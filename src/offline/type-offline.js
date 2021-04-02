// @flow
import { vcxInitPoolStart, vcxInitStart } from '../store/route-store'
import { getUnacknowledgedMessages } from '../store/config-store'

export const OFFLINE_STATUS = 'OFFLINE_STATUS'

export type OfflineStore = {
  offline: boolean,
}

export type OfflineActions = OfflineStatus

export type OfflineStatus = {
  type: typeof OFFLINE_STATUS,
  offline: boolean,
}

export type OfflineProps = {
  overlay?: boolean,
  offline: (offline: boolean) => void,
  render?: (isConnected: ?boolean) => any,
  vcxInitPoolStart: typeof vcxInitPoolStart,
  vcxInitStart: typeof vcxInitStart,
  getUnacknowledgedMessages: typeof getUnacknowledgedMessages,
}
