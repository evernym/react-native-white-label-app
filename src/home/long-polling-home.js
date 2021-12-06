// @flow

import { all, put, race, take, call, takeLatest } from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import { AppState } from 'react-native'
import { eventChannel } from 'redux-saga'

import { getUnacknowledgedMessages } from '../store/config-store'
import {
  GET_MESSAGES_FAIL,
  GET_MESSAGES_LOADING,
  GET_MESSAGES_SUCCESS,
} from '../store/type-config-store'
import { pollingIntervals } from '../external-imports'
import {
  CONNECTION_REQUEST_SENT,
  NEW_CONNECTION_SUCCESS,
} from '../store/type-connection-store'
import { SEND_CLAIM_REQUEST_SUCCESS } from '../claim-offer/type-claim-offer'
import { UPDATE_QUESTION_ANSWER } from '../question/type-question'
import { PROOF_SUCCESS } from '../proof/type-proof'

function* poll(interval: number): any {
  while (true) {
    yield* ensureAppActive()

    // we need to start a race
    // among interval seconds or message download statues
    // We are starting a race here because if before interval seconds
    // we receive a push notification, or user pull-refresh
    // or user goes to some other screen, then we need to reset timer
    // so essentially starting this while loop from start again
    const [timeToRefresh] = yield race([
      call(delay, interval),
      take([GET_MESSAGES_LOADING, GET_MESSAGES_SUCCESS, GET_MESSAGES_FAIL]),
    ])

    if (timeToRefresh) {
      console.log(`refresh after ${interval} seconds`)
      // if interval seconds are done, then start downloading messages
      yield put(getUnacknowledgedMessages())
    }
  }
}

function* ensureAppActive(): any {
  if (AppState.currentState !== 'active') {
    // if app is not in foreground
    // then wait for app to come to foreground
    // we don't want to keep polling even if app is in background
    const appStateChannel = yield call(appStateSource)
    while (true) {
      const state: string = yield take(appStateChannel)
      if (state === 'active') {
        // close channel, as we are not interested anymore to listen
        // for state changes, since state has become 'active'
        appStateChannel.close()
        break
      }
    }
  }
}

function appStateSource() {
  let currentState = AppState.currentState || 'background'

  return eventChannel((emitter) => {
    const _stateChangeListener = (nextAppState) => {
      if (
        currentState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        emitter(nextAppState)
      }
      currentState = nextAppState
    }
    AppState.addEventListener('change', _stateChangeListener)

    // return an unsubscribe function
    return () => {
      // remove listeners
      AppState.removeEventListener('change', _stateChangeListener)
    }
  })
}

function* startPolling(): any {
  while (true) {
    // first, we want to run polling with `pollingIntervals.short` interval for 60 seconds
    yield race([call(delay, 60000), call(poll, pollingIntervals.short)])

    // we will exit above call after 60 seconds, because pollWithInterval function
    // never returns, and hence race will end it's execution after 60 seconds delay is done

    // now, we want to run polling with `pollingIntervals.medium` seconds interval for 2 minutes
    yield race([call(delay, 120000), call(poll, pollingIntervals.medium)])

    // We are already running a long polling with 15 seconds, so here we can minimize the load
    // on CAS by using `pollingIntervals.long * 2` seconds interval
    yield* poll(pollingIntervals.long * 2)
  }
}

function* frequentPolling(): any {
  // We are using takeLatest because we want to start polling again at 2 seconds interval
  // if we would use takeLeading, then if saga were on 15 seconds interval,
  // then it will keep on going for 15 seconds,
  // but we want to stop previous timers and saga, and run a new one
  yield takeLatest(
    [
      NEW_CONNECTION_SUCCESS,
      CONNECTION_REQUEST_SENT,
      UPDATE_QUESTION_ANSWER,
      SEND_CLAIM_REQUEST_SUCCESS,
      PROOF_SUCCESS,
    ],
    startPolling
  )
}

function* longPolling(): any {
  // this polling will run in the background even if user does not do anything
  yield* ensureAppActive()
  yield* poll(pollingIntervals.long)
}

export function* watchLongPollingHome(): any {
  yield all([frequentPolling(), longPolling()])
}
