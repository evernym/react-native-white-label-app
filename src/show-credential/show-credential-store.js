import { call, put, takeEvery, select } from 'redux-saga/effects'
import {
  createOutOfBandConnectionInvitation,
  credentialGetPresentationProposal,
} from '../bridge/react-native-cxs/RNCxs'
import { deleteOneTimeConnection, saveNewOneTimeConnection } from '../store/connections-store'
import { customLogger } from '../store/custom-logger'
import { getClaim } from '../claim/claim-store'
import type {
  ShowCredentialAction,
  ShowCredentialActions,
  CredentialPresentationSentAction,
  ShowCredentialStore,
} from './type-show-credential'
import {
  SHOW_CREDENTIAL,
  CREDENTIAL_PRESENTATION_SENT,
  SHOW_CREDENTIAL_FAIL,
  SHOW_CREDENTIAL_READY,
  SHOW_CREDENTIAL_FINISHED,
  ShowCredentialStoreInitialState,
  showCredentialFail,
  showCredentialReady,
} from './type-show-credential'
import { getShowCredentialConnectionIdentifier } from '../store/store-selector'

export function* preparePresentationProposalSaga(
  action: ShowCredentialAction,
): Generator<*, *, *> {
  try {
    const claim = yield call(getClaim, action.claimOfferUuid)
    if (!claim) {
      yield put(showCredentialFail('Cannot prepare Presentation Proposal'))
      return
    }

    let presentationProposal = yield call(credentialGetPresentationProposal, claim.handle)
    if (!presentationProposal) {
      yield put(showCredentialFail('Cannot prepare Presentation Proposal'))
      return
    }

    const presentationProposalParsed = JSON.parse(presentationProposal)
    presentationProposalParsed.comment = claim.claim.name
    presentationProposal = JSON.stringify(presentationProposalParsed)

    const {
      invitation,
      pairwiseInfo,
      vcxSerializedConnection,
    } = yield call(
      createOutOfBandConnectionInvitation, `Show \"${claim.claim.name}\" Credential`, false, presentationProposal,
    )

    console.log('invitation')
    console.log(invitation)

    const connection = {
      identifier: pairwiseInfo.myPairwiseDid,
      ...pairwiseInfo,
      vcxSerializedConnection,
      senderName: claim.claim.name,
      thid: JSON.parse(presentationProposal)['@id'],
    }

    yield put(showCredentialReady(invitation, claim.claimUuid, connection.identifier))
    yield put(saveNewOneTimeConnection(connection))
  } catch (error) {
    customLogger.log(`preparePresentationProposalSaga: error: ${error}`)
    yield put(showCredentialFail(error.message))
  }
}

export function* watchShowCredential(): any {
  yield takeEvery(SHOW_CREDENTIAL, preparePresentationProposalSaga)
}

export function* credentialPresentationFinishedSaga(
  action: CredentialPresentationSentAction,
): Generator<*, *, *> {
  const connectionIdentifier = yield select(getShowCredentialConnectionIdentifier)
  if (connectionIdentifier) {
    yield put(deleteOneTimeConnection(connectionIdentifier))
  }
}

export function* watchShowCredentialFinishedSaga(): any {
  yield takeEvery(SHOW_CREDENTIAL_FINISHED, credentialPresentationFinishedSaga)
}

export default function showCredentialReducer(
  state: ShowCredentialStore = ShowCredentialStoreInitialState,
  action: ShowCredentialActions,
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
