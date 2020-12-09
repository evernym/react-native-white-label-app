// @flow

import type { Item } from '../components/custom-list/type-custom-list'
import type {
  ReactNavigation,
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
  AdditionalProofDataPayload,
  AcceptOutofbandPresentationRequestAction,
} from '../proof-request/type-proof-request'
import type { UpdateAttributeClaimAction } from '../proof/type-proof'
import type {
  Attribute,
  AdditionalDataPayload,
  NotificationPayloadInfo,
} from '../push-notification/type-push-notification'
import type { ClaimMap } from '../claim/type-claim'

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
} from '../claim-offer/type-claim-offer'
import {
  CLAIM_STORAGE_SUCCESS,
  DELETE_CLAIM_SUCCESS,
} from '../claim/type-claim'
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
  NEW_CONNECTION_SUCCESS,
} from '../store/type-connection-store'

export const HISTORY_EVENT_STATUS = {
  [INVITATION_RECEIVED]: 'CONNECTION REQUEST',
  [NEW_CONNECTION_SUCCESS]: 'CONNECTED',
  [INVITATION_ACCEPTED]: INVITATION_ACCEPTED,
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
}

export type HistoryEventStatus = $Keys<typeof HISTORY_EVENT_STATUS>

export const HISTORY_EVENT_TYPE = {
  INVITATION: 'INVITATION',
  CLAIM: 'CLAIM',
  PROOF: 'PROOF',
  AUTHENTICATION: 'AUTHENTICATION',
  QUESTION: 'QUESTION',
}

export type HistoryEventType = $Keys<typeof HISTORY_EVENT_TYPE>

export const EventTypeToEventStatusMap = {
  INVITATION: [
    INVITATION_RECEIVED,
    INVITATION_ACCEPTED,
    NEW_CONNECTION_SUCCESS,
    INVITATION_REJECTED,
    CONNECTION_FAIL,
  ],
  CLAIM: [
    CLAIM_OFFER_RECEIVED,
    CLAIM_OFFER_ACCEPTED,
    CLAIM_OFFER_IGNORED,
    CLAIM_OFFER_REJECTED,
    CLAIM_STORAGE_SUCCESS,
    PAID_CREDENTIAL_REQUEST_FAIL,
    SEND_CLAIM_REQUEST_FAIL,
  ],
  PROOF: [
    PROOF_REQUEST_RECEIVED,
    PROOF_REQUEST_ACCEPTED,
    PROOF_REQUEST_IGNORED,
    PROOF_REQUEST_REJECTED,
    DENY_PROOF_REQUEST_SUCCESS,
    UPDATE_ATTRIBUTE_CLAIM,
  ],
  QUESTION: [QUESTION_RECEIVED, UPDATE_QUESTION_ANSWER],
}

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
}

export type ConnectionHistoryItem = {
  action: string,
  data: Array<Attribute>,
  id: string,
  name: string,
  originalPayload: {
    type: typeof CLAIM_OFFER_RECEIVED | typeof PROOF_REQUEST_RECEIVED,
    payload: AdditionalDataPayload | AdditionalProofDataPayload,
    payloadInfo: NotificationPayloadInfo,
  },
  remoteDid: string,
  status: string,
  timestamp: string,
  type: string,
}

export type ConnectionHistoryDetailsProps = {
  navigation: {},
  route: {
    params: {
      type: string,
      id?: string,
      type?: string,
      icon?: string,
      action?: string,
      status?: string,
      timestamp?: string,
      data?: Array<Item>,
      claimMap?: ?ClaimMap,
    },
  },
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
export const LOAD_HISTORY_EVENT_OCCURED_FAIL = 'LOAD_HISTORY_EVENT_OCCURED_FAIL'

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
  | OutofbandClaimOfferAcceptedAction
  | AcceptOutofbandPresentationRequestAction

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

export type ConnectionHistoryState = {
  disableTaps: boolean,
}

export type ConnectionHistoryProps = {
  claimMap: ?ClaimMap,
  activeConnectionThemePrimary: string,
  activeConnectionThemeSecondary: string,
  connectionHistory: {
    [string]: { data: ConnectionHistoryEvent[], newBadge: boolean },
  },
  updateStatusBarTheme: (color?: string) => void,
  deleteConnectionAction: (senderDID: string) => void,
  goToUIScreen: (
    string,
    string,
    $PropertyType<ReactNavigation, 'navigation'>
  ) => void,
} & ReactNavigation

export const CONNECTION_ALREADY_EXIST = 'Connection already exists.'

export const REMOVE_EVENT = 'REMOVE_EVENT'
export type RemoveEventAction = {
  type: typeof REMOVE_EVENT,
  uid: string,
  navigationRoute: string,
}
