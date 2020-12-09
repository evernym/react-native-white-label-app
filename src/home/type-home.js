// @flow
import type { ReactNavigation } from '../common/type-common'
import type { MessageDownloadStatus } from '../store/type-config-store'

export type HomeProps = {
  sendConnectionReuse: Function,
  sendConnectionRedirect: Function,
  environmentName: string,
  newBannerConnections: Array<Object>,
  recentConnections: Array<Object>,
  hasNoConnection: boolean,
  mappedDidToLogoAndName: Object,
  getUnacknowledgedMessages: () => void,
  messageDownloadStatus: MessageDownloadStatus,
  snackError: ?string,
} & ReactNavigation
