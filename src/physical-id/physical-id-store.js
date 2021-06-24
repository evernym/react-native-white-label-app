// @flow
import {
  put,
  takeLatest,
  call,
  all,
  select,
  take,
  fork,
  race,
} from 'redux-saga/effects'
import { NativeModules } from 'react-native'

import {
  PhysicalIdStore,
  PhysicalIdStoreAction,
  LaunchPhysicalIdSDKAction,
  PhysicalIdProcessStatus,
  PhysicalIdConnectionStatus,
  HYDRATE_PHYSICAL_ID_SDK_TOKEN,
  ERROR_CONNECTION_DETAIL_FETCH_ERROR,
} from './physical-id-type'
import type { CustomError } from '../common/type-common'
import type { Store } from '../store/type-store'

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
} from './physical-id-type'
import {
  getSdkToken,
  getWorkflowData,
  getPhysicalIdInvitation,
} from './physical-id-api'
import { captureError } from '../services/error/error-handler'
import { secureDelete, getHydrationItem, secureSet } from '../services/storage'
import {
  invitationReceived,
  sendInvitationResponse,
} from '../invitation/invitation-store'
import { convertQrCodeToInvitation } from '../qr-code/qr-code'
import { ResponseType } from '../components/request/type-request'
import { QR_CODE_SENDER_DETAIL, QR_CODE_SENDER_DID } from '../api/api-constants'
import { ensureAppHydrated, getEnvironmentName } from '../store/config-store'
import { getUserPairwiseDid } from '../store/store-selector'
import { INVITATION_RESPONSE_FAIL } from '../invitation/type-invitation'
import { SERVER_ENVIRONMENT } from '../store/type-config-store'
import { NEW_CONNECTION_SUCCESS } from '../store/type-connection-store'
import { flattenAsync } from '../common/flatten-async'
import {
  getUrlData,
  isValidUrl,
} from '../components/qr-scanner/qr-code-types/qr-url'

const { JumioMobileSDKDocumentVerification } = NativeModules

const initialState = {
  status: physicalIdProcessStatus.IDLE,
  applicantId: null,
  error: null,
  physicalIdDid: null,
  physicalIdConnectionStatus: physicalIdConnectionStatus.IDLE,
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

export const launchPhysicalIdSDK = () => ({
  type: LAUNCH_PHYSICAL_ID_SDK,
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
  const [
    connectionError,
    connectionDid,
  ] = yield* makeConnectionWithPhysicalIdSaga()

  if (connectionError || !connectionDid) {
    yield put(
      updatePhysicalIdStatus(
        physicalIdProcessStatus.APPLICANT_ID_API_ERROR,
        connectionError
      )
    )
    return
  }

  const [tokenError, token]: [
    string | null,
    string | null
  ] = yield* getSdkTokenSaga()
  if (tokenError) {
    // action are already raised by sdk toke saga and status is also updated in above saga
    return
  }

  const apiSecret = yield* getPhysicalApiSecret()
  // TODO:KS for now, let's hard code the data center to US. We will choose data center dynamically on the basis of user country later
  const dataCenter = 'US'

  // Once we have connection and token, start SDK
  try {
    // init sdk
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_START))
    JumioMobileSDKDocumentVerification.initDocumentVerification(
      token,
      apiSecret,
      dataCenter,
      {
        type: action.documentType,
        userReference: connectionDid,
        customerInternalReference: connectionDid,
        country: action.country,
      }
    )

    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_SUCCESS))
  } catch (e) {
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_INIT_FAIL))
    return
  }

  try {
    // start SDK
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_START))
    JumioMobileSDKDocumentVerification.startDocumentVerification()

    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_SUCCESS))
  } catch (e) {
    yield put(updatePhysicalIdStatus(physicalIdProcessStatus.SDK_SCAN_FAIL))
    return
  }
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

  const [error, invitationDetails]: [
    Error | null,
    { invitation: string } | null
  ] = yield call(flattenAsync(getPhysicalIdInvitation))

  if (error || !invitationDetails.invitation) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_DETAIL_FETCH_ERROR,
        ERROR_CONNECTION_DETAIL_FETCH_ERROR(error.message)
      )
    )
    return [ERROR_CONNECTION_DETAIL_FETCH_ERROR(error.message), null]
  }

  const urlQrCode = isValidUrl(invitationDetails.invitation)
  if (!urlQrCode) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR,
        ERROR_CONNECTION_DETAIL_INVALID('Invalid invite')
      )
    )
    return [ERROR_CONNECTION_DETAIL_INVALID('Invalid invite'), null]
  }

  const [invitationParseError, invitationData] = yield call(
    flattenAsync(getUrlData),
    urlQrCode,
    invitationDetails.invitation
  )
  if (invitationParseError || !invitationData) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR,
        ERROR_CONNECTION_DETAIL_INVALID('Invalid invite')
      )
    )
    return [ERROR_CONNECTION_DETAIL_INVALID('Invalid invite json'), null]
  }

  yield put(
    updatePhysicalIdConnectionStatus(
      physicalIdConnectionStatus.CONNECTION_DETAIL_FETCH_SUCCESS
    )
  )
  yield put(
    invitationReceived({
      payload: convertQrCodeToInvitation(invitationData),
    })
  )
  physicalIdDid = invitationData[QR_CODE_SENDER_DETAIL][QR_CODE_SENDER_DID]
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
  const { fail } = yield race({
    success: take(NEW_CONNECTION_SUCCESS),
    fail: take(INVITATION_RESPONSE_FAIL),
  })
  if (fail) {
    yield put(
      updatePhysicalIdConnectionStatus(
        physicalIdConnectionStatus.CONNECTION_FAIL
      )
    )
    return
  }

  yield put(physicalIdConnectionEstablished(physicalIdDid))
  yield put(
    updatePhysicalIdConnectionStatus(
      physicalIdConnectionStatus.CONNECTION_SUCCESS
    )
  )
  yield* persistPhysicalIdDidSaga(physicalIdDid)
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

function* getPhysicalApiSecret(): Generator<*, *, *> {
  const environment: string = yield select(selectEnvironmentName)
  if (environment === SERVER_ENVIRONMENT.PROD) {
    // TODO:KS Ask question
    return 'prod-secret-key'
  }

  // TODO:KS Ask question
  return 'test-secret-key'
}

function* persistPhysicalIdSdkToken(sdkToken: string): Generator<*, *, *> {
  try {
    yield put({ type: 'PERSIST_PHYSICAL_ID_SDK_TOKEN_START' })
    yield call(secureSet, PHYSICAL_ID_SDK_TOKEN_STORAGE_KEY, sdkToken)
    yield put({ type: 'PERSIST_PHYSICAL_ID_SDK_TOKEN_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'PERSIST_PHYSICAL_ID_SDK_TOKEN_FAIL',
    })
  }
}

const selectPhysicalIdSdkToken = (state: Store) => state.physicalId.sdkToken

const selectPhysicalIdDid = (state: Store) => state.physicalId.physicalIdDid

function* getSdkTokenSaga(): Generator<*, *, *> {
  // TODO: Need to decide if we ca re-use same sdk token
  // or do we need to generate a new one every time
  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_FETCH_START)
  )
  // below code is only if we can persist old sdk token
  let oldSdkToken: ?string = yield select(selectPhysicalIdSdkToken)
  if (!oldSdkToken) {
    oldSdkToken = yield* hydratePhysicalIdSdkTokenSaga()
  }

  // get hardware token, if product decides to restrict access
  const [error, response]: [
    Error | null,
    null | { sdkToken: string }
  ] = yield call(flattenAsync(getSdkToken), oldSdkToken)
  if (error || !response) {
    yield put(
      updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL)
    )

    return [physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL, null]
  }

  yield put(updatePhysicalIdSdkToken(response.sdkToken))
  yield put(
    updatePhysicalIdStatus(physicalIdProcessStatus.SDK_TOKEN_FETCH_SUCCESS)
  )

  yield fork(persistPhysicalIdSdkToken, response.sdkToken)

  return [null, response.sdkToken]
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
  yield takeLatest(LAUNCH_PHYSICAL_ID_SDK, launchPhysicalIdSDKSaga)
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
