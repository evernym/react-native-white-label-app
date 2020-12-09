// @flow

import type { Element } from 'react'
import type {
  NavigationStackProp,
  NavigationRoute as _NavigationRoute,
  NavigationState as _NavigationState,
  NavigationLeafRoute as _NavigationLeafRoute,
} from '@react-navigation/native'

export type CustomError = {
  code: string,
  message: string,
  // some of the time we can display different error to user
  // than what we got in error message
  // because error message can contain some exception as well
  // which we don't want to show to user
  displayMessage?: string,
  // Each error can also have a type which tells if we retry the action
  // that this error can be resolved by retry
  // For example: if server returned any error above 500
  // then we can retry with exponential backoff, and server might respond
  // with success
  // However, if server responds with 4XX, then the problem was on client
  // and it might not be possible to repeat the same action because
  // ConnectMe will create request second time as well
  // Or there might be some error that are related to signing or encryption
  // which even if we retry won't be resolved
  isResolvableByRetry?: boolean,
}
export const GENERIC_ERROR_MESSAGE = 'Error occurred'

export const INITIAL_TEST_ACTION = 'INITIAL_TEST_ACTION'
export type InitialTestAction = {
  type: typeof INITIAL_TEST_ACTION,
}
export const initialTestAction = () => ({
  type: INITIAL_TEST_ACTION,
})

export type NavigationParams = {
  [string]: any,
}

export type NavigationRoute = _NavigationRoute
export type NavigationState = _NavigationState
export type NavigationLeafRoute = _NavigationLeafRoute

export type ReactNavigation = {
  navigation: NavigationStackProp<NavigationRoute>,
  route: NavigationRoute,
}

export type GenericObject = {
  [string]: any,
}

export type GenericStringObject = {
  [string]: string,
}

export type MessageAnnotation = {
  name: string,
  version: string,
}

export type TopicAnnotation = {
  tid: number,
  mid: number,
}

export type ReactChildren = Element<*>

export const RESET: 'RESET' = 'RESET'
export const REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS: 'REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS' =
  'REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS'

export type ResetAction = {
  type: typeof RESET,
}

export type ImageSource = {
  uri: string,
}

export type NotificationPayload = {
  forDID: string,
  uid: string,
  type: string,
  remotePairwiseDID: string,
  senderLogoUrl?: ?string,
  pushNotifMsgText?: ?string,
  pushNotifMsgTitle?: ?string,
  msg?: ?string,
}

export type ImmutableGenericStringObject = {
  +[string]: string,
}

export const STORE_STATUS = {
  IDLE: 'IDLE',
  IN_PROGRESS: 'IN_PROGRESS',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
}

export type StoreError = { +error: ?CustomError }
export type StoreStatus = { +status: $Keys<typeof STORE_STATUS> }

export type StatusBarStyle = 'default' | 'light-content' | 'dark-content'

export const ERROR_VCX_INIT_FAIL = (message: ?string) => ({
  code: 'CM-001',
  message: `VCX_INIT Failed ${message || ''}`,
})

export const STORAGE_STATUS = {
  IDLE: 'IDLE',
  RESTORE_START: 'RESTORE_START',
  RESTORE_SUCCESS: 'RESTORE_SUCCESS',
  RESTORE_FAIL: 'RESTORE_FAIL',
  PERSIST_START: 'PERSIST_START',
  PERSIST_FAIL: 'PERSIST_FAIL',
  PERSIST_SUCCESS: 'PERSIST_SUCCESS',
}
export type StorageStatus = $Keys<typeof STORAGE_STATUS>

export type ComponentStatus = {
  error: boolean,
  success: boolean,
  loading: boolean,
  idle: boolean,
}

export type Styles =
  | number
  | Array<GenericObject | number>
  | GenericObject
  | Object

export type RequestedAttrsJson = {
  +[string]: [string, boolean, MatchingCredential],
}

export type AttributeNames = {
  +[string]: string
}

export type MatchingCredential = {
  cred_info: {
    referent: string,
    attrs: { [claimAttributeName: string]: string },
    schema_id: string,
    cred_def_id: string,
    rev_reg_id?: string,
    cred_rev_id?: string,
  },
  interval?: {
    to?: number,
    from?: number,
  },
}

export type Dispatch = (action: { type: string }) => any

export type ReduxConnect = {
  dispatch: Dispatch,
}

export const ID = '@id'
export const TYPE = '@type'
