// @flow
import type { AriesPresentationProposal } from "../proof-request/type-proof-request";
import type { NotificationPayloadInfo } from "../push-notification/type-push-notification";

export const HYDRATE_VERIFIER_STORE = 'HYDRATE_VERIFIER_STORE'
export type HydrateVerifierStoreAction = {
  type: typeof HYDRATE_VERIFIER_STORE,
  data: VerifierStore,
}

export const PRESENTATION_PROPOSAL_RECEIVED = 'PRESENTATION_PROPOSAL_RECEIVED'
export type PresentationProposalReceivedAction = {
  type: typeof PRESENTATION_PROPOSAL_RECEIVED,
  presentationProposal: AriesPresentationProposal,
  payloadInfo: NotificationPayloadInfo,
}

export const OUTOFBAND_PRESENTATION_PROPOSAL_ACCEPTED = 'OUTOFBAND_PRESENTATION_PROPOSAL_ACCEPTED'
export type OutOfBandPresentationProposalAcceptedAction = {
  type: typeof OUTOFBAND_PRESENTATION_PROPOSAL_ACCEPTED,
  uid: string,
}

export const PRESENTATION_PROPOSAL_ACCEPTED = 'PRESENTATION_PROPOSAL_ACCEPTED'
export type PresentationProposalAcceptedAction = {
  type: typeof PRESENTATION_PROPOSAL_ACCEPTED,
  uid: string,
}

export const PRESENTATION_REQUEST_SENT = 'PRESENTATION_REQUEST_SENT'
export type PresentationRequestSentAction = {
  type: typeof PRESENTATION_REQUEST_SENT,
  uid: string,
  presentationRequest: string,
  serialized: string,
}

export const PRESENTATION_VERIFIED = 'PRESENTATION_VERIFIED'
export type PresentationVerifiedAction = {
  type: typeof PRESENTATION_VERIFIED,
  uid: string,
  requestedProof: RequestedProof,
}

export const PRESENTATION_VERIFICATION_FAILED = 'PRESENTATION_VERIFICATION_FAILED'
export type PresentationVerificationFailedAction = {
  type: typeof PRESENTATION_VERIFICATION_FAILED,
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

export type SubProofReferent = {
  attribute: string,
  sub_proof_index: number,
}

export type RequestedProof = {
  revealed_attrs: {
    +[string]: RevealedAttribute,
  },
  revealed_attr_groups: {
    +[string]: RevealedAttributeGroup,
  },
  self_attested_attrs: {
    +[string]: string,
  },
  unrevealed_attrs: {
    +[string]: SubProofReferent,
  },
  predicates: {
    +[string]: SubProofReferent,
  }
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
  | PresentationProposalReceivedAction
  | OutOfBandPresentationProposalAcceptedAction
  | PresentationProposalAcceptedAction
  | PresentationRequestSentAction
  | PresentationVerifiedAction
  | PresentationVerificationFailedAction

export type VerifierData = {
  uid: string,
  presentationProposal: AriesPresentationProposal,
  senderDID: string,
  senderName: string | null,
  senderLogoUrl: string | null,
  presentationRequest?: string,
  vcxSerializedStateObject?: string,
  requestedProof?: RequestedProof | null,
  hidden?: boolean,
  error?: string,
}

export type VerifierStore = {
  +[string]: VerifierData,
}

export const VerifierStoreInitialState = {}
