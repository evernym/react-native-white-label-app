// @flow
import type { ReactNavigation } from '../common/type-common'
import type { MessageDownloadStatus } from '../store/type-config-store'

export type HomeProps = {
  newBannerConnections: Array<Object>,
  recentConnections: Array<Object>,
  hasNoConnection: boolean,
  mappedDidToLogoAndName: Object,
  getUnacknowledgedMessages: () => void,
  messageDownloadStatus: MessageDownloadStatus,
  openingSideMenu: () => void,
  closingSideMenu: () => void,
} & ReactNavigation
