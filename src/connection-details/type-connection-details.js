// @flow

import type {
  NavigationScreenProp,
  NavigationLeafRoute,
} from '@react-navigation/native'
import type { ReactNavigation, } from '../common/type-common'
import type { InvitationPayload, } from '../invitation/type-invitation'
import type { NotificationOpenOptions, } from '../push-notification/type-push-notification'

import { sendConnectionRedirect } from '../store/connections-store'
import { sendConnectionReuse } from '../store/connections-store'
import type { ConnectionHistoryEvent } from '../connection-history/type-connection-history'
import type { ClaimMap } from '../claim/type-claim'

export const BLANK_ATTRIBUTE_DATA_TEXT = 'n/a'
export const DISSATISFIED_ATTRIBUTE_DATA_TEXT = 'Not found'
export const MISSING_ATTRIBUTE_DATA_TEXT = 'Missing - Tap to fix'

export type ConnectionHistoryState = {
  newMessageLine?: boolean,
}

export type ConnectionHistoryNavigation = {
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  route: {
    params: {|
      showExistingConnectionSnack: boolean,
      senderName: string,
      image: string,
      senderDID: string,
      identifier: string,
      qrCodeInvitationPayload: InvitationPayload,
      messageType: ?string,
      notificationOpenOptions: ?NotificationOpenOptions,
      uid: ?string,
    |},
  },
}

export type ConnectionHistoryProps = {
  claimMap: ?ClaimMap,
  activeConnectionThemePrimary: string,
  activeConnectionThemeSecondary: string,
  connectionHistory: ConnectionHistoryEvent[],
  sendConnectionRedirect: typeof sendConnectionRedirect,
  sendConnectionReuse: typeof sendConnectionReuse,
  newConnectionSeen: Function,
  updateStatusBarTheme: (color?: string) => void,
  deleteConnectionAction: (senderDID: string) => void,
  goToUIScreen: (
    string,
    string,
    $PropertyType<ReactNavigation, 'navigation'>
  ) => void,
} & ConnectionHistoryNavigation
