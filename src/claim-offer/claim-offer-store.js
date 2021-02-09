// @flow
import { put, call, all, select, takeEvery, spawn } from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import {
  CLAIM_OFFER_STATUS,
  CLAIM_OFFER_RECEIVED,
  CLAIM_OFFER_SHOWN,
  CLAIM_OFFER_ACCEPTED,
  CLAIM_OFFER_REJECTED,
  SEND_CLAIM_REQUEST,
  CLAIM_REQUEST_SUCCESS,
  CLAIM_REQUEST_FAIL,
  CLAIM_OFFER_IGNORED,
  CLAIM_REQUEST_STATUS,
  ADD_SERIALIZED_CLAIM_OFFER,
  CLAIM_OFFERS,
  SAVE_CLAIM_OFFERS_SUCCESS,
  SAVE_CLAIM_OFFERS_FAIL,
  ERROR_SAVE_CLAIM_OFFERS,
  REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS,
  REMOVE_SERIALIZED_CLAIM_OFFERS_FAIL,
  HYDRATE_CLAIM_OFFERS_SUCCESS,
  HYDRATE_CLAIM_OFFERS_FAIL,
  ERROR_HYDRATE_CLAIM_OFFERS,
  ERROR_NO_SERIALIZED_CLAIM_OFFER,
  ERROR_SEND_CLAIM_REQUEST,
  INSUFFICIENT_BALANCE,
  SEND_PAID_CREDENTIAL_REQUEST,
  PAID_CREDENTIAL_REQUEST_SUCCESS,
  PAID_CREDENTIAL_REQUEST_FAIL,
  CLAIM_OFFER_SHOW_START,
  RESET_CLAIM_REQUEST_STATUS,
  SEND_CLAIM_REQUEST_SUCCESS,
  SEND_CLAIM_REQUEST_FAIL,
  DENY_CLAIM_OFFER,
  DENY_CLAIM_OFFER_SUCCESS,
  DENY_CLAIM_OFFER_FAIL,
  OUTOFBAND_CLAIM_OFFER_ACCEPTED,
  DELETE_OUTOFBAND_CLAIM_OFFER,
  CLAIM_OFFER_DELETED,
  DELETE_CLAIM_OFFER,
  ERROR_RECEIVE_CLAIM,
} from './type-claim-offer'
import type {
  ClaimOfferStore,
  ClaimOfferAction,
  ClaimOfferDenyAction,
  ClaimOfferAcceptedAction,
  ClaimOfferPayload,
  AddSerializedClaimOfferAction,
  SerializedClaimOffer,
  ClaimRequestSuccessAction,
  ClaimOfferDeletedAction,
  DeleteClaimOfferAction,
  SerializedClaimOffers,
} from './type-claim-offer'
import type {
  AdditionalDataPayload,
  NotificationPayloadInfo,
} from '../push-notification/type-push-notification'
import type { CustomError } from '../common/type-common'
import {
  getClaimOffer,
  getClaimOffers,
  getSerializedClaimOffer,
  getWalletBalance,
  getConnectionHistory,
  getConnection,

} from '../store/store-selector'
import {
  getHandleBySerializedConnection,
  getClaimHandleBySerializedClaimOffer,
  serializeClaimOffer,
  getClaimOfferState,
  sendClaimRequest as sendClaimRequestApi,
  getLedgerFees,
  credentialReject,
} from '../bridge/react-native-cxs/RNCxs'
import { CLAIM_STORAGE_FAIL, CLAIM_STORAGE_SUCCESS } from '../claim/type-claim'
import { CLAIM_STORAGE_ERROR } from '../services/error/error-code'
import type { Connection } from '../store/type-connection-store'
import { RESET } from '../common/type-common'
import { secureSet, secureDelete, getHydrationItem } from '../services/storage'
import { BigNumber } from 'bignumber.js'
import { refreshWalletBalance } from '../wallet/wallet-store'
import type {
  ClaimStorageSuccessAction,
  ClaimStorageFailAction,
} from '../claim/type-claim'
import type { LedgerFeesData } from '../ledger/type-ledger-store'
import moment from 'moment'
import { captureError } from '../services/error/error-handler'
import { retrySaga } from '../api/api-utils'
import { ensureVcxInitAndPoolConnectSuccess, ensureVcxInitSuccess } from '../store/route-store'
import {
  ACTION_IS_NOT_SUPPORTED,
  CREDENTIAL_DEFINITION_NOT_FOUND,
  CREDENTIAL_DEFINITION_NOT_FOUND_MESSAGE,
  INVALID_CREDENTIAL_OFFER,
  INVALID_CREDENTIAL_OFFER_MESSAGE,
  SCHEMA_NOT_FOUND,
  SCHEMA_NOT_FOUND_MESSAGE,
} from '../bridge/react-native-cxs/error-cxs'
import Snackbar from 'react-native-snackbar'
import { colors, venetianRed } from '../common/styles/constant'
import { checkProtocolStatus } from '../store/protocol-status'
import { isIssuanceCompleted } from '../store/store-utils'

const claimOfferInitialState = {
  vcxSerializedClaimOffers: {},
}

// TODO:PS: data structure for claim offer received should be flat
// It should not have only payload
// Merge payload and payloadInfo
export const claimOfferReceived = (
  payload: AdditionalDataPayload,
  payloadInfo: NotificationPayloadInfo
) => ({
  type: CLAIM_OFFER_RECEIVED,
  payload,
  payloadInfo,
})

// this action is used because we don't want to show claim offer again to user
// we set claim offer status as shown, so another code path doesn't show it
export const claimOfferShown = (uid: string) => ({
  type: CLAIM_OFFER_SHOWN,
  uid,
})

export const denyClaimOffer = (uid: string) => ({
  type: DENY_CLAIM_OFFER,
  uid,
})

export const denyClaimOfferSuccess = (uid: string) => ({
  type: DENY_CLAIM_OFFER_SUCCESS,
  uid,
})

export const denyClaimOfferFail = (uid: string) => ({
  type: DENY_CLAIM_OFFER_FAIL,
  uid,
})

export const claimOfferIgnored = (uid: string) => ({
  type: CLAIM_OFFER_IGNORED,
  uid,
})

export const claimOfferRejected = (uid: string) => ({
  type: CLAIM_OFFER_REJECTED,
  uid,
})

export const sendClaimRequest = (uid: string, payload: ClaimOfferPayload) => ({
  type: SEND_CLAIM_REQUEST,
  uid,
  payload,
})

export const sendClaimRequestSuccess = (
  uid: string,
  payload: ClaimOfferPayload
) => ({
  type: SEND_CLAIM_REQUEST_SUCCESS,
  uid,
  payload,
})

export const sendClaimRequestFail = (uid: string, remoteDid: string) => ({
  type: SEND_CLAIM_REQUEST_FAIL,
  uid,
  remoteDid,
})

export const claimRequestSuccess = (
  uid: string,
  issueDate: number
): ClaimRequestSuccessAction => ({
  type: CLAIM_REQUEST_SUCCESS,
  uid,
  issueDate,
})

export const claimRequestFail = (uid: string, error: CustomError) => ({
  type: CLAIM_REQUEST_FAIL,
  error,
  uid,
})

export const inSufficientBalance = (uid: string) => ({
  type: INSUFFICIENT_BALANCE,
  uid,
})

export const sendPaidCredentialRequest = (
  uid: string,
  payload: ClaimOfferPayload
) => ({
  type: SEND_PAID_CREDENTIAL_REQUEST,
  uid,
  payload,
})

export const paidCredentialRequestSuccess = (uid: string) => ({
  type: PAID_CREDENTIAL_REQUEST_SUCCESS,
  uid,
})

export const paidCredentialRequestFail = (uid: string, remoteDid: string) => ({
  type: PAID_CREDENTIAL_REQUEST_FAIL,
  uid,
  remoteDid,
})

export const acceptClaimOffer = (uid: string, remoteDid: string) => ({
  type: CLAIM_OFFER_ACCEPTED,
  uid,
  remoteDid,
})

export const acceptOutofbandClaimOffer = (uid: string, remoteDid: string, show: boolean) => ({
  type: OUTOFBAND_CLAIM_OFFER_ACCEPTED,
  uid,
  remoteDid,
  show,
})

export const deleteOutOfBandClaimOffer = (uid: string) => ({
  type: DELETE_OUTOFBAND_CLAIM_OFFER,
  uid,
})

export function* denyClaimOfferSaga(
  action: ClaimOfferDenyAction
): Generator<*, *, *> {
  const { uid } = action
  const claimOffer = yield select(getClaimOffer, uid)
  const remoteDid: string = claimOffer.remotePairwiseDID

  const [connection]: Connection[] = yield select(getConnection, remoteDid)
  if (!connection) {
    captureError(new Error(ERROR_NO_SERIALIZED_CLAIM_OFFER(uid)))
    yield put(claimRequestFail(uid, ERROR_NO_SERIALIZED_CLAIM_OFFER(uid)))
    return
  }

  const vcxSerializedClaimOffer: SerializedClaimOffer | null = yield select(
    getSerializedClaimOffer,
    connection.identifier,
    uid
  )

  if (!vcxSerializedClaimOffer) {
    captureError(new Error(ERROR_NO_SERIALIZED_CLAIM_OFFER(uid)))
    yield put(claimRequestFail(uid, ERROR_NO_SERIALIZED_CLAIM_OFFER(uid)))

    return
  }

  const [connectionHandle, claimHandle] = yield all([
    call(getHandleBySerializedConnection, connection.vcxSerializedConnection),
    call(
      getClaimHandleBySerializedClaimOffer,
      vcxSerializedClaimOffer.serialized
    ),
  ])

  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    yield put(denyClaimOfferFail(uid))
    return
  }

  try {
    yield call(credentialReject, claimHandle, connectionHandle, '')
    yield put(denyClaimOfferSuccess(uid))
  } catch (e) {
    if (e.code === ACTION_IS_NOT_SUPPORTED) {
      // proprietary protocol doesn't support credential rejection.
      // It works for aries based connection only
      // So we can complete with success if we received this error
      yield put(denyClaimOfferSuccess(uid))
    } else {
      // else fail
      yield put(denyClaimOfferFail(uid))
      Snackbar.show({
        text: 'Failed to reject Credential Offer.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: venetianRed,
        textColor: colors.white,
      })
    }
  }
}

export const ERROR_ACCEPT_CLAIM_OFFER_FAIL =
  'Unable to accept credential. Check your internet connection or try to restart app.'

export function* claimOfferAccepted(
  action: ClaimOfferAcceptedAction
): Generator<*, *, *> {
  const messageId = action.uid
  const claimOfferPayload: ClaimOfferPayload = yield select(
    getClaimOffer,
    messageId
  )
  const payTokenAmount = new BigNumber(claimOfferPayload.payTokenValue || '0')
  const isPaidCredential = payTokenAmount.isGreaterThan(0)
  const remoteDid = claimOfferPayload.remotePairwiseDID
  const [connection]: Connection[] = yield select(getConnection, remoteDid)
  if (!connection) {
    captureError(new Error(ERROR_NO_SERIALIZED_CLAIM_OFFER(messageId)))
    yield put(
      claimRequestFail(messageId, ERROR_NO_SERIALIZED_CLAIM_OFFER(messageId))
    )

    return
  }

  const vcxSerializedClaimOffer: SerializedClaimOffer | null = yield select(
    getSerializedClaimOffer,
    connection.identifier,
    messageId
  )

  if (!vcxSerializedClaimOffer) {
    captureError(new Error(ERROR_NO_SERIALIZED_CLAIM_OFFER(messageId)))
    yield put(
      claimRequestFail(messageId, ERROR_NO_SERIALIZED_CLAIM_OFFER(messageId))
    )

    return
  }

  const vcxResult = yield* ensureVcxInitAndPoolConnectSuccess()
  if (vcxResult && vcxResult.fail) {
    yield put(sendClaimRequestFail(messageId, remoteDid))
    return
  }

  try {
    if (isPaidCredential) {
      yield put(sendPaidCredentialRequest(messageId, claimOfferPayload))

      const walletBalance: string = yield select(getWalletBalance)
      const balanceAmount = new BigNumber(walletBalance)
      const getLedgerFeesStartTime = moment()
      const { transfer }: LedgerFeesData = yield call(getLedgerFees)
      const transferFeesAmount = new BigNumber(transfer)

      if (balanceAmount.isLessThan(payTokenAmount.plus(transferFeesAmount))) {
        const afterLedgerFeesCalculationDone = moment()
        // add an artificial delay here because by the time we reach here
        // user would already be seeing `Paying...` status modal
        // and if ledger fees API takes less than 1-2 seconds
        // then user would see UI jumping too quickly from one state to another
        // UX will be bad
        // TODO: this decision can also be effected with the device performance
        // so if we have device with low configuration, then we may not want this
        // Need to add package with device information and test how it behaves
        if (
          getLedgerFeesStartTime
            .add(0.7, 'seconds')
            .isAfter(afterLedgerFeesCalculationDone)
        ) {
          yield call(delay, 500)
        }
        yield put(inSufficientBalance(messageId))
        return
      }
    } else {
      yield put(sendClaimRequest(messageId, claimOfferPayload))
    }
    // since these two api calls are independent, we can call them in parallel
    // but result of both calls are needed before we can move on with other logic
    // so we wait here till both calls are done
    const [connectionHandle, claimHandle] = yield all([
      call(getHandleBySerializedConnection, connection.vcxSerializedConnection),
      call(
        getClaimHandleBySerializedClaimOffer,
        vcxSerializedClaimOffer.serialized
      ),
    ])

    // TODO We don't have any payment handle as of now, so hard code to 0
    const paymentHandle = 0

    try {
      yield* retrySaga(
        call(sendClaimRequestApi, claimHandle, connectionHandle, paymentHandle)
      )
    } catch (e) {
      const showSnackError = (text) => {
        Snackbar.show({
          text: text,
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: venetianRed,
          textColor: colors.white,
        })
      }

      if (e.code === CREDENTIAL_DEFINITION_NOT_FOUND) {
        showSnackError(CREDENTIAL_DEFINITION_NOT_FOUND_MESSAGE)
      } else if (e.code === SCHEMA_NOT_FOUND) {
        showSnackError(SCHEMA_NOT_FOUND_MESSAGE)
      } else if (e.code === INVALID_CREDENTIAL_OFFER) {
        showSnackError(INVALID_CREDENTIAL_OFFER_MESSAGE)
      }

      captureError(e)
      if (isPaidCredential) {
        yield put(paidCredentialRequestFail(messageId, remoteDid))
      } else {
        yield put(sendClaimRequestFail(messageId, remoteDid))
      }
      return
    }

    // since we have sent claim request, state of claim offer in vcx is changed
    // so we need to update stored serialized claim offer in store
    // update serialized state in background
    yield call(
      saveSerializedClaimOffer,
      claimHandle,
      connection.identifier,
      messageId
    )

    yield put(sendClaimRequestSuccess(messageId, claimOfferPayload))
    // if we are able to send claim request successfully,
    // then we can raise an action to show that we have sent claim request
    // so that our history middleware can record this event
    if (isPaidCredential) {
      // it also means payment was successful and we can show success to user in modal
      yield put(paidCredentialRequestSuccess(messageId))
      yield put(refreshWalletBalance())
    }

    yield call(
      checkCredentialStatus,
      messageId,
      claimOfferPayload.issuer.name,
      claimOfferPayload.remotePairwiseDID
    )

    // now the updated claim offer is secure stored now we can update claim request
  } catch (e) {
    captureError(e)
    if (isPaidCredential) {
      yield put(paidCredentialRequestFail(messageId, remoteDid))
    } else {
      yield put(
        claimRequestFail(messageId, ERROR_SEND_CLAIM_REQUEST(e.message))
      )
    }
  }
}

export function* checkCredentialStatus(
  identifier: string,
  senderName: string,
  remoteDID: string
): Generator<*, *, *> {
  yield spawn(
    checkProtocolStatus,
    {
      identifier: identifier,
      getObjectFunc: getClaimOffer,
      isCompletedFunc: isIssuanceCompleted,
      error: ERROR_RECEIVE_CLAIM(senderName),
      onErrorEvent: sendClaimRequestFail(identifier, remoteDID),
    }
  )
}

function* claimStorageSuccessSaga(
  action: ClaimStorageSuccessAction
): Generator<*, *, *> {
  const { messageId, issueDate } = action
  yield put(claimRequestSuccess(messageId, issueDate))
}

export function* watchClaimStorageSuccess(): any {
  yield takeEvery(CLAIM_STORAGE_SUCCESS, claimStorageSuccessSaga)
}

export function* watchClaimOfferDeny(): any {
  yield takeEvery(DENY_CLAIM_OFFER, denyClaimOfferSaga)
}

function* claimStorageFailSaga(
  action: ClaimStorageFailAction
): Generator<*, *, *> {
  const { messageId } = action
  yield put(claimRequestFail(messageId, CLAIM_STORAGE_ERROR()))
}

export function* watchClaimStorageFail(): any {
  yield takeEvery(CLAIM_STORAGE_FAIL, claimStorageFailSaga)
}

export function* saveSerializedClaimOffer(
  claimHandle: number,
  userDID: string,
  messageId: string
): Generator<*, *, *> {
  try {
    const [serializedClaimOffer, claimOfferVcxState]: [
      string,
      number
    ] = yield all([
      call(serializeClaimOffer, claimHandle),
      call(getClaimOfferState, claimHandle),
    ])
    yield put(
      addSerializedClaimOffer(
        serializedClaimOffer,
        userDID,
        messageId,
        claimOfferVcxState
      )
    )
  } catch (e) {
    captureError(e)
    // TODO:KS need to think about what happens when serialize call from vcx fails
  }
}

function* watchClaimOfferAccepted(): any {
  yield takeEvery(CLAIM_OFFER_ACCEPTED, claimOfferAccepted)
}

export const addSerializedClaimOffer = (
  serializedClaimOffer: string,
  userDID: string,
  messageId: string,
  claimOfferVcxState: number
) => ({
  type: ADD_SERIALIZED_CLAIM_OFFER,
  serializedClaimOffer,
  userDID,
  messageId,
  claimOfferVcxState,
})

export function* watchAddSerializedClaimOffer(): any {
  //save claimOffers as well or rename to save ClaimOfferSaga
  yield takeEvery(
    [
      ADD_SERIALIZED_CLAIM_OFFER,
      CLAIM_OFFER_RECEIVED,
      SEND_CLAIM_REQUEST,
      CLAIM_OFFER_SHOWN,
      CLAIM_OFFER_DELETED,
      CLAIM_STORAGE_SUCCESS,
      SEND_CLAIM_REQUEST_FAIL,
    ],
    saveClaimOffersSaga
  )
}

export function* saveClaimOffersSaga(
  action: AddSerializedClaimOfferAction
): Generator<*, *, *> {
  try {
    const claimOffers = yield select(getClaimOffers)
    yield call(secureSet, CLAIM_OFFERS, JSON.stringify(claimOffers))
    yield put({
      type: SAVE_CLAIM_OFFERS_SUCCESS,
    })
  } catch (e) {
    // capture error for safe set
    captureError(e)
    yield put({
      type: SAVE_CLAIM_OFFERS_FAIL,
      error: ERROR_SAVE_CLAIM_OFFERS(e.message),
    })
  }
}

export function* removePersistedSerializedClaimOffersSaga(): Generator<
  *,
  *,
  *
> {
  try {
    yield call(secureDelete, CLAIM_OFFERS)
    yield put({
      type: REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS,
    })
  } catch (e) {
    // capture error for secure delete
    captureError(e)
    yield put({
      type: REMOVE_SERIALIZED_CLAIM_OFFERS_FAIL,
    })
  }
}

export function* hydrateClaimOffersSaga(): Generator<*, *, *> {
  try {
    const claimOffersJson = yield call(getHydrationItem, CLAIM_OFFERS)
    const connectionHistory = yield select(getConnectionHistory)
    if (claimOffersJson) {
      const serializedClaimOffers = JSON.parse(claimOffersJson)
      const {
        vcxSerializedClaimOffers: serializedOffers,
        ...offers
      } = serializedClaimOffers

      // To make sure that all claim offers has issue date
      // we have to look through connection history and extract issue date from it if current date is empty
      let storageSuccessHistory = []
      Object.keys(connectionHistory.data.connections)
        .map((uid) => connectionHistory.data.connections[uid])
        .forEach((connection) => {
          storageSuccessHistory.push(
            ...connection.data.filter(
              (event) => event.originalPayload.type === CLAIM_STORAGE_SUCCESS
            )
          )
        })

      // iterate over offers and do
      for (let uid of Object.keys(offers)) {
        const offer = offers[uid]
        // 2. set missing data
        if (!offer.issueDate) {
          const historyEvent = storageSuccessHistory.find(
            (event) => event.originalPayload.messageId === uid
          )
          if (historyEvent) {
            offer.issueDate = historyEvent.originalPayload.issueDate
          }
          serializedClaimOffers[uid] = offer
        }
      }

      yield put(hydrateClaimOffers(serializedClaimOffers))
    }
  } catch (e) {
    captureError(e)
    yield put({
      type: HYDRATE_CLAIM_OFFERS_FAIL,
      error: ERROR_HYDRATE_CLAIM_OFFERS(e.message),
    })
  }
}

export const hydrateClaimOffers = (claimOffers: ClaimOfferStore) => ({
  type: HYDRATE_CLAIM_OFFERS_SUCCESS,
  claimOffers,
})

export const deleteClaimOffer = (
  uid: string,
  userDID: string
): DeleteClaimOfferAction => ({
  type: DELETE_CLAIM_OFFER,
  uid,
  userDID,
})

export const claimOfferDeleted = (
  uid: string,
  vcxSerializedClaimOffers: SerializedClaimOffers
): ClaimOfferDeletedAction => ({
  type: CLAIM_OFFER_DELETED,
  uid,
  vcxSerializedClaimOffers,
})

function* deleteClaimOfferSaga(
  action: DeleteClaimOfferAction
): Generator<*, *, *> {
  try {
    const claimOffers = yield select(getClaimOffers)

    const {
      [action.uid]: deleted,
      ...restSerializedOffers
    } = claimOffers.vcxSerializedClaimOffers[action.userDID]
    const serializedOffers = {
      ...claimOffers.vcxSerializedClaimOffers,
      [action.userDID]: restSerializedOffers,
    }

    yield put(claimOfferDeleted(action.uid, serializedOffers))
  } catch (e) {
    captureError(e)
  }
}

export function* watchDeleteClaimOffer(): any {
  yield takeEvery(DELETE_CLAIM_OFFER, deleteClaimOfferSaga)
}

export function* watchClaimOffer(): any {
  yield all([
    watchClaimOfferAccepted(),
    watchAddSerializedClaimOffer(),
    watchClaimStorageSuccess(),
    watchClaimStorageFail(),
    watchDeleteClaimOffer(),
  ])
}

export const claimOfferShowStart = (uid: string) => ({
  type: CLAIM_OFFER_SHOW_START,
  uid,
})

export const resetClaimRequestStatus = (uid: string) => ({
  type: RESET_CLAIM_REQUEST_STATUS,
  uid,
})

export default function claimOfferReducer(
  state: ClaimOfferStore = claimOfferInitialState,
  action: ClaimOfferAction
) {
  switch (action.type) {
    case CLAIM_OFFER_RECEIVED:
      if (state[action.payloadInfo.uid]) {
        return state
      }
      return {
        ...state,
        [action.payloadInfo.uid]: {
          ...action.payload,
          ...action.payloadInfo,
          status: CLAIM_OFFER_STATUS.RECEIVED,
          claimRequestStatus: CLAIM_REQUEST_STATUS.NONE,
          error: null,
        },
      }
    case CLAIM_OFFER_SHOWN:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: CLAIM_OFFER_STATUS.SHOWN,
        },
      }
    case CLAIM_OFFER_ACCEPTED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: CLAIM_OFFER_STATUS.ACCEPTED,
        },
      }
    case OUTOFBAND_CLAIM_OFFER_ACCEPTED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: CLAIM_OFFER_STATUS.ACCEPTED,
        },
      }
    case DELETE_OUTOFBAND_CLAIM_OFFER:
      const { [action.uid]: claimOffer, ...newState } = state
      return {
        ...newState,
      }
    case CLAIM_OFFER_IGNORED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: CLAIM_OFFER_STATUS.IGNORED,
        },
      }
    case CLAIM_OFFER_REJECTED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: CLAIM_OFFER_STATUS.REJECTED,
        },
      }
    case SEND_CLAIM_REQUEST:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST,
        },
      }
    case CLAIM_REQUEST_SUCCESS:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.CLAIM_REQUEST_SUCCESS,
          status: CLAIM_OFFER_STATUS.ISSUED,
          issueDate: action.issueDate,
        },
      }
    case CLAIM_REQUEST_FAIL:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.CLAIM_REQUEST_FAIL,
          status: CLAIM_OFFER_STATUS.FAILED,
        },
      }
    case INSUFFICIENT_BALANCE:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.INSUFFICIENT_BALANCE,
          status: CLAIM_OFFER_STATUS.FAILED,
        },
      }
    case SEND_PAID_CREDENTIAL_REQUEST:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus:
            CLAIM_REQUEST_STATUS.SENDING_PAID_CREDENTIAL_REQUEST,
        },
      }
    case PAID_CREDENTIAL_REQUEST_SUCCESS:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus:
            CLAIM_REQUEST_STATUS.PAID_CREDENTIAL_REQUEST_SUCCESS,
          status: CLAIM_OFFER_STATUS.ISSUED,
        },
      }
    case PAID_CREDENTIAL_REQUEST_FAIL:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.PAID_CREDENTIAL_REQUEST_FAIL,
          status: CLAIM_OFFER_STATUS.FAILED,
        },
      }
    case RESET:
      return claimOfferInitialState
    case ADD_SERIALIZED_CLAIM_OFFER:
      return {
        ...state,
        vcxSerializedClaimOffers: {
          ...state.vcxSerializedClaimOffers,
          [action.userDID]: {
            ...state.vcxSerializedClaimOffers[action.userDID],
            [action.messageId]: {
              serialized: action.serializedClaimOffer,
              state: action.claimOfferVcxState,
              messageId: action.messageId,
            },
          },
        },
      }
    case HYDRATE_CLAIM_OFFERS_SUCCESS:
      return action.claimOffers

    case CLAIM_OFFER_SHOW_START:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: CLAIM_OFFER_STATUS.RECEIVED,
          claimRequestStatus: CLAIM_REQUEST_STATUS.NONE,
        },
      }

    case RESET_CLAIM_REQUEST_STATUS:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.NONE,
          status: CLAIM_OFFER_STATUS.RECEIVED,
        },
      }

    case SEND_CLAIM_REQUEST_SUCCESS:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.SEND_CLAIM_REQUEST_SUCCESS,
        },
      }

    case SEND_CLAIM_REQUEST_FAIL:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          claimRequestStatus: CLAIM_REQUEST_STATUS.SEND_CLAIM_REQUEST_FAIL,
          status: CLAIM_OFFER_STATUS.FAILED,
        },
      }
    case CLAIM_OFFER_DELETED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: CLAIM_OFFER_STATUS.DELETED,
          claimRequestStatus: CLAIM_REQUEST_STATUS.DELETED,
        },
        vcxSerializedClaimOffers: action.vcxSerializedClaimOffers,
      }
    default:
      return state
  }
}
