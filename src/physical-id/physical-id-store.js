// @flow
import {
  put,
  call,
  all,
  select,
  take,
  fork,
  race,
  join,
  takeEvery,
  spawn,
} from 'redux-saga/effects'
import { NativeModules } from 'react-native'
import delay from '@redux-saga/delay-p'

import type {
  PhysicalIdStore,
  PhysicalIdStoreAction,
  LaunchPhysicalIdSDKAction,
  PhysicalIdProcessStatus,
  PhysicalIdConnectionStatus,
} from './physical-id-type'
import type { CustomError } from '../common/type-common'
import type { Store } from '../store/type-store'
import type { InvitationPayload } from '../invitation/type-invitation'

import {
  LAUNCH_PHYSICAL_ID_SDK,
  UPDATE_PHYSICAL_ID_PROCESS_STATUS,
  physicalIdProcessStatus,
  ERROR_PHYSICAL_ID_SDK_TOKEN_API,
  UPDATE_PHYSICAL_ID_SDK_TOKEN,
  ERROR_MESSAGE_NO_SDK_TOKEN,
  ERROR_PHYSICAL_ID_SDK,
  ERROR_CONNECTION_DETAIL_INVALID,
  PHYSICAL_ID_CONNECTION_ESTABLISHED,
  HYDRATE_PHYSICAL_ID_DID_SUCCESS,
  REMOVE_PHYSICAL_ID_DID,
  GET_SDK_TOKEN,
  physicalIdConnectionStatus,
  UPDATE_PHYSICAL_ID_CONNECTION_STATUS,
  RESET_PHYSICAL_ID_STATUES,
  HYDRATE_PHYSICAL_ID_SDK_TOKEN,
  ERROR_CONNECTION_DETAIL_FETCH_ERROR,
  ERROR_CONNECTION_FAIL,
} from './physical-id-type'
import {
  getSdkToken,
  getWorkflowData,
  getPhysicalIdInvitation,
  issueCredential,
} from './physical-id-api'
import { captureError } from '../services/error/error-handler'
import { secureDelete, getHydrationItem, secureSet } from '../services/storage'
import {
  invitationReceived,
  sendInvitationResponse,
} from '../invitation/invitation-store'
import { ResponseType } from '../components/request/type-request'
import {
  ensureAppHydrated,
  getUnacknowledgedMessages,
} from '../store/config-store'
import { getUserPairwiseDid } from '../store/store-selector'
import { INVITATION_RESPONSE_FAIL } from '../invitation/type-invitation'
import { NEW_CONNECTION_SUCCESS } from '../store/type-connection-store'
import { flattenAsync } from '../common/flatten-async'
import {
  getUrlData,
  isValidUrl,
} from '../components/qr-scanner/qr-code-types/qr-url'
import { getEnvironmentName } from '../switch-environment/switсh-environment-store'
import { convertQrCodeToAppInvitation } from '../components/qr-scanner/qr-code-converter'
import { flatJsonParse } from '../common/flat-json-parse'
import { countriesCodeMap } from './physical-id-countries-map'
import {
  GET_MESSAGES_FAIL,
  GET_MESSAGES_SUCCESS,
} from '../store/type-config-store'

const initialState = {
  status: physicalIdProcessStatus.IDLE,
  applicantId: null,
  error: null,
  physicalIdDid: null,
  physicalIdConnectionStatus: physicalIdConnectionStatus.IDLE,
  sdkToken: null,
}

export const updatePhysicalIdStatus = (
  status: PhysicalIdProcessStatus,
  error: ?CustomError
) => ({
  type: UPDATE_PHYSICAL_ID_PROCESS_STATUS,
  status,
  error,
})

export const updatePhysicalIdConnectionStatus = (
  status: PhysicalIdConnectionStatus,
  error: ?CustomError
) => ({
  type: UPDATE_PHYSICAL_ID_CONNECTION_STATUS,
  status,
  error,
})

export const launchPhysicalIdSDK = (country: string, documentType: string) => ({
  type: LAUNCH_PHYSICAL_ID_SDK,
  country,
  documentType,
})

export const hydratePhysicalIdSdkToken = (sdkToken: string) => ({
  type: HYDRATE_PHYSICAL_ID_SDK_TOKEN,
  sdkToken,
})

export const updatePhysicalIdSdkToken = (sdkToken: string) => ({
  type: UPDATE_PHYSICAL_ID_SDK_TOKEN,
  sdkToken,
})

export const physicalIdConnectionEstablished = (physicalIdDid: string) => ({
  type: PHYSICAL_ID_CONNECTION_ESTABLISHED,
  physicalIdDid,
})

const PHYSICAL_ID_SDK_TOKEN_STORAGE_KEY = 'PHYSICAL_ID_SDK_TOKEN_STORAGE_KEY'
export function* removePersistedPhysicalIdSdkTokenSaga(): Generator<*, *, *> {
  try {
    yield put({ type: 'REMOVE_PHYSICAL_ID_SDK_TOKEN_START' })
    yield call(secureDelete, PHYSICAL_ID_SDK_TOKEN_STORAGE_KEY)
    yield put({ type: 'REMOVE_PHYSICAL_ID_SDK_TOKEN_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'REMOVE_PHYSICAL_ID_SDK_TOKEN_FAIL',
    })
  }
}

export function* hydratePhysicalIdSdkTokenSaga(): any {
  try {
    yield put({ type: 'HYDRATE_PHYSICAL_ID_SDK_TOKEN_START' })
    const sdkToken: string = yield call(
      getHydrationItem,
      PHYSICAL_ID_SDK_TOKEN_STORAGE_KEY
    )
    if (sdkToken) {
      yield put(hydratePhysicalIdSdkToken(sdkToken))
      return sdkToken
    }
    yield put({ type: 'HYDRATE_PHYSICAL_ID_SDK_TOKEN_NOT_FOUND' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'HYDRATE_PHYSICAL_ID_SDK_TOKEN_FAIL',
    })
  }
}

function* launchPhysicalIdSDKSaga(
  action: LaunchPhysicalIdSDKAction
): Generator<*, *, *> {
  // make connection with physical Id scanner in background
  const connectionTask = yield fork(makeConnectionWithPhysicalIdSaga)

  const [tokenError, tokenResponse]: [
    string | null,
    [string, string] | null
  ] = yield* getSdkTokenSaga()

  if (tokenError || !tokenResponse) {
    // action are already raised by sdk toke saga and status is also updated in above saga
    return
  }

  const [token, apiDataCenter] = tokenResponse
  // init sdk
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_START))
  const [midsSdkInitError] = yield call(
    flattenAsync(midsSdkInit),
    token,
    apiDataCenter
  )
  if (midsSdkInitError) {
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_FAIL))
    return
  }
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_SUCCESS))

  const [countryListError, countryList] = yield call(
    flattenAsync(midsGetCountryList)
  )
  const selectedCountry = countriesCodeMap[action.country]
  const [documentTypesError, documentTypes] = yield call(
    flattenAsync(midsGetDocumentTypes),
    selectedCountry
  )

  // start SDK
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_START))

  // TODO:KS Validate that the spelling and casing is as per need of MC SDK
  const documentNameMap = {
    PASSPORT: 'Passport',
    DRIVING_LICENSE: "Driver's license",
    IDENTITY_CARD: 'Identity card',
    VISA: 'Visa',
  }
  const document = documentNameMap[action.documentType]
  const [workflowIdError, workflowId] = yield call(
    flattenAsync(midsScanStart),
    document
  )
  if (workflowIdError) {
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_FAIL))
    return
  }
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_SUCCESS))

  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SEND_WORKFLOW_ID_START)
  )
  const domainDID: string = yield select(selectDomainDID)
  const verityFlowBaseUrl: string = yield select(selectVerityFlowBaseUrl)
  // send workflow Id to server so that it can get the data for workflowRefId
  const [getWorkflowDataError] = yield call(flattenAsync(getWorkflowData), {
    workflowId,
    country: selectedCountry,
    document: action.documentType,
    domainDID,
    verityFlowBaseUrl,
  })

  if (getWorkflowDataError) {
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SEND_WORKFLOW_ID_FAIL)
    )
    // there was an error while sending workflow data
    // this is the API that we can retry
    return
  }

  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SEND_WORKFLOW_ID_SUCCESS)
  )

  let [connectionError, connectionDID]: [
    { code: string, message: string } | null | typeof undefined,
    string | null | typeof undefined
  ] = [null, null]
  const connectionTaskResult = connectionTask.result()

  if (!connectionTaskResult) {
    // if connection task is still running, then wait for it's completion
    ;[connectionError, connectionDID] = yield join(connectionTask)
  } else {
    // if connection task is already done, then just take the result
    ;[connectionError, connectionDID] = connectionTaskResult
  }

  if (connectionError || !connectionDID) {
    return
  }

  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_START)
  )

  // TODO:KS Get a new hardware token here again, to make auth more stronger
  // now we have connection, and we also have the workflow data
  // we can now issue the credential
  const [issueCredentialError] = yield call(flattenAsync(issueCredential), {
    workflowId,
    connectionDID,
    hardwareToken: 'something-fails-for-now-till-we-add-auth',
    country: selectedCountry,
    document: action.documentType,
    domainDID,
    verityFlowBaseUrl,
  })
  if (issueCredentialError) {
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL)
    )

    // something went wrong while asking to issue credential
    return
  }

  yield put(
    updatePhysicalIdStatus(
      physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_SUCCESS
    )
  )
}

async function midsSdkInit(sdkToken: string, apiDataCenter: string) {
  return new Promise((resolve, reject) => {
    NativeModules.MIDSDocumentVerification.initMIDSSDK(
      sdkToken,
      apiDataCenter,
      resolve,
      reject
    )
  })
}

export async function midsGetCountryList() {
  return new Promise((resolve, reject) => {
    NativeModules.MIDSDocumentVerification.getCountryList(resolve, reject)
  })
}

export async function midsGetDocumentTypes(country: string) {
  return new Promise((resolve, reject) => {
    NativeModules.MIDSDocumentVerification.getDocumentTypes(
      country,
      resolve,
      reject
    )
  })
}

async function midsScanStart(document: string) {
  return new Promise((resolve, reject) => {
    NativeModules.MIDSDocumentVerification.startMIDSSDKScan(
      document,
      '1.0.0',
      resolve,
      reject
    )
  })
}

function* makeConnectionWithPhysicalIdSaga(): Generator<*, *, *> {
  // if connection is already established, then don't make connection again
  let physicalIdDid: ?string = yield* getPhysicalIdDidSaga()
  if (physicalIdDid) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_SUCCESS
      )
    )
    return [null, physicalIdDid]
  }

  // create connection because no connection is established or
  // user deleted connection that was established
  yield put(
    updatePhysicalIdConnectionStatus(
      physicalIdConnectionStatus.CONNECTION_DETAIL_FETCHING
    )
  )

  const hardwareToken = ''
  const domainDID: string = yield select(selectDomainDID)
  const verityFlowBaseUrl: string = yield select(selectVerityFlowBaseUrl)
  const [error, invitationDetails]: [
    Error | null,
    { invitation: string } | null
  ] = yield call(
    flattenAsync(getPhysicalIdInvitation),
    hardwareToken,
    domainDID,
    verityFlowBaseUrl
  )

  if (error || !invitationDetails || !invitationDetails.invitation) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_DETAIL_FETCH_ERROR,
        ERROR_CONNECTION_DETAIL_FETCH_ERROR(error?.message ?? '')
      )
    )
    return [ERROR_CONNECTION_DETAIL_FETCH_ERROR(error?.message ?? ''), null]
  }

  let invitationData = null
  let invitationParseError = null
  const urlQrCode = isValidUrl(invitationDetails.invitation)
  if (urlQrCode) {
    ;[invitationParseError, invitationData] = yield call(
      flattenAsync(getUrlData),
      urlQrCode,
      invitationDetails.invitation
    )
  }

  if (!invitationData) {
    ;[invitationParseError, invitationData] = flatJsonParse(
      invitationDetails.invitation
    )
  }

  if (invitationParseError) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR,
        ERROR_CONNECTION_DETAIL_INVALID('Invalid invite URL')
      )
    )
    return [ERROR_CONNECTION_DETAIL_INVALID('Invalid invite URL'), null]
  }

  yield put(
    updatePhysicalIdConnectionStatus(
      physicalIdConnectionStatus.CONNECTION_DETAIL_FETCH_SUCCESS
    )
  )
  const [appInviteError, appInvitation]: [
    null | string,
    null | InvitationPayload
  ] = yield call(
    convertQrCodeToAppInvitation,
    typeof invitationData !== 'string'
      ? JSON.stringify(invitationData)
      : invitationData
  )
  if (appInviteError || !appInvitation) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR,
        ERROR_CONNECTION_DETAIL_INVALID(
          'Could not convert invite to app invite'
        )
      )
    )
    return [
      ERROR_CONNECTION_DETAIL_INVALID('Could not convert invite to app invite'),
      null,
    ]
  }

  yield put(
    invitationReceived({
      payload: appInvitation,
    })
  )
  physicalIdDid = appInvitation.senderDID
  yield put(
    sendInvitationResponse({
      response: ResponseType.accepted,
      senderDID: physicalIdDid,
    })
  )
  yield put(
    updatePhysicalIdConnectionStatus(
      physicalIdConnectionStatus.CONNECTION_IN_PROGRESS
    )
  )
  // since we will be racing for connection status update
  // it might happen that we would get some problem with push notification
  // and connection status might never change
  // So, we are manually refreshing
  yield spawn(refreshConnectionStateSaga)

  const { fail } = yield race({
    success: take(NEW_CONNECTION_SUCCESS),
    fail: take(INVITATION_RESPONSE_FAIL),
    refreshTimeout: take(CONNECTION_REFRESH_TIMEOUT),
  })

  if (fail) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_FAIL
      )
    )
    return [
      ERROR_CONNECTION_FAIL(physicalIdConnectionStatus.CONNECTION_FAIL),
      null,
    ]
  }

  yield put(physicalIdConnectionEstablished(appInvitation.senderDID))
  yield put(
    updatePhysicalIdConnectionStatus(
      physicalIdConnectionStatus.CONNECTION_SUCCESS
    )
  )
  yield* persistPhysicalIdDidSaga(appInvitation.senderDID)
  console.log('persist done>>>')
  return [null, physicalIdDid]
}

function* getPhysicalIdDidSaga(): Generator<*, *, *> {
  let physicalIdDid: ?string = yield select(selectPhysicalIdDid)
  if (!physicalIdDid) {
    physicalIdDid = yield* hydratePhysicalIdDidSaga()
  }

  if (!physicalIdDid) {
    return null
  }

  // since we want to take data from connections store
  // we need to make sure that data is hydrated before we take data
  // from persisted stores
  yield* ensureAppHydrated()
  const userPairwiseDid: ?string = yield select(
    getUserPairwiseDid,
    physicalIdDid
  )
  if (userPairwiseDid) {
    return physicalIdDid
  }

  // if we have physicalIdDid, but no corresponding user pairwise did
  // then user might have deleted the connection that was established
  // so, we reset physicalId did as well
  yield put(removePhysicalIdDid())
  yield* removePersistedPhysicalIdDidSaga()
  return null
}

const CONNECTION_REFRESH_TIMEOUT = 'CONNECTION_REFRESH_TIMEOUT'
function* refreshConnectionStateSaga() {
  let i = 0
  while (i < 5) {
    yield call(delay, 5000)
    yield put(getUnacknowledgedMessages())
    yield race({
      success: take(GET_MESSAGES_SUCCESS),
      fail: take(GET_MESSAGES_FAIL),
    })
    i++
  }

  yield call(delay, 3 * 60000)
  yield put({ type: CONNECTION_REFRESH_TIMEOUT })
}

const selectPhysicalIdDid = (state: Store) => state.physicalId.physicalIdDid
const selectDomainDID = (state: Store) => state.config.domainDID
const selectVerityFlowBaseUrl = (state: Store) => state.config.verityFlowBaseUrl

function* getSdkTokenSaga(): Generator<*, *, *> {
  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_FETCH_START)
  )

  // TODO:KS Get hardware token, we  would need to get the nonce from server by calling getProvisionToken API
  const hardwareToken = ''
  const domainDID: string = yield select(selectDomainDID)
  const verityFlowBaseUrl: string = yield select(selectVerityFlowBaseUrl)
  // get hardware token, if product decides to restrict access
  const [error, response]: [
    Error | null,
    null | { result: string }
  ] = yield call(
    flattenAsync(getSdkToken),
    hardwareToken,
    domainDID,
    verityFlowBaseUrl
  )
  if (error || !response) {
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL)
    )

    return [physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL, null]
  }

  const [tokenParseError, token] = flatJsonParse(response.result)
  if (tokenParseError || !token) {
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_PARSE_FAIL)
    )

    return [physicalIdProcessStatus.SDK_TOKEN_PARSE_FAIL, null]
  }

  // TODO: save apiDataCenter as well from the token response
  yield put(updatePhysicalIdSdkToken(token.sdkToken))
  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_FETCH_SUCCESS)
  )

  return [null, [token.sdkToken, token.apiDataCenter]]
}

export const selectPhysicalIdStatus = (state: Store) => state.physicalId.status

export const selectEnvironmentName = (state: Store) =>
  getEnvironmentName(state.config)

const PHYSICAL_ID_DID_STORAGE_KEY = 'PHYSICAL_ID_DID_STORAGE_KEY'
export function* removePersistedPhysicalIdDidSaga(): Generator<*, *, *> {
  try {
    yield put({ type: 'REMOVE_PHYSICAL_ID_DID_START' })
    yield call(secureDelete, PHYSICAL_ID_DID_STORAGE_KEY)
    yield put({ type: 'REMOVE_PHYSICAL_ID_DID_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'REMOVE_PHYSICAL_ID_DID_FAIL',
    })
  }
}

export function* hydratePhysicalIdDidSaga(): any {
  try {
    yield put({ type: 'HYDRATE_PHYSICAL_ID_DID_START' })
    const physicalIdDid: string = yield call(
      getHydrationItem,
      PHYSICAL_ID_DID_STORAGE_KEY
    )
    if (physicalIdDid) {
      yield put(hydratePhysicalIdDid(physicalIdDid))
      return physicalIdDid
    }
  } catch (e) {
    captureError(e)
    yield put({
      type: 'HYDRATE_PHYSICAL_ID_DID_FAIL',
    })
  }
}

export function* persistPhysicalIdDidSaga(
  physicalIdDid: string
): Generator<*, *, *> {
  try {
    yield put({ type: 'PERSIST_PHYSICAL_ID_DID_START' })
    yield call(secureSet, PHYSICAL_ID_DID_STORAGE_KEY, physicalIdDid)
    yield put({ type: 'PERSIST_PHYSICAL_ID_DID_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'PERSIST_PHYSICAL_ID_DID_FAIL',
    })
  }
}

export const hydratePhysicalIdDid = (physicalIdDid: string) => ({
  type: HYDRATE_PHYSICAL_ID_DID_SUCCESS,
  physicalIdDid,
})

export const removePhysicalIdDid = () => ({
  type: REMOVE_PHYSICAL_ID_DID,
})

export const resetPhysicalIdStatues = () => ({
  type: RESET_PHYSICAL_ID_STATUES,
})

function* watchPhysicalIdStart(): any {
  yield takeEvery(LAUNCH_PHYSICAL_ID_SDK, launchPhysicalIdSDKSaga)
}

export function* watchPhysicalId(): any {
  yield all([watchPhysicalIdStart()])
}

export default function physicalIdReducer(
  state: PhysicalIdStore = initialState,
  action: PhysicalIdStoreAction
) {
  switch (action.type) {
    case UPDATE_PHYSICAL_ID_PROCESS_STATUS:
      return {
        ...state,
        status: action.status,
        error: action.error ? action.error : null,
      }
    case UPDATE_PHYSICAL_ID_CONNECTION_STATUS:
      return {
        ...state,
        physicalIdConnectionStatus: action.status,
      }
    case PHYSICAL_ID_CONNECTION_ESTABLISHED:
    case HYDRATE_PHYSICAL_ID_DID_SUCCESS:
      return {
        ...state,
        physicalIdDid: action.physicalIdDid,
      }
    case REMOVE_PHYSICAL_ID_DID:
      return {
        ...state,
        physicalIdDid: null,
      }
    case RESET_PHYSICAL_ID_STATUES:
      return {
        ...state,
        status: initialState.status,
        error: initialState.error,
        physicalIdConnectionStatus: initialState.physicalIdConnectionStatus,
      }
    default:
      return state
  }
}
