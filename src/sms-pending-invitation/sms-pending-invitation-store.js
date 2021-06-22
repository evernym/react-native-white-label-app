// @flow
import { all, call, put, select, take, takeEvery } from 'redux-saga/effects'
import type { CustomError } from '../common/type-common'
import { RESET } from '../common/type-common'
import type {
  SMSPendingInvitationAction,
  SMSPendingInvitationRequestAction,
  SMSPendingInvitationStore,
} from './type-sms-pending-invitation'
import {
  SAFE_TO_DOWNLOAD_SMS_INVITATION,
  SMS_PENDING_INVITATION_FAIL,
  SMS_PENDING_INVITATION_RECEIVED,
  SMS_PENDING_INVITATION_REQUEST,
  SMS_PENDING_INVITATION_SEEN,
  SMSPendingInvitationStatus,
} from './type-sms-pending-invitation'
import type { InvitationPayload } from '../invitation/type-invitation'
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
import {
  HYDRATED,
  UNSAFE_SCREENS_TO_DOWNLOAD_SMS,
} from '../store/type-config-store'
import { captureError } from '../services/error/error-handler'
import { isValidInvitationUrl } from './sms-invitation-validator'
import {
  getUrlData,
  isValidUrl,
} from '../components/qr-scanner/qr-code-types/qr-url'
import {
  convertProprietaryInvitationToAppInvitation,
  convertShortProprietaryInvitationToAppInvitation,
  isProprietaryInvitation,
  isShortProprietaryInvitation,
} from '../invitation/kinds/proprietary-connection-invitation'
import {
  convertAriesInvitationToAppInvitation,
  isAriesInvitation,
} from '../invitation/kinds/aries-connection-invitation'
import {
  convertAriesOutOfBandInvitationToAppInvitation,
  isAriesOutOfBandInvitation,
} from '../invitation/kinds/aries-out-of-band-invitation'
import type { Url } from 'url-parse'

const initialState = {}

export const getSmsPendingInvitation = (smsToken: string) => ({
  type: SMS_PENDING_INVITATION_REQUEST,
  smsToken,
})

export const smsPendingInvitationReceived = (
  smsToken: string,
  data: InvitationPayload
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

export function* handleDeepLinkError(smsToken: string, e: any): any {
  let error: CustomError = {
    code: ERROR_PENDING_INVITATION_RESPONSE_PARSE_CODE,
    message: `${ERROR_PENDING_INVITATION_RESPONSE_PARSE}: ${e.message}`,
  }

  try {
    const parsedError = JSON.parse(e.message)
    error = {
      code: parsedError.code || parsedError.statusCode || error.code,
      message: parsedError.message || parsedError.statusMsg || error.message,
    }
  } catch (e) {}
  captureError(e)
  yield put(smsPendingInvitationFail(smsToken, error))
}

export function* handleDeepLink(
  smsToken: string,
  parsedUrl: Url,
  url: string
): any {
  try {
    const [urlError, pendingInvitationPayload] = yield call(
      getUrlData,
      parsedUrl,
      url
    )
    if (urlError) {
      throw new Error(urlError)
    }

    const proprietaryInvitation = isProprietaryInvitation(
      pendingInvitationPayload
    )
    if (proprietaryInvitation) {
      yield put(
        smsPendingInvitationReceived(
          smsToken,
          convertProprietaryInvitationToAppInvitation(proprietaryInvitation)
        )
      )
      return
    }

    const proprietaryShortInvitation = isShortProprietaryInvitation(
      pendingInvitationPayload
    )
    if (proprietaryShortInvitation) {
      yield put(
        smsPendingInvitationReceived(
          smsToken,
          convertShortProprietaryInvitationToAppInvitation(
            proprietaryShortInvitation
          )
        )
      )
      return
    }

    const ariesInvitationData =
      pendingInvitationPayload.payload || pendingInvitationPayload
    const ariesV1Invite = isAriesInvitation(
      ariesInvitationData,
      JSON.stringify(ariesInvitationData)
    )
    if (ariesV1Invite) {
      yield put(
        smsPendingInvitationReceived(
          smsToken,
          convertAriesInvitationToAppInvitation(ariesV1Invite)
        )
      )
      return
    }

    const ariesV1OutOfBandInvite = isAriesOutOfBandInvitation(
      pendingInvitationPayload
    )
    if (ariesV1OutOfBandInvite) {
      yield put(
        smsPendingInvitationReceived(
          smsToken,
          yield call(
            convertAriesOutOfBandInvitationToAppInvitation,
            ariesV1OutOfBandInvite
          )
        )
      )
      return
    }

    throw new Error('Invitation payload object format is not as expected')
  } catch (e) {
    yield call(handleDeepLinkError, smsToken, e)
  }
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

  const { smsToken } = action

  try {
    // there can be two types of token that we can get from deep link
    // 1. it can be 8 characters token
    // 2. it can be a url that would return invitation details

    if (!smsToken) {
      throw new Error('No data in token received')
    }

    const agencyUrl: string = yield select(getAgencyUrl)

    const urlInvitationData = isValidUrl(smsToken)
    if (urlInvitationData) {
      // token is already valid link
      yield call(handleDeepLink, smsToken, urlInvitationData, smsToken)
    } else {
      // we need query for received token
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

      const urlInvitationData = isValidUrl(invitationLink.url)
      if (!urlInvitationData) {
        throw new Error('Not recognized for any type of token that we know')
      }
      yield call(
        handleDeepLink,
        smsToken,
        urlInvitationData,
        invitationLink.url
      )
    }
  } catch (e) {
    yield call(handleDeepLinkError, smsToken, e)
  }
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
