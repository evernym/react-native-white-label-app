// @flow

import { INITIAL_TEST_ACTION } from '../common/type-common'
import type {
  CustomError,
  MessageAnnotation,
  TopicAnnotation,
  ReactNavigation,
  ResetAction,
  ImageSource,
  RequestedAttrsJson,
  GenericObject,
} from '../common/type-common'
import type {
  Attribute,
  NotificationPayloadInfo,
  SelectedAttribute,
} from '../push-notification/type-push-notification'
import type { ClaimMap } from '../claim/type-claim'
import { updateAttributeClaim } from '../proof/proof-store'
import type { LockStore } from '../lock/type-lock'
import { applyAttributesForPresentationRequest } from './proof-request-store'
import { appName } from '../external-imports'

export type RequestedAttribute = {|
  name?: string,
  names?: Array<string>,
  self_attest_allowed?: boolean,
  restrictions?: GenericObject,
|}

export type RequestedPredicates = {
  name: string,
  p_type: string,
  p_value: number,
  restrictions?: GenericObject,
}

export type ProofRequestedAttributes = {
  +[string]: RequestedAttribute,
}

export type ProofRequestedPredicates = {
  +[string]: RequestedPredicates,
}

export type ProofRequestData = {
  nonce: string,
  name: string,
  version: string,
  requested_attributes: ProofRequestedAttributes,
  requested_predicates?: ProofRequestedPredicates,
}

export type ProofRequest = {
  '@topic': {
    mid: number,
    tid: number,
  },
  '@type': {
    name: string,
    version: string,
  },
  msg_ref_id: string,
  proof_request_data: ProofRequestData,
}

export type ProofRequestPushPayload = {
  '@type': MessageAnnotation,
  '@topic': TopicAnnotation,
  intended_use?: string,
  proof_request_data: ProofRequestData,
  remoteName: string,
  proofHandle: number,
  ephemeralProofRequest?: string,
  outofbandProofRequest?: string,
}

export type AdditionalProofData = {
  name: string,
  version: string,
  requestedAttributes: Array<Attribute>,
}

export type AdditionalProofDataPayload = {
  data: AdditionalProofData,
  requester: {
    name: string,
  },
  originalProofRequestData: ProofRequestData,
  statusMsg?: string,
  proofHandle: number,
  ephemeralProofRequest?: string,
  outofbandProofRequest?: string,
}

export type HeaderProofData = {
  institutionalName: string,
  credentialName: string,
  credentialText: string,
  imageUrl: string,
  colorBackground: string,
}

export type ProofRequestAttributeListProp = {
  list: Array<Attribute>,
  claimMap?: ?ClaimMap,
  missingAttributes: MissingAttributes | {},
  canEnablePrimaryAction: (canEnable: boolean) => void,
  updateAttributesFilledFromCredentials: (item: SelectedAttribute) => void,
  updateAttributesFilledByUser: (item: SelectedAttribute) => void,
  attributesFilledFromCredential: RequestedAttrsJson,
  attributesFilledByUser: SelfAttestedAttributes,
}

export type ProofRequestAttributeListAndHeaderProps = ProofRequestAttributeListProp &
  HeaderProofData

export type ProofRequestAndHeaderProps = ProofRequestProps & HeaderProofData

export type ProofRequestAttributeListState = {
  [string]: string,
  isMissingFieldsShowing: boolean,
  showToggleMenu: boolean,
}

export const NO_SELF_ATTEST: 'NO_SELF_ATTEST' = 'NO_SELF_ATTEST'
export const NO_CRED_NO_SELF_ATTEST: 'NO_CRED_NO_SELF_ATTEST' =
  'NO_CRED_NO_SELF_ATTEST'

export type DissatisfiedAttribute = {|
  name: string,
  p_type?: string,
  p_value?: number,
  reason: typeof NO_SELF_ATTEST | typeof NO_CRED_NO_SELF_ATTEST,
  type?: string,
|}

export const DISSATISFIED_ATTRIBUTE_TYPE = {
  ATTRIBUTE: 'ATTRIBUTE',
  PREDICATE: 'PREDICATE',
}

export type ProofRequestPayload = AdditionalProofDataPayload & {
  status: ProofRequestStatus,
  proofStatus: ProofStatus,
  uid: string,
  senderLogoUrl?: ?string,
  remotePairwiseDID: string,
  missingAttributes?: MissingAttributes,
  vcxSerializedProofRequest?: string,
  // this key will be used to indicate that this proof request
  // cannot be fulfilled by credentials that are in user's wallet
  // nor user can fill self attested values inside empty attributes
  // value inside this key will tell reason that cannot fulfill each attribute
  dissatisfiedAttributes?: DissatisfiedAttribute[],
  requestedAttrsJson?: RequestedAttrsJson,
  selfAttestedAttributes?: any,
  hidden?: boolean,
  autoAccept?: boolean,
}

export type ProofRequestProps = {
  data: AdditionalProofData,
  logoUrl: string,
  proofStatus: ProofStatus,
  originalProofRequestData: ProofRequestData,
  remotePairwiseDID: string,
  name: string,
  errorProofSendData: ?CustomError,
  colorBackground: string,
  secondColorBackground: string,
  ignoreProofRequest: (uid: string) => void,
  rejectProofRequest: (uid: string) => void,
  acceptProofRequest: (uid: string) => void,
  proofRequestShown: (uid: string) => void,
  updateAttributeClaim: typeof updateAttributeClaim,
  getProof: (uid: string) => void,
  uid: string,
  proofGenerationError?: ?CustomError,
  claimMap?: ?ClaimMap,
  missingAttributes: MissingAttributes | {},
  userAvatarSource: ?ImageSource,
  proofRequestShowStart: (uid: string) => ProofRequestShowStartAction,
  newConnectionSeen: (senderDID: string) => void,
  hideModal: () => void,
  dissatisfiedAttributes: DissatisfiedAttribute[],
  denyProofRequest: (uid: string) => void,
  acceptOutOfBandInvitation: any,
  applyAttributesForPresentationRequest: typeof applyAttributesForPresentationRequest,
  deleteOutofbandPresentationRequest: (uid: string) => void,
  invitation?: any,
  invitationPayload?: any,
  attachedRequest?: any,
  lock: LockStore,
  canBeIgnored?: boolean,
  unlockApp: () => void,
} & ReactNavigation

export type ProofRequestState = {
  allMissingAttributesFilled: boolean,
  interactionsDone: boolean,
  scheduledDeletion: boolean,
  attributesFilledFromCredential: RequestedAttrsJson,
  attributesFilledByUser: SelfAttestedAttributes,
}

export const PROOF_REQUESTS = 'PROOF_REQUESTS'
export const PROOF_REQUEST_RECEIVED = 'PROOF_REQUEST_RECEIVED'
export type ProofRequestReceivedAction = {
  type: typeof PROOF_REQUEST_RECEIVED,
  payload: AdditionalProofDataPayload,
  payloadInfo: NotificationPayloadInfo,
}

export const PROOF_REQUEST_STATUS = {
  IDLE: 'IDLE',
  RECEIVED: 'RECEIVED',
  SHOWN: 'SHOWN',
  ACCEPTED: 'ACCEPTED',
  IGNORED: 'IGNORED',
  REJECTED: 'REJECTED',
}

export const PROOF_STATUS = {
  NONE: 'NONE',
  SENDING_PROOF: 'SENDING_PROOF',
  SEND_PROOF_FAIL: 'SEND_PROOF_FAIL',
  SEND_PROOF_SUCCESS: 'SEND_PROOF_SUCCESS',
}

export type ProofRequestStatus = $Keys<typeof PROOF_REQUEST_STATUS>
export type ProofStatus = $Keys<typeof PROOF_STATUS>

export const PROOF_REQUEST_SHOWN = 'PROOF_REQUEST_SHOWN'
export type ProofRequestShownAction = {
  type: typeof PROOF_REQUEST_SHOWN,
  uid: string,
}

export const SEND_PROOF_SUCCESS = 'SEND_PROOF_SUCCESS'
export type SendProofSuccessAction = {
  type: typeof SEND_PROOF_SUCCESS,
  uid: string,
}

export const HYDRATE_PROOF_REQUESTS = 'HYDRATE_PROOF_REQUESTS'
export type HydrateProofRequestsAction = {
  type: typeof HYDRATE_PROOF_REQUESTS,
  proofRequests: ProofRequestStore,
}

export const SEND_PROOF_FAIL = 'SEND_PROOF_FAIL'
export type SendProofFailAction = {
  type: typeof SEND_PROOF_FAIL,
  uid: string,
  error: CustomError,
}

export const SEND_PROOF = 'SEND_PROOF'
export type SendProofAction = {
  type: typeof SEND_PROOF,
  uid: string,
}

export const PROOF_REQUEST_IGNORED = 'PROOF_REQUEST_IGNORED'
export type ProofRequestIgnoredAction = {
  type: typeof PROOF_REQUEST_IGNORED,
  uid: string,
}

export const PROOF_REQUEST_REJECTED = 'PROOF_REQUEST_REJECTED'
export type ProofRequestRejectedAction = {
  type: typeof PROOF_REQUEST_REJECTED,
  uid: string,
}

export const PROOF_REQUEST_ACCEPTED = 'PROOF_REQUEST_ACCEPTED'
export type ProofRequestAcceptedAction = {
  type: typeof PROOF_REQUEST_ACCEPTED,
  uid: string,
}

export const PROOF_REQUEST_AUTO_FILL = 'PROOF_REQUEST_AUTO_FILL'
export type ProofRequestAutoFillAction = {
  type: typeof PROOF_REQUEST_AUTO_FILL,
  uid: string,
  requestedAttributes: Array<Attribute>,
}

export type MissingAttribute = {
  key: string,
  name: string,
}

export type SelfAttestedAttribute = {
  name: string,
  data: string,
  key: string,
}

export type SelfAttestedAttributes = {
  [attributeName: string]: SelfAttestedAttribute,
}

export type MissingAttributes = SelfAttestedAttributes

export const MISSING_ATTRIBUTES_FOUND = 'MISSING_ATTRIBUTES_FOUND'
export type MissingAttributesFoundAction = {
  type: typeof MISSING_ATTRIBUTES_FOUND,
  missingAttributes: MissingAttributes,
  uid: string,
}

export type ProofRequestInitialAction = {
  type: typeof INITIAL_TEST_ACTION,
}

export const PROOF_SERIALIZED = 'PROOF_SERIALIZED'
export type ProofSerializedAction = {
  type: typeof PROOF_SERIALIZED,
  serializedProof: string,
  uid: string,
}

export const UPDATE_PROOF_HANDLE = 'UPDATE_PROOF_HANDLE'
export type UpdateProofHandleAction = {
  type: typeof UPDATE_PROOF_HANDLE,
  proofHandle: number,
  uid: string,
}

export const PROOF_REQUEST_SHOW_START = 'PROOF_REQUEST_SHOW_START'
export type ProofRequestShowStartAction = {
  type: typeof PROOF_REQUEST_SHOW_START,
  uid: string,
}

export const PROOF_REQUEST_DISSATISFIED_ATTRIBUTES_FOUND: 'PROOF_REQUEST_DISSATISFIED_ATTRIBUTES_FOUND' =
  'PROOF_REQUEST_DISSATISFIED_ATTRIBUTES_FOUND'
export type ProofRequestDissatisfiedAttributesFoundAction = {
  type: typeof PROOF_REQUEST_DISSATISFIED_ATTRIBUTES_FOUND,
  uid: string,
  dissatisfiedAttributes: DissatisfiedAttribute[],
}

export const DENY_PROOF_REQUEST: 'DENY_PROOF_REQUEST' = 'DENY_PROOF_REQUEST'
export type DenyProofRequestAction = {
  type: typeof DENY_PROOF_REQUEST,
  uid: string,
}

export const DENY_PROOF_REQUEST_FAIL = 'DENY_PROOF_REQUEST_FAIL'
export type DenyProofRequestFailAction = {
  type: typeof DENY_PROOF_REQUEST_FAIL,
  uid: string,
}

export const DENY_PROOF_REQUEST_SUCCESS: 'DENY_PROOF_REQUEST_SUCCESS' =
  'DENY_PROOF_REQUEST_SUCCESS'
export type DenyProofRequestSuccessAction = {
  type: typeof DENY_PROOF_REQUEST_SUCCESS,
  uid: string,
}

export const APPLY_ATTRIBUTES_FOR_PRESENTATION_REQUEST =
  'APPLY_ATTRIBUTES_FOR_PRESENTATION_REQUEST'
export type ApplyAttributesForPresentationRequestAction = {
  type: typeof APPLY_ATTRIBUTES_FOR_PRESENTATION_REQUEST,
  uid: string,
  requestedAttrsJson: RequestedAttrsJson,
  selfAttestedAttributes: SelfAttestedAttributes,
}

export const ACCEPT_OUTOFBAND_PRESENTATION_REQUEST =
  'ACCEPT_OUTOFBAND_PRESENTATION_REQUEST'
export type AcceptOutofbandPresentationRequestAction = {
  type: typeof ACCEPT_OUTOFBAND_PRESENTATION_REQUEST,
  uid: string,
  senderDID: string,
  show: boolean,
}

export const DELETE_OUTOFBAND_PRESENTATION_REQUEST =
  'DELETE_OUTOFBAND_PRESENTATION_REQUEST'
export type DeleteOutofbandPresentationRequestAction = {
  type: typeof DELETE_OUTOFBAND_PRESENTATION_REQUEST,
  uid: string,
}

export const OUT_OF_BAND_CONNECTION_FOR_PRESENTATION_ESTABLISHED =
  'OUT_OF_BAND_CONNECTION_FOR_PRESENTATION_ESTABLISHED'
export type OutOfBandConnectionForPresentationEstablishedAction = {
  type: typeof OUT_OF_BAND_CONNECTION_FOR_PRESENTATION_ESTABLISHED,
  uid: string,
}

export type ProofRequestAction =
  | ProofRequestReceivedAction
  | SendProofSuccessAction
  | HydrateProofRequestsAction
  | SendProofFailAction
  | SendProofAction
  | ProofRequestIgnoredAction
  | ProofRequestAcceptedAction
  | ProofRequestShownAction
  | ProofRequestInitialAction
  | ProofRequestRejectedAction
  | ProofRequestAutoFillAction
  | MissingAttributesFoundAction
  | ProofSerializedAction
  | UpdateProofHandleAction
  | ProofRequestShowStartAction
  | ResetAction
  | ProofRequestDissatisfiedAttributesFoundAction
  | DenyProofRequestAction
  | DenyProofRequestSuccessAction
  | DenyProofRequestFailAction
  | ApplyAttributesForPresentationRequestAction
  | AcceptOutofbandPresentationRequestAction
  | DeleteOutofbandPresentationRequestAction

export type ProofRequestStore = {
  +[string]: ProofRequestPayload,
}

export type QrCodeEphemeralProofRequest = {
  ephemeralProofRequest: {
    '@id': string,
    '@type': string,
    'request_presentations~attach': Array<{
      '@id': string,
      'mime-type': string,
      data: {
        base64: string,
      },
    }>,
    comment: ?string,
    '~service': {
      recipientKeys: Array<string>,
      routingKeys: ?Array<string>,
      serviceEndpoint: string,
    },
  },
  proofRequestPayload: AdditionalProofDataPayload,
}

export type AriesPresentationRequest = {
  '@id': string,
  '@type': string,
  comment: string,
  'request_presentations~attach': Array<{
    '@id': string,
    'mime-type': string,
    data: {
      base64: string,
    },
  }>,
}

export const PRIMARY_ACTION_SEND = 'Share Attributes'

export const MESSAGE_ERROR_PROOF_GENERATION_TITLE = 'Error generating proof'
export const MESSAGE_ERROR_PROOF_GENERATION_DESCRIPTION = 'Please try again.'

export const ERROR_SEND_PROOF = (message: string) => ({
  code: 'PR-001',
  message: `Error sending proof: ${message}`,
})

export const MESSAGE_ATTRIBUTE_TITLE = 'Missing Attribute'
export const MESSAGE_ATTRIBUTE_DESCRIPTION = (
  requester: string,
  attribute: string
) => `
  ${requester} is asking you to share ${attribute}, which is not found in your ${appName} wallet.`

export const MESSAGE_PREDICATE_TITLE = 'Unfulfilled Predicate'
export const MESSAGE_PREDICATE_DESCRIPTION = (
  requester: string,
  attribute: string
) => `
  ${requester} is asking you to prove that ${attribute}, but credential matching to the condition is not found in your Connect.Me wallet.`

export const ATTRIBUTE_TYPE = {
  FILLED_ATTRIBUTE: 'FILLED_ATTRIBUTE',
  SELF_ATTESTED_ATTRIBUTE: 'SELF_ATTESTED_ATTRIBUTE',
  DISSATISFIED_ATTRIBUTE: 'DISSATISFIED_ATTRIBUTE',
  FILLED_PREDICATE: 'FILLED_PREDICATE',
  DISSATISFIED_PREDICATE: 'DISSATISFIED_PREDICATE',
}

export type AriesPresentationPreviewAttribute = {
  name: string,
  value?: string | null,
  cred_def_id?: string | null,
}

export type AriesPresentationPreviewPredicate = {
  name: string,
  predicate?: string | null,
  threshold?: string | null,
  cred_def_id?: string | null,
}

export type AriesPresentationPreview = {
  '@type': string,
  attributes?: Array<AriesPresentationPreviewAttribute>,
  predicates?: Array<AriesPresentationPreviewPredicate>,
}

export type AriesPresentationProposal = {
  '@id': string,
  '@type': string,
  comment: string,
  presentation_proposal: AriesPresentationPreview,
}
