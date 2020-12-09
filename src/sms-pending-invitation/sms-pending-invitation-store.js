// @flow
import { put, takeEvery, call, take, all, select } from 'redux-saga/effects'
import type { CustomError } from '../common/type-common'
import type {
  SMSPendingInvitationStore,
  SMSPendingInvitationAction,
  SMSPendingInvitationPayload,
  SMSPendingInvitationRequestAction,
} from './type-sms-pending-invitation'
import type {
  InvitationPayload,
  AriesConnectionInvite,
  AriesConnectionInvitePayload,
  AriesOutOfBandInvite,
  AriesServiceEntry,
} from '../invitation/type-invitation'
import {
  SMS_PENDING_INVITATION_REQUEST,
  SMS_PENDING_INVITATION_RECEIVED,
  SMS_PENDING_INVITATION_FAIL,
  SMS_PENDING_INVITATION_SEEN,
  SMSPendingInvitationStatus,
  SAFE_TO_DOWNLOAD_SMS_INVITATION,
} from './type-sms-pending-invitation'
import { getInvitationLink } from '../api/api'
import {
  ERROR_PENDING_INVITATION_RESPONSE_PARSE,
  ERROR_PENDING_INVITATION_RESPONSE_PARSE_CODE,
} from '../api/api-constants'
import {
  getAgencyUrl,
  getCurrentScreen,
  getHydrationState,
} from '../store/store-selector'
import { invitationReceived } from '../invitation/invitation-store'
import {
  HYDRATED,
  UNSAFE_SCREENS_TO_DOWNLOAD_SMS,
} from '../store/type-config-store'
import { RESET } from '../common/type-common'
import { captureError } from '../services/error/error-handler'
import { isValidInvitationUrl } from './sms-invitation-validator'
import { schemaValidator } from '../services/schema-validator'
import { ID } from '../common/type-common'
import {
  isValidAriesOutOfBandInviteData,
  isValidAriesV1InviteData,
} from '../invitation/invitation'
import isUrl from 'validator/lib/isURL'
import { CONNECTION_INVITE_TYPES } from '../invitation/type-invitation'
import {
  getUrlQrCodeData,
  isValidUrlQrCode,
} from '../components/qr-scanner/qr-code-types/qr-url'

const initialState = {}

export const getSmsPendingInvitation = (smsToken: string) => ({
  type: SMS_PENDING_INVITATION_REQUEST,
  smsToken,
})

export const smsPendingInvitationReceived = (
  smsToken: string,
  data:
    | SMSPendingInvitationPayload
    | AriesConnectionInvitePayload
    | AriesOutOfBandInvite
) => ({
  type: SMS_PENDING_INVITATION_RECEIVED,
  data,
  smsToken,
})

export const smsPendingInvitationFail = (
  smsToken: string,
  error: CustomError
) => ({
  type: SMS_PENDING_INVITATION_FAIL,
  smsToken,
  error,
})

export const smsPendingInvitationSeen = (smsToken: string) => ({
  type: SMS_PENDING_INVITATION_SEEN,
  smsToken,
})

// Below action tells that now user can't change the environment
// and so whatever environment we have available now, we can go ahead and
// start downloading SMS invitation from that environment
export const safeToDownloadSmsInvitation = () => ({
  type: SAFE_TO_DOWNLOAD_SMS_INVITATION,
})

export const convertSmsPayloadToInvitation = (
  pendingInvitation: SMSPendingInvitationPayload
): InvitationPayload => ({
  senderEndpoint: pendingInvitation.senderAgencyDetail.endpoint,
  requestId: pendingInvitation.connReqId,
  senderAgentKeyDelegationProof:
    pendingInvitation.senderDetail.agentKeyDlgProof,
  senderName: pendingInvitation.senderDetail.name,
  senderDID: pendingInvitation.senderDetail.DID,
  senderLogoUrl: pendingInvitation.senderDetail.logoUrl,
  senderVerificationKey: pendingInvitation.senderDetail.verKey,
  targetName: pendingInvitation.targetName,
  senderAgencyDetail: pendingInvitation.senderAgencyDetail,
  senderDetail: pendingInvitation.senderDetail,
  version: pendingInvitation.version,
})

export function convertAriesPayloadToInvitation(
  ariesConnectionInvite: AriesConnectionInvite
): InvitationPayload {
  const { payload, original } = ariesConnectionInvite

  const senderAgentKeyDelegationProof = {
    agentDID: payload.recipientKeys[0],
    agentDelegatedKey: payload.recipientKeys[0],
    signature: '<no-signature-supplied>',
  }

  const invitation = {
    senderEndpoint: payload.serviceEndpoint,
    requestId: payload[ID],
    senderAgentKeyDelegationProof,
    senderName: payload.label || 'Unknown',
    senderDID: payload.recipientKeys[0],
    // TODO:KS Need to discuss with architects to know how to fulfill this requirement
    senderLogoUrl:
      payload.profileUrl && isUrl(payload.profileUrl)
        ? payload.profileUrl
        : null,
    senderVerificationKey: payload.recipientKeys[0],
    targetName: payload.label || 'Unknown',
    senderDetail: {
      name: payload.label || 'Unknown',
      agentKeyDlgProof: senderAgentKeyDelegationProof,
      DID: payload.recipientKeys[0],
      logoUrl:
        payload.profileUrl && isUrl(payload.profileUrl)
          ? payload.profileUrl
          : null,
      verKey: payload.recipientKeys[0],
      publicDID: payload.recipientKeys[0],
    },
    senderAgencyDetail: {
      DID: payload.recipientKeys[0],
      verKey: payload.recipientKeys[1],
      endpoint: payload.serviceEndpoint,
    },
    version: '1.0',
    original,
    type: CONNECTION_INVITE_TYPES.ARIES_V1_QR,
  }

  return invitation
}

export function convertAriesOutOfBandPayloadToInvitation(
  invite: AriesOutOfBandInvite
): InvitationPayload | null {
  const payload = invite

  const serviceEntry = payload.service
    ? ((payload.service.find(
        (serviceEntry) => typeof serviceEntry === 'object'
      ): any): AriesServiceEntry)
    : null

  if (!serviceEntry) {
    return null
  }

  const publicDID = invite.public_did || serviceEntry.recipientKeys[0]

  const senderAgentKeyDelegationProof = {
    agentDID: serviceEntry.recipientKeys[0],
    agentDelegatedKey: serviceEntry.recipientKeys[0],
    signature: '<no-signature-supplied>',
  }

  const invitation = {
    senderEndpoint: serviceEntry.serviceEndpoint,
    requestId: payload[ID],
    senderAgentKeyDelegationProof,
    senderName: payload.label || 'Unknown',
    senderDID: publicDID,
    senderLogoUrl:
      payload.profileUrl && isUrl(payload.profileUrl)
        ? payload.profileUrl
        : null,
    senderVerificationKey: serviceEntry.recipientKeys[0],
    targetName: payload.label || 'Unknown',
    senderDetail: {
      name: payload.label || 'Unknown',
      agentKeyDlgProof: senderAgentKeyDelegationProof,
      DID: publicDID,
      logoUrl:
        payload.profileUrl && isUrl(payload.profileUrl)
          ? payload.profileUrl
          : null,
      verKey: serviceEntry.recipientKeys[0],
      publicDID: publicDID,
    },
    senderAgencyDetail: {
      DID: '',
      verKey: '',
      endpoint: serviceEntry.serviceEndpoint,
    },
    type: CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND,
    version: '1.0',
    original: JSON.stringify(invite),
    originalObject: invite,
  }
  return invitation
}

export function* callSmsPendingInvitationRequest(
  action: SMSPendingInvitationRequestAction
): any {
  // we wait to download SMS invitation till we know that we are safe
  // because user can still change the environment and point to something else
  // to download sms invitation from updated environment
  // if a user is gone past lock selection screen, then we know we are safe
  // or user has already setup lock and is now coming for second SMS invitation
  // or user is not on one of these screens
  // splash screen, lock selection, dev environment switch
  const currentScreen: string = yield select(getCurrentScreen)
  if (UNSAFE_SCREENS_TO_DOWNLOAD_SMS.indexOf(currentScreen) > -1) {
    // user is on screens where he has chance to change environment details
    // so we wait for event which tells that we are safe
    yield take(SAFE_TO_DOWNLOAD_SMS_INVITATION)
  }

  // if we reach this point, that means either user was not on some unsafe screen
  // or we waited till safe action was raised, either way
  // we can now go ahead and start downloading SMS invitation

  // I lied a bit in above statement that we can start downloading SMS now
  // there is one more scenario that we need to consider before we can start
  // downloading sms, this saga can also be triggered if user already has an app
  // and user switched environments while setting up the app first time
  // so now we need to maintain switched environment for the lifetime of app
  // so we store those environment details in phone storage and
  // hydrate them when app is killed and started again
  // now, when user starts the app second time, user's updated config
  // might still not be fetched or app is not fully hydrated yet,
  // so, we wait for app to be hydrated if not already hydrated
  const isAppHydrated: boolean = yield select(getHydrationState)
  if (!isAppHydrated) {
    yield take(HYDRATED)
  }

  // now we are sure that user can't change the environment for first time app
  // and also we are sure that if user did update the environment first time
  // then we have got the updated config
  // and now, we can go ahead and start downloading SMS pending invitation

  const agencyUrl: string = yield select(getAgencyUrl)
  const { smsToken } = action

  try {
    // there can be two types of token that we can get from deep link
    // 1. it can be 8 characters token
    // 2. it can be a url that would return invitation details

    if (!smsToken) {
      throw new Error('No data in token received')
    }

    let invitationLink = {
      url: '',
    }
    if (smsToken.length < 12) {
      // we are assuming that if length is less than 12, then we got a token
      // get invitation link
      invitationLink = yield call(getInvitationLink, {
        agencyUrl,
        smsToken,
      })
    } else if (isValidInvitationUrl(smsToken)) {
      // check if we got the url, then directly assign url
      invitationLink = {
        url: smsToken,
      }
    } else {
      throw new Error('Not recognized for any type of token that we know')
    }

    const urlInvitationData = isValidUrlQrCode(invitationLink.url)
    if (!urlInvitationData) {
      return
    }

    const [urlError, pendingInvitationPayload] = yield call(
      getUrlQrCodeData,
      urlInvitationData,
      invitationLink.url
    )
    if (urlError) {
      throw new Error('Invitation payload object format is not as expected')
    }

    if (
      schemaValidator.validate(
        smsInvitationExpectedSchema,
        pendingInvitationPayload
      )
    ) {
      yield put(
        invitationReceived({
          payload: convertSmsPayloadToInvitation(
            ((pendingInvitationPayload: Object): SMSPendingInvitationPayload)
          ),
        })
      )
      yield put(
        smsPendingInvitationReceived(smsToken, pendingInvitationPayload)
      )
      return
    }

    const ariesInvitationData =
      pendingInvitationPayload.payload || pendingInvitationPayload
    const original = JSON.stringify(ariesInvitationData)
    const ariesV1Invite = isValidAriesV1InviteData(
      ariesInvitationData,
      original
    )
    if (ariesV1Invite) {
      yield put(
        invitationReceived({
          payload: convertAriesPayloadToInvitation(ariesV1Invite),
        })
      )
      yield put(smsPendingInvitationReceived(smsToken, ariesInvitationData))
      return
    }

    const ariesV1OutOfBandInvite = isValidAriesOutOfBandInviteData(
      pendingInvitationPayload
    )
    if (ariesV1OutOfBandInvite) {
      const payload = convertAriesOutOfBandPayloadToInvitation(
        ariesV1OutOfBandInvite
      )
      if (!payload) {
        throw new Error('Invitation payload object format is not as expected')
      }

      yield put(
        invitationReceived({
          payload: payload,
        })
      )
      yield put(
        smsPendingInvitationReceived(smsToken, pendingInvitationPayload)
      )
      return
    }

    throw new Error('Invitation payload object format is not as expected')
  } catch (e) {
    let error: CustomError = {
      code: ERROR_PENDING_INVITATION_RESPONSE_PARSE_CODE,
      message: `${ERROR_PENDING_INVITATION_RESPONSE_PARSE}: ${e.message}`,
    }

    try {
      error = JSON.parse(e.message)
    } catch (e) {}
    captureError(e)
    yield put(smsPendingInvitationFail(smsToken, error))
  }
}

export const smsInvitationExpectedSchema = {
  type: 'object',
  properties: {
    senderDetail: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        agentKeyDlgProof: { type: 'object' },
        DID: { type: 'string' },
        logoUrl: { type: 'string' },
        verKey: { type: 'string' },
        publicDID: { type: 'string' },
      },
      required: ['DID', 'verKey', 'agentKeyDlgProof'],
    },
    senderAgencyDetail: {
      type: 'object',
      properties: {
        DID: { type: 'string' },
        verKey: { type: 'string' },
        endpoint: { type: 'string' },
      },
      required: ['DID', 'verKey', 'endpoint'],
    },
    targetName: { type: 'string' },
  },
  required: ['senderDetail', 'senderAgencyDetail'],
}

function* watchSmsPendingInvitationRequest(): any {
  yield takeEvery(
    SMS_PENDING_INVITATION_REQUEST,
    callSmsPendingInvitationRequest
  )
}

export function* watchSmsPendingInvitationSaga(): any {
  yield all([watchSmsPendingInvitationRequest()])
}

export default function smsPendingInvitationReducer(
  state: SMSPendingInvitationStore = initialState,
  action: SMSPendingInvitationAction
) {
  switch (action.type) {
    case SMS_PENDING_INVITATION_REQUEST:
      if (state[action.smsToken] !== undefined) {
        return state
      } else {
        return {
          ...state,
          [action.smsToken]: {
            payload: null,
            isFetching: true,
            status: SMSPendingInvitationStatus.NONE,
            error: null,
          },
        }
      }

    case SMS_PENDING_INVITATION_RECEIVED:
      return {
        ...state,
        [action.smsToken]: {
          ...state[action.smsToken],
          isFetching: false,
          payload: action.data,
          status: SMSPendingInvitationStatus.RECEIVED,
        },
      }

    case SMS_PENDING_INVITATION_FAIL:
      return {
        ...state,
        [action.smsToken]: {
          ...state[action.smsToken],
          payload: null,
          isFetching: false,
          error: action.error,
          status: SMSPendingInvitationStatus.FETCH_FAILED,
        },
      }

    case SMS_PENDING_INVITATION_SEEN:
      if (action.smsToken) {
        return {
          ...state,
          [action.smsToken]: {
            ...state[action.smsToken],
            status: SMSPendingInvitationStatus.SEEN,
          },
        }
      } else {
        return state
      }

    case RESET:
      return initialState

    default:
      return state
  }
}
