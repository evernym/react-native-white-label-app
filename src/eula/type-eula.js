// @flow
import { Platform } from 'react-native'
import { androidEulaLocal, androidEulaUrl, iosEulaLocal, iosEulaUrl } from '../external-imports'

const isAndroid = Platform.OS === 'android'
export const EULA_ACCEPT = 'EULA_ACCEPT'
export const SHARE_EULA = 'SHARE_EULA'
export const EULA_URL = isAndroid ? androidEulaUrl : iosEulaUrl
export const localEulaSource = isAndroid ? androidEulaLocal : iosEulaLocal
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

export type ShareEula = {
  type: typeof SHARE_EULA,
  uri: string,
}

export type HydrateEulaAcceptAction = {
  type: typeof HYDRATE_EULA_ACCEPT,
  isEulaAccept: boolean,
}

export const title = 'END USER LICENSE AGREEMENT'
