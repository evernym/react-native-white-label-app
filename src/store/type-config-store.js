// @flow
import type { CustomError } from '../common/type-common'
import {
  lockPinSetupRoute,
  lockSelectionRoute,
  restoreRoute,
  splashScreenRoute,
  startUpRoute,
  switchEnvironmentRoute,
} from '../common/route-constants'
import type {
  ChangeEnvironmentUrlAction,
  HydrateSwitchEnvironmentDetailFailAction,
  SaveSwitchEnvironmentDetailFailAction,
  ServerEnvironmentChangedAction,
  SwitchEnvironmentAction,
  SwitchErrorAlertsAction,
} from '../switch-environment/type-switch-environment'

export const __uniqueId = '__uniqueId'

export const APP_INSTALLED = 'APP_INSTALLED'
export type AppInstalledSuccessAction = {
  type: typeof APP_INSTALLED,
}

export const HYDRATED = 'HYDRATED'
export type HydratedAction = {
  type: typeof HYDRATED,
}

export const INITIALIZED = 'INITIALIZED'
export type InitializedAction = {
  type: typeof INITIALIZED,
}
export const ALREADY_INSTALLED_RESULT = 'ALREADY_INSTALLED_RESULT'
export type AlreadyInstalledAction = {
  type: typeof ALREADY_INSTALLED_RESULT,
  isAlreadyInstalled: boolean,
}

export const TOGGLE_ERROR_ALERTS = 'TOGGLE_ERROR_ALERTS'
export type ToggleErrorAlertsAction = {
  type: typeof TOGGLE_ERROR_ALERTS,
  isShowErrorAlert: boolean,
}

export const VCX_INIT_NOT_STARTED = 'VCX_INIT_NOT_STARTED'

export const VCX_INIT_START = 'VCX_INIT_START'
export type VcxInitStartAction = {
  type: typeof VCX_INIT_START,
}

export const VCX_INIT_SUCCESS = 'VCX_INIT_SUCCESS'
export type VcxInitSuccessAction = {
  type: typeof VCX_INIT_SUCCESS,
}

export const VCX_INIT_FAIL = 'VCX_INIT_FAIL'
export type VcxInitFailAction = {
  type: typeof VCX_INIT_FAIL,
  error: CustomError,
}

export const VCX_INIT_POOL_NOT_STARTED = 'VCX_INIT_POOL_NOT_STARTED'

export const VCX_INIT_POOL_START = 'VCX_INIT_POOL_START'
export type VcxInitPoolStartAction = {
  type: typeof VCX_INIT_POOL_START,
}

export const VCX_INIT_POOL_SUCCESS = 'VCX_INIT_POOL_SUCCESS'
export type VcxInitPoolSuccessAction = {
  type: typeof VCX_INIT_POOL_SUCCESS,
}

export const VCX_INIT_POOL_FAIL = 'VCX_INIT_POOL_FAIL'
export type VcxInitPoolFailAction = {
  type: typeof VCX_INIT_POOL_FAIL,
  error: CustomError,
}

export const USE_VCX = 'USE_VCX'
export type UseVcxAction = {
  type: typeof USE_VCX,
}

export type ConfigAction =
  | HydratedAction
  | InitializedAction
  | AppInstalledSuccessAction
  | AlreadyInstalledAction
  | ServerEnvironmentChangedAction
  | SwitchErrorAlertsAction
  | ToggleErrorAlertsAction
  | SwitchEnvironmentAction
  | SaveSwitchEnvironmentDetailFailAction
  | HydrateSwitchEnvironmentDetailFailAction
  | ChangeEnvironmentUrlAction
  | VcxInitStartAction
  | VcxInitFailAction
  | VcxInitSuccessAction
  | UseVcxAction
  | ShowSnackErrorAction
  | ClearSnackErrorAction
  | VcxInitPoolStartAction
  | VcxInitPoolSuccessAction
  | VcxInitPoolFailAction

export type VcxInitializationState =
  | typeof VCX_INIT_NOT_STARTED
  | typeof VCX_INIT_START
  | typeof VCX_INIT_SUCCESS
  | typeof VCX_INIT_FAIL

export type VcxPoolInitializationState =
  | typeof VCX_INIT_POOL_NOT_STARTED
  | typeof VCX_INIT_POOL_START
  | typeof VCX_INIT_POOL_SUCCESS
  | typeof VCX_INIT_POOL_FAIL

export type PoolConfig = {
  key: string,
  genesis: string,
  namespace_list: [string]
}

export type AgencyPoolConfig = {
  agencyUrl: string,
  agencyDID: string,
  agencyVerificationKey: string,
  poolConfig: string | Array<PoolConfig>,
  paymentMethod: string,
}

export type VerityFlowConfig = {
  domainDID: string,
  verityFlowBaseUrl: string,
  identityCardCredDefId: string,
  drivingLicenseCredDefId: string,
  passportCredDefId: string,
}

export type ConfigStore = {
  isAlreadyInstalled: boolean,
  isHydrated: boolean,
  showErrorAlerts: boolean,
  vcxInitializationState: VcxInitializationState,
  vcxInitializationError: null | CustomError,
  vcxPoolInitializationState: VcxPoolInitializationState,
  vcxPoolInitializationError: null | CustomError,
  isInitialized: boolean,
  messageDownloadStatus: MessageDownloadStatus,
  snackError: ?string,
  isLoading: boolean,
  isVcxPoolInitFailed: boolean,
  isVcxInitFailed: boolean,
  isGetMessagesFailed: boolean,
} & AgencyPoolConfig &
  VerityFlowConfig

export type MessageDownloadStatus =
  | typeof GET_MESSAGES_LOADING
  | typeof GET_MESSAGES_FAIL
  | typeof GET_MESSAGES_SUCCESS

// IMPORTANT NOTE: If this key value changes,
// then it would need to be changed in ConnectMe app/evernym-sdk/physical-id.js
// and other repos that we have based out of this white label app
export const STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL =
  'STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL'

export const ERROR_SAVE_SWITCH_ENVIRONMENT = {
  code: 'CS-000',
  message: 'Failed to store switched environment details: ',
}

export const ERROR_HYDRATE_SWITCH_ENVIRONMENT = {
  code: 'CS-001',
  message: 'Failed to hydrate switched environment details: ',
}

export const schemaDownloadedEnvironmentDetails = {
  type: 'object',
  properties: {
    agencyUrl: {
      type: 'string',
    },
    agencyDID: {
      type: 'string',
    },
    agencyVerificationKey: {
      type: 'string',
    },
    poolConfig: {
      type: 'string',
    },
    paymentMethod: {
      type: 'string',
    },
  },
  required: [
    'agencyDID',
    'agencyUrl',
    'agencyVerificationKey',
    'poolConfig',
    'paymentMethod',
  ],
}

export const MESSAGE_FAIL_ENVIRONMENT_SWITCH_TITLE =
  'Failed to switch environment'

export const ERROR_NO_WALLET_NAME = 'Wallet name not found'

export const MESSAGE_FAIL_ENVIRONMENT_SWITCH_INVALID_DATA = (url: string) =>
  `Data returned by ${url} is not valid as per our requirements.`

export const MESSAGE_FAIL_ENVIRONMENT_SWITCH_ERROR = (message: string) =>
  `Failed to switch environment due to following error. ${message}`

export const MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_TITLE = 'Success'

export const MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_DESCRIPTION =
  'Environment switched successfully.'

export const ERROR_VCX_INIT_FAIL = (message: string) => ({
  code: `CS-002`,
  message: `Failed to init vcx: ${message}`,
})

export const ERROR_VCX_PROVISION_FAIL = (message: string) => ({
  code: `CS-003`,
  message: `Failed to provision vcx: ${message}`,
})

export const UNSAFE_SCREENS_TO_DOWNLOAD_SMS = [
  splashScreenRoute,
  lockSelectionRoute,
  switchEnvironmentRoute,
  restoreRoute,
  lockPinSetupRoute,
  startUpRoute,
]

export type DownloadedMessage = {
  statusCode: string,
  payload?: ?any,
  senderDID: string,
  uid: string,
  type: string,
  refMsgId?: ?string,
  deliveryDetails: Array<any>,
  decryptedPayload?: string,
  pairwiseDID?: string,
}
export type DownloadedConnectionMessages = {
  pairwiseDID: string,
  msgs: Array<DownloadedMessage>,
}
export type DownloadedConnectionsWithMessages = Array<DownloadedConnectionMessages>
export type AcknowledgeServerData = Array<{
  pairwiseDID: string,
  uids: Array<string>,
}>

export const MESSAGE_RESPONSE_CODE = {
  MESSAGE_CREATED: 'MS-101',
  MESSAGE_SENT: 'MS-102',
  MESSAGE_PENDING: 'MS-103',
  MESSAGE_ACCEPTED: 'MS-104',
  MESSAGE_REJECTED: 'MS-105',
  MESSAGE_ANSWERED: 'MS-106',
}

export type MessagePaymentDetails = {|
  payment_addr: string,
  payment_required: string,
  price: number,
|}

export const ACKNOWLEDGE_MESSAGES_FAIL = 'ACKNOWLEDGE_MESSAGES_FAIL'
export const GET_MESSAGES_FAIL = 'GET_MESSAGES_FAIL'
export const ACKNOWLEDGE_MESSAGES = 'ACKNOWLEDGE_MESSAGES'
export const GET_MESSAGES_SUCCESS = 'GET_MESSAGES_SUCCESS'
export const GET_MESSAGES_LOADING = 'GET_MESSAGES_LOADING'
export const GET_UN_ACKNOWLEDGED_MESSAGES = 'GET_UN_ACKNOWLEDGED_MESSAGES'

export type GetUnacknowledgedMessagesAction = {
  type: typeof GET_UN_ACKNOWLEDGED_MESSAGES,
  uid?: string,
  forDid?: string,
  hideLoader?: boolean,
}
export type GetMessagesLoadingAction = {
  type: typeof GET_MESSAGES_LOADING,
}

export type GetMessagesSuccessAction = {
  type: typeof GET_MESSAGES_SUCCESS,
}

export type AcknowledgeMessagesAction = {
  type: typeof ACKNOWLEDGE_MESSAGES,
}

export type GetMessagesFailAction = {
  type: typeof GET_MESSAGES_FAIL,
}

export type AcknowledgeMessagesFailAction = {
  type: typeof ACKNOWLEDGE_MESSAGES_FAIL,
  error: string,
}

export const SHOW_SNACK_ERROR = 'SHOW_SNACK_ERROR'
export type ShowSnackErrorAction = {
  type: typeof SHOW_SNACK_ERROR,
  error: string,
}

export const CLEAR_SNACK_ERROR = 'CLEAR_SNACK_ERROR'
export type ClearSnackErrorAction = {
  type: typeof CLEAR_SNACK_ERROR,
}
