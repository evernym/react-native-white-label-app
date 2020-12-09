// @flow

import type {
  InAppNotification,
  ShowInAppNotificationAction,
  ClearInAppNotificationAction,
  ScheduleClearInAppNotificationAction,
} from './in-app-notification-type'

import {
  SHOW_IN_APP_NOTIFICATION,
  CLEAR_IN_APP_NOTIFICATION,
  SCHEDULE_CLEAR_IN_APP_NOTIFICATION,
} from './in-app-notification-type'

export const showInAppNotification = (
  notification: InAppNotification
): ShowInAppNotificationAction => ({
  type: SHOW_IN_APP_NOTIFICATION,
  notification,
})

export const clearInAppNotification = (): ClearInAppNotificationAction => ({
  type: CLEAR_IN_APP_NOTIFICATION,
})

export const scheduleClearInAppNotification = (): ScheduleClearInAppNotificationAction => ({
  type: SCHEDULE_CLEAR_IN_APP_NOTIFICATION,
})
