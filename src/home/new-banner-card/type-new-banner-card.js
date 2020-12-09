// @flow
import { removeEvent } from '../../connection-history/connection-history-store'

export type NewBannerCardProps = {
  navigation: Object,
  navigationRoute: string,
  timestamp: string,
  logoUrl: string,
  uid: string,
  issuerName: string,
  removeEvent: typeof removeEvent,
}
