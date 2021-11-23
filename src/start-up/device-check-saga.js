// @flow

import { Platform, NativeModules } from 'react-native'
import { call, put, takeLeading } from 'redux-saga/effects'
import jwtDecode from 'jwt-decode'

import { flattenAsync } from '../common/flatten-async'
import { androidDeviceCheckApiKey } from '../external-imports'

const { RNIndy } = NativeModules

function* checkDeviceSecurityWorker() {
  if (__DEV__ || !androidDeviceCheckApiKey) {
    // 1. If we are in development environment, then we don't need to validate device security
    // also if we validate device security in dev environment,
    // then we won't be able to run on simulators
    // 2. If there is no android API key, then also we don't need to validate device security
    yield put({ type: DEVICE_SECURITY_OK })
    return
  }

  yield put({ type: DEVICE_SECURITY_CHECK_IN_PROGRESS })

  if (Platform.OS === 'android') {
    const [playServiceError, playServiceStatus] = yield call(
      flattenAsync(RNIndy.getGooglePlayServicesStatus)
    )
    if (
      playServiceError ||
      playServiceStatus === GooglePlayServicesStatus.GMS_DISABLED ||
      playServiceStatus === GooglePlayServicesStatus.INVALID
    ) {
      yield put({ type: PLAY_SERVICE_NOT_AVAILABLE })
      return
    }

    if (playServiceStatus === GooglePlayServicesStatus.GMS_NEED_UPDATE) {
      yield put({ type: PLAY_SERVICE_NEED_UPDATE })
      return
    }

    // generate nonce
    const [nonceError, nonce] = yield call(
      flattenAsync(RNIndy.generateNonce),
      NONCE_LENGTH
    )
    if (nonceError) {
      yield put({ type: DEVICE_SECURITY_CHECK_FAILED })
      return
    }

    const [attestError, attestJws] = yield call(
      flattenAsync(RNIndy.sendAttestationRequest),
      nonce,
      androidDeviceCheckApiKey
    )
    if (attestError || !attestJws) {
      yield put({ type: DEVICE_SECURITY_CHECK_FAILED })
      return
    }

    const payload = jwtDecode(attestJws)
    if (!payload.ctsProfileMatch || !payload.basicIntegrity) {
      yield put({ type: DEVICE_SECURITY_CHECK_FAILED })
      return
    }

    yield put({ type: DEVICE_SECURITY_OK })
    return
  }

  if (Platform.OS === 'ios') {
    const [deviceCheckTokenError] = yield call(
      flattenAsync(NativeModules.RNIndy.getDeviceCheckToken)
    )

    if (deviceCheckTokenError) {
      yield put({ type: DEVICE_SECURITY_CHECK_FAILED })
      return
    }

    yield put({ type: DEVICE_SECURITY_OK })
    return
  }

  yield put({ type: DEVICE_SECURITY_OK })
  return
}

export async function getDeviceAttestation(
  nonce: string
): Promise<null | string> {
  if (Platform.OS === 'android') {
    const [androidTokenError, androidToken] = await flattenAsync(
      RNIndy.sendAttestationRequest
    )(nonce, androidDeviceCheckApiKey)
    if (androidTokenError) {
      return null
    }

    return androidToken
  }

  if (Platform.OS === 'ios') {
    const [iosTokenError, iosToken] = await flattenAsync(
      NativeModules.RNIndy.getDeviceCheckToken
    )
    if (iosTokenError) {
      return null
    }

    return iosToken
  }

  return null
}

export function* checkDeviceSecuritySaga(): Generator<*, *, *> {
  yield takeLeading(START_DEVICE_SECURITY_CHECK, checkDeviceSecurityWorker)
}

export function deviceCheckReducer(
  state: DeviceCheckState = DEVICE_SECURITY_CHECK_IDLE,
  action: DeviceCheckActions
) {
  return action.type ? action.type : state
}

export const START_DEVICE_SECURITY_CHECK = 'START_DEVICE_SECURITY_CHECK'
export const DEVICE_SECURITY_CHECK_IDLE = 'DEVICE_SECURITY_CHECK_IDLE'
export const DEVICE_SECURITY_OK = 'DEVICE_SECURITY_OK'
export const PLAY_SERVICE_NOT_AVAILABLE = 'PLAY_SERVICE_NOT_AVAILABLE'
export const PLAY_SERVICE_NEED_UPDATE = 'PLAY_SERVICE_NEED_UPDATE'
export const DEVICE_SECURITY_CHECK_FAILED = 'DEVICE_SECURITY_CHECK_FAILED'
export const DEVICE_SECURITY_CHECK_IN_PROGRESS =
  'DEVICE_SECURITY_CHECK_IN_PROGRESS'

const NONCE_LENGTH = 20

export type DeviceCheckState =
  | typeof DEVICE_SECURITY_CHECK_IDLE
  | typeof DEVICE_SECURITY_OK
  | typeof PLAY_SERVICE_NOT_AVAILABLE
  | typeof PLAY_SERVICE_NEED_UPDATE
  | typeof DEVICE_SECURITY_CHECK_FAILED
  | typeof DEVICE_SECURITY_CHECK_IN_PROGRESS
type DeviceCheckActions =
  | { type: typeof DEVICE_SECURITY_CHECK_IDLE }
  | { type: typeof DEVICE_SECURITY_OK }
  | { type: typeof PLAY_SERVICE_NOT_AVAILABLE }
  | { type: typeof PLAY_SERVICE_NEED_UPDATE }
  | { type: typeof DEVICE_SECURITY_CHECK_FAILED }
  | { type: typeof DEVICE_SECURITY_CHECK_IN_PROGRESS }

export const GooglePlayServicesStatus = {
  AVAILABLE: 10,
  GMS_DISABLED: 20,
  GMS_NEED_UPDATE: 21,
  INVALID: 30,
}
