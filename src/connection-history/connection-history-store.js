// @flow

import { all, takeEvery, put, call, select } from 'redux-saga/effects'
import merge from 'lodash.merge'
import {
  claimOfferRoute,
  inviteActionRoute,
  proofRequestRoute,
  questionRoute,
} from '../common'
import {
  LOAD_HISTORY,
  LOAD_HISTORY_SUCCESS,
  LOAD_HISTORY_FAIL,
  RECORD_HISTORY_EVENT,
  DELETE_HISTORY_EVENT,
  SHOW_USER_BACKUP_ALERT,
  ERROR_LOADING_HISTORY,
  HISTORY_EVENT_OCCURRED,
  HISTORY_EVENT_STATUS,
  HISTORY_EVENT_TYPE,
  HISTORY_EVENT_STORAGE_KEY,
  ERROR_HISTORY_EVENT_OCCURRED,
  REMOVE_EVENT,
  UPDATE_HISTORY_EVENT,
  DELETE_PENDING_HISTORY_EVENTS,
  PENDING_ACTIONS,
} from './type-connection-history'
import type {
  ConnectionHistoryEvent,
  ConnectionHistoryData,
  ConnectionHistoryAction,
  ConnectionHistoryStore,
  HistoryEventOccurredAction,
  HistoryEventOccurredEventType,
  DeleteHistoryEventAction,
  ShowUserBackupAlertAction,
  RecordHistoryEventAction,
  RemoveEventAction,
  UpdateHistoryEventAction,
  DeletePendingHistoryEventsAction,
} from './type-connection-history'
import type { CustomError } from '../common/type-common'
import type {
  InvitationAcceptedAction,
  InvitationPayload,
} from '../invitation/type-invitation'
import { uuid } from '../services/uuid'
import {
  INVITATION_ACCEPTED,
  INVITATION_RECEIVED,
} from '../invitation/type-invitation'
import moment from 'moment'
import type {
  SendClaimRequestSuccessAction,
  ClaimOfferPayload,
  ClaimOfferDenyAction,
  ClaimOfferReceivedAction,
  ClaimOfferAcceptedAction,
  SendClaimRequestFailAction,
  PaidCredentialRequestFailAction,
  OutofbandClaimOfferAcceptedAction,
} from '../claim-offer/type-claim-offer'
import type {
  ClaimStorageSuccessAction,
  DeleteClaimSuccessAction,
} from '../claim/type-claim'
import type {
  Proof,
  UpdateAttributeClaimAction,
  ErrorSendProofFailAction,
} from '../proof/type-proof'
import type { Store } from '../store/type-store'
import {
  SEND_CLAIM_REQUEST_SUCCESS,
  CLAIM_OFFER_ACCEPTED,
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  DENY_CLAIM_OFFER,
  DENY_CLAIM_OFFER_SUCCESS,
  DENY_CLAIM_OFFER_FAIL,
  OUTOFBAND_CLAIM_OFFER_ACCEPTED,
  DELETE_OUTOFBAND_CLAIM_OFFER,
} from '../claim-offer/type-claim-offer'
import { UPDATE_ATTRIBUTE_CLAIM, ERROR_SEND_PROOF } from '../proof/type-proof'
import type {
  ProofRequestReceivedAction,
  SendProofSuccessAction,
  ProofRequestPayload,
  DenyProofRequestSuccessAction,
  SelfAttestedAttributes,
  DenyProofRequestAction,
  DenyProofRequestFailAction,
  AcceptOutofbandPresentationRequestAction,
} from '../proof-request/type-proof-request'
import type {
  QuestionReceivedAction,
  QuestionPayload,
  UpdateQuestionAnswerAction,
} from '../question/type-question'
import type { Item } from '../components/custom-list/type-custom-list'
import {
  PROOF_REQUEST_RECEIVED,
  SEND_PROOF_SUCCESS,
  DENY_PROOF_REQUEST_SUCCESS,
  DENY_PROOF_REQUEST,
  DENY_PROOF_REQUEST_FAIL,
  ACCEPT_OUTOFBAND_PRESENTATION_REQUEST,
  PROOF_REQUEST_ACCEPTED,
  ATTRIBUTE_TYPE,
} from '../proof-request/type-proof-request'
import { secureSet, getHydrationItem } from '../services/storage'
import {
  getProofRequest,
  getProof,
  getClaimOffer,
  getPendingHistoryEvent,
  getHistory,
  getPendingHistory,
  getHistoryEvent,
  getClaimReceivedHistory,
  getUniqueHistoryItem,
  getLastConnectionEvent,
  getConnection,
} from '../store/store-selector'
import {
  CLAIM_STORAGE_SUCCESS,
  DELETE_CLAIM_SUCCESS,
} from '../claim/type-claim'
import { RESET } from '../common/type-common'
import {
  CLAIM_OFFER_RECEIVED,
  NEW_CONNECTION_SEEN,
  CONNECTION_HISTORY_BACKED_UP,
} from '../claim-offer/type-claim-offer'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'
import {
  QUESTION_RECEIVED,
  UPDATE_QUESTION_ANSWER,
} from '../question/type-question'
import { MESSAGE_TYPE } from '../api/api-constants'
import { selectQuestion } from '../question/question-store'
import {
  CONNECTION_FAIL,
  DELETE_CONNECTION_SUCCESS,
  CONNECTION_REQUEST_SENT,
  NEW_CONNECTION_SUCCESS,
} from '../store/type-connection-store'
import type {
  Connection,
  ConnectionFailAction,
  DeleteConnectionSuccessEventAction,
} from '../store/type-connection-store'
import {
  acceptClaimOffer,
  checkCredentialStatus,
  denyClaimOffer,
} from '../claim-offer/claim-offer-store'
import { updateAttributeClaim } from '../proof/proof-store'
import {
  checkConnectionStatus,
  sendInvitationResponse,
} from '../invitation/invitation-store'
import { ResponseType } from '../components/request/type-request'
import { denyProofRequest } from '../proof-request/proof-request-store'
import type {
  InviteActionReceivedAction,
  InviteActionPayload,
} from '../invite-action/type-invite-action.js'
import {
  INVITE_ACTION_RECEIVED,
  INVITE_ACTION_REJECTED,
  INVITE_ACTION_ACCEPTED,
  INVITE_ACTION_RESPONSES,
} from '../invite-action/type-invite-action.js'
import { selectInviteAction } from '../invite-action/invite-action-store'

const initialState = {
  error: null,
  isLoading: false,
  data: null,
}

export const newConnectionSeen = (senderDid: string) => ({
  type: NEW_CONNECTION_SEEN,
  senderDid,
})

export const connectionHistoryBackedUp = () => ({
  type: CONNECTION_HISTORY_BACKED_UP,
})

export const loadHistory = () => ({
  type: LOAD_HISTORY,
})

// FIXME: Flow is showing an error with ConnectionHistoryData type, need to look into this.
export const loadHistorySuccess = (data: any) => ({
  type: LOAD_HISTORY_SUCCESS,
  data,
})

export const loadHistoryFail = (error: CustomError) => ({
  type: LOAD_HISTORY_FAIL,
  error,
})

export const removeEvent = (
  uid: string,
  navigationRoute: string
): RemoveEventAction => ({
  type: REMOVE_EVENT,
  uid,
  navigationRoute,
})

export function* loadHistorySaga(): Generator<*, *, *> {
  yield put(loadHistory())
  try {
    const historyEvents = yield call(
      getHydrationItem,
      HISTORY_EVENT_STORAGE_KEY
    )

    if (historyEvents) {
      const oldHistory = JSON.parse(historyEvents) // IMPORTANT: This is history.data, not just history object.
      const oldHistoryKeys = Object.keys(oldHistory)
      let newHistory = {
        connections: { data: {}, newBadge: false },
        connectionsUpdated: false,
      }

      let history: any

      if ('connectionsUpdated' in oldHistory && 'connections' in oldHistory) {
        history = oldHistory
      } else if ('newBadge' in oldHistory[oldHistoryKeys[0]]) {
        newHistory = {
          ...newHistory,
          connections: oldHistory,
        }
        history = newHistory
      } else {
        const modifiedData = {}
        for (let i = 0; i < oldHistoryKeys.length; i++) {
          modifiedData[oldHistoryKeys[i]] = {
            data: oldHistory[oldHistoryKeys[i]].data,
            newBadge: false,
          }
        }

        newHistory = {
          ...newHistory,
          connections: modifiedData,
        }
        history = newHistory
      }

      // CMe keeps the whole history event for delete connections
      // for CMe <= 1.4.0 Home -> Recent event section showed events only for existing connections.
      //            A history event didn't contain `senderLogoUrl` and `senderName`.
      //            They we taken from connection store
      // for CMe > 1.4.0 Home -> Recent event section shows all events (even for deleted connections)
      //            The approach used for CMe <=1.4.0 doesn't work when we want to show history for deleted connections as well.
      //            So we need populate history with missing data - add `senderLogoUrl` and `senderName` from last connection related event.
      Object.keys(history.connections).forEach((connectionKey) => {
        const connectionHistory = history.connections[connectionKey].data || []

        for (let i = 0; i < connectionHistory.length; i++) {
          if (
            !connectionHistory[i].senderName ||
            !connectionHistory[i].senderLogoUrl
          ) {
            customLogger.log(
              'loadHistorySaga --> set missing history event data'
            )

            const connectionAddedEvent = getLastConnectionEvent(
              connectionHistory.slice(0, i + 1)
            )
            if (connectionAddedEvent && connectionAddedEvent.originalPayload) {
              // ConnectMe <= 1.3 - Connection completed event
              if (
                connectionAddedEvent.originalPayload.type ===
                  NEW_CONNECTION_SUCCESS &&
                connectionAddedEvent.originalPayload.connection
              ) {
                history.connections[connectionKey].data[i].senderName =
                  connectionAddedEvent.originalPayload.connection.senderName
                history.connections[connectionKey].data[i].senderLogoUrl =
                  connectionAddedEvent.originalPayload.connection.logoUrl
              }

              // ConnectMe 1.4 - Connection completed event
              if (
                connectionAddedEvent.originalPayload.type ===
                  INVITATION_ACCEPTED &&
                connectionAddedEvent.originalPayload.payload
              ) {
                history.connections[connectionKey].data[i].senderName =
                  connectionAddedEvent.originalPayload.payload.senderName
                history.connections[connectionKey].data[i].senderLogoUrl =
                  connectionAddedEvent.originalPayload.payload.senderLogoUrl
              }
            }
          }
        }
      })

      yield put(loadHistorySuccess(history))
    }
  } catch (e) {
    captureError(e)
    customLogger.error(`loadHistorySaga: ${e}`)
    yield put(
      loadHistoryFail({
        ...ERROR_LOADING_HISTORY,
        message: `${ERROR_LOADING_HISTORY.message} ${e.message}`,
      })
    )
  }
}

export function* retryInterruptedActionsSaga(): Generator<*, *, *> {
  const history = yield select(getHistory)

  if (!history) {
    return
  }

  // Iterate over history events.
  // If the status of the last event associated with connection
  // means that action was started but not finished,
  // try to retry action associated with this event.
  for (const connection: any of Object.values(history.connections)) {
    if (connection && connection.data && connection.data.length > 0) {
      for (const event of connection.data) {
        if (event.status === INVITATION_ACCEPTED) {
          // Invitation was accepted but ConnectionRequest was not send - retry
          yield put(
            sendInvitationResponse({
              response: ResponseType.accepted,
              senderDID: event.remoteDid,
            })
          )
        }
        if (event.status === CONNECTION_REQUEST_SENT) {
          // Invitation was accepted and ConnectionRequest was send - check for completion
          const [connection]: Connection[] = yield select(
            getConnection,
            event.remoteDid
          )
          if (connection && connection.senderName) {
            yield call(
              checkConnectionStatus,
              connection.identifier,
              connection.senderName,
              connection.senderDID
            )
          }
        }
        if (event.status === CLAIM_OFFER_ACCEPTED) {
          // CredentialOffer was accepted but CredentialRequest was not send - retry
          yield put(
            acceptClaimOffer(
              event.originalPayload.uid,
              event.originalPayload.remoteDid
            )
          )
        }
        if (event.status === HISTORY_EVENT_STATUS[SEND_CLAIM_REQUEST_SUCCESS]) {
          // CredentialOffer was accepted and CredentialRequest was send - check for completion
          const claimOffer = yield select(
            getClaimOffer,
            event.originalPayload.uid
          )
          if (claimOffer) {
            yield call(
              checkCredentialStatus,
              claimOffer.uid,
              claimOffer.issuer.name,
              claimOffer.remotePairwiseDID
            )
          }
        }
        if (event.status === HISTORY_EVENT_STATUS[DENY_CLAIM_OFFER]) {
          // CredentialOffer was denied but not sent - retry
          yield put(denyClaimOffer(event.originalPayload.uid))
        }
        if (event.status === UPDATE_ATTRIBUTE_CLAIM) {
          // ProofRequest was accepted but not sent - retry
          yield put(
            updateAttributeClaim(
              event.originalPayload.uid,
              event.originalPayload.remoteDid,
              event.originalPayload.requestedAttrsJson,
              event.originalPayload.selfAttestedAttrs
            )
          )
        }
        if (event.status === DENY_PROOF_REQUEST) {
          // ProofRequest was denied but not sent - retry
          yield put(denyProofRequest(event.originalPayload.uid))
        }
      }
    }
  }
}

// receive invitation
export function convertInvitationToHistoryEvent(
  invitation: InvitationPayload
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[INVITATION_RECEIVED],
    data: {},
    id: uuid(),
    name: invitation.senderName,
    status: HISTORY_EVENT_STATUS[INVITATION_RECEIVED],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITATION,
    remoteDid: invitation.senderDID,
    originalPayload: invitation,
    senderName: invitation.senderName,
    senderLogoUrl: invitation.senderLogoUrl,
  }
}

// accept invitation
export function convertInvitationAcceptedToHistoryEvent(
  action: InvitationAcceptedAction
): ConnectionHistoryEvent {
  const { senderName, senderDID, senderLogoUrl } = action.payload

  return {
    action: HISTORY_EVENT_STATUS[INVITATION_ACCEPTED],
    data: [
      {
        label: 'Will be established on',
        data: moment().format(),
      },
    ],
    id: uuid(),
    name: senderName,
    status: HISTORY_EVENT_STATUS[INVITATION_ACCEPTED],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITATION,
    remoteDid: senderDID,
    originalPayload: action,
    senderName: senderName,
    senderLogoUrl: senderLogoUrl,
  }
}

// invitation accepted and connection request sent
export function convertConnectionRequestSentToHistoryEvent(
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[INVITATION_ACCEPTED],
    data: [
      {
        label: 'Will be established on',
        data: moment().format(),
      },
    ],
    id: uuid(),
    name: event.name,
    status: HISTORY_EVENT_STATUS[CONNECTION_REQUEST_SENT],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITATION,
    remoteDid: event.remoteDid,
    originalPayload: event.originalPayload,
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

// connection established
export function convertConnectionSuccessToHistoryEvent(
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[NEW_CONNECTION_SUCCESS],
    data: [
      {
        label: 'Established on',
        data: moment().format(),
      },
    ],
    id: uuid(),
    name: event.name,
    status: HISTORY_EVENT_STATUS[NEW_CONNECTION_SUCCESS],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITATION,
    remoteDid: event.remoteDid,
    originalPayload: event.originalPayload,
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

// connection failed
export function convertConnectionFailToHistoryEvent(
  action: ConnectionFailAction,
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS.CONNECTION_FAIL,
    data: [
      {
        label: 'Failed to make secure connection with',
        data: moment().format(),
      },
    ],
    id: uuid(),
    name: event.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITATION,
    remoteDid: event.remoteDid,
    originalPayload: event.originalPayload,
    status: HISTORY_EVENT_STATUS.CONNECTION_FAIL,
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

// connection deleted
export function convertConnectionDeletedToHistoryEvent(
  action: DeleteConnectionSuccessEventAction,
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS.DELETE_CONNECTION_SUCCESS,
    data: [
      {
        label: 'You deleted your connection with',
        data: moment().format(),
      },
    ],
    id: uuid(),
    name: event.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITATION,
    remoteDid: event.remoteDid,
    originalPayload: event.originalPayload,
    status: HISTORY_EVENT_STATUS.DELETE_CONNECTION_SUCCESS,
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

// claim request pending
export function convertSendClaimRequestSuccessToHistoryEvent(
  action: SendClaimRequestSuccessAction,
  event?: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[SEND_CLAIM_REQUEST_SUCCESS],
    // $FlowFixMe
    data: action.payload.data && action.payload.data.revealedAttributes,
    id: uuid(),
    name: action.payload.data && action.payload.data.name,
    status: HISTORY_EVENT_STATUS[SEND_CLAIM_REQUEST_SUCCESS],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.CLAIM,
    remoteDid: action.payload.remotePairwiseDID,
    originalPayload: action,
    senderName: event?.senderName,
    senderLogoUrl: event?.senderLogoUrl,
  }
}

export function convertClaimStorageSuccessToHistoryEvent(
  action: ClaimStorageSuccessAction,
  claim: ClaimOfferPayload,
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[CLAIM_STORAGE_SUCCESS],
    // $FlowFixMe
    data: claim.data && claim.data.revealedAttributes,
    id: uuid(),
    name: claim.data && claim.data.name,
    status: HISTORY_EVENT_STATUS[CLAIM_STORAGE_SUCCESS],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.CLAIM,
    remoteDid: claim.remotePairwiseDID,
    originalPayload: {
      ...action,
      remotePairwiseDID: claim.remotePairwiseDID,
    },
    payTokenValue: claim.payTokenValue,
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

export function convertProofRequestToHistoryEvent(
  action: ProofRequestReceivedAction
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[PROOF_REQUEST_RECEIVED],
    // $FlowFixMe
    data: action.payload.data.requestedAttributes,
    id: uuid(),
    name: action.payload.data.name,
    status: HISTORY_EVENT_STATUS[PROOF_REQUEST_RECEIVED],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.PROOF,
    remoteDid: action.payloadInfo.remotePairwiseDID,
    originalPayload: action,
    showBadge: !action.payloadInfo.hidden,
    senderName: action.payload.requester.name,
    senderLogoUrl: action.payloadInfo.senderLogoUrl,
  }
}

export function convertClaimOfferToHistoryEvent(
  action: ClaimOfferReceivedAction
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[CLAIM_OFFER_RECEIVED],
    // $FlowFixMe
    data: action.payload.data.revealedAttributes,
    id: uuid(),
    name: action.payload.data.name,
    status: HISTORY_EVENT_STATUS[CLAIM_OFFER_RECEIVED],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.CLAIM,
    remoteDid: action.payload.issuer.did,
    originalPayload: action,
    showBadge: !action.payloadInfo.hidden,
    senderName: action.payload.issuer.name,
    senderLogoUrl: action.payloadInfo.senderLogoUrl,
  }
}

export function convertClaimOfferAcceptedToHistoryEvent(
  action: ClaimOfferAcceptedAction | OutofbandClaimOfferAcceptedAction,
  credentialOfferReceivedHistoryEvent: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[CLAIM_OFFER_ACCEPTED],
    data: credentialOfferReceivedHistoryEvent.data,
    id: uuid(),
    name: credentialOfferReceivedHistoryEvent.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.CLAIM,
    remoteDid: credentialOfferReceivedHistoryEvent.remoteDid,
    originalPayload: action,
    status: HISTORY_EVENT_STATUS[CLAIM_OFFER_ACCEPTED],
    senderName: credentialOfferReceivedHistoryEvent.senderName,
    senderLogoUrl: credentialOfferReceivedHistoryEvent.senderLogoUrl,
  }
}

export function convertClaimOfferDenyToHistoryEvent(
  action: ClaimOfferDenyAction,
  claimOffer: any,
  event: ConnectionHistoryEvent
) {
  return {
    action: HISTORY_EVENT_STATUS[action.type],
    data: claimOffer.data.revealedAttributes,
    id: uuid(),
    name: claimOffer.data.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.CLAIM,
    remoteDid: claimOffer.remotePairwiseDID,
    originalPayload: { ...action, claimOffer },
    status: HISTORY_EVENT_STATUS[action.type],
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

export function convertCredentialRequestFailToHistoryEvent(
  action: SendClaimRequestFailAction | PaidCredentialRequestFailAction,
  credentialOfferAcceptedHistoryEvent: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[action.type],
    data: credentialOfferAcceptedHistoryEvent.data,
    id: uuid(),
    name: credentialOfferAcceptedHistoryEvent.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.CLAIM,
    remoteDid: credentialOfferAcceptedHistoryEvent.remoteDid,
    originalPayload: action,
    status: HISTORY_EVENT_STATUS[action.type],
    senderName: credentialOfferAcceptedHistoryEvent.senderName,
    senderLogoUrl: credentialOfferAcceptedHistoryEvent.senderLogoUrl,
  }
}

function convertOutofbandProofRequestAcceptedToHistoryEvent(
  action: AcceptOutofbandPresentationRequestAction,
  proofReceivedEvent: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS.UPDATE_ATTRIBUTE_CLAIM,
    data: proofReceivedEvent.data,
    id: uuid(),
    name: proofReceivedEvent.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.PROOF,
    remoteDid: proofReceivedEvent.remoteDid,
    originalPayload: proofReceivedEvent.originalPayload,
    status: HISTORY_EVENT_STATUS.PROOF_REQUEST_ACCEPTED,
    senderName: proofReceivedEvent.senderName,
    senderLogoUrl: proofReceivedEvent.senderLogoUrl,
  }
}

export function convertUpdateAttributeToHistoryEvent(
  action: UpdateAttributeClaimAction,
  proofReceivedEvent: ConnectionHistoryEvent,
  selfAttestedAttributes: *
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[action.type],
    data: proofReceivedEvent.data,
    id: uuid(),
    name: proofReceivedEvent.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.PROOF,
    remoteDid: proofReceivedEvent.remoteDid,
    originalPayload: { ...action, selfAttestedAttributes },
    status: HISTORY_EVENT_STATUS[action.type],
    senderName: proofReceivedEvent.senderName,
    senderLogoUrl: proofReceivedEvent.senderLogoUrl,
  }
}

function convertErrorSendProofToHistoryEvent(
  action: ErrorSendProofFailAction,
  storedUpdateAttributeEvent: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[action.type],
    data: storedUpdateAttributeEvent.data,
    id: uuid(),
    name: storedUpdateAttributeEvent.name,
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.PROOF,
    remoteDid: storedUpdateAttributeEvent.remoteDid,
    originalPayload: {
      ...storedUpdateAttributeEvent.originalPayload,
      type: action.type,
    },
    status: HISTORY_EVENT_STATUS[action.type],
    senderName: storedUpdateAttributeEvent.senderName,
    senderLogoUrl: storedUpdateAttributeEvent.senderLogoUrl,
  }
}

function convertDeleteClaimSuccessToHistoryEvent(
  action: DeleteClaimSuccessAction,
  claim: ClaimOfferPayload,
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[action.type],
    // $FlowFixMe
    data: {},
    id: uuid(),
    name: claim.data.name,
    status: HISTORY_EVENT_STATUS[action.type],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.CLAIM,
    remoteDid: claim.remotePairwiseDID,
    originalPayload: {
      ...action,
      data: {},
      remotePairwiseDID: claim.remotePairwiseDID,
    },
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

function mapSentAttributes(
  revealedGroupAttributes: *,
  revealedAttributes: *,
  selfAttestedAttributes: *,
  requestedAttributes: *,
  requestedPredicates: *,
  predicates: *
): Array<Item> {
  let sentAttributes = []
  if (revealedAttributes) {
    const revealedAttributeKeys = Object.keys(revealedAttributes)
    const revealedAttributeValues: Array<any> = Object.values(
      revealedAttributes
    )
    revealedAttributeValues.forEach(
      (revealedAttribute: Array<string>, index: number) => {
        sentAttributes.push({
          label: requestedAttributes[revealedAttributeKeys[index]].name,
          key: revealedAttributeKeys[index],
          data: revealedAttribute[1],
          claimUuid: revealedAttribute[0],
          type: ATTRIBUTE_TYPE.FILLED_ATTRIBUTE,
        })
      }
    )
  }

  if (revealedGroupAttributes) {
    const attributes = revealedGroupAttributes
    Object.keys(attributes).forEach((attributeKey) => {
      const revealedAttribute = attributes[attributeKey]
      sentAttributes.push({
        key: attributeKey,
        values: revealedAttribute.values,
        claimUuid: revealedAttribute.claimUuid,
        type: ATTRIBUTE_TYPE.FILLED_ATTRIBUTE,
      })
    })
  }

  if (selfAttestedAttributes) {
    const selfAttestedAttributesKeys = Object.keys(selfAttestedAttributes)
    const selfAttestedAttributesValues: Array<any> = Object.values(
      selfAttestedAttributes
    )
    selfAttestedAttributesValues.forEach(
      (selfAttestedAttribute: string, index: number) => {
        sentAttributes.push({
          label: requestedAttributes[selfAttestedAttributesKeys[index]].name,
          key: selfAttestedAttributesKeys[index],
          data: selfAttestedAttribute,
          type: ATTRIBUTE_TYPE.SELF_ATTESTED_ATTRIBUTE,
        })
      }
    )
  }

  if (requestedPredicates) {
    Object.keys(requestedPredicates).forEach((requestedPredicateKey) => {
      const predicate = predicates[requestedPredicateKey]
      const requestedPredicate = requestedPredicates[requestedPredicateKey]
      sentAttributes.push({
        label: requestedPredicate.name,
        p_type: requestedPredicate.p_type,
        p_value: requestedPredicate.p_value,
        key: requestedPredicateKey,
        claimUuid: predicate[0],
        type: ATTRIBUTE_TYPE.FILLED_PREDICATE,
      })
    })
  }
  return sentAttributes
}

export function convertProofSendToHistoryEvent(
  action: SendProofSuccessAction,
  {
    data: { name },
    originalProofRequestData: { requested_attributes, requested_predicates },
    remotePairwiseDID: remoteDid,
  }: ProofRequestPayload,
  {
    requested_proof: {
      revealed_group_attrs,
      revealed_attrs,
      self_attested_attrs,
      predicates,
    },
  }: Proof,
  event?: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[SEND_PROOF_SUCCESS],
    data: mapSentAttributes(
      revealed_group_attrs,
      revealed_attrs,
      self_attested_attrs,
      requested_attributes,
      requested_predicates,
      predicates
    ),
    id: uuid(),
    name,
    status: HISTORY_EVENT_STATUS[SEND_PROOF_SUCCESS],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.PROOF,
    remoteDid,
    originalPayload: action,
    senderName: event?.senderName,
    senderLogoUrl: event?.senderLogoUrl,
  }
}

export function convertProofDenyToHistoryEvent(
  action:
    | DenyProofRequestSuccessAction
    | DenyProofRequestAction
    | DenyProofRequestFailAction,
  proofRequest: ProofRequestPayload,
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[action.type],
    data: proofRequest,
    id: uuid(),
    name: proofRequest.data.name,
    status: HISTORY_EVENT_STATUS[action.type],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.PROOF,
    remoteDid: proofRequest.remotePairwiseDID,
    originalPayload: { ...action, proofRequest },
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

export function convertQuestionReceivedToHistoryEvent(
  action: QuestionReceivedAction,
  connection: Connection
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[QUESTION_RECEIVED],
    data: action.question,
    id: uuid(),
    name: action.question.messageTitle,
    status: HISTORY_EVENT_STATUS[QUESTION_RECEIVED],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.QUESTION,
    remoteDid: action.question.from_did,
    originalPayload: {
      payloadInfo: action.question,
      type: MESSAGE_TYPE.QUESTION,
    },
    showBadge: true,
    senderName: connection.senderName,
    senderLogoUrl: connection.logoUrl,
  }
}

export function convertQuestionAnswerToHistoryEvent(
  action: UpdateQuestionAnswerAction,
  question: QuestionPayload,
  event: ConnectionHistoryEvent
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[UPDATE_QUESTION_ANSWER],
    data: { payload: question, ...action },
    id: uuid(),
    name: `You responded with: ${action.answer.text}`,
    status: HISTORY_EVENT_STATUS[UPDATE_QUESTION_ANSWER],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.QUESTION,
    remoteDid: question.from_did,
    originalPayload: {
      payloadInfo: question,
      type: MESSAGE_TYPE.QUESTION,
    },
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

export function convertInviteActionReceivedToHistoryEvent(
  action: InviteActionReceivedAction,
  connection: Connection,
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[INVITE_ACTION_RECEIVED],
    data: action.inviteAction,
    id: uuid(),
    name: action.inviteAction.inviteActionTitle,
    status: HISTORY_EVENT_STATUS[INVITE_ACTION_RECEIVED],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITE_ACTION,
    remoteDid: action.inviteAction.from_did,
    originalPayload: {
      payloadInfo: action.inviteAction,
      type: MESSAGE_TYPE.INVITE_ACTION,
    },
    senderName: connection.senderName,
    senderLogoUrl: connection.logoUrl,
  }
}

export function convertInviteActionToHistoryEvent(
  action: InviteActionReceivedAction,
  inviteActionPayload: InviteActionPayload,
  event: ConnectionHistoryEvent,
  actionResponse: string,
): ConnectionHistoryEvent {
  return {
    action: HISTORY_EVENT_STATUS[
      actionResponse === INVITE_ACTION_RESPONSES.REJECTED
        ? INVITE_ACTION_REJECTED
        : INVITE_ACTION_ACCEPTED
      ],
    data: { payload: inviteActionPayload, ...action },
    id: uuid(),
    name: `You resolved action`,
    status:
      HISTORY_EVENT_STATUS[
        actionResponse === INVITE_ACTION_RESPONSES.REJECTED
          ? INVITE_ACTION_REJECTED
          : INVITE_ACTION_ACCEPTED
        ],
    timestamp: moment().format(),
    type: HISTORY_EVENT_TYPE.INVITE_ACTION,
    remoteDid: inviteActionPayload.from_did,
    originalPayload: {
      payloadInfo: inviteActionPayload,
      type: MESSAGE_TYPE.INVITE_ACTION,
    },
    senderName: event.senderName,
    senderLogoUrl: event.senderLogoUrl,
  }
}

export const recordHistoryEvent = (historyEvent: ConnectionHistoryEvent) => ({
  type: RECORD_HISTORY_EVENT,
  historyEvent,
})

export const showUserBackupAlert = (
  action: any
): ShowUserBackupAlertAction => ({
  type: SHOW_USER_BACKUP_ALERT,
  action,
})

export const deleteHistoryEvent = (
  historyEvent: ConnectionHistoryEvent
): DeleteHistoryEventAction => ({
  type: DELETE_HISTORY_EVENT,
  historyEvent,
})

export const deletePendingHistoryEvents = (
  senderDID: string
): DeletePendingHistoryEventsAction => ({
  type: DELETE_PENDING_HISTORY_EVENTS,
  senderDID,
})

export const updateHistoryEvent = (
  historyEvent: ConnectionHistoryEvent
): UpdateHistoryEventAction => ({
  type: UPDATE_HISTORY_EVENT,
  historyEvent,
})

export const historyEventOccurred = (event: HistoryEventOccurredEventType) => ({
  type: HISTORY_EVENT_OCCURRED,
  event,
})

export function* historyEventOccurredSaga(
  action: HistoryEventOccurredAction
): Generator<*, *, *> {
  const { event } = action
  let historyEvent: ?ConnectionHistoryEvent = null
  try {
    if (event.type === INVITATION_RECEIVED) {
      historyEvent = convertInvitationToHistoryEvent(event.data.payload)
    }

    if (event.type === INVITATION_ACCEPTED) {
      historyEvent = convertInvitationAcceptedToHistoryEvent(event)

      const existingConnectionFailEvent: ConnectionHistoryEvent = yield select(
        getUniqueHistoryItem,
        event.senderDID,
        CONNECTION_FAIL
      )
      const existingInvitationAcceptedEvent = yield select(
        getUniqueHistoryItem,
        event.senderDID,
        INVITATION_ACCEPTED
      )
      const existingEvent =
        existingConnectionFailEvent || existingInvitationAcceptedEvent
      if (existingEvent) {
        yield put(deleteHistoryEvent(existingEvent))
      }
    }

    if (event.type === CONNECTION_REQUEST_SENT) {
      const invitationAcceptedEvent = yield select(
        getUniqueHistoryItem,
        event.senderDID,
        INVITATION_ACCEPTED
      )

      // convert invitation accepted into connection success event
      historyEvent = convertConnectionRequestSentToHistoryEvent(
        invitationAcceptedEvent
      )
      if (invitationAcceptedEvent) {
        yield put(deleteHistoryEvent(invitationAcceptedEvent))
      }
    }

    if (event.type === NEW_CONNECTION_SUCCESS) {
      const invitationAcceptedEvent = yield select(
        getUniqueHistoryItem,
        event.senderDid,
        INVITATION_ACCEPTED
      )
      // convert invitation accepted into connection success event
      historyEvent = convertConnectionSuccessToHistoryEvent(
        invitationAcceptedEvent
      )
      if (invitationAcceptedEvent) {
        yield put(deleteHistoryEvent(invitationAcceptedEvent))
      }
    }

    if (event.type === CONNECTION_FAIL) {
      const existingInvitationAcceptedEvent = yield select(
        getUniqueHistoryItem,
        event.senderDid,
        INVITATION_ACCEPTED
      )
      const credentialRequestFailEvent = convertConnectionFailToHistoryEvent(
        event,
        existingInvitationAcceptedEvent
      )

      if (existingInvitationAcceptedEvent) {
        yield put(deleteHistoryEvent(existingInvitationAcceptedEvent))
      }
      historyEvent = credentialRequestFailEvent
    }

    if (event.type === DELETE_CONNECTION_SUCCESS) {
      const invitationAcceptedEvent = yield select(
        getUniqueHistoryItem,
        event.senderDID,
        INVITATION_ACCEPTED
      )
      const existingConnectionFailEvent: ConnectionHistoryEvent = yield select(
        getUniqueHistoryItem,
        event.senderDID,
        CONNECTION_FAIL
      )
      const connectionSuccessEvent = yield select(
        getUniqueHistoryItem,
        event.senderDID,
        HISTORY_EVENT_STATUS.NEW_CONNECTION_SUCCESS
      )

      const existingEvent =
        invitationAcceptedEvent ||
        connectionSuccessEvent ||
        existingConnectionFailEvent

      const connectionDeletedEvent = convertConnectionDeletedToHistoryEvent(
        event,
        existingEvent
      )

      // we can delete all active actions because deleting of the connection
      // means that these actions never complete
      yield put(deletePendingHistoryEvents(event.senderDID))

      if (connectionSuccessEvent) {
        historyEvent = connectionDeletedEvent
      }
    }

    if (event.type === CLAIM_OFFER_RECEIVED) {
      historyEvent = convertClaimOfferToHistoryEvent(event)
      const existingEvent = yield select(
        getHistoryEvent,
        historyEvent.originalPayload.payloadInfo.uid,
        historyEvent.remoteDid,
        CLAIM_OFFER_RECEIVED
      )
      if (existingEvent) historyEvent = null
    }

    if (event.type === DELETE_OUTOFBAND_CLAIM_OFFER) {
      const claimOffer = yield select(getClaimOffer, event.uid)
      const claimOfferReceivedEvent = yield select(
        getHistoryEvent,
        event.uid,
        claimOffer.remotePairwiseDID,
        CLAIM_OFFER_RECEIVED
      )
      historyEvent = convertClaimOfferDenyToHistoryEvent(
        event,
        claimOffer,
        claimOfferReceivedEvent
      )
      yield put(deleteHistoryEvent(claimOfferReceivedEvent))
    }

    if (event.type === DENY_CLAIM_OFFER) {
      const claimOffer = yield select(getClaimOffer, event.uid)
      const claimOfferReceivedEvent = yield select(
        getHistoryEvent,
        event.uid,
        claimOffer.remotePairwiseDID,
        CLAIM_OFFER_RECEIVED
      )
      const claimOfferDenyFailedEvent = yield select(
        getPendingHistory,
        event.uid,
        claimOffer.remotePairwiseDID,
        DENY_CLAIM_OFFER_FAIL
      )
      const oldHistoryEvent =
        claimOfferReceivedEvent || claimOfferDenyFailedEvent

      historyEvent = convertClaimOfferDenyToHistoryEvent(
        event,
        claimOffer,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))

      const denyClaimOfferEvent = yield select(
        getPendingHistory,
        event.uid,
        historyEvent.remoteDid,
        DENY_CLAIM_OFFER
      )
      if (denyClaimOfferEvent) {
        historyEvent = undefined
      }
    }

    if (event.type === DENY_CLAIM_OFFER_FAIL) {
      const claimOffer = yield select(getClaimOffer, event.uid)
      const oldHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        claimOffer.remotePairwiseDID,
        DENY_CLAIM_OFFER
      )
      historyEvent = convertClaimOfferDenyToHistoryEvent(
        event,
        claimOffer,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (event.type === DENY_CLAIM_OFFER_SUCCESS) {
      const claimOffer = yield select(getClaimOffer, event.uid)
      const oldHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        claimOffer.remotePairwiseDID,
        DENY_CLAIM_OFFER
      )
      historyEvent = convertClaimOfferDenyToHistoryEvent(
        event,
        claimOffer,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (event.type === OUTOFBAND_CLAIM_OFFER_ACCEPTED) {
      if (!event.show) {
        return
      }
      const existingCredentialOfferReceivedEvent: ConnectionHistoryEvent = yield select(
        getHistoryEvent,
        event.uid,
        event.remoteDid,
        CLAIM_OFFER_RECEIVED
      )
      if (existingCredentialOfferReceivedEvent) {
        yield put(deleteHistoryEvent(existingCredentialOfferReceivedEvent))
      }
      const credentialOfferAcceptedEvent = convertClaimOfferAcceptedToHistoryEvent(
        event,
        existingCredentialOfferReceivedEvent
      )
      historyEvent = credentialOfferAcceptedEvent
    }

    if (event.type === CLAIM_OFFER_ACCEPTED) {
      const existingCredentialOfferReceivedEvent: ConnectionHistoryEvent = yield select(
        getHistoryEvent,
        event.uid,
        event.remoteDid,
        CLAIM_OFFER_RECEIVED
      )
      // if sending credential request fails, then history store will delete credential offer accepted event, and add send_credential_request_fail event
      // Now, if user re-try to send credential request, then CLAIM_OFFER_ACCEPTED event will be raised again. But this time, history store won't have any CLAIM_OFFER_RECEIVED event, because it was deleted when user accepted credential offer first time
      // We need to check if history store already had SEND_CLAIM_REQUEST_FAIL or PAID_CREDENTIAL_REQUEST_FAIL
      const existingCredRequestFailEvent: ConnectionHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        SEND_CLAIM_REQUEST_FAIL
      )
      const existingPaidCredRequestFailEvent: ConnectionHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        PAID_CREDENTIAL_REQUEST_FAIL
      )
      const existingOutofbandClaimOfferAcceptedEvent: ConnectionHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        OUTOFBAND_CLAIM_OFFER_ACCEPTED
      )
      const existingEvent =
        existingCredentialOfferReceivedEvent ||
        existingCredRequestFailEvent ||
        existingPaidCredRequestFailEvent ||
        existingOutofbandClaimOfferAcceptedEvent

      const credentialOfferAcceptedEvent = convertClaimOfferAcceptedToHistoryEvent(
        event,
        existingEvent
      )

      if (existingEvent) {
        yield put(deleteHistoryEvent(existingEvent))
      }
      historyEvent = credentialOfferAcceptedEvent

      const existingCredentialOfferAcceptedEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        CLAIM_OFFER_ACCEPTED
      )
      if (existingCredentialOfferAcceptedEvent) {
        historyEvent = undefined
      }
    }

    if (
      event.type === SEND_CLAIM_REQUEST_FAIL ||
      event.type === PAID_CREDENTIAL_REQUEST_FAIL
    ) {
      const existingCredentialOfferAcceptedEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        CLAIM_OFFER_ACCEPTED
      )
      const existingSendClaimRequestSuccessEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        SEND_CLAIM_REQUEST_SUCCESS
      )
      const existingEvent =
        existingCredentialOfferAcceptedEvent ||
        existingSendClaimRequestSuccessEvent
      const credentialRequestFailEvent = convertCredentialRequestFailToHistoryEvent(
        event,
        existingEvent
      )
      if (existingEvent) {
        yield put(deleteHistoryEvent(existingEvent))
      }
      historyEvent = credentialRequestFailEvent
    }

    if (event.type === SEND_CLAIM_REQUEST_SUCCESS) {
      const claimOfferAcceptedEvent = yield select(
        getPendingHistory,
        event.uid,
        event.payload.remotePairwiseDID,
        CLAIM_OFFER_ACCEPTED
      )
      historyEvent = convertSendClaimRequestSuccessToHistoryEvent(
        event,
        claimOfferAcceptedEvent
      )

      const existingEvent = yield select(
        getPendingHistory,
        historyEvent.originalPayload.uid,
        historyEvent.remoteDid,
        SEND_CLAIM_REQUEST_SUCCESS
      )
      if (existingEvent) historyEvent = null
      if (claimOfferAcceptedEvent) {
        yield put(deleteHistoryEvent(claimOfferAcceptedEvent))
      }
    }

    if (event.type === CLAIM_STORAGE_SUCCESS) {
      const claim: ClaimOfferPayload = yield select(
        getClaimOffer,
        event.messageId
      )
      const existingEvent = yield select(
        getClaimReceivedHistory,
        event.messageId,
        claim.remotePairwiseDID,
        CLAIM_STORAGE_SUCCESS
      )

      if (existingEvent) historyEvent = null
      const pendingHistory = yield select(getPendingHistoryEvent, claim)

      historyEvent = convertClaimStorageSuccessToHistoryEvent(
        event,
        claim,
        pendingHistory
      )

      if (pendingHistory) {
        yield put(deleteHistoryEvent(pendingHistory))
      }
    }

    if (event.type === DELETE_CLAIM_SUCCESS) {
      const claim: ClaimOfferPayload = yield select(
        getClaimOffer,
        event.messageId
      )
      const claimReceivedEvent = yield select(
        getClaimReceivedHistory,
        event.messageId,
        claim.remotePairwiseDID,
        CLAIM_STORAGE_SUCCESS
      )
      historyEvent = convertDeleteClaimSuccessToHistoryEvent(
        event,
        claim,
        claimReceivedEvent
      )
      if (claimReceivedEvent) {
        // Delete attributes from received credential history item
        const event = {
          ...claimReceivedEvent,
          data: {},
          originalPayload: {
            ...claimReceivedEvent.originalPayload,
            data: {},
          },
        }
        yield put(updateHistoryEvent(event))
      }
    }

    if (event.type === PROOF_REQUEST_RECEIVED) {
      historyEvent = convertProofRequestToHistoryEvent(event)
      const existingEvent = yield select(
        getHistoryEvent,
        historyEvent.originalPayload.payloadInfo.uid,
        historyEvent.remoteDid,
        PROOF_REQUEST_RECEIVED
      )
      if (existingEvent) historyEvent = null
    }

    if (event.type === ACCEPT_OUTOFBAND_PRESENTATION_REQUEST) {
      if (!event.show) {
        return
      }
      const storedProofReceivedEvent = yield select(
        getHistoryEvent,
        event.uid,
        event.senderDID,
        PROOF_REQUEST_RECEIVED
      )
      if (storedProofReceivedEvent) {
        yield put(deleteHistoryEvent(storedProofReceivedEvent))
      }
      const proofRequestAcceptedEvent = convertOutofbandProofRequestAcceptedToHistoryEvent(
        event,
        storedProofReceivedEvent
      )
      historyEvent = proofRequestAcceptedEvent
    }

    if (event.type === UPDATE_ATTRIBUTE_CLAIM) {
      // get proof request received event
      const storedProofReceivedEvent = yield select(
        getHistoryEvent,
        event.uid,
        event.remoteDid,
        PROOF_REQUEST_RECEIVED
      )
      const storedErrorSendProofEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        ERROR_SEND_PROOF
      )
      const storedOutofbandProofRequestAcceptedEvent: ConnectionHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        PROOF_REQUEST_ACCEPTED
      )
      const selfAttestedAttributes: SelfAttestedAttributes = yield select(
        (store: Store, uid: string) =>
          store.proof[uid].proofData
            ? store.proof[uid].proofData.selfAttestedAttributes
            : {},
        event.uid
      )
      const existingEvent =
        storedProofReceivedEvent ||
        storedErrorSendProofEvent ||
        storedOutofbandProofRequestAcceptedEvent
      const updateAttributeClaimEvent = convertUpdateAttributeToHistoryEvent(
        event,
        existingEvent,
        selfAttestedAttributes
      )
      if (existingEvent) {
        yield put(deleteHistoryEvent(existingEvent))
      }
      historyEvent = updateAttributeClaimEvent
      const existingUpdateAttributeEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        UPDATE_ATTRIBUTE_CLAIM
      )
      if (existingUpdateAttributeEvent) {
        historyEvent = undefined
      }
    }

    if (event.type === ERROR_SEND_PROOF) {
      const storedUpdateAttributeEvent = yield select(
        getPendingHistory,
        event.uid,
        event.remoteDid,
        UPDATE_ATTRIBUTE_CLAIM
      )
      const errorSendProofEvent = convertErrorSendProofToHistoryEvent(
        event,
        storedUpdateAttributeEvent
      )
      if (storedUpdateAttributeEvent) {
        yield put(deleteHistoryEvent(storedUpdateAttributeEvent))
      }
      historyEvent = errorSendProofEvent
    }

    if (event.type === SEND_PROOF_SUCCESS) {
      const proofRequest: ProofRequestPayload = yield select(
        getProofRequest,
        event.uid
      )
      const proof: Proof = yield select(getProof, event.uid)
      const oldHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        proofRequest.remotePairwiseDID,
        UPDATE_ATTRIBUTE_CLAIM
      )
      historyEvent = convertProofSendToHistoryEvent(
        event,
        proofRequest,
        proof,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (event.type === DENY_PROOF_REQUEST) {
      const proofRequest: ProofRequestPayload = yield select(
        getProofRequest,
        event.uid
      )
      const proofRequestReceivedEvent = yield select(
        getHistoryEvent,
        event.uid,
        proofRequest.remotePairwiseDID,
        PROOF_REQUEST_RECEIVED
      )
      const proofDenyFailedEvent = yield select(
        getPendingHistory,
        event.uid,
        proofRequest.remotePairwiseDID,
        DENY_PROOF_REQUEST_FAIL
      )
      const oldHistoryEvent = proofRequestReceivedEvent || proofDenyFailedEvent
      historyEvent = convertProofDenyToHistoryEvent(
        event,
        proofRequest,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
      const existingDenyProofRequestEvent = yield select(
        getPendingHistory,
        event.uid,
        historyEvent.remoteDid,
        DENY_PROOF_REQUEST
      )
      if (existingDenyProofRequestEvent) {
        historyEvent = undefined
      }
    }

    if (event.type === DENY_PROOF_REQUEST_FAIL) {
      const proofRequest: ProofRequestPayload = yield select(
        getProofRequest,
        event.uid
      )
      const oldHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        proofRequest.remotePairwiseDID,
        DENY_PROOF_REQUEST
      )
      historyEvent = convertProofDenyToHistoryEvent(
        event,
        proofRequest,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (event.type === DENY_PROOF_REQUEST_SUCCESS) {
      const proofRequest: ProofRequestPayload = yield select(
        getProofRequest,
        event.uid
      )
      const oldHistoryEvent = yield select(
        getPendingHistory,
        event.uid,
        proofRequest.remotePairwiseDID,
        DENY_PROOF_REQUEST
      )
      historyEvent = convertProofDenyToHistoryEvent(
        event,
        proofRequest,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (event.type === QUESTION_RECEIVED) {
      const connection: Array<Connection> = yield select(
        getConnection,
        event.question.remotePairwiseDID || event.question.from_did
      )
      historyEvent = convertQuestionReceivedToHistoryEvent(event, connection[0])
    }

    if (event.type === UPDATE_QUESTION_ANSWER) {
      const questionPayload: QuestionPayload = yield select(
        selectQuestion,
        event.uid
      )
      const oldHistoryEvent = yield select(
        getHistoryEvent,
        event.uid,
        questionPayload.remotePairwiseDID,
        MESSAGE_TYPE.QUESTION
      )
      historyEvent = convertQuestionAnswerToHistoryEvent(
        event,
        questionPayload,
        oldHistoryEvent
      )
      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (event.type === INVITE_ACTION_RECEIVED) {
      const [connection]: Array<Connection> = yield select(
        getConnection,
        event.inviteAction.from_did
      )
      historyEvent = convertInviteActionReceivedToHistoryEvent(event, connection)
    }

    if (event.type === INVITE_ACTION_REJECTED) {
      const inviteActionPayload: InviteActionPayload = yield select(
        selectInviteAction,
        event.uid
      )

      const oldHistoryEvent = yield select(
        getHistoryEvent,
        event.uid,
        inviteActionPayload.from_did,
        MESSAGE_TYPE.INVITE_ACTION
      )

      historyEvent = convertInviteActionToHistoryEvent(
        event,
        inviteActionPayload,
        oldHistoryEvent,
        INVITE_ACTION_RESPONSES.REJECTED
      )

      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (event.type === INVITE_ACTION_ACCEPTED) {
      const inviteActionPayload: InviteActionPayload = yield select(
        selectInviteAction,
        event.uid
      )

      const oldHistoryEvent = yield select(
        getHistoryEvent,
        event.uid,
        inviteActionPayload.from_did,
        MESSAGE_TYPE.INVITE_ACTION
      )

      historyEvent = convertInviteActionToHistoryEvent(
        event,
        inviteActionPayload,
        oldHistoryEvent,
        INVITE_ACTION_RESPONSES.ACCEPTED
      )

      if (oldHistoryEvent) yield put(deleteHistoryEvent(oldHistoryEvent))
    }

    if (historyEvent) {
      yield put(recordHistoryEvent(historyEvent))
    }
  } catch (e) {
    captureError(e)
    yield put(
      loadHistoryFail({
        ...ERROR_HISTORY_EVENT_OCCURRED,
        message: `${ERROR_HISTORY_EVENT_OCCURRED.message} ${e.message}`,
      })
    )
  }
}

export function* removeEventSaga(
  action: RemoveEventAction
): Generator<*, *, *> {
  let eventType
  let remotePairwiseDID

  if (action.navigationRoute === claimOfferRoute) {
    const claimOffer = yield select(getClaimOffer, action.uid)
    eventType = CLAIM_OFFER_RECEIVED
    remotePairwiseDID = claimOffer.remotePairwiseDID
  } else if (action.navigationRoute === proofRequestRoute) {
    const proofRequest: ProofRequestPayload = yield select(
      getProofRequest,
      action.uid
    )
    eventType = PROOF_REQUEST_RECEIVED
    remotePairwiseDID = proofRequest.remotePairwiseDID
  } else if (action.navigationRoute === questionRoute) {
    const questionPayload: QuestionPayload = yield select(
      selectQuestion,
      action.uid
    )
    eventType = MESSAGE_TYPE.QUESTION
    remotePairwiseDID = questionPayload.remotePairwiseDID
  } else if (action.navigationRoute === inviteActionRoute) {
    const inviteActionPayload: InviteActionPayload = yield select(
      selectInviteAction,
      action.uid
    )
    eventType = MESSAGE_TYPE.INVITE_ACTION
    remotePairwiseDID = inviteActionPayload.remotePairwiseDID
  }

  if (eventType && remotePairwiseDID) {
    const event = yield select(
      getHistoryEvent,
      action.uid,
      remotePairwiseDID,
      eventType
    )

    if (event) yield put(deleteHistoryEvent(event))
  }
}

export function* watchRecordHistoryEvent(): any {
  yield takeEvery([RECORD_HISTORY_EVENT, DELETE_HISTORY_EVENT], persistHistory)
}

export function* watchNewConnectionSeen(): any {
  yield takeEvery(NEW_CONNECTION_SEEN, persistHistory)
}

export function* watchConnectionHistoryBackedUp(): any {
  yield takeEvery(CONNECTION_HISTORY_BACKED_UP, persistHistory)
}

export function* persistHistory(action: RecordHistoryEventAction): any {
  // if we get action to record history event
  // that means our history store is updated with data
  // we can now store history data to secure storage

  const historyData: ConnectionHistoryData | null = yield select(getHistory)
  if (historyData) {
    try {
      yield call(
        secureSet,
        HISTORY_EVENT_STORAGE_KEY,
        JSON.stringify(historyData)
      )
    } catch (e) {
      // Need to figure out what happens if storage fails
      captureError(e)
      customLogger.error(`persistHistory: ${e}`)
    }
  }
}

export function* watchHistoryEventOccurred(): any {
  yield takeEvery(HISTORY_EVENT_OCCURRED, historyEventOccurredSaga)
}

export function* watchRemoveEvent(): any {
  yield takeEvery(REMOVE_EVENT, removeEventSaga)
}

export function* watchConnectionHistory(): any {
  yield all([
    watchHistoryEventOccurred(),
    watchRecordHistoryEvent(),
    watchNewConnectionSeen(),
    watchConnectionHistoryBackedUp(),
    watchRemoveEvent(),
  ])
}

export default function connectionHistoryReducer(
  state: ConnectionHistoryStore = initialState,
  action: ConnectionHistoryAction
) {
  switch (action.type) {
    case LOAD_HISTORY:
      return {
        ...state,
        isLoading: true,
      }

    case LOAD_HISTORY_SUCCESS:
      return {
        ...state,
        data: {
          ...merge(state.data, action.data),
        },
        isLoading: false,
      }

    case LOAD_HISTORY_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.error,
      }

    case RECORD_HISTORY_EVENT: {
      const { remoteDid } = action.historyEvent
      return {
        ...state,
        data: {
          ...(state.data ? state.data : {}),
          connections: {
            ...(state.data && state.data.connections
              ? state.data.connections
              : {}),
            [remoteDid]: {
              data: [
                ...(state.data &&
                state.data.connections &&
                state.data.connections[remoteDid]
                  ? state.data.connections[remoteDid].data
                  : []),
                action.historyEvent,
              ],
              newBadge: true,
            },
          },
          connectionsUpdated: true,
        },
      }
    }

    case DELETE_HISTORY_EVENT: {
      const { remoteDid } = action.historyEvent
      const filteredDataArr =
        state.data &&
        state.data.connections &&
        state.data.connections[remoteDid] &&
        state.data.connections[remoteDid].data
          ? state.data.connections[remoteDid].data.filter((item) => {
              // $FlowFixMe
              return item !== action.historyEvent
            })
          : []
      return {
        ...state,
        data: {
          ...(state.data ? state.data : {}),
          connections: {
            ...(state.data && state.data.connections
              ? state.data.connections
              : {}),
            [remoteDid]: {
              data: filteredDataArr,
              newBadge: false,
            },
          },
          connectionsUpdated: true,
        },
      }
    }

    case UPDATE_HISTORY_EVENT: {
      const { remoteDid } = action.historyEvent
      const filteredDataArr =
        state.data &&
        state.data.connections &&
        state.data.connections[remoteDid] &&
        state.data.connections[remoteDid].data
          ? state.data.connections[remoteDid].data.map((item) => {
              // $FlowFixMe
              return item.id === action.historyEvent.id
                ? action.historyEvent
                : item
            })
          : []
      return {
        ...state,
        data: {
          ...(state.data ? state.data : {}),
          connections: {
            ...(state.data && state.data.connections
              ? state.data.connections
              : {}),
            [remoteDid]: {
              data: filteredDataArr,
              newBadge: false,
            },
          },
          connectionsUpdated: true,
        },
      }
    }

    case DELETE_PENDING_HISTORY_EVENTS: {
      const { senderDID } = action
      const filteredDataArr =
        state.data &&
        state.data.connections &&
        state.data.connections[senderDID] &&
        state.data.connections[senderDID].data
          ? state.data.connections[senderDID].data.filter(
              (item) => !PENDING_ACTIONS.includes(item.action)
            )
          : []
      return {
        ...state,
        data: {
          ...(state.data ? state.data : {}),
          connections: {
            ...(state.data && state.data.connections
              ? state.data.connections
              : {}),
            [senderDID]: {
              data: filteredDataArr,
              newBadge: false,
            },
          },
          connectionsUpdated: true,
        },
      }
    }

    case SHOW_USER_BACKUP_ALERT: {
      return {
        ...state,
        data: {
          ...(state.data ? state.data : {}),
          connectionsUpdated: true,
        },
      }
    }

    case NEW_CONNECTION_SEEN:
      return {
        ...state,
        data: {
          ...(state.data ? state.data : {}),
          connections: {
            ...(state.data && state.data.connections
              ? state.data.connections
              : {}),
            [action.senderDid]: {
              data: [
                ...(state.data &&
                state.data.connections &&
                state.data.connections[action.senderDid]
                  ? state.data.connections[action.senderDid].data
                  : []),
              ],
              newBadge: false,
            },
          },
        },
      }

    case CONNECTION_HISTORY_BACKED_UP:
      return {
        ...state,
        data: {
          ...(state.data ? state.data : {}),
          connectionsUpdated: false,
        },
      }

    case RESET:
      return initialState

    default:
      return state
  }
}
