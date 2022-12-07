// @flow

import type { Item } from '../components/custom-list/type-custom-list'
import type {
  GenericObject,
  CustomError,
  ResetAction,
} from '../common/type-common'
import type {
  InvitationAcceptedAction,
  InvitationReceivedAction,
} from '../invitation/type-invitation'
import type {
  ConnectionFailAction,
  DeleteConnectionSuccessEventAction,
  NewConnectionAction,
  NewConnectionSuccessAction,
} from '../store/type-connection-store'
import type { ClaimStorageSuccessAction } from '../claim/type-claim'
import type {
  ClaimOfferReceivedAction,
  ClaimOfferAcceptedAction,
  SendClaimRequestFailAction,
  SendClaimRequestAction,
  OutofbandClaimOfferAcceptedAction,
} from '../claim-offer/type-claim-offer'
import type {
  ProofRequestReceivedAction,
  SendProofSuccessAction,
} from '../proof-request/type-proof-request'
import type { UpdateAttributeClaimAction } from '../proof/type-proof'

import {
  INVITATION_ACCEPTED,
  INVITATION_RECEIVED,
  INVITATION_REJECTED,
} from '../invitation/type-invitation'
import {
  CLAIM_OFFER_RECEIVED,
  CLAIM_OFFER_ACCEPTED,
  CLAIM_OFFER_IGNORED,
  CLAIM_OFFER_REJECTED,
  SEND_CLAIM_REQUEST_SUCCESS,
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  DENY_CLAIM_OFFER,
  DENY_CLAIM_OFFER_SUCCESS,
  DENY_CLAIM_OFFER_FAIL,
  DELETE_CLAIM_SUCCESS,
} from '../claim-offer/type-claim-offer'
import { CLAIM_STORAGE_SUCCESS } from '../claim/type-claim'
import {
  PROOF_REQUEST_RECEIVED,
  PROOF_REQUEST_ACCEPTED,
  PROOF_REQUEST_IGNORED,
  PROOF_REQUEST_REJECTED,
  SEND_PROOF_SUCCESS,
  DENY_PROOF_REQUEST_SUCCESS,
  DENY_PROOF_REQUEST_FAIL,
  DENY_PROOF_REQUEST,
} from '../proof-request/type-proof-request'
import { UPDATE_ATTRIBUTE_CLAIM, ERROR_SEND_PROOF } from '../proof/type-proof'
import {
  QUESTION_RECEIVED,
  UPDATE_QUESTION_ANSWER,
} from '../question/type-question'
import {
  CONNECTION_FAIL,
  CONNECTION_REQUEST_SENT,
  DELETE_CONNECTION_SUCCESS,
  NEW_CONNECTION_SUCCESS,
} from '../store/type-connection-store'
import type { QuestionReceivedAction } from '../question/type-question'
import {
  INVITE_ACTION_RECEIVED,
  INVITE_ACTION_REJECTED,
  INVITE_ACTION_ACCEPTED,
} from '../invite-action/type-invite-action.js'
import {
  PROOF_PROPOSAL_ACCEPTED,
  PROOF_PROPOSAL_RECEIVED,
  PROOF_REQUEST_SENT,
  PROOF_VERIFICATION_FAILED,
  PROOF_VERIFIED,
} from '../verifier/type-verifier'
import type {
  OutOfBandProofProposalAcceptedAction,
  ProofProposalAcceptedAction,
  ProofProposalReceivedAction,
  ProofRequestSentAction,
  ProofVerificationFailedAction,
  ProofVerifiedAction,
} from '../verifier/type-verifier'

export const HISTORY_EVENT_STATUS = {
  [INVITATION_RECEIVED]: 'CONNECTION REQUEST',
  [NEW_CONNECTION_SUCCESS]: 'CONNECTED',
  [INVITATION_ACCEPTED]: INVITATION_ACCEPTED,
  [CONNECTION_REQUEST_SENT]: CONNECTION_REQUEST_SENT,
  [CONNECTION_FAIL]: CONNECTION_FAIL,
  [INVITATION_REJECTED]: 'CONNECTION REJECTED',
  [SEND_CLAIM_REQUEST_SUCCESS]: 'PENDING',
  [CLAIM_OFFER_RECEIVED]: 'CLAIM OFFER RECEIVED',
  [CLAIM_OFFER_ACCEPTED]: CLAIM_OFFER_ACCEPTED,
  [CLAIM_OFFER_IGNORED]: 'IGNORED OFFER',
  [CLAIM_OFFER_REJECTED]: 'REJECTED OFFER',
  [DENY_CLAIM_OFFER]: DENY_CLAIM_OFFER,
  [DENY_CLAIM_OFFER_SUCCESS]: DENY_CLAIM_OFFER_SUCCESS,
  [DENY_CLAIM_OFFER_FAIL]: DENY_CLAIM_OFFER_FAIL,
  [CLAIM_STORAGE_SUCCESS]: 'RECEIVED',
  [DELETE_CLAIM_SUCCESS]: 'DELETED',
  [PROOF_REQUEST_RECEIVED]: 'PROOF RECEIVED',
  [PROOF_REQUEST_ACCEPTED]: PROOF_REQUEST_ACCEPTED,
  [PROOF_REQUEST_IGNORED]: 'IGNORED',
  [PROOF_REQUEST_REJECTED]: 'REJECTED',
  [SEND_PROOF_SUCCESS]: 'SHARED',
  [QUESTION_RECEIVED]: QUESTION_RECEIVED,
  [UPDATE_QUESTION_ANSWER]: UPDATE_QUESTION_ANSWER,
  [DENY_PROOF_REQUEST_SUCCESS]: DENY_PROOF_REQUEST_SUCCESS,
  [DENY_PROOF_REQUEST]: DENY_PROOF_REQUEST,
  [DENY_PROOF_REQUEST_FAIL]: DENY_PROOF_REQUEST_FAIL,
  [SEND_CLAIM_REQUEST_FAIL]: SEND_CLAIM_REQUEST_FAIL,
  [PAID_CREDENTIAL_REQUEST_FAIL]: PAID_CREDENTIAL_REQUEST_FAIL,
  [UPDATE_ATTRIBUTE_CLAIM]: UPDATE_ATTRIBUTE_CLAIM,
  [ERROR_SEND_PROOF]: ERROR_SEND_PROOF,
  [DELETE_CONNECTION_SUCCESS]: DELETE_CONNECTION_SUCCESS,
  [INVITE_ACTION_RECEIVED]: INVITE_ACTION_RECEIVED,
  [INVITE_ACTION_REJECTED]: INVITE_ACTION_REJECTED,
  [INVITE_ACTION_ACCEPTED]: INVITE_ACTION_ACCEPTED,
  [PROOF_PROPOSAL_RECEIVED]: PROOF_PROPOSAL_RECEIVED,
  [PROOF_PROPOSAL_ACCEPTED]: PROOF_PROPOSAL_ACCEPTED,
  [PROOF_REQUEST_SENT]: PROOF_REQUEST_SENT,
  [PROOF_VERIFIED]: PROOF_VERIFIED,
  [PROOF_VERIFICATION_FAILED]: PROOF_VERIFICATION_FAILED,
}

export const HISTORY_EVENT_TYPE = {
  INVITATION: 'INVITATION',
  CLAIM: 'CLAIM',
  PROOF: 'PROOF',
  AUTHENTICATION: 'AUTHENTICATION',
  QUESTION: 'QUESTION',
  INVITE_ACTION: 'INVITE_ACTION',
}

export type HistoryEventType = $Keys<typeof HISTORY_EVENT_TYPE>

export type ConnectionHistoryEvent = {
  action: string,
  data: Array<Item> | GenericObject,
  id: string,
  name: string,
  status: string, // HistoryEventStatus
  timestamp: string,
  type: HistoryEventType,
  remoteDid: string,
  originalPayload: GenericObject,
  showBadge?: boolean,
  payTokenValue?: string,
  senderName?: ?string,
  senderLogoUrl?: ?string,
}

export type ConnectionHistoryData = {
  connections: {
    [string]: { data: ConnectionHistoryEvent[], newBadge: boolean },
  },
  connectionsUpdated: boolean,
}

export const LOAD_HISTORY = 'LOAD_HISTORY'

export type LoadHistoryAction = {
  type: typeof LOAD_HISTORY,
}

export const LOAD_HISTORY_SUCCESS = 'LOAD_HISTORY_SUCCESS'

export type LoadHistorySuccessAction = {
  type: typeof LOAD_HISTORY_SUCCESS,
  data: ConnectionHistoryData,
}

export const LOAD_HISTORY_FAIL = 'LOAD_HISTORY_FAIL'

export type LoadHistoryFailAction = {
  type: typeof LOAD_HISTORY_FAIL,
  error: CustomError,
}

export const HISTORY_EVENT_OCCURRED = 'HISTORY_EVENT_OCCURRED'

export type HistoryEventOccurredEventType =
  | InvitationReceivedAction
  | NewConnectionAction
  | NewConnectionSuccessAction
  | ClaimOfferReceivedAction
  | ProofRequestReceivedAction
  | SendProofSuccessAction
  | SendClaimRequestAction
  | ClaimStorageSuccessAction
  | ClaimOfferAcceptedAction
  | SendClaimRequestFailAction
  | ResetAction
  | UpdateAttributeClaimAction
  | InvitationAcceptedAction
  | ConnectionFailAction
  | DeleteConnectionSuccessEventAction
  | QuestionReceivedAction
  | OutofbandClaimOfferAcceptedAction
  | ProofProposalReceivedAction
  | OutOfBandProofProposalAcceptedAction
  | ProofProposalAcceptedAction
  | ProofRequestSentAction
  | ProofVerifiedAction
  | ProofVerificationFailedAction

export type HistoryEventOccurredAction = {
  type: typeof HISTORY_EVENT_OCCURRED,
  event: HistoryEventOccurredEventType,
}

export const RECORD_HISTORY_EVENT = 'RECORD_HISTORY_EVENT'

export type RecordHistoryEventAction = {
  type: typeof RECORD_HISTORY_EVENT,
  historyEvent: ConnectionHistoryEvent,
}

export const DELETE_HISTORY_EVENT = 'DELETE_HISTORY_EVENT'

export type DeleteHistoryEventAction = {
  type: typeof DELETE_HISTORY_EVENT,
  historyEvent: ConnectionHistoryEvent,
}

export const DELETE_PENDING_HISTORY_EVENTS = 'DELETE_PENDING_HISTORY_EVENTS'
export type DeletePendingHistoryEventsAction = {
  type: typeof DELETE_PENDING_HISTORY_EVENTS,
  senderDID: string,
}

export const SHOW_USER_BACKUP_ALERT = 'SHOW_USER_BACKUP_ALERT'
export type ShowUserBackupAlertAction = {
  type: typeof SHOW_USER_BACKUP_ALERT,
  action: any,
}

export const ERROR_LOADING_HISTORY = {
  code: 'CN002',
  message: 'Error while loading connection history data',
}

export const ERROR_HISTORY_EVENT_OCCURRED = {
  code: 'CN003',
  message: 'Error while history event occurred',
}

export const UPDATE_HISTORY_EVENT = 'UPDATE_HISTORY_EVENT'

export type UpdateHistoryEventAction = {
  type: typeof UPDATE_HISTORY_EVENT,
  historyEvent: ConnectionHistoryEvent,
}

export type ConnectionHistoryAction =
  | LoadHistoryAction
  | LoadHistorySuccessAction
  | LoadHistoryFailAction
  | RecordHistoryEventAction
  | HistoryEventOccurredAction
  | DeleteHistoryEventAction
  | ShowUserBackupAlertAction

export type ConnectionHistoryStore = {
  error?: ?CustomError,
  isLoading: boolean,
  data: ?ConnectionHistoryData,
}

export const HISTORY_EVENT_STORAGE_KEY = 'HISTORY_EVENT_STORAGE_KEY'

export const CONNECTION_ALREADY_EXIST = 'Connection already exists.'

export const REMOVE_EVENT = 'REMOVE_EVENT'
export type RemoveEventAction = {
  type: typeof REMOVE_EVENT,
  uid: string,
  navigationRoute: string,
}

export const LOADING_ACTIONS = [
  'PENDING',
  HISTORY_EVENT_STATUS[INVITATION_ACCEPTED],
  HISTORY_EVENT_STATUS[CLAIM_OFFER_ACCEPTED],
  HISTORY_EVENT_STATUS[SEND_CLAIM_REQUEST_SUCCESS],
  HISTORY_EVENT_STATUS[PROOF_REQUEST_ACCEPTED],
  HISTORY_EVENT_STATUS[UPDATE_ATTRIBUTE_CLAIM],
  HISTORY_EVENT_STATUS[DENY_PROOF_REQUEST],
  HISTORY_EVENT_STATUS[DENY_CLAIM_OFFER],
  HISTORY_EVENT_STATUS[PROOF_PROPOSAL_ACCEPTED],
  HISTORY_EVENT_STATUS[PROOF_REQUEST_SENT],
]

export const PENDING_ACTIONS = [
  'PENDING',
  HISTORY_EVENT_STATUS[INVITATION_ACCEPTED],
  HISTORY_EVENT_STATUS[CLAIM_OFFER_RECEIVED],
  HISTORY_EVENT_STATUS[CLAIM_OFFER_ACCEPTED],
  HISTORY_EVENT_STATUS[SEND_CLAIM_REQUEST_SUCCESS],
  HISTORY_EVENT_STATUS[PROOF_REQUEST_RECEIVED],
  HISTORY_EVENT_STATUS[PROOF_REQUEST_ACCEPTED],
  HISTORY_EVENT_STATUS[UPDATE_ATTRIBUTE_CLAIM],
  HISTORY_EVENT_STATUS[DENY_PROOF_REQUEST],
  HISTORY_EVENT_STATUS[DENY_CLAIM_OFFER],
  HISTORY_EVENT_STATUS[QUESTION_RECEIVED],
  HISTORY_EVENT_STATUS[CONNECTION_FAIL],
  HISTORY_EVENT_STATUS[SEND_CLAIM_REQUEST_FAIL],
  HISTORY_EVENT_STATUS[ERROR_SEND_PROOF],
  HISTORY_EVENT_STATUS[DENY_PROOF_REQUEST_FAIL],
  HISTORY_EVENT_STATUS[DENY_CLAIM_OFFER_FAIL],
  HISTORY_EVENT_STATUS[PROOF_PROPOSAL_RECEIVED],
  HISTORY_EVENT_STATUS[PROOF_PROPOSAL_ACCEPTED],
  HISTORY_EVENT_STATUS[PROOF_REQUEST_SENT],
]
