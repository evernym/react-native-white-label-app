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

import type {
  OnfidoStore,
  OnfidoStoreAction,
  LaunchOnfidoSDKAction,
  OnfidoProcessStatus,
  OnfidoConnectionStatus,
} from './type-onfido'
import type { CustomError, GenericObject } from '../common/type-common'
import type { Store } from '../store/type-store'
import type { QrCodeShortInvite } from '../components/qr-scanner/type-qr-scanner'

import {
  LAUNCH_ONFIDO_SDK,
  UPDATE_ONFIDO_PROCESS_STATUS,
  onfidoProcessStatus,
  ERROR_ONFIDO_APPLICANT_ID_API,
  HYDRATE_ONFIDO_APPLICANT_ID_SUCCESS,
  UPDATE_ONFIDO_APPLICANT_ID,
  ERROR_MESSAGE_NO_APPLICANT_ID,
  ERROR_ONFIDO_SDK,
  ERROR_CONNECTION_DETAIL_INVALID,
  ONFIDO_CONNECTION_ESTABLISHED,
  HYDRATE_ONFIDO_DID_SUCCESS,
  REMOVE_ONFIDO_DID,
  GET_APPLICANT_ID,
  onfidoConnectionStatus,
  UPDATE_ONFIDO_CONNECTION_STATUS,
  RESET_ONFIDO_STATUES,
} from './type-onfido'
import {
  getApplicantId as getApplicantIdApi,
  getCheckUuid,
  getOnfidoInvitation,
} from './onfido-api'
import { captureError } from '../services/error/error-handler'
import { secureDelete, getHydrationItem, secureSet } from '../services/storage'
import { isValidShortInviteQrCode } from '../components/qr-scanner/qr-code-types/qr-code-short-invite'
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

const initialState = {
  status: onfidoProcessStatus.IDLE,
  applicantId: null,
  error: null,
  onfidoDid: null,
  onfidoConnectionStatus: onfidoConnectionStatus.IDLE,
}

// although this seems like a big issue that we are committing this token
// directly in source code, there is actually no issue with this
// because even if people get this token, the most that they can do
// is launch onFido SDK in their mobile app, and then scan documents
// and scanned documents would only show up in our account if onfido approves
// those documents
// Having said above things, we have to discuss this with onFido team
// because onFido team suggested this approach
const testToken = 'test_iePALvXVOtTzKLuySX5kzN8nyGmPNYRK'
const prodToken = 'live_z7RRdU1p3SJZHk9mdfnoGaxH5bMrm3KM'

export const updateOnfidoStatus = (
  status: OnfidoProcessStatus,
  error: ?CustomError
) => ({
  type: UPDATE_ONFIDO_PROCESS_STATUS,
  status,
  error,
})

export const updateOnfidoConnectionStatus = (
  status: OnfidoConnectionStatus,
  error: ?CustomError
) => ({
  type: UPDATE_ONFIDO_CONNECTION_STATUS,
  status,
  error,
})

export const launchOnfidoSDK = () => ({
  type: LAUNCH_ONFIDO_SDK,
})

export const onfidoConnectionEstablished = (onfidoDid: string) => ({
  type: ONFIDO_CONNECTION_ESTABLISHED,
  onfidoDid,
})

const ONFIDO_APPLICANT_ID_STORAGE_KEY = 'ONFIDO_APPLICANT_ID_STORAGE_KEY'
export function* removePersistedOnfidoApplicantIdSaga(): Generator<*, *, *> {
  try {
    yield put({ type: 'REMOVE_ONFIDO_APPLICANT_ID_START' })
    yield call(secureDelete, ONFIDO_APPLICANT_ID_STORAGE_KEY)
    yield put({ type: 'REMOVE_ONFIDO_APPLICANT_ID_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'REMOVE_ONFIDO_APPLICANT_ID_FAIL',
    })
  }
}

export function* hydrateOnfidoApplicantIdSaga(): any {
  try {
    yield put({ type: 'HYDRATE_ONFIDO_APPLICANT_ID_START' })
    const applicantId: string = yield call(
      getHydrationItem,
      ONFIDO_APPLICANT_ID_STORAGE_KEY
    )
    if (applicantId) {
      yield put(hydrateApplicantId(applicantId))
      return applicantId
    }
    yield put({ type: 'HYDRATE_ONFIDO_APPLICANT_ID_NOT_FOUND' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'HYDRATE_ONFIDO_APPLICANT_ID_FAIL',
    })
  }
}

export function* persistOnfidoApplicantId(
  applicantId: string
): Generator<*, *, *> {
  try {
    yield put({ type: 'PERSIST_ONFIDO_APPLICANT_ID_START' })
    yield call(secureSet, ONFIDO_APPLICANT_ID_STORAGE_KEY, applicantId)
    yield put({ type: 'PERSIST_ONFIDO_APPLICANT_ID_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'PERSIST_ONFIDO_APPLICANT_ID_FAIL',
    })
  }
}

export const hydrateApplicantId = (applicantId: string) => ({
  type: HYDRATE_ONFIDO_APPLICANT_ID_SUCCESS,
  applicantId,
})

export const updateOnfidoApplicantId = (applicantId: string) => ({
  type: UPDATE_ONFIDO_APPLICANT_ID,
  applicantId,
})

export const selectOnfidoApplicantId = (state: Store) =>
  state.onfido.applicantId

export const selectOnfidoDid = (state: Store) => state.onfido.onfidoDid

export function* getApplicantIdSaga(): Generator<*, *, *> {
  // we need to generate new applicant id every time we want to start onfido sdk
  // also, we need to pass old applicant id as first name if we already have
  // applicant id
  yield put(updateOnfidoStatus(onfidoProcessStatus.APPLICANT_ID_FETCHING))
  let oldApplicantId: ?string = yield select(selectOnfidoApplicantId)
  if (!oldApplicantId) {
    oldApplicantId = yield* hydrateOnfidoApplicantIdSaga()
  }

  // check if connection is established with onfido
  let onfidoDid: ?string = yield* getOnfidoDidSaga()
  // if connection with onfido was not established
  // and we created applicant id, that means
  // connect.me has created applicant but onfido does not have connection
  // so, we can't pass applicant id as first_name unless connect.me
  // is sure about successful connection establishment and applicant id
  if (!onfidoDid) {
    oldApplicantId = null
  }
  const token: string = yield* getOnfidoToken()
  const response: { id: string } = yield call(
    getApplicantIdApi,
    oldApplicantId,
    token
  )
  if (response && response.id) {
    yield put(updateOnfidoApplicantId(response.id))
    yield call(persistOnfidoApplicantId, response.id)
    yield put(updateOnfidoStatus(onfidoProcessStatus.APPLICANT_ID_SUCCESS))

    return response.id
  }

  throw new Error(ERROR_MESSAGE_NO_APPLICANT_ID)
}

function promisifyOnfidoStartSDK(applicantId: string, token: string) {
  return new Promise((resolve, reject) => {
    NativeModules.OnfidoSDK.startSDK(
      applicantId,
      token,
      (id) => resolve(id),
      (error) => reject(new Error(error))
    )
  })
}

export function* launchOnfidoSDKSaga(
  action: LaunchOnfidoSDKAction
): Generator<*, *, *> {
  try {
    const applicantId: string = yield* getApplicantIdSaga()
    // make connection with onfido in background
    yield fork(makeConnectionWithOnfidoSaga, applicantId)

    try {
      yield put(updateOnfidoStatus(onfidoProcessStatus.START_NO_CONNECTION))
      const token: string = yield* getOnfidoToken()
      yield call(promisifyOnfidoStartSDK, applicantId, token)
      yield put(updateOnfidoStatus(onfidoProcessStatus.CHECK_UUID_FETCHING))
      try {
        const checkUuid: string | { error: { message: string } } = yield call(
          getCheckUuid,
          applicantId,
          token
        )
        if (checkUuid.error && checkUuid.error.message) {
          throw new Error(checkUuid.error.message)
        }
        yield put(updateOnfidoStatus(onfidoProcessStatus.CHECK_UUID_SUCCESS))
      } catch (e) {
        yield put(updateOnfidoStatus(onfidoProcessStatus.CHECK_UUID_ERROR))
      }
    } catch (e) {
      yield put(
        updateOnfidoStatus(
          onfidoProcessStatus.SDK_ERROR,
          ERROR_ONFIDO_SDK(e.message)
        )
      )
    }
  } catch (e) {
    yield put(
      updateOnfidoStatus(
        onfidoProcessStatus.APPLICANT_ID_API_ERROR,
        ERROR_ONFIDO_APPLICANT_ID_API(e.message)
      )
    )
  }
}

export function* makeConnectionWithOnfidoSaga(
  applicantId: string
): Generator<*, *, *> {
  try {
    // if connection is already established, then don't make connection again
    let onfidoDid: ?string = yield* getOnfidoDidSaga()
    if (onfidoDid) {
      yield put(
        updateOnfidoConnectionStatus(onfidoConnectionStatus.CONNECTION_SUCCESS)
      )
      return
    }

    // create connection because no connection is established or
    // user deleted connection that was established
    yield put(
      updateOnfidoConnectionStatus(
        onfidoConnectionStatus.CONNECTION_DETAIL_FETCHING
      )
    )
    const token: string = yield* getOnfidoToken()
    const invitationDetails: {
      invite: GenericObject,
      state: string,
    } = yield call(getOnfidoInvitation, applicantId, token)

    if (!invitationDetails.invite) {
      yield put(
        updateOnfidoConnectionStatus(
          onfidoConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR,
          ERROR_CONNECTION_DETAIL_INVALID('No invite found')
        )
      )
      return
    }
    const invitationData:
      | QrCodeShortInvite
      | boolean = isValidShortInviteQrCode(invitationDetails.invite)
    if (!invitationData || typeof invitationData !== 'object') {
      yield put(
        updateOnfidoConnectionStatus(
          onfidoConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR,
          ERROR_CONNECTION_DETAIL_INVALID('Invalid invite json')
        )
      )
      return
    }
    yield put(
      updateOnfidoConnectionStatus(
        onfidoConnectionStatus.CONNECTION_DETAIL_FETCH_SUCCESS
      )
    )
    yield put(
      invitationReceived({
        payload: convertQrCodeToInvitation(invitationData),
      })
    )
    onfidoDid = invitationData[QR_CODE_SENDER_DETAIL][QR_CODE_SENDER_DID]
    yield put(
      sendInvitationResponse({
        response: ResponseType.accepted,
        senderDID: onfidoDid,
      })
    )
    yield put(
      updateOnfidoConnectionStatus(
        onfidoConnectionStatus.CONNECTION_IN_PROGRESS
      )
    )
    const { fail } = yield race({
      success: take(NEW_CONNECTION_SUCCESS),
      fail: take(INVITATION_RESPONSE_FAIL),
    })
    if (fail) {
      yield put(
        updateOnfidoConnectionStatus(onfidoConnectionStatus.CONNECTION_FAIL)
      )
      return
    }

    yield put(onfidoConnectionEstablished(onfidoDid))
    yield put(
      updateOnfidoConnectionStatus(onfidoConnectionStatus.CONNECTION_SUCCESS)
    )
    yield* persistOnfidoDidSaga(onfidoDid)
  } catch (e) {
    yield put(
      updateOnfidoConnectionStatus(
        onfidoConnectionStatus.CONNECTION_DETAIL_FETCH_ERROR
      )
    )
  }
}

export function* getOnfidoDidSaga(): Generator<*, *, *> {
  let onfidoDid: ?string = yield select(selectOnfidoDid)
  if (!onfidoDid) {
    onfidoDid = yield* hydrateOnfidoDidSaga()
  }

  if (!onfidoDid) {
    return null
  }

  // since we want to take data from connections store
  // we need to make sure that data is hydrated before we take data
  // from persisted stores
  yield* ensureAppHydrated()
  const userPairwiseDid: ?string = yield select(getUserPairwiseDid, onfidoDid)
  if (userPairwiseDid) {
    return onfidoDid
  }

  // if we have onfidoDid, but no corresponding user pairwise did
  // then user might have deleted the connection that was established
  // so, we reset onfido did as well
  yield put(removeOnfidoDid())
  yield* removePersistedOnfidoDidSaga()
  return null
}

export function* getOnfidoToken(): Generator<*, *, *> {
  const environment: string = yield select(selectEnvironmentName)
  if (environment === SERVER_ENVIRONMENT.PROD) {
    return prodToken
  }

  return testToken
}

export const selectOnfidoStatus = (state: Store) => state.onfido.status

export const selectEnvironmentName = (state: Store) =>
  getEnvironmentName(state.config)

const ONFIDO_DID_STORAGE_KEY = 'ONFIDO_DID_STORAGE_KEY'
export function* removePersistedOnfidoDidSaga(): Generator<*, *, *> {
  try {
    yield put({ type: 'REMOVE_ONFIDO_DID_START' })
    yield call(secureDelete, ONFIDO_DID_STORAGE_KEY)
    yield put({ type: 'REMOVE_ONFIDO_DID_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'REMOVE_ONFIDO_DID_FAIL',
    })
  }
}

export function* hydrateOnfidoDidSaga(): any {
  try {
    yield put({ type: 'HYDRATE_ONFIDO_DID_START' })
    const onfidoDid: string = yield call(
      getHydrationItem,
      ONFIDO_DID_STORAGE_KEY
    )
    if (onfidoDid) {
      yield put(hydrateOnfidoDid(onfidoDid))
      return onfidoDid
    }
  } catch (e) {
    captureError(e)
    yield put({
      type: 'HYDRATE_ONFIDO_DID_FAIL',
    })
  }
}

export function* persistOnfidoDidSaga(onfidoDid: string): Generator<*, *, *> {
  try {
    yield put({ type: 'PERSIST_ONFIDO_DID_START' })
    yield call(secureSet, ONFIDO_DID_STORAGE_KEY, onfidoDid)
    yield put({ type: 'PERSIST_ONFIDO_DID_SUCCESS' })
  } catch (e) {
    captureError(e)
    yield put({
      type: 'PERSIST_ONFIDO_DID_FAIL',
    })
  }
}

export const hydrateOnfidoDid = (onfidoDid: string) => ({
  type: HYDRATE_ONFIDO_DID_SUCCESS,
  onfidoDid,
})

export const removeOnfidoDid = () => ({
  type: REMOVE_ONFIDO_DID,
})

export const getApplicantId = () => ({
  type: GET_APPLICANT_ID,
})

export const resetOnfidoStatues = () => ({
  type: RESET_ONFIDO_STATUES,
})

function* watchOnfidoStart(): any {
  yield takeLatest(LAUNCH_ONFIDO_SDK, launchOnfidoSDKSaga)
}

export function* watchOnfido(): any {
  yield all([watchOnfidoStart()])
}

export default function onfidoReducer(
  state: OnfidoStore = initialState,
  action: OnfidoStoreAction
) {
  switch (action.type) {
    case UPDATE_ONFIDO_PROCESS_STATUS:
      return {
        ...state,
        status: action.status,
        error: action.error ? action.error : null,
      }
    case UPDATE_ONFIDO_CONNECTION_STATUS:
      return {
        ...state,
        onfidoConnectionStatus: action.status,
      }
    case UPDATE_ONFIDO_APPLICANT_ID:
      return {
        ...state,
        applicantId: action.applicantId,
      }
    case HYDRATE_ONFIDO_APPLICANT_ID_SUCCESS:
      // if we already have applicant id even before we can hydrate
      // then we don't need to update value from hydration
      if (state.applicantId) {
        return state
      }

      return {
        ...state,
        applicantId: action.applicantId,
      }
    case ONFIDO_CONNECTION_ESTABLISHED:
    case HYDRATE_ONFIDO_DID_SUCCESS:
      return {
        ...state,
        onfidoDid: action.onfidoDid,
      }
    case REMOVE_ONFIDO_DID:
      return {
        ...state,
        onfidoDid: null,
      }
    case RESET_ONFIDO_STATUES:
      return {
        ...state,
        status: initialState.status,
        error: initialState.error,
        onfidoConnectionStatus: initialState.onfidoConnectionStatus,
      }
    default:
      return state
  }
}
