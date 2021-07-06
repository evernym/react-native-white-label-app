// @flow
import * as React from 'react'
import type {
  NavigationScreenProp,
  NavigationLeafRoute,
} from '@react-navigation/native'

import type {
  CustomError,
  ResetAction,
  GenericObject,
} from '../common/type-common'
import type {
  AdditionalDataPayload,
  NotificationPayloadInfo,
} from '../push-notification/type-push-notification'
import type { LedgerFeesStateEnum } from '../ledger/components/ledger-fees/ledger-fees-type'
import type { InvitationPayload } from '../invitation/type-invitation'

export const CLAIM_OFFER_STATUS = {
  IDLE: 'IDLE',
  RECEIVED: 'RECEIVED',
  SHOWN: 'SHOWN',
  ACCEPTED: 'ACCEPTED',
  ISSUED: 'ISSUED',
  IGNORED: 'IGNORED',
  REJECTED: 'REJECTED',
  DELETED: 'DELETED',
  FAILED: 'FAILED',
}
export const VCX_CLAIM_OFFER_STATE = {
  NONE: 0,
  INITIALIZED: 1,
  UNFULFILLED: 5,
  EXPIRED: 6,
  REVOKED: 7,
  RECEIVED: 3,
  SENT: 2,
  ACCEPTED: 4,
}

export const ACCEPTING_TEXT = 'Accepting...'
export const PAYING_TEXT = 'Paying...'

export const CREDENTIAL_OFFER_MODAL_STATUS = {
  NONE: 'NONE',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  LEDGER_FEES: 'LEDGER_FEES',
  CREDENTIAL_REQUEST_STATUS: 'CREDENTIAL_REQUEST_STATUS',
  SEND_PAID_CREDENTIAL_REQUEST_FAIL: 'SEND_PAID_CREDENTIAL_REQUEST_FAIL',
  CREDENTIAL_REQUEST_FAIL: 'CREDENTIAL_REQUEST_FAIL',
  TOKEN_SENT_FAIL: 'TOKEN_SENT_FAIL',
}
export type ClaimOfferStatus = $Keys<typeof CLAIM_OFFER_STATUS>

export const CLAIM_OFFER_RECEIVED = 'CLAIM_OFFER_RECEIVED'
export type ClaimOfferReceivedAction = {
  type: typeof CLAIM_OFFER_RECEIVED,
  payload: AdditionalDataPayload,
  payloadInfo: NotificationPayloadInfo,
}

export const CLAIM_OFFER_FAILED = 'CLAIM_OFFER_FAILED'
export type ClaimOfferFailedAction = {
  type: typeof CLAIM_OFFER_FAILED,
  error: CustomError,
  uid: string,
}

export const CLAIM_OFFER_SHOWN = 'CLAIM_OFFER_SHOWN'
export type ClaimOfferShownAction = {
  type: typeof CLAIM_OFFER_SHOWN,
  uid: string,
}

export const CLAIM_OFFER_ACCEPTED = 'CLAIM_OFFER_ACCEPTED'
export type ClaimOfferAcceptedAction = {
  type: typeof CLAIM_OFFER_ACCEPTED,
  uid: string,
  remoteDid: string,
}

export const OUTOFBAND_CLAIM_OFFER_ACCEPTED = 'OUTOFBAND_CLAIM_OFFER_ACCEPTED'
export type OutofbandClaimOfferAcceptedAction = {
  type: typeof OUTOFBAND_CLAIM_OFFER_ACCEPTED,
  uid: string,
  remoteDid: string,
  show: boolean,
}

export const CLAIM_OFFER_REJECTED = 'CLAIM_OFFER_REJECTED'
export type ClaimOfferRejectedAction = {
  type: typeof CLAIM_OFFER_REJECTED,
  uid: string,
}

export const DENY_OUTOFBAND_CLAIM_OFFER = 'DENY_OUTOFBAND_CLAIM_OFFER'
export type DenyOutofbandClaimOfferAction = {
  type: typeof DENY_OUTOFBAND_CLAIM_OFFER,
  uid: string,
}

export const DENY_CLAIM_OFFER = 'DENY_CLAIM_OFFER'
export type ClaimOfferDenyAction = {
  type: typeof DENY_CLAIM_OFFER,
  uid: string,
}

export const DENY_CLAIM_OFFER_SUCCESS = 'DENY_CLAIM_OFFER_SUCCESS'

export const DENY_CLAIM_OFFER_FAIL = 'DENY_CLAIM_OFFER_FAIL'

export const CLAIM_OFFER_IGNORED = 'CLAIM_OFFER_IGNORED'
export type ClaimOfferIgnoredAction = {
  type: typeof CLAIM_OFFER_IGNORED,
  uid: string,
}

export const SEND_CLAIM_REQUEST = 'SEND_CLAIM_REQUEST'
export type SendClaimRequestAction = {
  type: typeof SEND_CLAIM_REQUEST,
  uid: string,
  payload: ClaimOfferPayload,
}

export const SEND_CLAIM_REQUEST_SUCCESS = 'SEND_CLAIM_REQUEST_SUCCESS'
export type SendClaimRequestSuccessAction = {
  type: typeof SEND_CLAIM_REQUEST_SUCCESS,
  uid: string,
  payload: ClaimOfferPayload,
}

export const SEND_CLAIM_REQUEST_FAIL = 'SEND_CLAIM_REQUEST_FAIL'
export type SendClaimRequestFailAction = {
  type: typeof SEND_CLAIM_REQUEST_FAIL,
  uid: string,
  remoteDid: string,
  error: CustomError,
}

export const CLAIM_REQUEST_SUCCESS = 'CLAIM_REQUEST_SUCCESS'
export type ClaimRequestSuccessAction = {
  type: typeof CLAIM_REQUEST_SUCCESS,
  uid: string,
  issueDate: number,
  colorTheme: string,
  claimId: string,
  attributes: string,
}

export const INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE'
export type InsufficientBalanceAction = {
  type: typeof INSUFFICIENT_BALANCE,
  uid: string,
}

export const SEND_PAID_CREDENTIAL_REQUEST = 'SEND_PAID_CREDENTIAL_REQUEST'
export type SendPaidCredentialRequestAction = {
  type: typeof SEND_PAID_CREDENTIAL_REQUEST,
  uid: string,
  payload: ClaimOfferPayload,
}

export const PAID_CREDENTIAL_REQUEST_SUCCESS = 'PAID_CREDENTIAL_REQUEST_SUCCESS'
export type PaidCredentialRequestSuccessAction = {
  type: typeof PAID_CREDENTIAL_REQUEST_SUCCESS,
  uid: string,
}

export const PAID_CREDENTIAL_REQUEST_FAIL = 'PAID_CREDENTIAL_REQUEST_FAIL'
export type PaidCredentialRequestFailAction = {
  type: typeof PAID_CREDENTIAL_REQUEST_FAIL,
  uid: string,
  remoteDid: string,
}

export const CLAIM_REQUEST_FAIL = 'CLAIM_REQUEST_FAIL'
export type ClaimRequestFailAction = {
  type: typeof CLAIM_REQUEST_FAIL,
  uid: string,
}

export const INITIAL_ACTION = 'INITIAL_ACTION'
export type ClaimRequestInitialAction = {
  type: typeof INITIAL_ACTION,
}

export const ADD_SERIALIZED_CLAIM_OFFER = 'ADD_SERIALIZED_CLAIM_OFFER'
export type AddSerializedClaimOfferAction = {
  type: typeof ADD_SERIALIZED_CLAIM_OFFER,
  serializedClaimOffer: string,
  userDID: string,
  messageId: string,
  claimOfferVcxState: number,
}

export const CLAIM_OFFER_SHOW_START = 'CLAIM_OFFER_SHOW_START'
export type ClaimOfferShowStartAction = {
  type: typeof CLAIM_OFFER_SHOW_START,
  uid: string,
}

export const RESET_CLAIM_REQUEST_STATUS = 'RESET_CLAIM_REQUEST_STATUS'
export type ResetClaimRequestStatusAction = {
  type: typeof RESET_CLAIM_REQUEST_STATUS,
  uid: string,
}

// TODO: See if this needs to be put somewhere else
export const NEW_CONNECTION_SEEN = 'NEW_CONNECTION_SEEN'
export type NewConnectionSeenAction = {
  type: typeof NEW_CONNECTION_SEEN,
  senderDid: string,
}

export const CONNECTION_HISTORY_BACKED_UP = 'CONNECTION_HISTORY_BACKED_UP'
export type ConnectionHistoryBackedUpAction = {
  type: typeof CONNECTION_HISTORY_BACKED_UP,
}

export const DELETE_CLAIM_OFFER = 'DELETE_CLAIM_OFFER'
export type DeleteClaimOfferAction = {
  type: typeof DELETE_CLAIM_OFFER,
  uid: string,
  userDID: string,
}

export const CLAIM_OFFER_DELETED = 'CLAIM_OFFER_DELETED'
export type ClaimOfferDeletedAction = {
  type: typeof CLAIM_OFFER_DELETED,
  uid: string,
  vcxSerializedClaimOffers: SerializedClaimOffers,
}

export type ClaimOfferAction =
  | ClaimOfferReceivedAction
  | ClaimOfferFailedAction
  | ClaimOfferShownAction
  | ClaimOfferAcceptedAction
  | ClaimOfferRejectedAction
  | SendClaimRequestAction
  | ClaimRequestSuccessAction
  | ClaimRequestFailAction
  | ClaimRequestInitialAction
  | AddSerializedClaimOfferAction
  | HydrateSerializedClaimOffersSuccessAction
  | ResetAction
  | InsufficientBalanceAction
  | SendPaidCredentialRequestAction
  | PaidCredentialRequestSuccessAction
  | PaidCredentialRequestFailAction
  | ClaimOfferShowStartAction
  | ResetClaimRequestStatusAction
  | SendClaimRequestSuccessAction
  | SendClaimRequestFailAction
  | ClaimOfferDeletedAction

export type CredentialOffer = {
  '@id': string,
  '@type': string,
  comment: string,
  credential_preview: {
    '@type': string,
    attributes: Array<{
      name: string,
      'mime-type': string,
      value: any,
    }>,
  },
  'offers~attach': Array<{
    '@id': string,
    'mime-type': string,
    data: {
      base64: string,
    },
  }>,
  '~alias': ?{
    imageUrl?: string,
    label?: string,
  },
}

export type ClaimOfferPayload = AdditionalDataPayload & {
  uid: string,
  senderLogoUrl?: ?string,
  remotePairwiseDID: string,
  status: ClaimOfferStatus,
  claimRequestStatus: ClaimRequestStatus,
  payTokenValue?: string,
  issueDate?: number,
  colorTheme?: string,
  ephemeralClaimOffer?: any,
  claimId?: string,
  attributes?: GenericObject,
}

export type SerializedClaimOffer = {
  serialized: string,
  state: number,
  messageId: string,
}

export type SerializedClaimOffersPerDid = {
  +[messageId: string]: SerializedClaimOffer,
}

export type SerializedClaimOffers = {
  +[userDID: string]: SerializedClaimOffersPerDid,
}

export type ClaimOfferStore = {
  +[string]: ClaimOfferPayload,
  // serialized offer are organized by user did so that we can directly
  // take all of offers for a connection and run update_state on all of them
  +vcxSerializedClaimOffers: SerializedClaimOffers,
}

export type ClaimProofNavigation = {
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  route: {
    params: {|
      uid: string,
      claimOfferData?: ClaimOfferPayload,
      backRedirectRoute?: string,
      invitationPayload?: InvitationPayload | null,
      attachedRequest?: GenericObject,
      senderName?: string,
      hidden?: boolean,
    |},
  },
}

export type ClaimRequestStatusModalProps = {
  claimRequestStatus: ClaimRequestStatus,
  payload: ClaimOfferPayload,
  onContinue: () => void,
  senderLogoUrl?: string,
  isPending?: boolean,
  message1: string,
  message3: string,
  message5?: string,
  message6?: string,
  buttonDisabled?: boolean,
  payTokenValue?: ?string,
  onModalHide?: () => void,
  fromConnectionHistory?: boolean,
}

export type CredentialOfferModalProps = {
  isValid?: boolean,
  claimRequestStatus?: ClaimRequestStatus,
  onModalHide?: () => void,
  claimOfferData?: ClaimOfferPayload,
  onClose: (event: any) => void,
  logoUrl?: string,
  payTokenValue?: ?string,
  credentialOfferModalStatus?: CredentialOfferModalStatus,
  testID: string,
  onRetry: () => void,
  onNo?: () => void,
  onYes?: () => void,
  transferAmount?: string,
  connectionName?: string,
  renderFeesText?: (fees: string, status: string) => any,
}

export type CredentialOfferModalState = {
  isVisible: boolean,
}
export type ClaimRequestStatusModalState = {
  modalText: string,
}

export const SAVE_CLAIM_OFFERS_SUCCESS = 'SAVE_CLAIM_OFFERS_SUCCESS'
export const SAVE_CLAIM_OFFERS_FAIL = 'SAVE_CLAIM_OFFERS_FAIL'
export const ERROR_SAVE_CLAIM_OFFERS = (message: string) => ({
  code: 'CO-001',
  message: `Error saving serialized claim offers: ${message}`,
})

export const REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS =
  'REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS'
export const REMOVE_SERIALIZED_CLAIM_OFFERS_FAIL =
  'REMOVE_SERIALIZED_CLAIM_OFFERS_FAIL'
export const ERROR_REMOVE_SERIALIZED_CLAIM_OFFERS = (message: string) => ({
  code: 'CO-002',
  message: `Error removing persisted serialized claim offers: ${message}`,
})

export const HYDRATE_CLAIM_OFFERS_SUCCESS = 'HYDRATE_CLAIM_OFFERS_SUCCESS'
export type HydrateSerializedClaimOffersSuccessAction = {
  type: typeof HYDRATE_CLAIM_OFFERS_SUCCESS,
  claimOffers: ClaimOfferStore,
}

export const HYDRATE_CLAIM_OFFERS_FAIL = 'HYDRATE_CLAIM_OFFERS_FAIL'
export const ERROR_HYDRATE_CLAIM_OFFERS = (message: string) => ({
  code: 'CO-003',
  message: `Error hydrating serialized claim offers: ${message}`,
})

export const CLAIM_OFFERS = 'CLAIM_OFFERS'

export const ERROR_NO_SERIALIZED_CLAIM_OFFER = (message: string) => ({
  code: 'CO-004',
  message: `No serialized claim offer found with this message id: ${message}`,
})

export const ERROR_SEND_CLAIM_REQUEST = (message: string) => ({
  code: 'CO-005',
  message: `Error occurred while trying to send/generate claim request: ${message}`,
})

export const ERROR_RECEIVE_CLAIM = (sender: string) => ({
  code: 'CO-006',
  message: `Failed to accept credential from ${sender}. ${sender} does not reply. You can try again later.`,
})

export const CLAIM_REQUEST_STATUS = {
  NONE: 'NONE',
  INSUFFICIENT_BALANCE,
  SENDING_PAID_CREDENTIAL_REQUEST: 'SENDING_PAID_CREDENTIAL_REQUEST',
  SENDING_CLAIM_REQUEST: 'SENDING_CLAIM_REQUEST',
  SEND_CLAIM_REQUEST_SUCCESS,
  SEND_CLAIM_REQUEST_FAIL,
  CLAIM_REQUEST_FAIL,
  CLAIM_REQUEST_SUCCESS,
  PAID_CREDENTIAL_REQUEST_SUCCESS,
  PAID_CREDENTIAL_REQUEST_FAIL,
  DELETED: 'DELETED',
}

export type ClaimRequestStatus = $Keys<typeof CLAIM_REQUEST_STATUS>

export type CredentialOfferModalStatus = $Keys<
  typeof CREDENTIAL_OFFER_MODAL_STATUS
>

export type TokenFeesData = {
  fees: string,
  total: string,
  currentTokenBalance: string,
}

export type PaymentTransactionInfoProps = {
  claimThemePrimary: string,
  claimThemeSecondary: string,
  onConfirmAndPay: () => void,
  onCancel: () => void,
  credentialPrice: string,
  txnFeesStatus?: LedgerFeesStateEnum,
  claimRequestStatus?: string,
  onRetry?: () => void,
  children?: React.Node,
  feesData?: TokenFeesData,
  onSuccess?: () => void,
}
