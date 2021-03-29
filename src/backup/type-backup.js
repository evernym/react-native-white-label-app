// @flow
import type { ReactNavigation } from '../common/type-common'
import type { CustomError } from '../common/type-common'
import type { RestoreStore, SaveToAppDirectory } from '../restore/type-restore'
import { appName } from '../external-imports'

export type ReactNavigationBackup = {
  navigation: {
    setParams: any,
    navigate: (route: string, params?: any) => void,
    goBack: (route?: ?string) => void,
  },
  route: {
    params: {
      recoveryPassphrase?: string,
      initialRoute: string,
      hideBtn?: boolean,
      viewOnlyMode?: boolean,
      navigateBack: () => void,
    },
  },
  hydrateCloudBackup: (lastSuccessfulCloudBackup: string) => any,
}

export type SelectRecoveryMethodProps = {
  hasVerifiedRecoveryPhrase: () => any,
  generateBackupFile: () => void,
} & ReactNavigationBackup

export type GenerateRecoveryPhraseProps = {
  generateRecoveryPhrase: () => void,
  recoveryPassphrase: Passphrase,
  recoveryStatus: $Keys<typeof BACKUP_STORE_STATUS>,
} & ReactNavigationBackup

export type GenerateRecoveryPhraseState = {
  chatBubbleDimensions: ChatBubbleDimensions,
}

export type ChatBubbleDimensions = {
  +width: number,
  +height: number,
  +x: number,
  +y: number,
}

export type PassphraseTextProps = {
  recoveryPassphrase: Passphrase,
  chatBubbleDimensions: ChatBubbleDimensions,
}

export type PassphraseErrorProps = {
  chatBubbleDimensions: ChatBubbleDimensions,
}

export type VerifyRecoveryPhraseProps = {
  recoveryPassphrase: Passphrase,
  submitPassphrase: (string) => void,
  resetError: () => void,
  status: string,
  restoreStatus: (string) => void,
  error: boolean,
  isCloudBackupEnabled: false,
  hasVerifiedRecoveryPhrase: () => any,
  generateBackupFile: () => void,
} & ReactNavigationBackup

export type VerifyRecoveryPhraseState = {
  error: boolean,
}

export type ExportBackupFileProps = {
  backupPath: string,
  backupStatus: string,
  exportBackup: () => void,
} & ReactNavigationBackup

export type BackupErrorProps = {
  updateStatusBarTheme: (string) => void,
  generateBackupFile: () => void,
} & ReactNavigationBackup

export type ExportBackupFileState = {
  submitButtonText: string,
}

export type BackupCompleteProps = {} & ReactNavigationBackup

export type BackupCompleteState = {
  submitButtonText: string,
  recoveryPassphrase: string,
}

export type CloudBackupScreenProps = {
  resetCloudBackupStatus: () => ResetCloudBackupStatusAction,
  setAutoCloudBackupEnabled: (
    autoCloudBackupEnabled: boolean
  ) => SetAutoCloudBackupEnabledAction,
  cloudBackupStatus: () => string,
  cloudBackupStart: () => any,
  restore: RestoreStore,
  route: string,
  saveFileToAppDirectory: (SaveToAppDirectory) => void,
  updateStatusBarTheme: (string) => void,
  error: string,
  message: string,
  connectionHistoryBackedUp: () => void,
  isAutoBackupEnabled?: boolean,
  isCloudBackupEnabled: false,
} & ReactNavigation

export const PREPARE_BACK_IDLE = 'PREPARE_BACKUP_IDLE'
export const PREPARE_BACKUP_LOADING = 'PREPARE_BACKUP_LOADING'
export const PREPARE_BACKUP_SUCCESS = 'PREPARE_BACKUP_SUCCESS'
export const PREPARE_BACKUP_FAILURE = 'PREPARE_BACKUP_FAILURE'

export const BACKUP_STORE_STATUS = {
  IDLE: 'IDLE',
  GENERATE_PHRASE_LOADING: 'GENERATE_PHRASE_LOADING',
  GENERATE_PHRASE_SUCCESS: 'GENERATE_PHRASE_SUCCESS',
  GENERATE_PHRASE_FAILURE: 'GENERATE_PHRASE_FAILURE',
  GENERATE_BACKUP_FILE_LOADING: 'GENERATE_BACKUP_FILE_LOADING',
  GENERATE_BACKUP_FILE_SUCCESS: 'GENERATE_BACKUP_FILE_SUCCESS',
  GENERATE_BACKUP_FILE_FAILURE: 'GENERATE_BACKUP_FILE_FAILURE',
  PREPARE_BACKUP_LOADING,
  PREPARE_BACKUP_SUCCESS,
  PREPARE_BACKUP_FAILURE,
  PREPARE_BACK_IDLE,
  EXPORT_BACKUP_LOADING: 'EXPORT_BACKUP_LOADING',
  EXPORT_BACKUP_SUCCESS: 'EXPORT_BACKUP_SUCCESS',
  EXPORT_BACKUP_FAILURE: 'EXPORT_BACKUP_FAILURE',
  EXPORT_BACKUP_NO_SHARE: 'EXPORT_BACKUP_NO_SHARE',
  BACKUP_COMPLETE: 'BACKUP_COMPLETE',

  // JY
  CLOUD_BACKUP_IDLE: 'CLOUD_BACKUP_IDLE',
  CLOUD_BACKUP_START: 'CLOUD_BACKUP_START',
  CLOUD_BACKUP_LOADING: 'CLOUD_BACKUP_LOADING',
  CLOUD_BACKUP_WAITING: 'CLOUD_BACKUP_WAITING',
  CLOUD_BACKUP_SUCCESS: 'CLOUD_BACKUP_SUCCESS',
  CLOUD_BACKUP_FAILURE: 'CLOUD_BACKUP_FAILURE',
  CLOUD_BACKUP_NO_SHARE: 'CLOUD_BACKUP_NO_SHARE',
  CLOUD_BACKUP_COMPLETE: 'CLOUD_BACKUP_COMPLETE',
}

export type Passphrase = {
  phrase: string,
  salt: string,
  hash: string,
}

export type PrepareBackupStatus =
  | typeof PREPARE_BACK_IDLE
  | typeof PREPARE_BACKUP_LOADING
  | typeof PREPARE_BACKUP_SUCCESS
  | typeof PREPARE_BACKUP_FAILURE

export type BackupStore = {
  autoCloudBackupEnabled?: boolean,
  cloudBackupError?: any,
  cloudBackupStatus?: string,
  cloudBackupPending: boolean,
  prepareCloudBackupStatus?: string,
  lastSuccessfulCloudBackup: string,
  walletHandle?: number,
  passphrase: Passphrase,
  backupWalletPath: string,
  showBanner: boolean,
  lastSuccessfulBackup: string,
  error: any,
  status: string,
  prepareBackupStatus: PrepareBackupStatus,
  encryptedFileLocation?: string,
  hasVerifiedRecoveryPhrase?: boolean,
  hasViewedWalletError?: boolean,
}

export type StoreError = { error: ?CustomError }
export type BackupStoreStatus = { status: $Keys<typeof BACKUP_STORE_STATUS> }

export const ERROR_EXPORT_BACKUP = {
  code: 'WB-001',
  message: 'Error while exporting backup file',
}

export const ERROR_GENERATE_BACKUP_FILE = {
  code: 'WB-002',
  message: 'Error while generating backup file',
}

export const ERROR_GENERATE_RECOVERY_PHRASE = {
  code: 'WB-003',
  message: 'Error while generating recovery phrase',
}

export const ERROR_HYDRATING_BACKUP = {
  code: 'WB-004',
  message: 'Error hydrating backup',
}

export const START_BACKUP = 'START_BACKUP'
export const GENERATE_BACKUP_FILE_LOADING = 'GENERATE_BACKUP_FILE_LOADING'
export const GENERATE_BACKUP_FILE_SUCCESS = 'GENERATE_BACKUP_FILE_SUCCESS'
export const GENERATE_BACKUP_FILE_FAILURE = 'GENERATE_BACKUP_FILE_FAILURE'
export const RESET_BACKUP_PATH = 'RESET_BACKUP_PATH'
export const BACKUP_WALLET_FAIL = 'BACKUP_WALLET_FAIL'
export const GENERATE_RECOVERY_PHRASE_LOADING =
  'GENERATE_RECOVERY_PHRASE_LOADING'
export const GENERATE_RECOVERY_PHRASE_SUCCESS =
  'GENERATE_RECOVERY_PHRASE_SUCCESS'
export const GENERATE_RECOVERY_PHRASE_FAILURE =
  'GENERATE_RECOVERY_PHRASE_FAILURE'
export const EXPORT_BACKUP_LOADING = 'EXPORT_BACKUP_LOADING'
export const EXPORT_BACKUP_SUCCESS = 'EXPORT_BACKUP_SUCCESS'
export const EXPORT_BACKUP_FAILURE = 'EXPORT_BACKUP_FAILURE'
export const EXPORT_BACKUP_NO_SHARE = 'EXPORT_BACKUP_NO_SHARE'
export const BACKUP_COMPLETE = 'BACKUP_COMPLETE'
export const HYDRATE_BACKUP = 'HYDRATE_BACKUP'
export const HYDRATE_CLOUD_BACKUP = 'HYDRATE_CLOUD_BACKUP'
export const HAS_VERIFIED_RECOVERY_PHRASE = 'HAS_VERIFIED_RECOVERY_PHRASE'

export const HYDRATE_AUTO_CLOUD_BACKUP_ENABLED =
  'HYDRATE_AUTO_CLOUD_BACKUP_ENABLED'
export const HYDRATE_HAS_VERIFIED_RECOVERY_PHRASE =
  'HYDRATE_HAS_VERIFIED_RECOVERY_PHRASE'

export const HYDRATE_BACKUP_FAILURE = 'HYDRATE_BACKUP_FAILURE'
export const PROMPT_WALLET_BACKUP_BANNER = 'PROMPT_WALLET_BACKUP_BANNER'
export const WALLET_FILE_NAME = appName

// JY
export const CLOUD_BACKUP_IDLE = 'CLOUD_BACKUP_IDLE'
export const CLOUD_BACKUP_START = 'CLOUD_BACKUP_START'
export const RESET_CLOUD_BACKUP_LOADING = 'RESET_CLOUD_BACKUP_LOADING'
export const CLOUD_BACKUP_LOADING = 'CLOUD_BACKUP_LOADING'
export const CLOUD_BACKUP_WAITING = 'CLOUD_BACKUP_WAITING'
export const CLOUD_BACKUP_SUCCESS = 'CLOUD_BACKUP_SUCCESS'
export const CLOUD_BACKUP_FAILURE = 'CLOUD_BACKUP_FAILURE'
export const WALLET_BACKUP_FAILURE = 'WALLET_BACKUP_FAILURE'
export const WALLET_BACKUP_FAILURE_VIEWED = 'WALLET_BACKUP_FAILURE_VIEWED'
export const CLOUD_BACKUP_NO_SHARE = 'CLOUD_BACKUP_NO_SHARE'
export const CLOUD_BACKUP_COMPLETE = 'CLOUD_BACKUP_COMPLETE'
export const SET_CLOUD_BACKUP_PENDING = 'SET_CLOUD_BACKUP_PENDING'
export const SET_AUTO_CLOUD_BACKUP_ENABLED = 'SET_AUTO_CLOUD_BACKUP_ENABLED'
export const SET_WALLET_HANDLE = 'SET_WALLET_HANDLE'
export const VIEWED_WALLET_ERROR = 'VIEWED_WALLET_ERROR'

export const AUTO_CLOUD_BACKUP_ENABLED = 'autoCloudBackupEnabled' //for asyncstorage
export const START_AUTOMATIC_CLOUD_BACKUP = 'START_AUTOMATIC_CLOUD_BACKUP'

export type NavigateBackToSettingsType = {
  navigateBackToSettings: () => void,
}

export type BackupStartAction = {
  type: typeof START_BACKUP,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  error: CustomError,
}

export type GenerateBackupFileLoadingAction = {
  type: typeof GENERATE_BACKUP_FILE_LOADING,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type GenerateBackupFileSuccessAction = {
  type: typeof GENERATE_BACKUP_FILE_SUCCESS,
  backupWalletPath: string,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type GenerateBackupFileFailureAction = {
  type: typeof GENERATE_BACKUP_FILE_FAILURE,
  error: CustomError,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type BackupWalletFailAction = {
  type: typeof BACKUP_WALLET_FAIL,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  error: CustomError,
}

export type GenerateRecoveryPhraseLoadingAction = {
  type: typeof GENERATE_RECOVERY_PHRASE_LOADING,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type GenerateRecoveryPhraseSuccessAction = {
  type: typeof GENERATE_RECOVERY_PHRASE_SUCCESS,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  passphrase: Passphrase,
  error: CustomError,
}

export type GenerateRecoveryPhraseFailureAction = {
  type: typeof GENERATE_RECOVERY_PHRASE_FAILURE,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  error: CustomError,
}

export type ExportBackupLoadingAction = {
  type: typeof EXPORT_BACKUP_LOADING,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  backupWalletPath: string,
}

export type PrepareBackupLoadingAction = {
  type: typeof PREPARE_BACKUP_LOADING,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type ExportBackupNoShareAction = {
  type: typeof EXPORT_BACKUP_NO_SHARE,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type ExportBackupSuccessAction = {
  type: typeof EXPORT_BACKUP_SUCCESS,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  lastSuccessfulBackup: string,
}

export type ExportBackupFailureAction = {
  type: typeof EXPORT_BACKUP_FAILURE,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  error: CustomError,
}

export type BackupCompleteAction = {
  type: typeof BACKUP_COMPLETE,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type HydrateBackupAction = {
  type: typeof HYDRATE_BACKUP,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
  lastSuccessfulBackup: string,
}

export type HydrateBackupFailAction = {
  type: typeof HYDRATE_BACKUP_FAILURE,
  error: CustomError,
}

export type PromptBackupBannerAction = {
  type: typeof PROMPT_WALLET_BACKUP_BANNER,
  showBanner: boolean,
}

export type PrepareBackupSuccessAction = {
  type: typeof PREPARE_BACKUP_SUCCESS,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type PrepareBackupFailureAction = {
  type: typeof PREPARE_BACKUP_FAILURE,
  status: $Keys<typeof BACKUP_STORE_STATUS>,
}

export type ResetCloudBackupStatusAction = {
  type: typeof RESET_CLOUD_BACKUP_LOADING,
  cloudBackupStatus: string,
  error: any,
}

export type SetAutoCloudBackupEnabledAction = {
  type: typeof SET_AUTO_CLOUD_BACKUP_ENABLED,
  autoCloudBackupEnabled: boolean,
}

export type BackupStoreAction =
  | BackupStartAction
  | GenerateBackupFileLoadingAction
  | GenerateBackupFileSuccessAction
  | BackupWalletFailAction
  | GenerateRecoveryPhraseLoadingAction
  | GenerateRecoveryPhraseSuccessAction
  | GenerateBackupFileFailureAction
  | PrepareBackupLoadingAction
  | ExportBackupLoadingAction
  | ExportBackupSuccessAction
  | ExportBackupFailureAction
  | ExportBackupNoShareAction
  | BackupCompleteAction
  | HydrateBackupAction
  | HydrateBackupFailAction
  | PrepareBackupSuccessAction
  | PrepareBackupFailureAction
  | ResetCloudBackupStatusAction
  | SetAutoCloudBackupEnabledAction
