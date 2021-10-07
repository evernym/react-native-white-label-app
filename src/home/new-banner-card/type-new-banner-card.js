// @flow
import { removeEvent } from '../../connection-history/connection-history-store'
import type { ConnectionHistoryEvent } from '../../connection-history/type-connection-history'

export type NewBannerCardProps = {
  navigation: Object,
  navigationRoute: string,
  timestamp: string,
  logoUrl: string,
  uid: string,
  issuerName: string,
  removeEvent: typeof removeEvent,
  event: ConnectionHistoryEvent,
}
