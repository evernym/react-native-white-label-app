// @flow
import {
  put,
  call,
  all,
  select,
  takeEvery,
  fork,
  spawn,
} from 'redux-saga/effects'
import moment from 'moment'
import type {
  Claim,
  ClaimStore,
  ClaimAction,
  ClaimReceivedAction,
  ClaimStorageFailAction,
  ClaimStorageSuccessAction,
  MapClaimToSenderAction,
  ClaimMap,
  ClaimReceivedVcxAction,
  ClaimVcx,
  DeleteClaimAction,
  DeleteClaimSuccessAction,
} from './type-claim'
import type { GetClaimVcxResult } from '../push-notification/type-push-notification'
import {
  CLAIM_RECEIVED,
  CLAIM_STORAGE_FAIL,
  CLAIM_STORAGE_SUCCESS,
  MAP_CLAIM_TO_SENDER,
  HYDRATE_CLAIM_MAP,
  HYDRATE_CLAIM_MAP_FAIL,
  ERROR_CLAIM_HYDRATE_FAIL,
  CLAIM_RECEIVED_VCX,
  DELETE_CLAIM,
  DELETE_CLAIM_SUCCESS,
} from './type-claim'
import type { CustomError, GenericObject } from '../common/type-common'
import {
  getClaimHandleBySerializedClaimOffer,
  updateClaimOfferState,
  getClaimVcx,
  fetchPublicEntitiesForCredentials,
  deleteCredential,
  updateClaimOfferStateWithMessage,
} from '../bridge/react-native-cxs/RNCxs'
import { CLAIM_STORAGE_ERROR } from '../services/error/error-code'
import {
  getClaimMap,
  getSerializedClaimOffers,
  getConnectionByUserDid,
  getClaimOffers,
  getSerializedClaimOffer,
  getClaimOffer,
  getConnectionHistory,
  getAllConnection,
  getClaimForOffer,
} from '../store/store-selector'
import { secureSet, getHydrationItem } from '../services/storage'
import { CLAIM_MAP } from '../common/secure-storage-constants'
import { RESET } from '../common/type-common'
import { updateMessageStatus } from '../store/config-store'
import { ensureVcxInitAndPoolConnectSuccess } from '../store/route-store'
import type {
  ClaimOfferPayload,
  SerializedClaimOffer,
} from '../claim-offer/type-claim-offer'
import { VCX_CLAIM_OFFER_STATE } from '../claim-offer/type-claim-offer'
import {
  deleteClaimOffer,
  saveSerializedClaimOffer,
} from '../claim-offer/claim-offer-store'
import type { Connection } from '../store/type-connection-store'
import { promptBackupBanner } from '../backup/backup-store'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'

export const claimReceived = (claim: Claim): ClaimReceivedAction => ({
  type: CLAIM_RECEIVED,
  claim,
})

export const claimStorageSuccess = (
  messageId: string,
  issueDate: number
): ClaimStorageSuccessAction => ({
  type: CLAIM_STORAGE_SUCCESS,
  messageId,
  issueDate,
})

export const claimStorageFail = (
  messageId: string,
  error: CustomError
): ClaimStorageFailAction => ({
  type: CLAIM_STORAGE_FAIL,
  messageId,
  error,
})

export const mapClaimToSender = (
  claimUuid: string,
  senderDID: string,
  myPairwiseDID: string,
  logoUrl: string,
  issueDate: number,
  name: string,
  senderName?: string
): MapClaimToSenderAction => ({
  type: MAP_CLAIM_TO_SENDER,
  claimUuid,
  senderDID,
  myPairwiseDID,
  logoUrl,
  issueDate,
  name,
  senderName,
})

export const hydrateClaimMap = (claimMap: ClaimMap) => ({
  type: HYDRATE_CLAIM_MAP,
  claimMap,
})

export const hydrateClaimMapFail = (error: CustomError) => ({
  type: HYDRATE_CLAIM_MAP_FAIL,
  error,
})

export function* hydrateClaimMapSaga(): Generator<*, *, *> {
  try {
    const fetchedClaimMap = yield call(getHydrationItem, CLAIM_MAP)
    const connectionHistory = yield select(getConnectionHistory)
    const connections = yield select(getAllConnection)

    if (fetchedClaimMap) {
      const claimMap: ClaimMap = JSON.parse(fetchedClaimMap)
      // We added a new field issueDate, and already stored credentials
      // might not have this field populated, so when app is upgraded
      // and new code expects issueData, new code will find it undefined
      // so, here we are iterating on claimMap, and then adding issueDate
      // as current time
      for (const key in claimMap) {
        if (claimMap.hasOwnProperty(key) && !claimMap[key].issueDate) {
          claimMap[key].issueDate = moment().unix()
        }

        // We added a new field `name`, and already stored credentials
        // might not have this field populated, so when app is upgraded
        // new code will find it undefined
        // so, here we are iterating on connectionHistory, and then adding `name` to credential
        if (claimMap.hasOwnProperty(key) && !claimMap[key].name) {
          const event = connectionHistory.data.connections[
            claimMap[key].senderDID
            ].data.find(
            (event) =>
              event.originalPayload.type === CLAIM_STORAGE_SUCCESS &&
              claimMap[key].issueDate === event.originalPayload.issueDate
          )

          if (event) {
            claimMap[key].name = event.name
          }
        }
        if (claimMap.hasOwnProperty(key) && !claimMap[key].senderName) {
          const connection = connections[claimMap[key].myPairwiseDID]
          if (connection) {
            claimMap[key].senderName = connection.senderName
          }
        }
      }

      yield put(hydrateClaimMap(claimMap))
    }
  } catch (e) {
    captureError(e)
    customLogger.error(`hydrateClaimMapSaga: ${e}`)
    yield put(
      hydrateClaimMapFail({
        code: ERROR_CLAIM_HYDRATE_FAIL.code,
        message: `${ERROR_CLAIM_HYDRATE_FAIL.message}:${e.message}`,
      })
    )
  }
}

export const claimReceivedVcx = (claim: ClaimVcx): ClaimReceivedVcxAction => ({
  type: CLAIM_RECEIVED_VCX,
  claim,
})

export function* claimReceivedVcxSaga(
  action: ClaimReceivedAction
): Generator<*, *, *> {
  const { forDID, connectionHandle, uid, msg } = action.claim
  const vcxResult = yield* ensureVcxInitAndPoolConnectSuccess()
  if (vcxResult && vcxResult.fail) {
    return
  }

  const serializedClaimOffers: {
    string: SerializedClaimOffer[],
  } = yield select(getSerializedClaimOffers, forDID)

  if (connectionHandle != null) {
    const message = msg ? JSON.parse(msg) : {}

    // try to find correspondent Credential Offer using ~thread_id
    // it works for Aries protocol only
    if (message["~thread"]) {
      const offerId = message["~thread"]["thid"]
      const serializedClaimOffer = serializedClaimOffers[offerId]

      if (serializedClaimOffer){
        yield call(
          checkForClaim,
          serializedClaimOffer,
          connectionHandle,
          forDID,
          uid,
          offerId,
          msg
        )
        return
      }
    }

    // else we don't know for which claim offer this claim was sent
    // we receive a claim we only know claim message id,
    // and user id for which claim was sent
    // so, we take out all the claim offers for the connection
    // and then check each claim offer for update and download latest message
    // for each claim offer and see which claim offer received claim
    for (const offerId of Object.keys(serializedClaimOffers)) {
      // run each claim offer check in parallel and wait for all of them to finish
      const serializedClaimOffer = serializedClaimOffers[offerId]
      // $FlowFixMe
      yield call(
        checkForClaim,
        serializedClaimOffer,
        connectionHandle,
        forDID,
        uid,
        offerId,
        null
      )
    }
  }
}

export function* checkForClaim(
  serializedClaimOffer: SerializedClaimOffer,
  connectionHandle: number,
  userDID: string,
  uid: string,
  offerId: string,
  credentialMessage: ?string,
): Generator<*, *, *> {
  if (serializedClaimOffer.state === VCX_CLAIM_OFFER_STATE.ACCEPTED) {
    // if claim offer is already in accepted state, then we don't want to update state
    return
  }

  const { messageId } = serializedClaimOffer
  const claimOfferPayload = yield select(getClaimOffer, offerId)

  try {
    const claimHandle: number = yield call(
      getClaimHandleBySerializedClaimOffer,
      serializedClaimOffer.serialized
    )
    let vcxClaimOfferState: number

    if (credentialMessage) {
      vcxClaimOfferState = yield call(
        updateClaimOfferStateWithMessage,
        claimHandle,
        credentialMessage
      )
    } else {
      vcxClaimOfferState = yield call(
        updateClaimOfferState,
        claimHandle,
        credentialMessage
      )
    }


    if (vcxClaimOfferState === VCX_CLAIM_OFFER_STATE.ACCEPTED) {
      // once we know that this claim offer state was updated to accepted
      // that means that we downloaded the claim for this claim offer
      // and saved to wallet, now we need to know claim uuid and exact claim
      const vcxClaim: GetClaimVcxResult = yield call(getClaimVcx, claimHandle)
      const connection: ?Connection = yield select(
        getConnectionByUserDid,
        userDID
      )

      const issueDate = moment().unix()

      if (connection) {
        yield put(
          mapClaimToSender(
            vcxClaim.claimUuid,
            connection.senderDID,
            userDID,
            connection.logoUrl,
            issueDate,
            claimOfferPayload.data.name,
            connection.senderName
          )
        )
        yield fork(saveClaimUuidMap)
      }

      yield put(claimStorageSuccess(serializedClaimOffer.messageId, issueDate))
      yield* updateMessageStatus([
        {
          pairwiseDID: userDID,
          uids: [messageId, uid],
        },
      ])
      yield put(promptBackupBanner(true))

      // since we asked vcx to update state, we should also update serialized state in redux
      // so that we don't go out of sync with vcx
      yield fork(
        saveSerializedClaimOffer,
        claimHandle,
        userDID,
        serializedClaimOffer.messageId
      )

      // once we stored a new credential into the wallet we can update the cache containing
      // public entities (like Schemas, Credential Definitions) located on the Ledger.
      // This allows us to reduce the time taken for Proof generation (for the first credential usage) by
      // using already cached entities instead of queering the Ledger.
      // we even can not wait/handle the result of this function.
      // If querying failed we will query entities again during
      // proof generation and will get an error there if it fails again.
      yield spawn(fetchPublicEntitiesForCredentials)
    }
  } catch (e) {
    // we got error while saving claim in wallet, what to do now?
    captureError(e)
    yield put(
      claimStorageFail(serializedClaimOffer.messageId, CLAIM_STORAGE_ERROR(e))
    )
  }
}

export function* saveClaimUuidMap(): Generator<*, *, *> {
  const claimMap: ClaimMap = yield select(getClaimMap)

  try {
    yield call(secureSet, CLAIM_MAP, JSON.stringify(claimMap))
  } catch (e) {
    // TODO:KS what should we do if storage fails
    captureError(e)
    customLogger.error(`Failed to store claim uuid map:${e}`)
  }
}

export function* getClaim(claimOfferUuid: string): Generator<*, *, *> {
  const claimOffers = yield select(getClaimOffers)
  const claimOffer: ClaimOfferPayload = claimOffers[claimOfferUuid]
  if (!claimOffer){
    return
  }

  const claim: GenericObject = yield select(getClaimForOffer, claimOffer)
  if (!claim){
    return
  }

  const identifier = claim.myPairwiseDID
  const vcxSerializedClaimOffer: SerializedClaimOffer = yield select(
    getSerializedClaimOffer,
    identifier,
    claimOfferUuid
  )

  const claimHandle = yield call(
    getClaimHandleBySerializedClaimOffer,
    vcxSerializedClaimOffer.serialized
  )

  return {
    claim,
    handle: claimHandle,
    vcxSerializedClaimOffer
  }
}

export const deleteClaim = (uuid: string): DeleteClaimAction => ({
  type: DELETE_CLAIM,
  uuid,
})

export const deleteClaimSuccess = (
  claimMap: ClaimMap,
  messageId: string
): DeleteClaimSuccessAction => ({
  type: DELETE_CLAIM_SUCCESS,
  claimMap,
  messageId,
})

export function* deleteClaimSaga(
  action: DeleteClaimAction
): Generator<*, *, *> {
  try {
    const claims: GenericObject = yield select(getClaimMap)
    const claim = yield call(getClaim, action.uuid)
    if (!claim) {
      return
    }

    yield call(deleteCredential, claim.handle)
    yield put(deleteClaimOffer(action.uuid, claim.claim.myPairwiseDID))

    // ideally we need to delete Claim from Claim Store as well but we don't have an claimUuid
    // investigate if we can get claimUuid during hydration
    yield put(deleteClaimSuccess(claims, claim.vcxSerializedClaimOffer.messageId))
  } catch (e) {
    captureError(e)
  }
}

export function* watchClaimReceivedVcx(): any {
  yield takeEvery(CLAIM_RECEIVED_VCX, claimReceivedVcxSaga)
}

export function* watchClaim(): any {
  yield all([watchClaimReceivedVcx()])
}

export function* watchDeleteClaim(): any {
  yield takeEvery(DELETE_CLAIM, deleteClaimSaga)
}

const initialState = {
  claimMap: {},
}

export default function claimReducer(
  state: ClaimStore = initialState,
  action: ClaimAction
) {
  switch (action.type) {
    case CLAIM_RECEIVED:
      return {
        ...state,
        [action.claim.messageId]: {
          claim: action.claim,
        },
      }

    case CLAIM_STORAGE_FAIL:
      return {
        ...state,
        [action.messageId]: {
          ...state[action.messageId],
          error: action.error,
        },
      }

    case CLAIM_STORAGE_SUCCESS: {
      const { [action.messageId]: deleted, ...newState } = state
      return newState
    }

    case MAP_CLAIM_TO_SENDER:
      const {
        claimUuid,
        senderDID,
        myPairwiseDID,
        logoUrl,
        issueDate,
        name,
        senderName,
      } = action
      return {
        ...state,
        claimMap: {
          ...state.claimMap,
          [claimUuid]: {
            senderDID,
            myPairwiseDID,
            logoUrl,
            issueDate,
            name,
            senderName,
          },
        },
      }

    case HYDRATE_CLAIM_MAP:
      return {
        ...state,
        claimMap: action.claimMap,
      }

    case DELETE_CLAIM_SUCCESS:
      return {
        ...state,
        claimMap: action.claimMap,
      }

    case RESET:
      return initialState

    default:
      return state
  }
}
