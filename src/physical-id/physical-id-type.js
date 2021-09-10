// @flow

import type { CustomError } from '../common/type-common'
import type {
  NavigationScreenProp,
  NavigationLeafRoute,
} from '@react-navigation/native'

export const physicalIdProcessStatus = {
  IDLE: 'IDLE',
  SDK_TOKEN_FETCH_FAIL: 'SDK_TOKEN_FETCH_FAIL',
  SDK_TOKEN_FETCH_START: 'SDK_TOKEN_FETCH_START',
  SDK_TOKEN_FETCH_SUCCESS: 'SDK_TOKEN_FETCH_SUCCESS',
  SDK_TOKEN_PARSE_FAIL: 'SDK_TOKEN_PARSE_FAIL',
  SDK_INIT_START: 'SDK_INIT_START',
  SDK_INIT_SUCCESS: 'SDK_INIT_SUCCESS',
  SDK_INIT_FAIL: 'SDK_INIT_FAIL',
  SDK_SCAN_START: 'SDK_SCAN_START',
  SDK_SCAN_FAIL: 'SDK_SCAN_FAIL',
  SDK_SCAN_SUCCESS: 'SDK_SCAN_SUCCESS',
  SEND_ISSUE_CREDENTIAL_START: 'SEND_ISSUE_CREDENTIAL_START',
  SEND_ISSUE_CREDENTIAL_FAIL: 'SEND_ISSUE_CREDENTIAL_FAIL',
  SEND_ISSUE_CREDENTIAL_SUCCESS: 'SEND_ISSUE_CREDENTIAL_SUCCESS',
}
export type PhysicalIdProcessStatus = $Keys<typeof physicalIdProcessStatus>

export const physicalIdConnectionStatus = {
  IDLE: 'IDLE',
  CONNECTION_DETAIL_FETCHING: 'CONNECTION_DETAIL_FETCHING',
  CONNECTION_DETAIL_FETCH_SUCCESS: 'CONNECTION_DETAIL_FETCH_SUCCESS',
  CONNECTION_DETAIL_FETCH_ERROR: 'CONNECTION_DETAIL_FETCH_ERROR',
  CONNECTION_DETAIL_INVALID_ERROR: 'CONNECTION_DETAIL_INVALID_ERROR',
  CONNECTION_IN_PROGRESS: 'CONNECTION_IN_PROGRESS',
  CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
  CONNECTION_FAIL: 'CONNECTION_FAIL',
}
export type PhysicalIdConnectionStatus = $Keys<
  typeof physicalIdConnectionStatus
>

export type PhysicalIdNavigation = {
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  route: {
    params: {|
      title: string,
    |},
  },
}

export type PhysicalIdStore = {
  status: PhysicalIdProcessStatus,
  sdkToken: ?string,
  error: ?CustomError,
  physicalIdDid: ?string,
  physicalIdConnectionStatus: PhysicalIdConnectionStatus,
}

export const UPDATE_PHYSICAL_ID_PROCESS_STATUS =
  'UPDATE_PHYSICAL_ID_PROCESS_STATUS'
export type UpdatePhysicalIdProcessStatusAction = {
  type: typeof UPDATE_PHYSICAL_ID_PROCESS_STATUS,
  status: PhysicalIdProcessStatus,
  error?: ?CustomError,
}

export const STOP_PHYSICAL_ID = "STOP_PHYSICAL_ID"

export const LAUNCH_PHYSICAL_ID_SDK = 'LAUNCH_PHYSICAL_ID_SDK'
export type LaunchPhysicalIdSDKAction = {
  type: typeof LAUNCH_PHYSICAL_ID_SDK,
  documentType: string,
  country: string,
}

export const UPDATE_PHYSICAL_ID_SDK_TOKEN = 'UPDATE_PHYSICAL_ID_SDK_TOKEN'
export type UpdatePhysicalIdSdkTokenAction = {
  type: typeof UPDATE_PHYSICAL_ID_SDK_TOKEN,
  sdkToken: string,
}

export const HYDRATE_PHYSICAL_ID_SDK_TOKEN = 'HYDRATE_PHYSICAL_ID_SDK_TOKEN'
export type HydratePhysicalIdSdkTokenAction = {
  type: typeof HYDRATE_PHYSICAL_ID_SDK_TOKEN,
  sdkToken: string,
}

export const PHYSICAL_ID_CONNECTION_ESTABLISHED =
  'PHYSICAL_ID_CONNECTION_ESTABLISHED'
export type PhysicalIdConnectionEstablishedAction = {
  type: typeof PHYSICAL_ID_CONNECTION_ESTABLISHED,
  physicalIdDid: string,
}

export const HYDRATE_PHYSICAL_ID_DID_SUCCESS = 'HYDRATE_PHYSICAL_ID_DID_SUCCESS'
export type HydratePhysicalIdDidSuccessAction = {
  type: typeof HYDRATE_PHYSICAL_ID_DID_SUCCESS,
  physicalIdDid: string,
}

export const REMOVE_PHYSICAL_ID_DID = 'REMOVE_PHYSICAL_ID_DID'
export type RemovePhysicalIdDidAction = {
  type: typeof REMOVE_PHYSICAL_ID_DID,
}

export const GET_SDK_TOKEN = 'GET_SDK_TOKEN'
export type GetSdkTokenAction = {
  type: typeof GET_SDK_TOKEN,
}

export const UPDATE_PHYSICAL_ID_CONNECTION_STATUS =
  'UPDATE_PHYSICAL_ID_CONNECTION_STATUS'
export type UpdatePhysicalIdConnectionStatusAction = {
  type: typeof UPDATE_PHYSICAL_ID_CONNECTION_STATUS,
  status: PhysicalIdConnectionStatus,
  error?: ?CustomError,
}

export const RESET_PHYSICAL_ID_STATUES = 'RESET_PHYSICAL_ID_STATUES'
export type ResetPhysicalIdStatuesAction = {
  type: typeof RESET_PHYSICAL_ID_STATUES,
}

export const PHYSICAL_ID_DOCUMENT_SUBMITTED =
  'PHYSICAL_ID_DOCUMENT_SUBMITTED'
export type PhysicalIdDocumentSubmittedAction = {
  type: typeof PHYSICAL_ID_DOCUMENT_SUBMITTED,
  uid: string,
  documentType: string,
}

export const PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED =
  'PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED'
export type PhysicalIdDocumentIssuanceFailedAction = {
  type: typeof PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED,
  uid: string,
  error: ?CustomError,
}

export type PhysicalIdStoreAction =
  | LaunchPhysicalIdSDKAction
  | UpdatePhysicalIdProcessStatusAction
  | UpdatePhysicalIdSdkTokenAction
  | HydratePhysicalIdSdkTokenAction
  | PhysicalIdConnectionEstablishedAction
  | HydratePhysicalIdDidSuccessAction
  | RemovePhysicalIdDidAction
  | GetSdkTokenAction
  | UpdatePhysicalIdConnectionStatusAction
  | ResetPhysicalIdStatuesAction
  | PhysicalIdDocumentSubmittedAction
  | PhysicalIdDocumentIssuanceFailedAction

export const JumioDocTypes = {
  BankStatement: { value: 'BS', text: 'Bank statement' },
  InsuranceCard: { value: 'IC', text: 'Insurance card' },
  UtilityBill: { value: 'UB', text: 'Utility bill' },
  CashAdvanceApplication: { value: 'CAAP', text: 'Utility bill' },
  CorporateResolutionCertificate: { value: 'CRC', text: 'Utility bill' },
  CreditCardStatement: { value: 'CCS', text: 'Utility bill' },
  LeaseAgreement: { value: 'LAG', text: 'Utility bill' },
  LoanApplication: { value: 'LOAP', text: 'Utility bill' },
  MortgageApplication: { value: 'MOAP', text: 'Utility bill' },
  TaxReturn: { value: 'TR', text: 'Utility bill' },
  VehicleTitle: { value: 'VT', text: 'Utility bill' },
  VoidedCheck: { value: 'VC', text: 'Utility bill' },
  StudentCard: { value: 'STUC', text: 'Utility bill' },
  HealthCareCard: { value: 'HCC', text: 'Utility bill' },
  CouncilBill: { value: 'CB', text: 'Utility bill' },
  SeniorsCard: { value: 'SENC', text: 'Utility bill' },
  MedicareCard: { value: 'MEDC', text: 'Utility bill' },
  BirthCertificate: { value: 'BC', text: 'Utility bill' },
  WorkingWithChildrenCheck: { value: 'WWCC', text: 'Utility bill' },
  SuperannuationStatement: { value: 'SS', text: 'Utility bill' },
  TradeAssociationCard: { value: 'TAC', text: 'Utility bill' },
  SchoolEnrollmentLetter: { value: 'SEL', text: 'School enrollment letter' },
  PhoneBill: { value: 'PB', text: 'Phone bill' },
  USSocialSecurityCard: { value: 'USSS', text: 'US social security card' },
  SocialSecurityCard: { value: 'SSC', text: 'Social security card' },
  CustomDocumentType: { value: 'CUSTOM', text: 'Custom document type' },
}

export const ERROR_PHYSICAL_ID_SDK_TOKEN_API = (message: string) => ({
  code: 'PH-001',
  message: `${message}`,
})

export const ERROR_PHYSICAL_ID_SDK = (message: string) => ({
  code: 'PH-002',
  message,
})

export const ERROR_CONNECTION_DETAIL_INVALID = (message: string) => ({
  code: 'PH-003',
  message: `Invalid connection details returned by physicalId: ${message}`,
})

export const ERROR_CONNECTION_DETAIL_FETCH_ERROR = (message: string) => ({
  code: 'PH-004',
  message: `Could not get connection invitation for physicalId: ${message}`,
})

export const ERROR_CONNECTION_FAIL = (message: string) => ({
  code: 'PH-004',
  message: `Connection establishment failed for physicalId: ${message}`,
})

export const ERROR_MESSAGE_NO_SDK_TOKEN = 'Could not get SDK token'

export const TEXT_PHYSICAL_ID_SUCCESS_TITLE = 'Great job!'
export const TEXT_PHYSICAL_ID_SUCCESS_FIRST_PARAGRAPH = `We're verifying your identity right now. If it all checks out, we'll issue you with your PhysicalId ID.`
export const TEXT_PHYSICAL_ID_SUCCESS_SECOND_PARAGRAPH = `You'll get a notification that your PhysicalId ID is ready to use. It shouldn't take long -- you'll have a result within 5 minutes.`

export const TEXT_PHYSICAL_ID_DEFAULT = `PhysicalId would give you a digital copy of your identity documents. Would you like to continue?`

export const TEXT_PHYSICAL_ID_YES = 'Yes'
export const TEXT_PHYSICAL_ID_I_ACCEPT = 'I accept'
export const TEXT_PHYSICAL_ID_OK = 'OK'

export const TEXT_PHYSICAL_ID_ID = 'PhysicalId ID'
export const TEXT_PHYSICAL_ID_ID_PARAGRAPH = `Your PhysicalId ID is reusable digital proof of identity. To start, all you need is a passport or driver's license and yourself.`
export const TEXT_PHYSICAL_ID_HEADING_2 = 'Important information'
export const TEXT_PHYSICAL_ID_TNC_FIRST_PARAGRAPH = `This is the BETA release of the PhysicalId ID. It should give you a preview of how the PhysicalId ID might operate and look. We are still developing the PhysicalId ID and while we build it, help and troubleshooting resources won't be in place. So the PhysicalId ID is not intended for any specific use by individual users or commercial enterprises relying on this verification.`
export const TEXT_PHYSICAL_ID_TNC_SECOND_1 =
  'By going ahead and using the PhysicalId ID in BETA, you agree to the '
export const TEXT_PHYSICAL_ID_TNC_SECOND_2 =
  ' and understand that your data will be used as described in the '
export const TEXT_PHYSICAL_ID_TNC_SECOND_3 =
  '. Once we have issued your PhysicalId ID, we will delete the data you provided us shortly thereafter. This is to better protect your data during this early development phase.'
