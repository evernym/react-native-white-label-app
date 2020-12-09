// @flow

import delay from '@redux-saga/delay-p'

import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import {
  inAppNotificationReducer,
  scheduleClearInAppNotificationSaga,
} from '../in-app-notification-store'
import { initialTestAction } from '../../common/type-common'
import {
  showInAppNotification,
  clearInAppNotification,
  scheduleClearInAppNotification,
} from '../in-app-notification-actions'
import { inAppNotificationMockData } from '../../../__mocks__/data/in-app-notification-mock-data'

describe('in-app-notification-store: actions', () => {
  it('should add notification to show', () => {
    const initialState = inAppNotificationReducer(
      undefined,
      initialTestAction()
    )
    expect(
      inAppNotificationReducer(
        initialState,
        showInAppNotification(inAppNotificationMockData.notification)
      )
    ).toMatchSnapshot()
  })

  it('should clear notification', () => {
    const initialState = inAppNotificationReducer(
      undefined,
      initialTestAction()
    )
    const stateAfterNotification = inAppNotificationReducer(
      initialState,
      showInAppNotification(inAppNotificationMockData.notification)
    )
    expect(
      inAppNotificationReducer(stateAfterNotification, clearInAppNotification())
    )
  })
})

describe('in-app-notification-store:sagas', () => {
  it('saga: scheduleClearInAppNotificationSaga', () => {
    return expectSaga(
      scheduleClearInAppNotificationSaga,
      scheduleClearInAppNotification()
    )
      .provide([[matchers.call.fn(delay), null]])
      .put(clearInAppNotification())
      .run()
  })
})
