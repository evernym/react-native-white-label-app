// @flow
import type {
  ReactNavigation,
  CustomError,
  StorageStatus,
} from '../common/type-common'

export type InviteActionStatus = $Keys<typeof INVITE_ACTION_STATUS>

export type FinalizeActionState = InviteActionResponseState

export type InviteActionScreenProps = {
  inviteAction: InviteActionStoreMessage,
  senderLogoUrl?: string,
  senderName: string,
  initiateFinalizedAction: (uid: string, actionResponse: string) => void,
  updateInviteActionStatus: (
    uid: string,
    status: InviteActionStatus,
    error: ?CustomError
  ) => UpdateInviteActionStatusAction,
} & ReactNavigation

export const SEND_USER_ACTION_TO_INVITE_ACTION =
  'SEND_USER_ACTION_TO_INVITE_ACTION'
export type InviteActionResponseState = {
  type: typeof SEND_USER_ACTION_TO_INVITE_ACTION,
  uid: string,
  actionResponse: string,
}

export type inviteActionScreenState = {
  licenseKey: string,
  idPalBlock: boolean,
  isStartScreen: boolean,
  isConfirmationScreen: boolean,
  language: string,
  loading: boolean,
}

export type InviteActionStoreMessage = {
  payload: InviteActionPayload,
  status: InviteActionStatus,
  error: ?CustomError,
}

export type InviteActionStore = {
  data: InviteActionStoreData,
  storageStatus: StorageStatus,
}

export type InviteActionAction = InviteActionReceivedAction

export type InviteActionReceivedAction = {
  type: typeof INVITE_ACTION_RECEIVED,
  inviteAction: InviteActionPayload,
}

export const UPDATE_INVITE_ACTION_STORAGE_STATUS =
  'UPDATE_INVITE_ACTION_STORAGE_STATUS'

export type UpdateInviteActionStorageStatusAction = {
  type: typeof UPDATE_INVITE_ACTION_STORAGE_STATUS,
  status: StorageStatus,
}

export type ParsedInviteAction = {
  invite_action_meta_data: ValidResponsesInviteAction,
}
export type ValidResponsesInviteAction = {
  id_pal_token: string,
  invite_action_title: string,
  invite_action_detail: string,
  accept_text: string,
  deny_text: string,
}
export type InviteActionData = {
  inviteActionTitle: string,
  inviteActionDetails?: string,
  acceptText?: string,
  denyText?: string,
  token?: string,
}

export type InviteActionResponse = {
  text: string,
  nonce?: string,
}

export type ExternalLink = {
  text?: string,
  src: string,
}

export type InviteActionPayload = {
  '@type': string,
  protocol: string,
  messageId: string,
  timing: { expires_time: string },
  issuer_did: string,
  remoteDid?: string,
  uid: string,
  from_did: string,
  forDID: string,
  connectionHandle: number,
  remotePairwiseDID: string,
  inviteActionTitle: string,
  inviteActionDetails?: string,
  acceptText?: string,
  denyText?: string,
  token?: string,
  originalInviteAction: any,
  remoteName: string,
}

export type InviteActionStoreData = {
  [msgId: string]: InviteActionStoreMessage,
}

export type InviteActionRequest = {
  '@type': string,
  '@id': string,
  '@timing': { expires_time: string },
  goal_code: string,
}

export type InviteActionDetailsHeaderProps = {
  institutionalName: string,
  inviteActionTitle?: string,
  inviteActionDetails?: string,
  imageUrl: string,
}

export type UpdateInviteActionStatusAction = {
  type: typeof UPDATE_INVITE_ACTION_STATUS,
  uid: string,
  status: InviteActionStatus,
  error: ?CustomError,
}

export type InviteActionAcknowledgePayload = {
  '@type': string,
  '@id': string,
  status: string,
  '~thread': { thid: string },
}

export const INVITE_ACTION_REJECTED_TYPE =
  'https://didcomm.org/invite-action/0.9/problem-report'
export const INVITE_ACTION_ACCEPTED_TYPE =
  'https://didcomm.org/invite-action/0.9/ack'

export const INVITE_ACTION_ERROR_GET_CONNECTION_HANDLE = (
  message: ?string
) => ({
  code: 'MP-INVITE-ACTION-001',
  message: `Failed to get connection handle: ${message || ''}`,
})

export const INVITE_ACTION_ERROR_FINALIZING_ACTION = (message: ?string) => ({
  code: 'MP-INVITE-ACTION-002',
  message: `Failed to finalize action: ${
    message || ''
  }. Action may have already been finalized`,
})

export const INVITE_ACTION_RESPONSES = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
}

export const INITIATING_FINALIZATION_OF_INVITE_ACTION =
  'INITIATING_FINALIZATION_OF_INVITE_ACTION'
export const INVITE_ACTION_VCX_INIT_FAIL = 'INVITE_ACTION_VCX_INIT_FAIL'
export const INVITE_ACTION_FINALIZATION_SUCCESS =
  'INVITE_ACTION_FINALIZATION_SUCCESS'
export const INVITE_ACTION_SEND_MESSAGE_FAILURE =
  'INVITE_ACTION_SEND_MESSAGE_FAILURE'
export const INVITE_ACTION_GET_CONNECTION_HANDLE_FAILURE =
  'INVITE_ACTION_GET_CONNECTION_HANDLE_FAILURE'
export const INVITE_ACTION_RECEIVED = 'INVITE_ACTION_RECEIVED'
export const INVITE_ACTION_SEEN = 'INVITE_ACTION_SEEN'
export const INVITE_ACTION_REJECTED = 'INVITE_ACTION_REJECTED'
export const INVITE_ACTION_ACCEPTED = 'INVITE_ACTION_ACCEPTED'
export const UPDATE_INVITE_ACTION = 'UPDATE_INVITE_ACTION'
export const UPDATE_INVITE_ACTION_STATUS = 'UPDATE_INVITE_ACTION_STATUS'
export const HYDRATE_INVITE_ACTION_STORE = 'HYDRATE_INVITE_ACTION_STORE'
export const FINALIZE_INITIATED_ACTION = 'FINALIZE_INITIATED_ACTION'
export const INVITE_ACTION_STORAGE_KEY = 'INVITE_ACTION_STORAGE_KEY'

export const INVITE_ACTION_PROTOCOL = 'inviteaction'

export const INVITE_ACTION_STATUS = {
  INVITE_ACTION_RECEIVED,
  INVITE_ACTION_SEEN,
  INITIATING_FINALIZATION_OF_INVITE_ACTION,
  INVITE_ACTION_VCX_INIT_FAIL,
  INVITE_ACTION_FINALIZATION_SUCCESS,
  INVITE_ACTION_SEND_MESSAGE_FAILURE,
  INVITE_ACTION_GET_CONNECTION_HANDLE_FAILURE,
}
