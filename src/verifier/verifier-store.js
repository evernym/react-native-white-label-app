// @flow
import { all, call, put, select, takeEvery } from 'redux-saga/effects'
import {
  createProofVerifierWithProposal,
  proofVerifierDeserialize,
  proofVerifierGetProofRequest,
  proofVerifierGetProofMessage,
  proofVerifierSendRequest,
  proofVerifierSerialize,
  proofVerifierUpdateStateWithMessage,
} from '../bridge/react-native-cxs/RNCxs'
import { getVerifier, getVerifiers } from '../store/store-selector'
import type {
  HydrateVerifierStoreAction,
  OutOfBandProofProposalAcceptedAction,
  ProofProposalAcceptedAction,
  ProofProposalReceivedAction,
  ProofRequestSentAction,
  ProofVerificationFailedAction,
  ProofVerifiedAction,
  RequestedProof,
  VerifierActions,
  VerifierStore,
} from './type-verifier'
import {
  HYDRATE_VERIFIER_STORE,
  OUTOFBAND_PROOF_PROPOSAL_ACCEPTED,
  PROOF_PROPOSAL_ACCEPTED,
  PROOF_PROPOSAL_RECEIVED,
  PROOF_REQUEST_SENT,
  PROOF_VERIFICATION_FAILED,
  PROOF_VERIFIED,
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
import {
  ensureVcxInitAndPoolConnectSuccess,
  ensureVcxInitSuccess,
} from '../store/route-store'

export const hydrateVerifierStore = (
  data: VerifierStore
): HydrateVerifierStoreAction => ({
  type: HYDRATE_VERIFIER_STORE,
  data,
})

export const proofProposalReceived = (
  presentationProposal: AriesPresentationProposal,
  payloadInfo: NotificationPayloadInfo
): ProofProposalReceivedAction => ({
  type: PROOF_PROPOSAL_RECEIVED,
  presentationProposal,
  payloadInfo,
})

export const proofProposalAccepted = (
  uid: string
): ProofProposalAcceptedAction => ({
  type: PROOF_PROPOSAL_ACCEPTED,
  uid,
})

export const outofbandProofProposalAccepted = (
  uid: string
): OutOfBandProofProposalAcceptedAction => ({
  type: OUTOFBAND_PROOF_PROPOSAL_ACCEPTED,
  uid,
})

export const proofRequestSent = (
  uid: string,
  proofRequest: string,
  serialized: string
): ProofRequestSentAction => ({
  type: PROOF_REQUEST_SENT,
  uid,
  proofRequest,
  serialized,
})
export const proofVerified = (
  uid: string,
  requestedProof: RequestedProof
): ProofVerifiedAction => ({
  type: PROOF_VERIFIED,
  uid,
  requestedProof,
})
export const proofVerificationFailed = (
  uid: string,
  error: string
): ProofVerificationFailedAction => ({
  type: PROOF_VERIFICATION_FAILED,
  uid,
  error,
})

export function* proofProposalAcceptedSaga(
  action: ProofProposalAcceptedAction
): Generator<*, *, *> {
  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    throw new Error(
      'Cannot accept presentation proposal. Library is not initialized'
    )
  }

  const verifier = yield select(getVerifier, action.uid)
  if (!verifier) {
    throw new Error('Cannot accept presentation proposal. Verifier not found')
  }

  const connection = yield call(getConnectionHandle, verifier.senderDID)
  if (!connection) {
    throw new Error('Cannot accept presentation proposal. Connection not found')
  }

  const handle = yield call(
    createProofVerifierWithProposal,
    JSON.stringify(verifier.presentationProposal),
    verifier.presentationProposal.comment
  )
  yield call(proofVerifierSendRequest, handle, connection)
  const proofRequest = yield call(proofVerifierGetProofRequest, handle)
  const serialized = yield call(proofVerifierSerialize, handle)

  yield put(proofRequestSent(action.uid, proofRequest, serialized))
}

function prepareRequestedProofData(
  proofRequestMessage: string,
  proofMessage: string
): RequestedProof | null {
  const proof = JSON.parse(proofMessage)
  const proofRequest = JSON.parse(proofRequestMessage)
  if (!proof || !proofRequest) {
    return null
  }

  const indyProof = proof['libindy_proof']
    ? JSON.parse(proof['libindy_proof'])
    : undefined
  const proofRequestData = proofRequest['proof_request_data']
  if (!indyProof || !proofRequestData) {
    return null
  }

  const requestedAttributes = proofRequestData['requested_attributes'] || {}
  const requestedPredicates = proofRequestData['requested_predicates'] || {}

  const revealed_attrs: Array<any> = indyProof.requested_proof.revealed_attrs
    ? Object.keys(indyProof.requested_proof.revealed_attrs).map((key) => ({
        attribute: requestedAttributes[key]
          ? requestedAttributes[key].name
          : '',
        ...indyProof.requested_proof.revealed_attrs[key],
      }))
    : []

  const revealed_attr_groups: Array<any> = indyProof.requested_proof
    .revealed_attr_groups
    ? Object.values(indyProof.requested_proof.revealed_attr_groups)
    : []

  const self_attested_attrs: Array<any> = indyProof.requested_proof
    .self_attested_attrs
    ? Object.keys(indyProof.requested_proof.self_attested_attrs).map((key) => ({
        attribute: requestedAttributes[key]
          ? requestedAttributes[key].name
          : '',
        ...indyProof.requested_proof.self_attested_attrs[key],
      }))
    : []

  const unrevealed_attrs: Array<any> = indyProof.requested_proof
    .unrevealed_attrs
    ? Object.keys(indyProof.requested_proof.unrevealed_attrs).map((key) => ({
        attribute: requestedAttributes[key]
          ? requestedAttributes[key].name
          : '',
        ...indyProof.requested_proof.unrevealed_attrs[key],
      }))
    : []

  const predicates: Array<any> = Object.keys(
    indyProof.requested_proof.predicates
  ).map((key) => {
    const predicate = requestedPredicates[key]
    return {
      attribute: predicate ? predicate.name : '',
      p_type: predicate ? predicate.p_type : '',
      p_value: predicate ? predicate.p_value : 0,
      ...indyProof.requested_proof.predicates[key],
    }
  })

  return {
    revealed_attrs,
    revealed_attr_groups,
    self_attested_attrs,
    unrevealed_attrs,
    predicates,
  }
}

export function* updateVerifierState(message: string): Generator<*, *, *> {
  const vcxResult = yield* ensureVcxInitAndPoolConnectSuccess()
  if (vcxResult && vcxResult.fail) {
    throw new Error('Cannot update Verifier state. Library is not initialized')
  }

  const parsedMessage = JSON.parse(message) || {}
  const uid = parsedMessage['~thread'] ? parsedMessage['~thread']['thid'] : ''

  try {
    const verifier = yield select(getVerifier, uid)
    if (!verifier) {
      return
    }

    const handle = yield call(
      proofVerifierDeserialize,
      verifier.vcxSerializedStateObject
    )
    const state = yield call(
      proofVerifierUpdateStateWithMessage,
      handle,
      message
    )

    // proof request rejected
    if (state === VERIFIER_STATE.PROOF_REQUEST_REJECTED) {
      throw new Error('Proof Request rejected')
    }

    // proof received
    if (state === VERIFIER_STATE.PROOF_RECEIVED) {
      const { proofState, message } = yield call(
        proofVerifierGetProofMessage,
        handle
      )
      if (!proofState || !message || proofState !== PROOF_SATE.VERIFIER) {
        throw new Error('Proof verification failed')
      }

      // proof accepted
      const requestedProof = prepareRequestedProofData(
        verifier.proofRequest,
        message
      )
      if (!requestedProof) {
        throw new Error('Proof verification failed')
      }

      yield put(proofVerified(uid, requestedProof))
    }
  } catch (error) {
    customLogger.log(`updateVerifierState: ${error}`)
    yield put(proofVerificationFailed(uid, error))
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

export function* watchProofProposalAccepted(): any {
  yield takeEvery(PROOF_PROPOSAL_ACCEPTED, proofProposalAcceptedSaga)
}

function* watchPersistVerifierStore(): any {
  yield takeEvery(
    [
      PROOF_PROPOSAL_RECEIVED,
      PROOF_REQUEST_SENT,
      PROOF_VERIFIED,
      PROOF_VERIFICATION_FAILED,
    ],
    persistVerifier
  )
}

export function* watchVerifier(): any {
  yield all([watchProofProposalAccepted(), watchPersistVerifierStore()])
}

export default function verifierReducer(
  state: VerifierStore = VerifierStoreInitialState,
  action: VerifierActions
) {
  switch (action.type) {
    case HYDRATE_VERIFIER_STORE: {
      return {
        ...state,
        ...action.data,
      }
    }
    case PROOF_PROPOSAL_RECEIVED:
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
    case PROOF_REQUEST_SENT:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofRequest: action.proofRequest,
          vcxSerializedStateObject: action.serialized,
        },
      }
    case PROOF_VERIFIED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          requestedProof: action.requestedProof,
        },
      }
    case PROOF_VERIFICATION_FAILED:
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
