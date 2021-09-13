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
  GetSupportedDocumentTypesAction,
  SdkInitStatus,
} from './physical-id-type'
import type { CustomError } from '../common/type-common'
import type { Store } from '../store/type-store'
import type { InvitationPayload } from '../invitation/type-invitation'

import {
  LAUNCH_PHYSICAL_ID_SDK,
  UPDATE_PHYSICAL_ID_PROCESS_STATUS,
  physicalIdProcessStatus,
  UPDATE_PHYSICAL_ID_SDK_TOKEN,
  ERROR_CONNECTION_DETAIL_INVALID,
  PHYSICAL_ID_CONNECTION_ESTABLISHED,
  HYDRATE_PHYSICAL_ID_DID_SUCCESS,
  REMOVE_PHYSICAL_ID_DID,
  physicalIdConnectionStatus,
  UPDATE_PHYSICAL_ID_CONNECTION_STATUS,
  HYDRATE_PHYSICAL_ID_SDK_TOKEN,
  ERROR_CONNECTION_DETAIL_FETCH_ERROR,
  ERROR_CONNECTION_FAIL,
  STOP_PHYSICAL_ID,
  PHYSICAL_ID_DOCUMENT_SUBMITTED,
  PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED,
  SDK_INIT,
  GET_SUPPORTED_DOCUMENT_TYPES,
  GET_SUPPORTED_DOCUMENT_TYPES_SUCCESS,
  GET_SUPPORTED_DOCUMENT_TYPES_FAILED,
  RESET_PHYSICAL_ID_STATUES,
  UPDATE_SDK_INIT_STATUS,
  sdkInitStatus,
  ERROR_FETCH_DOCUMENT_TYPES_FAIL,
} from './physical-id-type'
import {
  getSdkToken,
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
  showSnackError,
} from '../store/config-store'
import {
  getConnectionByProp,
  getUserPairwiseDid,
} from '../store/store-selector'
import { INVITATION_RESPONSE_FAIL } from '../invitation/type-invitation'
import { NEW_CONNECTION_SUCCESS } from '../store/type-connection-store'
import { flattenAsync } from '../common/flatten-async'
import {
  getUrlData,
  isValidUrl,
} from '../components/qr-scanner/qr-code-types/qr-url'
import { convertQrCodeToAppInvitation } from '../components/qr-scanner/qr-code-converter'
import { flatJsonParse } from '../common/flat-json-parse'
import { countriesCodeMap } from './physical-id-countries-map'
import {
  GET_MESSAGES_FAIL,
  GET_MESSAGES_SUCCESS,
} from '../store/type-config-store'

const initialState = {
  sdkInitStatus: sdkInitStatus.IDLE,
  status: physicalIdProcessStatus.IDLE,
  applicantId: null,
  error: null,
  physicalIdDid: null,
  physicalIdConnectionStatus: physicalIdConnectionStatus.IDLE,
  sdkToken: null,
  documentTypes: null,
}

export const sdkInit = (
) => ({
  type: SDK_INIT,
})

export const updateSdkInitStatus = (
  status: SdkInitStatus,
  error: ?CustomError
) => ({
  type: UPDATE_SDK_INIT_STATUS,
  status,
  error,
})

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

export const physicalIdDocumentSubmittedAction = (uid: string, documentType: string) => ({
  type: PHYSICAL_ID_DOCUMENT_SUBMITTED,
  uid,
  documentType,
})

export const physicalIdDocumentIssuanceFailedAction = (uid: string, error: ?CustomError,) => ({
  type: PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED,
  uid,
  error,
})

export const getSupportedDocuments = (country: string) => ({
  type: GET_SUPPORTED_DOCUMENT_TYPES,
  country
})

export const getSupportedDocumentTypesSuccess = (documentTypes: [string]) => ({
  type: GET_SUPPORTED_DOCUMENT_TYPES_SUCCESS,
  documentTypes
})

export const getSupportedDocumentTypesFailed = (error: ?CustomError) => ({
  type: GET_SUPPORTED_DOCUMENT_TYPES_FAILED,
  error
})

export function* ensureSdkInitSuccess(): Generator<*, *, *> {
  let status = yield select(selectSdkStatus)
  if (status === sdkInitStatus.SDK_INIT_SUCCESS) {
    // if already initialized, no need to process further
    return
  }

  if ([sdkInitStatus.IDLE, sdkInitStatus.SDK_INIT_FAIL].includes(status)) {
    // if vcx init not started or vcx init failed and we want to init again
    yield put(sdkInit())
  }

  // if we are here, that means we either started vcx init
  // or vcx init was already in progress and now we need to wait for success
  return yield race({
    success: take(action => action.status === sdkInitStatus.SDK_INIT_SUCCESS),
    fail: take(action => action.status === sdkInitStatus.SDK_INIT_FAIL),
    timeout: call(delay, 30000),
  })
}

function* launchPhysicalIdSDKSaga(
  action: LaunchPhysicalIdSDKAction
): Generator<*, *, *> {
  // make connection with physical Id scanner in background
  const connectionTask = yield fork(makeConnectionWithPhysicalIdSaga)

  const result = yield* ensureSdkInitSuccess()
  if (result && (result.fail || result.timeout)) {
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_FAIL))
    return
  }

  const selectedCountry = countriesCodeMap[action.country]

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

  // init sdk again with new token for the next try
  yield spawn(initPhysicalIdSdkSaga)

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

  const domainDID: string = yield select(selectDomainDID)
  const verityFlowBaseUrl: string = yield select(selectVerityFlowBaseUrl)
  const credDefId: string = yield* getCredDefId(action.documentType)

  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_START)
  )

  // the relationshipId and connectionDID are different
  // Verity-flow backend needs a relationshipId to communicate with the Verity
  // so we get relationshipId from invitation
  const [relationshipIdError, relationshipId] = yield* getRelationshipId(
    connectionDID
  )
  if (relationshipIdError || !relationshipId) {
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL)
    )

    return
  }

  yield put(physicalIdDocumentSubmittedAction(
    workflowId,
    action.documentType,
  ))

  // TODO:KS Get a new hardware token here again, to make auth more stronger
  // now we have connection, and we also have the workflow data
  // we can now issue the credential
  const [issueCredentialError] = yield call(flattenAsync(issueCredential), {
    workflowId,
    connectionDID: relationshipId,
    hardwareToken: 'something-fails-for-now-till-we-add-auth',
    country: selectedCountry,
    document: action.documentType,
    domainDID,
    verityFlowBaseUrl,
    credDefId,
  })
  if (issueCredentialError) {
    // something went wrong while asking to issue credential
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL)
    )
    yield put(physicalIdDocumentIssuanceFailedAction(
      workflowId,
      issueCredentialError
    ))
    yield call(showSnackError, issueCredentialError.message)
    return
  }

  yield put(
    updatePhysicalIdStatus(
      physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_SUCCESS
    )
  )
}

function* getRelationshipId(connectionDID: string): Generator<*, *, *> {
  const connections = yield select(
    getConnectionByProp,
    'senderDID',
    connectionDID
  )
  if (connections.length === 0) {
    return ['NO_CONNECTION', null]
  }

  const connection = connections[0]
  if (!connection) {
    return ['NO_CONNECTION', null]
  }

  const [originalParseError, original] = flatJsonParse(connection.original)
  if (originalParseError || !original) {
    return [null, connectionDID]
  }

  if (!original.service || original.service.length === 0) {
    return [null, connectionDID]
  }

  const relationshipId = original.service[0].id.split(';')[0]
  if (relationshipId) {
    return [null, relationshipId]
  }

  return [null, connectionDID]
}

function* getCredDefId(documentType: string): Generator<*, *, *> {
  const credDefIdDocumentMap = {
    PASSPORT: 'passportCredDefId',
    DRIVING_LICENSE: 'drivingLicenseCredDefId',
    IDENTITY_CARD: 'identityCardCredDefId',
  }

  return yield select(
    (store: Store) => store.config[credDefIdDocumentMap[documentType]]
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
      getUrlData,
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

const selectDomainDID = (state: Store) => state.config.domainDID
const selectVerityFlowBaseUrl = (state: Store) => state.config.verityFlowBaseUrl
const selectSdkStatus = (state: Store) => state.physicalId.sdkInitStatus

export function* initPhysicalIdSdkSaga(): Generator<*, *, *> {
  const [tokenError, tokenResponse]: [
      string | null,
      [string, string] | null
  ] = yield* getSdkTokenSaga()

  if (tokenError || !tokenResponse) {
    // action are already raised by sdk toke saga and status is also updated in above saga
    return
  }

  // init sdk
  let [sdkToken, apiDataCenter] = tokenResponse
  yield put(updateSdkInitStatus(sdkInitStatus.SDK_INIT_START))
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_START))
  const [midsSdkInitError] = yield call(
    flattenAsync(midsSdkInit),
    sdkToken,
    apiDataCenter
  )
  if (midsSdkInitError) {
    yield put(updateSdkInitStatus(sdkInitStatus.SDK_INIT_FAIL))
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_FAIL))
    return
  }
  yield put(updateSdkInitStatus(sdkInitStatus.SDK_INIT_SUCCESS))
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_SUCCESS))
}

export function* getSdkTokenSaga(): Generator<*, *, *> {
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
    yield put(updateSdkInitStatus(sdkInitStatus.SDK_INIT_FAIL))
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL)
    )

    return [physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL, null]
  }

  const [tokenParseError, token] = flatJsonParse(response.result)
  if (tokenParseError || !token) {
    yield put(updateSdkInitStatus(sdkInitStatus.SDK_INIT_FAIL))
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

function* getSupportedDocumentTypesSaga(
  action: GetSupportedDocumentTypesAction
): Generator<*, *, *> {
  const result = yield* ensureSdkInitSuccess()
  if (result && (result.fail || result.timeout)) {
    yield put(getSupportedDocumentTypesFailed(ERROR_FETCH_DOCUMENT_TYPES_FAIL(action.country)))
    return
  }

  const country = countriesCodeMap[action.country]
  const [documentTypesError, documentTypes] = yield call(
    flattenAsync(midsGetDocumentTypes),
    country
  )
  if (documentTypesError || !documentTypes) {
    yield put(getSupportedDocumentTypesFailed(ERROR_FETCH_DOCUMENT_TYPES_FAIL(action.country)))
    return
  }

  const parsedDocumentTypes =
    documentTypes
      .substring(1, documentTypes.length - 1)
      .replace(/ /g, "")
      .split(",")

  yield put(getSupportedDocumentTypesSuccess(parsedDocumentTypes))
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

export const stopPhysicalId = () => ({
  type: STOP_PHYSICAL_ID,
})

// Redux-Saga has a method called race race.
// It will run 2 tasks, but when one finishes, it will automatically cancel the other. So
//  - watchPhysicalIdStart is always running
//  - Every time there's a LAUNCH_PHYSICAL_ID_SDK, start a race between launchPhysicalIdSDKSaga
//  and listening for the next STOP_PHYSICAL_ID action.
//  - When one of those tasks finishes, the other task is cancelled this is the behavior of race.
//  - The names "task" and "cancel" inside of race do not matter, they just help readability of the code
function* watchPhysicalIdStart(): any {
  yield takeEvery(LAUNCH_PHYSICAL_ID_SDK, function* (...args) {
    yield race({
      task: call(launchPhysicalIdSDKSaga, ...args),
      cancel: take(STOP_PHYSICAL_ID)
    })
  })
}

export function* watchSdkInit(): any {
  yield takeEvery(SDK_INIT, initPhysicalIdSdkSaga)
}

export function* watchGetSupportedDocuments(): any {
  yield takeEvery(GET_SUPPORTED_DOCUMENT_TYPES, getSupportedDocumentTypesSaga)
}

export function* watchPhysicalId(): any {
  yield all([watchSdkInit(), watchPhysicalIdStart(), watchGetSupportedDocuments()])
}

export const selectPhysicalIdDid = (state: Store) => state.physicalId.physicalIdDid

export const selectDocumentTypes = (state: Store) =>
  state.physicalId.documentTypes ?
    state.physicalId.documentTypes.data:
    null

export const selectDocumentTypesIsLoading = (state: Store) =>
  state.physicalId.documentTypes ?
    state.physicalId.documentTypes.isLoading:
    false

export const selectDocumentTypesError = (state: Store) =>
  state.physicalId.documentTypes ?
    state.physicalId.documentTypes.error:
    false

export default function physicalIdReducer(
  state: PhysicalIdStore = initialState,
  action: PhysicalIdStoreAction
) {
  switch (action.type) {
    case UPDATE_SDK_INIT_STATUS:
      return {
        ...state,
        sdkInitStatus: action.status,
        error: action.error ? action.error : null,
      }
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
        error: initialState.error,
      }
    case GET_SUPPORTED_DOCUMENT_TYPES:
      return {
        ...state,
        documentTypes: {
          data: [],
          isLoading: true,
          error: null,
        },
      }
    case GET_SUPPORTED_DOCUMENT_TYPES_SUCCESS:
      return {
        ...state,
        documentTypes: {
          data: action.documentTypes,
          isLoading: false,
          error: null,
        },
      }
    case GET_SUPPORTED_DOCUMENT_TYPES_FAILED:
      return {
        ...state,
        documentTypes: {
          data: [],
          isLoading: false,
          error: action.error,
        },
      }
    case STOP_PHYSICAL_ID:
      return {
        ...state,
        applicantId: null,
        error: null,
        physicalIdDid: null,
        sdkToken: null,
        documentTypes: null,
      }
    default:
      return state
  }
}
