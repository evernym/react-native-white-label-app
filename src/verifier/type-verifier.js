// @flow
import type { AriesPresentationProposal } from "../proof-request/type-proof-request";
import type { NotificationPayloadInfo } from "../push-notification/type-push-notification";

export const HYDRATE_VERIFIER_STORE = 'HYDRATE_VERIFIER_STORE'
export type HydrateVerifierStoreAction = {
  type: typeof HYDRATE_VERIFIER_STORE,
  data: VerifierStore,
}

export const PROOF_PROPOSAL_RECEIVED = 'PROOF_PROPOSAL_RECEIVED'
export type ProofProposalReceivedAction = {
  type: typeof PROOF_PROPOSAL_RECEIVED,
  presentationProposal: AriesPresentationProposal,
  payloadInfo: NotificationPayloadInfo,
}

export const OUTOFBAND_PROOF_PROPOSAL_ACCEPTED = 'OUTOFBAND_PROOF_PROPOSAL_ACCEPTED'
export type OutOfBandProofProposalAcceptedAction = {
  type: typeof OUTOFBAND_PROOF_PROPOSAL_ACCEPTED,
  uid: string,
}

export const PROOF_PROPOSAL_ACCEPTED = 'PROOF_PROPOSAL_ACCEPTED'
export type ProofProposalAcceptedAction = {
  type: typeof PROOF_PROPOSAL_ACCEPTED,
  uid: string,
}

export const PROOF_REQUEST_SENT = 'PROOF_REQUEST_SENT'
export type ProofRequestSentAction = {
  type: typeof PROOF_REQUEST_SENT,
  uid: string,
  proofRequest: string,
  serialized: string,
}

export const PROOF_VERIFIED = 'PROOF_VERIFIED'
export type ProofVerifiedAction = {
  type: typeof PROOF_VERIFIED,
  uid: string,
  requestedProof: RequestedProof,
}

export const PROOF_VERIFICATION_FAILED = 'PROOF_VERIFICATION_FAILED'
export type ProofVerificationFailedAction = {
  type: typeof PROOF_VERIFICATION_FAILED,
  uid: string,
  error: string,
}

export type RevealedAttribute = {
  attribute: string,
  raw: string,
  encoded: string,
  sub_proof_index: number,
}

export type RevealedAttributeGroup = {
  sub_proof_index: number,
  values: {
    +[string]: {
      raw: string,
      encoded: string,
    },
  }
}

export type SelfAttestedAttribute = {
  attribute: string,
  value: string,
}

export type UnrevealedAttribute = {
  attribute: string,
  sub_proof_index: number,
}

export type Predicate = {
  attribute: string,
  p_type: string,
  p_value: number,
}

export type RequestedProof = {
  revealed_attrs: Array<RevealedAttribute>,
  revealed_attr_groups: Array<RevealedAttributeGroup>,
  self_attested_attrs: Array<SelfAttestedAttribute>,
  unrevealed_attrs: Array<UnrevealedAttribute>,
  predicates: Array<Predicate>
}

export const VERIFIER_STATE = {
  NONE: 0,
  PROOF_RECEIVED: 4,
  PROOF_REQUEST_REJECTED: 9,
}

export const PROOF_SATE = {
  NONE: 0,
  VERIFIER: 1,
  INVALID: 2,
}

export type VerifierActions =
  | HydrateVerifierStoreAction
  | ProofProposalReceivedAction
  | OutOfBandProofProposalAcceptedAction
  | ProofProposalAcceptedAction
  | ProofRequestSentAction
  | ProofVerifiedAction
  | ProofVerificationFailedAction

export type VerifierData = {
  uid: string,
  presentationProposal: AriesPresentationProposal,
  senderDID: string,
  senderName: string | null,
  senderLogoUrl: string | null,
  proofRequest?: string,
  vcxSerializedStateObject?: string,
  requestedProof?: RequestedProof | null,
  hidden?: boolean,
  error?: string,
}

export type VerifierStore = {
  +[string]: VerifierData,
}

export const VerifierStoreInitialState = {}
