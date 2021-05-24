// @flow
import type { ReactNavigation } from '../common/type-common'
import type { PendingRedirection } from '../lock/type-lock'

export type SettingsProps = {
  touchIdActive: boolean,
  currentScreen: string,
  timeStamp: number,
  walletBackup: {
    status: string,
    encryptionKey: string,
  },
  walletBalance: string,
  lastSuccessfulBackup: string,
  lastSuccessfulCloudBackup?: string,
  cloudBackupStatus?: string,
  autoCloudBackupEnabled?: boolean,
  connectionsUpdated?: boolean,
  isAutoBackupEnabled?: boolean,
  hasVerifiedRecoveryPhrase?: boolean,
  cloudBackupError?: string | null,
  hasViewedWalletError?: boolean,
  isCloudBackupEnabled: false,
  selectUserAvatar: () => void,
  setAutoCloudBackupEnabled: (switchState: boolean) => any,
  generateRecoveryPhrase: () => any | null,
  addPendingRedirection: (
    pendingRedirection: Array<?PendingRedirection>
  ) => void | null,
  connectionHistoryBackedUp: () => any,
  cloudBackupFailure: (error: string | null) => void,
  cloudBackupStart: () => void,
  viewedWalletError: (error: boolean) => void,
  biometricsSwitchOn: () => void,
  biometricsSwitchOff: () => void,
  aboutButtonInSetting: () => void,
  giveAppFeedbackButtonInSetting: () => void,
  disableTouchIdAction: () => void,
  enableTouchIdAction: () => void,
} & ReactNavigation

export type SettingsState = {
  walletBackupModalVisible: boolean,
  disableTouchIdSwitch: boolean,
}
