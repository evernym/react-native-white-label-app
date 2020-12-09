// @flow

import type {
  InitialTestAction,
  ReactNavigation,
  ReduxConnect,
} from '../common/type-common'
import { MESSAGE_TYPE } from '../api/api-constants'

export type InAppNotification = {
  senderName: string,
  senderImage: ?string,
  senderDID: string,
  identifier: string,
  text: string,
  messageType:
    | typeof MESSAGE_TYPE.CLAIM_OFFER
    | typeof MESSAGE_TYPE.PROOF_REQUEST
    | typeof MESSAGE_TYPE.QUESTION,
  messageId: string,
}

export type InAppNotificationStore = {
  notification: ?InAppNotification,
}

export const SHOW_IN_APP_NOTIFICATION: 'SHOW_IN_APP_NOTIFICATION' =
  'SHOW_IN_APP_NOTIFICATION'
export type ShowInAppNotificationAction = {
  type: typeof SHOW_IN_APP_NOTIFICATION,
  notification: InAppNotification,
}

export const CLEAR_IN_APP_NOTIFICATION: 'CLEAR_IN_APP_NOTIFICATION' =
  'CLEAR_IN_APP_NOTIFICATION'
export type ClearInAppNotificationAction = {
  type: typeof CLEAR_IN_APP_NOTIFICATION,
}

export const SCHEDULE_CLEAR_IN_APP_NOTIFICATION =
  'SCHEDULE_CLEAR_IN_APP_NOTIFICATION'
export type ScheduleClearInAppNotificationAction = {
  type: typeof SCHEDULE_CLEAR_IN_APP_NOTIFICATION,
}

export type InAppNotificationActions =
  | ShowInAppNotificationAction
  | ClearInAppNotificationAction
  | ScheduleClearInAppNotificationAction
  | InitialTestAction

export type NotificationCardProps = {
  notification: InAppNotification,
} & ReactNavigation &
  ReduxConnect
