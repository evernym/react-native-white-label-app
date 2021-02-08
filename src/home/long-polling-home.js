// @flow

import { all, put, race, select, take, call } from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import { homeDrawerRoute, homeRoute } from '../common'
import { getUnacknowledgedMessages } from '../store/config-store'
import { ROUTE_UPDATE } from '../store/route-store'
import { getCurrentScreen } from '../store/store-selector'
import {
  GET_MESSAGES_FAIL,
  GET_MESSAGES_LOADING,
  GET_MESSAGES_SUCCESS,
} from '../store/type-config-store'

function* longPollHome(): any {
  while (true) {
    const currentRoute: string = yield select(getCurrentScreen)
    if (!homeRoutes.includes(currentRoute)) {
      // if we are not on home route, then wait for user to go to home route
      yield take(isHomeRoute)
      // as soon as we are on home screen, we need to start downloading messages
      yield put(getUnacknowledgedMessages())
    }

    // now since we are on home route, we need to start a race
    // among 15 seconds or user navigating to another screen
    // or GET_MESSAGE_LOADING or GET_MESSAGE_SUCCESS
    // We are starting a race here because if before 15 seconds
    // we receive a push notification, or user pull-refresh
    // or user goes to some other screen, then we need to reset timer
    // and we need to wait for user to come back to home screen
    // so essentially starting this loop from start again
    const [timeToRefresh] = yield race([
      call(delay, 15000),
      take(GET_MESSAGES_LOADING),
      take(GET_MESSAGES_SUCCESS),
      take(GET_MESSAGES_FAIL),
      take(isNotHomeRoute),
    ])

    if (timeToRefresh) {
      console.log('refresh after 15 seconds')
      // if 15 seconds are done, then start downloading messages
      yield put(getUnacknowledgedMessages())
      // put to sleep for few seconds because we are triggering message download
      // we don't want to put too much load on CAS
      yield call(delay, 15000)
    }
  }
}

function isHomeRoute(action: *) {
  return (
    action.type === ROUTE_UPDATE && homeRoutes.includes(action.currentScreen)
  )
}

function isNotHomeRoute(action: *) {
  return (
    action.type === ROUTE_UPDATE && !homeRoutes.includes(action.currentScreen)
  )
}

const homeRoutes = [homeRoute, homeDrawerRoute]

export function* watchLongPollingHome(): any {
  yield all([longPollHome()])
}
