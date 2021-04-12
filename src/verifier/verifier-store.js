// @flow
import { all, call, put, select, takeEvery } from 'redux-saga/effects'
import {
  createProofVerifierWithProposal,
  proofVerifierDeserialize,
  proofVerifierGetPresentationRequest,
  proofVerifierGetProofMessage,
  proofVerifierSendRequest,
  proofVerifierSerialize,
  proofVerifierUpdateStateWithMessage,
} from '../bridge/react-native-cxs/RNCxs'
import { getVerifier, getVerifiers } from '../store/store-selector'
import type {
  HydrateVerifierStoreAction,
  OutOfBandPresentationProposalAcceptedAction,
  PresentationProposalAcceptedAction,
  PresentationProposalReceivedAction,
  PresentationRequestSentAction,
  PresentationVerificationFailedAction,
  PresentationVerifiedAction,
  RequestedProof,
  VerifierActions,
  VerifierStore,
} from './type-verifier'
import {
  HYDRATE_VERIFIER_STORE,
  OUTOFBAND_PRESENTATION_PROPOSAL_ACCEPTED,
  PRESENTATION_PROPOSAL_ACCEPTED,
  PRESENTATION_PROPOSAL_RECEIVED,
  PRESENTATION_REQUEST_SENT,
  PRESENTATION_VERIFICATION_FAILED,
  PRESENTATION_VERIFIED,
  PROOF_SATE,
  VERIFIER_STATE,
  VerifierStoreInitialState,
} from './type-verifier'
import { getHydrationItem, secureSet } from '../services/storage'
import { VERIFIERS } from '../common'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'
import type { AriesPresentationProposal } from '../proof-request/type-proof-request'
import type { NotificationPayloadInfo } from '../push-notification/type-push-notification'
import { getConnectionHandle } from '../store/connections-store'

export const hydrateVerifierStore = (
  data: VerifierStore,
): HydrateVerifierStoreAction => ({
  type: PRESENTATION_PROPOSAL_RECEIVED,
  data,
})

export const presentationProposalReceived = (
  presentationProposal: AriesPresentationProposal,
  payloadInfo: NotificationPayloadInfo,
): PresentationProposalReceivedAction => ({
  type: PRESENTATION_PROPOSAL_RECEIVED,
  presentationProposal,
  payloadInfo,
})

export const presentationProposalAccepted = (
  uid: string,
): PresentationProposalAcceptedAction => ({
  type: PRESENTATION_PROPOSAL_ACCEPTED,
  uid,
})

export const outofbandPresentationProposalAccepted = (
  uid: string,
): OutOfBandPresentationProposalAcceptedAction => ({
  type: OUTOFBAND_PRESENTATION_PROPOSAL_ACCEPTED,
  uid,
})

export const presentationRequestSent = (
  uid: string,
  presentationRequest: string,
  serialized: string,
): PresentationRequestSentAction => ({
  type: PRESENTATION_REQUEST_SENT,
  uid,
  presentationRequest,
  serialized,
})
export const presentationVerified = (
  uid: string,
  requestedProof: RequestedProof,
): PresentationVerifiedAction => ({
  type: PRESENTATION_VERIFIED,
  uid,
  requestedProof,
})
export const presentationVerificationFailed = (
  uid: string,
  error: string,
): PresentationVerificationFailedAction => ({
  type: PRESENTATION_VERIFICATION_FAILED,
  uid,
  error,
})

export function* presentationProposalAcceptedSaga(
  action: PresentationProposalAcceptedAction,
): Generator<*, *, *> {
  const verifier = yield select(getVerifier, action.uid)
  if (!verifier) {
    yield put(presentationVerificationFailed(action.uid, 'Cannot accept presentation proposal. Verifier not found'))
    return
  }

  const connection = yield call(getConnectionHandle, verifier.senderDID)
  if (!connection) {
    yield put(presentationVerificationFailed(action.uid, 'Cannot accept presentation proposal. Connection not found'))
    return
  }

  const handle = yield call(
    createProofVerifierWithProposal,
    JSON.stringify(verifier.presentationProposal),
    verifier.presentationProposal.comment,
  )
  yield call(proofVerifierSendRequest, handle, connection)
  const presentationRequest = yield call(proofVerifierGetPresentationRequest, handle)
  const serialized = yield call(proofVerifierSerialize, handle)

  yield put(presentationRequestSent(action.uid, presentationRequest, serialized))
}

function prepareRequestedProofData(presentationRequestMessage: string, proofMessage: string) {
  const proof = JSON.parse(proofMessage)
  const presentationRequest = JSON.parse(presentationRequestMessage)

  const indyProof =
    proof['libindy_proof'] ? JSON.parse(proof['libindy_proof']) : undefined

  const requestAttributes =
    presentationRequest['proof_request_data'] ?
      presentationRequest['proof_request_data']['requested_attributes'] : undefined

  if (!indyProof || !requestAttributes) {
    return
  }

  Object.keys(indyProof.requested_proof.revealed_attrs)
    .map((key) => {
      indyProof.requested_proof.revealed_attrs[key] = {
        attribute: requestAttributes[key] ? requestAttributes[key]['name'] : '',
        ...indyProof.requested_proof.revealed_attrs[key],
      }
    })

  return indyProof.requested_proof
}

export function* updateVerifierState(
  message: string,
): Generator<*, *, *> {
  const parsedMessage = JSON.parse(message) || {}
  const uid = parsedMessage['~thread'] ? parsedMessage['~thread']['thid'] : ''

  try {
    const verifier = yield select(getVerifier, uid)
    if (!verifier) {
      return
    }

    const handle = yield call(proofVerifierDeserialize, verifier.vcxSerializedStateObject)
    const state = yield call(proofVerifierUpdateStateWithMessage, handle, message)

    // proof request rejected
    if (state === VERIFIER_STATE.PROOF_REQUEST_REJECTED) {
      throw new Error('Presentation Request rejected')
    }

    // proof received
    if (state === VERIFIER_STATE.PROOF_RECEIVED) {
      const { proofState, message } = yield call(proofVerifierGetProofMessage, handle)
      if (!proofState || !message) {
        throw new Error('Presentation verification failed')
      }

      if (proofState === PROOF_SATE.VERIFIER) {
        // proof accepted
        const requestedProof = prepareRequestedProofData(verifier.presentationRequest, message)
        if (!requestedProof) {
          throw new Error('Presentation verification failed')
        }

        yield put(presentationVerified(uid, requestedProof))
      } else {
        throw new Error('Presentation verification failed')
      }
    }
  } catch (error) {
    customLogger.log(`updateVerifierState: ${error}`)
    yield put(presentationVerificationFailed(uid, error))
  }
}

export function* persistVerifier(): Generator<*, *, *> {
  try {
    const verifiers = yield select(getVerifiers)
    yield call(secureSet, VERIFIERS, JSON.stringify(verifiers))
  } catch (e) {
    captureError(e)
    customLogger.log(`persistVerifier Error: ${e}`)
  }
}

export function* hydrateVerifierSaga(): Generator<*, *, *> {
  try {
    const verifiers = yield call(getHydrationItem, VERIFIERS)
    if (verifiers) {
      yield put(hydrateVerifierStore(JSON.parse(verifiers)))
    }
  } catch (e) {
    captureError(e)
    customLogger.log(`hydrateVerifierSaga: ${e}`)
  }
}

export function* watchPresentationProposalAccepted(): any {
  yield takeEvery(PRESENTATION_PROPOSAL_ACCEPTED, presentationProposalAcceptedSaga)
}

function* watchPersistVerifierStore(): any {
  yield takeEvery(
    [
      PRESENTATION_PROPOSAL_RECEIVED,
      PRESENTATION_REQUEST_SENT,
      PRESENTATION_VERIFIED,
      PRESENTATION_VERIFICATION_FAILED,
    ],
    persistVerifier,
  )
}

export function* watchVerifier(): any {
  yield all([
    watchPresentationProposalAccepted(),
    watchPersistVerifierStore(),
  ])
}

export default function verifierReducer(
  state: VerifierStore = VerifierStoreInitialState,
  action: VerifierActions,
) {
  switch (action.type) {
    case HYDRATE_VERIFIER_STORE: {
      return {
        ...state,
        ...action.data,
      }
    }
    case PRESENTATION_PROPOSAL_RECEIVED:
      return {
        ...state,
        [action.payloadInfo.uid]: {
          presentationProposal: action.presentationProposal,
          uid: action.payloadInfo.uid,
          senderName: action.payloadInfo.senderName,
          senderDID: action.payloadInfo.remotePairwiseDID,
          senderLogoUrl: action.payloadInfo.senderLogoUrl,
          hidden: action.payloadInfo.hidden,
        },
      }
    case PRESENTATION_REQUEST_SENT:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          presentationRequest: action.presentationRequest,
          vcxSerializedStateObject: action.serialized,
        },
      }
    case PRESENTATION_VERIFIED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          requestedProof: action.requestedProof,
        },
      }
    case PRESENTATION_VERIFICATION_FAILED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          error: action.error,
        },
      }

    default:
      return state
  }
}
