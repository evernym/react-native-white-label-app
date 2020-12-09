// @flow

import type { ReactNavigation } from '../common/type-common'
import type { DeepLinkStore } from '../deep-link/type-deep-link'
import type { ConnectionHistoryData } from '../connection-history/type-connection-history'
import type { SMSPendingInvitationStore } from '../sms-pending-invitation/type-sms-pending-invitation'
import type { LockStore, PendingRedirection } from '../lock/type-lock'
import type { EulaStore } from '../eula/type-eula'
import type { Connection } from '../store/type-connection-store'

export type SplashScreenProps = {
  historyData: ConnectionHistoryData,
  eula: EulaStore,
  isInitialized: boolean,
  deepLink: DeepLinkStore,
  smsPendingInvitation: SMSPendingInvitationStore,
  lock: LockStore,
  getAllDid: { [publicDID: string]: Connection },
  getAllPublicDid: { [publicDID: string]: Connection },
  getSmsPendingInvitation: (token: string) => void,
  addPendingRedirection: (
    pendingRedirection: Array<?PendingRedirection>
  ) => void,
  safeToDownloadSmsInvitation: () => void,
  deepLinkProcessed: (data: string) => void,
} & ReactNavigation
