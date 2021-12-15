// @flow
import {
  put,
  call,
  all,
  select,
  take,
  race,
  takeEvery,
  spawn,
  takeLeading,
} from 'redux-saga/effects'
import { NativeModules, Platform } from 'react-native'
import delay from '@redux-saga/delay-p'

import type {
  PhysicalIdStore,
  PhysicalIdStoreAction,
  LaunchPhysicalIdSDKAction,
  PhysicalIdProcessStatus,
  PhysicalIdConnectionStatus,
  SdkStatus,
} from './physical-id-type'
import type { CustomError } from '../common/type-common'
import type { Store } from '../store/type-store'
import type { InvitationPayload } from '../invitation/type-invitation'

import {
  LAUNCH_PHYSICAL_ID_SDK,
  UPDATE_PHYSICAL_ID_PROCESS_STATUS,
  physicalIdProcessStatus,
  ERROR_CONNECTION_DETAIL_INVALID,
  PHYSICAL_ID_CONNECTION_ESTABLISHED,
  HYDRATE_PHYSICAL_ID_DID_SUCCESS,
  REMOVE_PHYSICAL_ID_DID,
  physicalIdConnectionStatus,
  UPDATE_PHYSICAL_ID_CONNECTION_STATUS,
  ERROR_CONNECTION_DETAIL_FETCH_ERROR,
  ERROR_CONNECTION_FAIL,
  STOP_PHYSICAL_ID,
  PHYSICAL_ID_DOCUMENT_SUBMITTED,
  PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED,
  PHYSICAL_ID_SDK_INIT,
  UPDATE_SDK_INIT_STATUS,
  sdkStatus,
  ERROR_PHYSICAL_ID_SDK,
  PHYSICAL_ID_CONNECTION_START,
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
import { countriesCodeMap, documentNameMap } from './physical-id-constants'
import {
  GET_MESSAGES_FAIL,
  GET_MESSAGES_SUCCESS,
} from '../store/type-config-store'
import { uuid } from '../services/uuid'
import {
  androidDeviceCheckApiKey,
  iosGetDeviceCheckJWT,
} from '../external-imports'

const initialState = {
  sdkInitStatus: sdkStatus.IDLE,
  status: physicalIdProcessStatus.IDLE,
  error: null,
  physicalIdDid: null,
  physicalIdConnectionStatus: physicalIdConnectionStatus.IDLE,
  documentTypes: null,
  reports: null,
}

export const physicalIdSdkInit = () => ({
  type: PHYSICAL_ID_SDK_INIT,
})

export const physicalIdConnectionStart = () => ({
  type: PHYSICAL_ID_CONNECTION_START,
})

export const updateSdkInitStatus = (
  status: SdkStatus,
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

export const physicalIdConnectionEstablished = (physicalIdDid: string) => ({
  type: PHYSICAL_ID_CONNECTION_ESTABLISHED,
  physicalIdDid,
})

export const physicalIdDocumentSubmittedAction = (
  uid: string,
  documentType: string
) => ({
  type: PHYSICAL_ID_DOCUMENT_SUBMITTED,
  uid,
  documentType,
})

export const physicalIdDocumentIssuanceFailedAction = (
  uid: string,
  error: string
) => ({
  type: PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED,
  uid,
  error,
})

export function* ensureSdkInitSuccess(): Generator<*, *, *> {
  let status = yield select(selectSdkStatus)
  if (status === sdkStatus.SDK_INIT_SUCCESS) {
    // if already initialized, no need to process further
    return
  }

  if (
    [sdkStatus.IDLE, sdkStatus.SDK_INIT_FAIL, sdkStatus.SDK_USED].includes(
      status
    )
  ) {
    // if vcx init not started or vcx init failed and we want to init again
    yield put(physicalIdSdkInit())
  }

  // if we are here, that means we either started vcx init
  // or vcx init was already in progress and now we need to wait for success
  const result = yield race({
    success: take((action) => action.status === sdkStatus.SDK_INIT_SUCCESS),
    fail: take((action) => action.status === sdkStatus.SDK_INIT_FAIL),
    timeout: call(delay, 60000),
  })
  if (result && result.timeout) {
    yield put(
      updateSdkInitStatus(
        sdkStatus.SDK_INIT_FAIL,
        ERROR_PHYSICAL_ID_SDK('Unable to init SDK')
      )
    )
  }
  return result
}

function* launchPhysicalIdSDKSaga(
  action: LaunchPhysicalIdSDKAction
): Generator<*, *, *> {
  yield put(
    updatePhysicalIdStatus(
      physicalIdProcessStatus.SDK_DOCUMENT_VERIFICATION_START
    )
  )

  while (true) {
    let numberOfRetries = 0
    const result = yield* ensureSdkInitSuccess()
    if (result && (result.fail || result.timeout)) {
      if (numberOfRetries < 3) {
        // try to call terminate SDK, because that might also be the problem
        yield call(flattenAsync(terminateSDK))
        numberOfRetries++
        continue
      }
      yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_FAIL))
      return
    } else {
      break
    }
  }

  const selectedCountry = countriesCodeMap[action.country]

  // start SDK
  yield put(updateSdkInitStatus(sdkStatus.SDK_USED))
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_START))

  // TODO:KS Validate that the spelling and casing is as per need of MC SDK
  const document = documentNameMap[action.documentType]

  // ONE OME STUPID THING! We have to call it
  yield call(flattenAsync(midsGetDocumentTypes), selectedCountry)

  const [workflowIdError, workflowId] = yield call(
    flattenAsync(midsScanStart),
    document
  )

  if (Platform.OS === 'ios' && workflowId === 'DESTROY') {
    yield call(flattenAsync(terminateSDK))
    yield put(stopPhysicalId())
    return
  }

  if (workflowIdError || !workflowId) {
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_FAIL))
    return
  }
  yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_SUCCESS))

  let physicalIdDid: ?string = yield* getPhysicalIdDidSaga()
  if (!physicalIdDid) {
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_FAIL))
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
    physicalIdDid
  )
  if (relationshipIdError || !relationshipId) {
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL)
    )

    return
  }

  // get safety net token for android
  // get device check token for ios
  // add a new param to send data for android or ios
  let hardwareToken = ''
  // this is the token that we can get by calling a function of host app
  let platformJWT = ''
  if (Platform.OS === 'android') {
    hardwareToken = yield call(
      NativeModules.RNUtils.sendAttestationRequest,
      uuid(),
      androidDeviceCheckApiKey
    )
  }

  if (Platform.OS === 'ios') {
    hardwareToken = yield call(NativeModules.RNUtils.getDeviceCheckToken)
    try {
      // putting try catch here because host app
      // might not be returning the correct data type from the calling code
      const response = yield call(iosGetDeviceCheckJWT)
      // if host app returned an array which is expected, then we check for error and JWT
      if (Array.isArray(response) && response.length === 2) {
        if (response[0] !== null && response[1]) {
          // if we get an error while calling get jwt function,
          // then console.log error, fail here and return
          console.log(
            'API call to get JWT token failed with error.',
            response[0]
          )
          yield put(
            updatePhysicalIdStatus(
              physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL
            )
          )

          return
        }
        // since we got the data and no error, set the jwt value
        platformJWT = response[1]
      } else if (typeof response === 'string') {
        // if host app is only returning string as response, then use it as it is
        platformJWT = response
      } else {
        console.log(
          "Response to get jwt API call can either be in [error, jwt] format or a string jwt. We did not find any matching response type and also the promise was not rejected. Can't proceed further to submit document and issue credential."
        )
        yield put(
          updatePhysicalIdStatus(
            physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL
          )
        )

        return
      }
    } catch (e) {
      yield put(
        updatePhysicalIdStatus(
          physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL
        )
      )

      return
    }
  }

  // now we have connection, and we also have the workflow data
  // we can now issue the credential
  yield spawn(submitDocuments, {
    workflowId,
    connectionDID: relationshipId,
    hardwareToken,
    platform: Platform.OS,
    platformJWT,
    country: selectedCountry,
    document: action.documentType,
    domainDID,
    verityFlowBaseUrl,
    credDefId,
  })

  yield put(physicalIdDocumentSubmittedAction(workflowId, action.documentType))
  yield put(
    updatePhysicalIdStatus(
      physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_SUCCESS
    )
  )
}

function* submitDocuments(data: any): Generator<*, *, *> {
  const [issueCredentialError] = yield call(flattenAsync(issueCredential), data)
  if (issueCredentialError) {
    // something went wrong while asking to issue credential
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL)
    )
    // yield put(
    //   physicalIdDocumentIssuanceFailedAction(data.workflowId, issueCredentialError.message)
    // )
  }
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

async function terminateSDK() {
  return new Promise((resolve, reject) => {
    NativeModules.MIDSDocumentVerification.terminateSDK(resolve, reject)
  })
}

function* makeConnectionWithPhysicalIdSaga(): Generator<*, *, *> {
  // since we want to take data from connections store
  // we need to make sure that data is hydrated before we take data
  // from persisted stores
  yield* ensureAppHydrated()

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
    return null
  }

  let connectionStatus = yield select(selectConnectionStatus)
  if (
    connectionStatus ===
      physicalIdConnectionStatus.CONNECTION_DETAIL_FETCHING ||
    connectionStatus ===
      physicalIdConnectionStatus.CONNECTION_DETAIL_FETCH_SUCCESS ||
    connectionStatus === physicalIdConnectionStatus.CONNECTION_IN_PROGRESS
  ) {
    // if already in progress, no need to process further - wait for the in progress one
    const { fail, timeout } = yield race({
      success: take(NEW_CONNECTION_SUCCESS),
      fail: take(INVITATION_RESPONSE_FAIL),
      timeout: call(delay, 300000),
    })

    if (fail || timeout) {
      yield put(
        updatePhysicalIdConnectionStatus(
          physicalIdConnectionStatus.CONNECTION_FAIL
        )
      )
      return null
    }
    let physicalIdDid: ?string = yield select(selectPhysicalIdDid)
    if (!physicalIdDid) {
      return null
    }
  }

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
export const selectSdkStatus = (state: Store) => state.physicalId.sdkInitStatus
export const selectConnectionStatus = (state: Store) =>
  state.physicalId.physicalIdConnectionStatus

export function* initPhysicalIdSdkSaga(): Generator<*, *, *> {
  // check sdk status and init
  let status = yield select(selectSdkStatus)
  if (
    status === sdkStatus.SDK_INIT_SUCCESS ||
    status === sdkStatus.SDK_INIT_START
  ) {
    // if already initialized or in progress, no need to process further
    return
  }

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

  yield put(updateSdkInitStatus(sdkStatus.SDK_INIT_START))
  const [midsSdkInitError] = yield call(
    flattenAsync(midsSdkInit),
    sdkToken,
    apiDataCenter
  )
  if (midsSdkInitError) {
    yield put(updateSdkInitStatus(sdkStatus.SDK_INIT_FAIL))
    return
  }
  yield put(updateSdkInitStatus(sdkStatus.SDK_INIT_SUCCESS))
}

export function* getSdkTokenSaga(): Generator<*, *, *> {
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
    yield put(updateSdkInitStatus(sdkStatus.SDK_INIT_FAIL))
    return [sdkStatus.SDK_INIT_FAIL, null]
  }

  const [tokenParseError, token] = flatJsonParse(response.result)
  if (tokenParseError || !token) {
    yield put(updateSdkInitStatus(sdkStatus.SDK_INIT_FAIL))
    return [sdkStatus.SDK_INIT_FAIL, null]
  }

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

export const hydratePhysicalIdDid = (physicalIdDid: string) => ({
  type: HYDRATE_PHYSICAL_ID_DID_SUCCESS,
  physicalIdDid,
})

export const removePhysicalIdDid = () => ({
  type: REMOVE_PHYSICAL_ID_DID,
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
      cancel: take(STOP_PHYSICAL_ID),
    })
  })
}

export function* watchSdkInit(): any {
  yield takeLeading(PHYSICAL_ID_SDK_INIT, initPhysicalIdSdkSaga)
}

export function* watchPhysicalIdConnectionStart(): any {
  yield takeLeading(
    PHYSICAL_ID_CONNECTION_START,
    makeConnectionWithPhysicalIdSaga
  )
}

export function* watchPhysicalId(): any {
  yield all([
    watchSdkInit(),
    watchPhysicalIdStart(),
    watchPhysicalIdConnectionStart(),
  ])
}

export const selectPhysicalIdDid = (state: Store) =>
  state.physicalId.physicalIdDid

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
    case STOP_PHYSICAL_ID:
      return {
        ...state,
        error: null,
        sdkInitStatus: sdkStatus.IDLE,
        status: physicalIdProcessStatus.IDLE,
      }
    default:
      return state
  }
}
