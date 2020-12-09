// @flow
import type { CustomError } from '../common/type-common'
import { Platform } from 'react-native'

import {
  ANDROID_EULA_LOCAL,
  ANDROID_EULA_URL,
  IOS_EULA_LOCAL,
  IOS_EULA_URL,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../../../../app/evernym-sdk/eula'

const isAndroid = Platform.OS === 'android'
export const EULA_ACCEPT = 'EULA_ACCEPT'
export const EULA_URL = isAndroid ? ANDROID_EULA_URL : IOS_EULA_URL
export const localEulaSource = isAndroid ? ANDROID_EULA_LOCAL : IOS_EULA_LOCAL
export const STORAGE_KEY_EULA_ACCEPTANCE = 'STORAGE_KEY_EULA_ACCEPTANCE'
export const HYDRATE_EULA_ACCEPT = 'HYDRATE_EULA_ACCEPT'

export type EulaStore = {
  isEulaAccept: boolean,
}

export type EulaActions = EulaAccept | HydrateEulaAcceptAction

export type EulaAccept = {
  type: typeof EULA_ACCEPT,
  isEulaAccept: boolean,
}

export type HydrateEulaAcceptAction = {
  type: typeof HYDRATE_EULA_ACCEPT,
  isEulaAccept: boolean,
}

export type EulaScreenState = {
  error: null | CustomError,
}
