// @flow

import type { CustomError } from '../common/type-common'
import type {
  NavigationScreenProp,
  NavigationLeafRoute,
} from '@react-navigation/native'

export const onfidoProcessStatus = {
  IDLE: 'IDLE',
  START_NO_CONNECTION: 'START_NO_CONNECTION',
  APPLICANT_ID_API_ERROR: 'APPLICANT_ID_API_ERROR',
  APPLICANT_ID_FETCHING: 'APPLICANT_ID_FETCHING',
  APPLICANT_ID_SUCCESS: 'APPLICANT_ID_SUCCESS',
  SDK_ERROR: 'SDK_ERROR',
  SDK_SUCCESS: 'SDK_SUCCESS',
  CHECK_UUID_FETCHING: 'CHECK_UUID_FETCHING',
  CHECK_UUID_ERROR: 'CHECK_UUID_ERROR',
  CHECK_UUID_SUCCESS: 'CHECK_UUID_SUCCESS',
}
export type OnfidoProcessStatus = $Keys<typeof onfidoProcessStatus>

export const onfidoConnectionStatus = {
  IDLE: 'IDLE',
  CONNECTION_DETAIL_FETCHING: 'CONNECTION_DETAIL_FETCHING',
  CONNECTION_DETAIL_FETCH_SUCCESS: 'CONNECTION_DETAIL_FETCH_SUCCESS',
  CONNECTION_DETAIL_FETCH_ERROR: 'CONNECTION_DETAIL_FETCH_ERROR',
  CONNECTION_DETAIL_INVALID_ERROR: 'CONNECTION_DETAIL_INVALID_ERROR',
  CONNECTION_IN_PROGRESS: 'CONNECTION_IN_PROGRESS',
  CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
  CONNECTION_FAIL: 'CONNECTION_FAIL',
}
export type OnfidoConnectionStatus = $Keys<typeof onfidoConnectionStatus>

export type OnfidoNavigation = {
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  route: {
    params: {|
      title: string,
    |},
  },
}

export type OnfidoProps = {
  status: OnfidoProcessStatus,
  error: ?CustomError,
  connectionStatus: OnfidoConnectionStatus,
  launchOnfidoSDK: () => LaunchOnfidoSDKAction,
  resetOnfidoStatues: () => ResetOnfidoStatuesAction,
} & OnfidoNavigation

export type OnfidoStore = {
  status: OnfidoProcessStatus,
  applicantId: ?string,
  error: ?CustomError,
  onfidoDid: ?string,
  onfidoConnectionStatus: OnfidoConnectionStatus,
}

export const UPDATE_ONFIDO_PROCESS_STATUS = 'UPDATE_ONFIDO_PROCESS_STATUS'
export type UpdateOnfidoProcessStatusAction = {
  type: typeof UPDATE_ONFIDO_PROCESS_STATUS,
  status: OnfidoProcessStatus,
  error?: ?CustomError,
}

export const LAUNCH_ONFIDO_SDK = 'LAUNCH_ONFIDO_SDK'
export type LaunchOnfidoSDKAction = {
  type: typeof LAUNCH_ONFIDO_SDK,
}

export const HYDRATE_ONFIDO_APPLICANT_ID_SUCCESS =
  'HYDRATE_ONFIDO_APPLICANT_ID_SUCCESS'
export type HydrateApplicantIdAction = {
  type: typeof HYDRATE_ONFIDO_APPLICANT_ID_SUCCESS,
  applicantId: string,
}

export const UPDATE_ONFIDO_APPLICANT_ID = 'UPDATE_ONFIDO_APPLICANT_ID'
export type UpdateOnfidoApplicantIdAction = {
  type: typeof UPDATE_ONFIDO_APPLICANT_ID,
  applicantId: string,
}

export const ONFIDO_CONNECTION_ESTABLISHED = 'ONFIDO_CONNECTION_ESTABLISHED'
export type OnfidoConnectionEstablishedAction = {
  type: typeof ONFIDO_CONNECTION_ESTABLISHED,
  onfidoDid: string,
}

export const HYDRATE_ONFIDO_DID_SUCCESS = 'HYDRATE_ONFIDO_DID_SUCCESS'
export type HydrateOnfidoDidSuccessAction = {
  type: typeof HYDRATE_ONFIDO_DID_SUCCESS,
  onfidoDid: string,
}

export const REMOVE_ONFIDO_DID = 'REMOVE_ONFIDO_DID'
export type RemoveOnfidoDidAction = {
  type: typeof REMOVE_ONFIDO_DID,
}

export const GET_APPLICANT_ID = 'GET_APPLICANT_ID'
export type GetApplicantIdAction = {
  type: typeof GET_APPLICANT_ID,
}

export const UPDATE_ONFIDO_CONNECTION_STATUS = 'UPDATE_ONFIDO_CONNECTION_STATUS'
export type UpdateOnfidoConnectionStatusAction = {
  type: typeof UPDATE_ONFIDO_CONNECTION_STATUS,
  status: OnfidoConnectionStatus,
  error?: ?CustomError,
}

export const RESET_ONFIDO_STATUES = 'RESET_ONFIDO_STATUES'
export type ResetOnfidoStatuesAction = {
  type: typeof RESET_ONFIDO_STATUES,
}

export type OnfidoStoreAction =
  | LaunchOnfidoSDKAction
  | UpdateOnfidoProcessStatusAction
  | HydrateApplicantIdAction
  | UpdateOnfidoApplicantIdAction
  | OnfidoConnectionEstablishedAction
  | HydrateOnfidoDidSuccessAction
  | RemoveOnfidoDidAction
  | GetApplicantIdAction
  | UpdateOnfidoConnectionStatusAction
  | ResetOnfidoStatuesAction

export const ERROR_ONFIDO_APPLICANT_ID_API = (message: string) => ({
  code: 'ON-001',
  message: `${message}`,
})

export const ERROR_ONFIDO_SDK = (message: string) => ({
  code: 'ON-002',
  message,
})

export const ERROR_CONNECTION_DETAIL_INVALID = (message: string) => ({
  code: 'ON-003',
  message: `Invalid connection details returned by onfido: ${message}`,
})

export const ERROR_MESSAGE_NO_APPLICANT_ID = 'Could not get Onfido applicant id'

export const TEXT_ONFIDO_SUCCESS_TITLE = 'Great job!'
export const TEXT_ONFIDO_SUCCESS_FIRST_PARAGRAPH = `We're verifying your identity right now. If it all checks out, we'll issue you with your Onfido ID.`
export const TEXT_ONFIDO_SUCCESS_SECOND_PARAGRAPH = `You'll get a notification that your Onfido ID is ready to use. It shouldn't take long -- you'll have a result within 5 minutes.`

export const TEXT_ONFIDO_DEFAULT = `Onfido would give you a digital copy of your identity documents. Would you like to continue?`

export const TEXT_ONFIDO_YES = 'Yes'
export const TEXT_ONFIDO_I_ACCEPT = 'I accept'
export const TEXT_ONFIDO_OK = 'OK'

export const TEXT_ONFIDO_ID = 'Onfido ID'
export const TEXT_ONFIDO_ID_PARAGRAPH = `Your Onfido ID is reusable digital proof of identity. To start, all you need is a passport or driver's license and yourself.`
export const TEXT_ONFIDO_HEADING_2 = 'Important information'
export const TEXT_ONFIDO_TNC_FIRST_PARAGRAPH = `This is the BETA release of the Onfido ID. It should give you a preview of how the Onfido ID might operate and look. We are still developing the Onfido ID and while we build it, help and troubleshooting resources won't be in place. So the Onfido ID is not intended for any specific use by individual users or commercial enterprises relying on this verification.`
export const TEXT_ONFIDO_TNC_SECOND_1 =
  'By going ahead and using the Onfido ID in BETA, you agree to the '
export const TEXT_ONFIDO_TNC_SECOND_2 =
  ' and understand that your data will be used as described in the '
export const TEXT_ONFIDO_TNC_SECOND_3 =
  '. Once we have issued your Onfido ID, we will delete the data you provided us shortly thereafter. This is to better protect your data during this early development phase.'
