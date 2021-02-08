// @flow

import {
  put,
  takeLeading,
  race,
  take,
  call,
  select,
  all,
} from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import {
  SEND_CLAIM_REQUEST_SUCCESS,
  SEND_PAID_CREDENTIAL_REQUEST,
  CLAIM_OFFER_RECEIVED,
} from '../claim-offer/type-claim-offer'
import { getUnacknowledgedMessages } from '../store/config-store'
import { FETCH_ADDITIONAL_DATA } from '../push-notification/type-push-notification'
import { selectPushPermissionAndToken } from '../push-notification/push-notification-store-selector'
import {
  GET_MESSAGES_SUCCESS,
  GET_MESSAGES_FAIL,
  VCX_INIT_SUCCESS,
  SHOW_SNACK_ERROR,
  CLEAR_SNACK_ERROR,
} from '../store/type-config-store'
import { PROOF_REQUEST_RECEIVED } from '../proof-request/type-proof-request'
import { QUESTION_RECEIVED } from '../question/type-question'
import {
  NEW_CONNECTION_SUCCESS,
  SEND_REDIRECT_SUCCESS,
  SEND_REUSE_SUCCESS,
} from '../store/type-connection-store'
import { getConnectionsCount } from '../store/store-selector'

export function* watchMessageDownload(): any {
  yield all([
    watchManualDownloadTrigger(),
    watchInfiniteDownloader(),
    watchDownloadError(),
  ])
}

function* watchManualDownloadTrigger(): any {
  yield takeLeading(
    [
      NEW_CONNECTION_SUCCESS,
      SEND_CLAIM_REQUEST_SUCCESS,
      SEND_PAID_CREDENTIAL_REQUEST,
      SEND_REDIRECT_SUCCESS,
      SEND_REUSE_SUCCESS,
    ],
    triggerDownloadSaga
  )
}

function* watchInfiniteDownloader(): any {
  yield takeLeading('TRIGGER_AUTOMATIC_DOWNLOAD', infiniteDownloadSaga)
}

function* watchDownloadError(): any {
  yield takeLeading(VCX_INIT_SUCCESS, downloadErrorSaga)
}

function* triggerDownloadSaga(action: { type: string }): Generator<*, *, *> {
  // We should trigger automatic message download, once user either
  // accept a connection, or accepts a cred offer

  const {
    isAllowed,
    pushToken,
  }: { isAllowed: boolean, pushToken: ?string } = yield select(
    selectPushPermissionAndToken
  )
  if (!isAllowed || !pushToken) {
    // If user has not allowed push notification permission
    // or user's device has not given any push token
    // then we schedule automatic message download after 10 seconds
    yield call(delay, 10000)
    yield put(getUnacknowledgedMessages())

    // since we know that messages would never arrive by push notification
    // because user has either not allowed push permission
    // or user's device did not provide push token
    // We should schedule automatic message download trigger after every 30 seconds
    yield put({
      type: 'TRIGGER_AUTOMATIC_DOWNLOAD',
      limit: 0,
    })
    return
  }

  // if push permission and token are available

  // then, we wait for 15 seconds to trigger a message download.
  // We are waiting for an arbitrary number because sender might take some time
  // to generate a response, or to send a new message.

  // It might also happen that MSDK receives Push Notification
  // in this 15 seconds window.

  // We need to race "timeout" and push notification's "fetch additional data"
  const { pushNotificationArrived } = yield race({
    waitOver: call(delay, 15000),
    pushNotificationArrived: take(FETCH_ADDITIONAL_DATA),
  })

  if (pushNotificationArrived) {
    // since push notification is arrived within this 15 seconds window
    // then we should not trigger an automatic download.
    return
  }

  yield put({
    type: 'TRIGGER_AUTOMATIC_DOWNLOAD',
    limit: 3,
  })
}

export function* infiniteDownloadSaga(action: {
  limit: number,
  type: string,
}): Generator<*, *, *> {
  let { limit } = action
  const defaultTimeout = 30000 // 30 seconds
  let waitTimeout = defaultTimeout

  while (true) {
    yield put(getUnacknowledgedMessages())

    // once we queue action to download messages
    // then we wait for message download to either be success or error
    // before scheduling another action to download new messages
    const { fail } = yield race({
      success: take(GET_MESSAGES_SUCCESS),
      fail: take(GET_MESSAGES_FAIL),
      receivedMessage: take([
        CLAIM_OFFER_RECEIVED,
        PROOF_REQUEST_RECEIVED,
        QUESTION_RECEIVED,
      ]),
    })

    if (fail) {
      // if message download fails, then we don't want to overload
      // agency with failing calls, so we backoff
      waitTimeout += defaultTimeout
    } else {
      waitTimeout = defaultTimeout
    }

    yield call(delay, waitTimeout)
    if (limit === 0) {
      continue
    }
    if (limit === 1) {
      break
    } else {
      limit--
    }
  }
}

function* downloadErrorSaga(): Generator<*, *, *> {
  const connectionsCount: number = yield select(getConnectionsCount)
  if (connectionsCount === 0) {
    // if there are no connections, then we wait for a new connection
    yield take(NEW_CONNECTION_SUCCESS)
  }
  const failCountToShowError = 2

  while (true) {
    let failCount = 0
    for (let i = 0; i < failCountToShowError; i++) {
      const { fail, success }: { fail?: any, success?: any } = yield race({
        success: take(GET_MESSAGES_SUCCESS),
        fail: take(GET_MESSAGES_FAIL),
      })

      if (fail) {
        // keep accumulating error messages for download message failure
        failCount += 1
        continue
      }

      if (success) {
        // if we get even one success before failure touches count of 3
        // then we reset failure counter to 0
        // and start counting failure from 0 by restarting for loop
        failCount = 0
        // break to outer while loop
        break
      }
    }

    if (failCount === failCountToShowError) {
      // we got GET_MESSAGES_FAIL successively 3 times
      // now it is the time to show error to user in snack
      yield put({
        type: SHOW_SNACK_ERROR,
        error: ERROR_MESSAGE_DOWNLOAD_FAIL,
      })

      // clear error for snack after 5 seconds
      yield call(delay, 5000)
      yield put({
        type: CLEAR_SNACK_ERROR,
      })
    }
  }
}

const ERROR_MESSAGE_DOWNLOAD_FAIL =
  'Unable to reach cloud agent. Check your internet connection or try to restart app.'
