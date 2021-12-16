// @flow

import type { CustomError } from '../common/type-common'

export const sdkStatus = {
  IDLE: 'IDLE',
  SDK_INIT_START: 'SDK_INIT_START',
  SDK_INIT_SUCCESS: 'SDK_INIT_SUCCESS',
  SDK_INIT_FAIL: 'SDK_INIT_FAIL',
  SDK_USED: 'SDK_USED',
}
export type SdkStatus = $Keys<typeof sdkStatus>

export const physicalIdProcessStatus = {
  IDLE: 'IDLE',
  SDK_INIT_FAIL: 'SDK_INIT_FAIL',
  SDK_DOCUMENT_VERIFICATION_START: 'SDK_DOCUMENT_VERIFICATION_START',
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

export type LoadedData = {
  data: ?[string],
  isLoading: false,
  error: ?CustomError,
}

export type PhysicalIdStore = {
  sdkInitStatus: SdkStatus,
  status: PhysicalIdProcessStatus,
  error: ?CustomError,
  physicalIdDid: ?string,
  physicalIdConnectionStatus: PhysicalIdConnectionStatus,
  documentTypes: ?LoadedData,
}

export const UPDATE_SDK_INIT_STATUS = 'UPDATE_SDK_INIT_STATUS'
export type UpdateSdkInitStatusAction = {
  type: typeof UPDATE_SDK_INIT_STATUS,
  status: SdkStatus,
  error?: ?CustomError,
}

export const UPDATE_PHYSICAL_ID_PROCESS_STATUS =
  'UPDATE_PHYSICAL_ID_PROCESS_STATUS'
export type UpdatePhysicalIdProcessStatusAction = {
  type: typeof UPDATE_PHYSICAL_ID_PROCESS_STATUS,
  status: PhysicalIdProcessStatus,
  error?: ?CustomError,
}

export const PHYSICAL_ID_SDK_INIT = 'PHYSICAL_ID_SDK_INIT'
export type PhysicalIdSdkInitAction = {
  type: typeof PHYSICAL_ID_SDK_INIT,
}

export const STOP_PHYSICAL_ID = 'STOP_PHYSICAL_ID'

export const LAUNCH_PHYSICAL_ID_SDK = 'LAUNCH_PHYSICAL_ID_SDK'
export type LaunchPhysicalIdSDKAction = {
  type: typeof LAUNCH_PHYSICAL_ID_SDK,
  documentType: string,
  country: string,
}

export const PHYSICAL_ID_CONNECTION_START =
  'PHYSICAL_ID_CONNECTION_START'
export type PhysicalIdConnectionStartAction = {
  type: typeof PHYSICAL_ID_CONNECTION_START,
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

export const PHYSICAL_ID_DOCUMENT_SUBMITTED = 'PHYSICAL_ID_DOCUMENT_SUBMITTED'
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
  error: string,
}

export type PhysicalIdStoreAction =
  | PhysicalIdSdkInitAction
  | LaunchPhysicalIdSDKAction
  | UpdateSdkInitStatusAction
  | UpdatePhysicalIdProcessStatusAction
  | PhysicalIdConnectionStartAction
  | PhysicalIdConnectionEstablishedAction
  | HydratePhysicalIdDidSuccessAction
  | RemovePhysicalIdDidAction
  | GetSdkTokenAction
  | UpdatePhysicalIdConnectionStatusAction
  | PhysicalIdDocumentSubmittedAction
  | PhysicalIdDocumentIssuanceFailedAction

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
