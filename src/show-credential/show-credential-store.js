// @flow
import { all, call, put, takeEvery } from 'redux-saga/effects'
import {
  createOutOfBandConnectionInvitation,
  credentialGetPresentationProposal,
} from '../bridge/react-native-cxs/RNCxs'
import { saveNewOneTimeConnection } from '../store/connections-store'
import { customLogger } from '../store/custom-logger'
import { getClaim } from '../claim/claim-store'
import type {
  CredentialPresentationSentAction,
  ShowCredentialAction,
  ShowCredentialActions,
  ShowCredentialFailAction,
  ShowCredentialFinishedAction,
  ShowCredentialReadyAction,
  ShowCredentialStore,
} from './type-show-credential'
import {
  CREDENTIAL_PRESENTATION_SENT,
  SHOW_CREDENTIAL,
  SHOW_CREDENTIAL_FAIL,
  SHOW_CREDENTIAL_FINISHED,
  SHOW_CREDENTIAL_READY,
  ShowCredentialStoreInitialState,
} from './type-show-credential'
import { ensureVcxInitSuccess } from '../store/route-store'

export const showCredential = (
  claimOfferUuid: string
): ShowCredentialAction => ({
  type: SHOW_CREDENTIAL,
  claimOfferUuid,
})

export const showCredentialReady = (
  presentationProposal: string,
  credentialUuid: string,
  connectionIdentifier: string
): ShowCredentialReadyAction => ({
  type: SHOW_CREDENTIAL_READY,
  presentationProposal,
  credentialUuid,
  connectionIdentifier,
})

export const showCredentialFail = (
  error: string
): ShowCredentialFailAction => ({
  type: SHOW_CREDENTIAL_FAIL,
  error,
})

export const credentialPresentationSent = (): CredentialPresentationSentAction => ({
  type: CREDENTIAL_PRESENTATION_SENT,
})

export const showCredentialFinished = (): ShowCredentialFinishedAction => ({
  type: SHOW_CREDENTIAL_FINISHED,
})

export function* preparePresentationProposalSaga(
  action: ShowCredentialAction
): Generator<*, *, *> {
  try {
    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      throw new Error(
        'Cannot prepare Presentation Proposal. Library is not initialized'
      )
    }

    const claim = yield call(getClaim, action.claimOfferUuid)
    if (!claim) {
      throw new Error(
        'Cannot prepare Presentation Proposal. Credential not found'
      )
    }

    const presentationProposal = yield call(
      credentialGetPresentationProposal,
      claim.handle
    )
    if (!presentationProposal) {
      throw new Error('Cannot prepare Presentation Proposal')
    }

    const { invitation, pairwiseInfo, vcxSerializedConnection } = yield call(
      createOutOfBandConnectionInvitation,
      `Show \"${claim.claim.name}\" Credential`,
      false,
      presentationProposal
    )

    const attachedRequest = invitation
      ? JSON.parse(invitation)['request~attach'][0]
      : undefined

    const connection = {
      identifier: pairwiseInfo.myPairwiseDid,
      ...pairwiseInfo,
      vcxSerializedConnection,
      attachedRequest,
    }

    yield put(
      showCredentialReady(invitation, claim.claimUuid, connection.identifier)
    )
    yield put(saveNewOneTimeConnection(connection))
  } catch (error) {
    customLogger.log(`preparePresentationProposalSaga: error: ${error}`)
    yield put(showCredentialFail(error.message))
  }
}

export function* watchShowCredential(): any {
  yield takeEvery(SHOW_CREDENTIAL, preparePresentationProposalSaga)
}

export function* watchShowCredentialStore(): any {
  yield all([watchShowCredential()])
}

export default function showCredentialReducer(
  state: ShowCredentialStore = ShowCredentialStoreInitialState,
  action: ShowCredentialActions
) {
  switch (action.type) {
    case SHOW_CREDENTIAL:
      return ShowCredentialStoreInitialState
    case SHOW_CREDENTIAL_READY:
      return {
        ...state,
        data: action.presentationProposal,
        credentialUuid: action.credentialUuid,
        connectionIdentifier: action.connectionIdentifier,
      }
    case SHOW_CREDENTIAL_FAIL:
      return {
        ...state,
        error: action.error,
      }
    case CREDENTIAL_PRESENTATION_SENT:
      return {
        ...state,
        isSent: true,
      }

    case SHOW_CREDENTIAL_FINISHED:
      return ShowCredentialStoreInitialState

    default:
      return state
  }
}
