// @flow

import delay from '@redux-saga/delay-p'
import { call, put, all, takeLatest } from 'redux-saga/effects'

import type {
  InAppNotificationStore,
  InAppNotificationActions,
  ScheduleClearInAppNotificationAction,
} from './in-app-notification-type'
import {
  SHOW_IN_APP_NOTIFICATION,
  CLEAR_IN_APP_NOTIFICATION,
  SCHEDULE_CLEAR_IN_APP_NOTIFICATION,
} from './in-app-notification-type'
import { clearInAppNotification } from './in-app-notification-actions'

export function* scheduleClearInAppNotificationSaga(
  action: ScheduleClearInAppNotificationAction
): Generator<*, *, *> {
  // Expectation here is that as soon as new in app notification
  // is shown to the user, UI rendering code will raise
  // schedule clear in app notification action

  // Once we receive that we need to clear in app notification
  // we will clear it in 3 seconds
  yield call(delay, 3000)
  yield put(clearInAppNotification())
}

function* watchScheduleClearInAppNotification(): any {
  yield takeLatest(
    SCHEDULE_CLEAR_IN_APP_NOTIFICATION,
    scheduleClearInAppNotificationSaga
  )
}

export function* watchInAppNotificationActions(): any {
  yield all([watchScheduleClearInAppNotification()])
}

const initialState: InAppNotificationStore = {
  notification: null,
}

export function inAppNotificationReducer(
  state: InAppNotificationStore = initialState,
  action: InAppNotificationActions
) {
  switch (action.type) {
    case SHOW_IN_APP_NOTIFICATION:
      return {
        ...state,
        notification: action.notification,
      }
    case CLEAR_IN_APP_NOTIFICATION:
      return {
        ...state,
        notification: null,
      }
    default:
      return state
  }
}
