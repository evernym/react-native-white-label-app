// @flow
import moment from 'moment'
import delay from '@redux-saga/delay-p'
import { put, takeLatest, take, call, all } from 'redux-saga/effects'
import type { CustomError } from '../common/type-common'
import {
  PENDING_REDIRECT,
  CLEAR_PENDING_REDIRECT,
  SET_PIN,
  LOCK_ENABLE,
  LOCK_FAIL,
  CHECK_PIN,
  CHECK_PIN_FAIL,
  CHECK_PIN_IDLE,
  CHECK_PIN_SUCCESS,
  UNLOCK_APP,
  LONG_PRESSED_IN_LOCK_SELECTION_SCREEN,
  PRESSED_ON_OR_IN_LOCK_SELECTION_SCREEN,
  SHOW_DEV_MODE,
  HIDE_DEV_MODE,
  ENABLE_TOUCHID,
  DISABLE_TOUCHID,
  CHECK_TOUCHID,
  TOUCH_ID_STORAGE_KEY,
  PIN_ENABLED_KEY,
  IN_RECOVERY,
  PIN_HASH,
  PUT_PIN_FAIL_DATA,
  PUT_PIN_FAIL_DATA_SUCCESS,
  SALT,
  NUMBER_OF_FAILED_PIN_ATTEMPTS,
  RECORDED_TIME_OF_PIN_FAILED_ATTEMPT,
} from './type-lock'
import type {
  PendingRedirection,
  LockStore,
  AddPendingRedirectAction,
  ClearPendingRedirectAction,
  SetPinAction,
  LockEnable,
  InRecovery,
  LockFail,
  CheckPinAction,
  CheckPinFailAction,
  CheckPinSuccessAction,
  LockActions,
  UnlockAppAction,
  CheckPinIdleAction,
  LongPressedInLockSelectionScreen,
  PressedOnOrInLockSelectionScreen,
  EnableDevMode,
  DisableDevMode,
  CheckTouchIdAction,
  EnableTouchIdAction,
  DisableTouchIdAction,
  PutPinFailDataAction,
} from './type-lock'
import {
  secureSet,
  safeGet,
  safeSet,
  getHydrationItem,
} from '../services/storage'
import { pinHash, generateSalt } from './pin-hash'
import { ensureVcxInitAndPoolConnectSuccess } from '../store/route-store'
import { captureError } from '../services/error/error-handler'

const initialState: LockStore = {
  pendingRedirection: null,
  checkPinStatus: CHECK_PIN_IDLE,
  numberOfFailedPinAttempts: 0,
  recordedTimeOfPinFailedAttempt: '',
  numberOfAttemptsMessage: '',
  lockdownTimeMessage: '',
  shouldLockApp: false,
  // we are assuming that app will be locked by default
  // and it will be unlocked either when user set security first time
  // or user unlock the app every time user opens the app
  // this property needs to be set accordingly
  isAppLocked: true,
  isLockEnabled: 'false',
  inRecovery: 'false',
  isTouchIdEnabled: false,
  showDevMode: false,
  error: {
    code: null,
    message: null,
  },
  pendingRedirectionParams: {},
}

export function addPendingRedirection(
  pendingRedirection: Array<PendingRedirection>
): AddPendingRedirectAction {
  return {
    type: PENDING_REDIRECT,
    pendingRedirection,
  }
}

export const clearPendingRedirect = (): ClearPendingRedirectAction => ({
  type: CLEAR_PENDING_REDIRECT,
})

export const setPinAction = (pin: string): SetPinAction => ({
  type: SET_PIN,
  pin,
})

export const lockEnable = (isLockEnable: string): LockEnable => ({
  type: LOCK_ENABLE,
  isLockEnable,
})

export const setInRecovery = (inRecovery: string): InRecovery => ({
  type: IN_RECOVERY,
  inRecovery,
})

export const lockFail = (error: CustomError): LockFail => ({
  type: LOCK_FAIL,
  error,
})

export const putPinFailData = (): PutPinFailDataAction => ({
  type: PUT_PIN_FAIL_DATA,
})

export function* setPin(action: SetPinAction): Generator<*, *, *> {
  try {
    const salt: string = yield call(generateSalt, true)
    const hashedPin: string = yield call(pinHash, action.pin.toString(), salt)
    yield call(secureSet, PIN_HASH, hashedPin)
    yield call(secureSet, SALT, salt)
    yield call(safeSet, PIN_ENABLED_KEY, 'true')
    yield call(safeSet, IN_RECOVERY, 'false')
    yield put(lockEnable('true'))
  } catch (e) {
    captureError(e)
    yield put(lockFail(e))
  }
}

export const enableTouchIdAction = () => ({
  type: ENABLE_TOUCHID,
})
export const disableTouchIdAction = (): DisableTouchIdAction => ({
  type: DISABLE_TOUCHID,
})

export function* enableTouchId(
  action: EnableTouchIdAction
): Generator<*, *, *> {
  try {
    yield call(safeSet, TOUCH_ID_STORAGE_KEY, 'true')
  } catch (e) {
    yield e
  }
}

export function* disableTouchId(
  action: DisableTouchIdAction
): Generator<*, *, *> {
  try {
    yield call(safeSet, TOUCH_ID_STORAGE_KEY, 'false')
  } catch (e) {
    yield e
  }
}

export function* getPinFailDataSaga(): Generator<*, *, *> {
  while (true) {
    const numberOfFailedPinAttemptsString: string = yield call(
      safeGet,
      NUMBER_OF_FAILED_PIN_ATTEMPTS
    )
    const numberOfFailedPinAttempts: number = parseInt(
      numberOfFailedPinAttemptsString
    )
    const recordedTimeOfPinFailedAttempt = yield call(
      safeGet,
      RECORDED_TIME_OF_PIN_FAILED_ATTEMPT
    )

    const now = moment().valueOf()
    const timePassed =
      (now - moment(recordedTimeOfPinFailedAttempt).valueOf()) / 1000 / 60

    const failedPinAttemptsToLockdownTimes = {
      '4': 1,
      '6': 3,
      '8': 15,
      '9': 60,
      '10': 1440,
    }

    if (!isNaN(numberOfFailedPinAttempts)) {
      if (numberOfFailedPinAttempts === 0) return

      if (
        numberOfFailedPinAttempts === 1 ||
        numberOfFailedPinAttempts === 2 ||
        numberOfFailedPinAttempts === 3 ||
        numberOfFailedPinAttempts === 5 ||
        numberOfFailedPinAttempts === 7
      ) {
        yield put({
          type: PUT_PIN_FAIL_DATA_SUCCESS,
          numberOfAttemptsMessage: `${numberOfFailedPinAttempts} failed attempt${
            numberOfFailedPinAttempts > 1 ? 's.' : '.'
          }`,
          lockdownTimeMessage: '',
          shouldLockApp: false,
        })
        return
      } else if (
        (numberOfFailedPinAttempts === 4 && timePassed >= 1) ||
        (numberOfFailedPinAttempts === 6 && timePassed >= 3) ||
        (numberOfFailedPinAttempts === 8 && timePassed >= 15) ||
        (numberOfFailedPinAttempts === 9 && timePassed >= 60) ||
        (numberOfFailedPinAttempts === 10 && timePassed >= 1440)
      ) {
        yield put({
          type: PUT_PIN_FAIL_DATA_SUCCESS,
          numberOfAttemptsMessage: '',
          lockdownTimeMessage: '',
          shouldLockApp: false,
        })
        return
      } else if (numberOfFailedPinAttempts === 11) {
        yield put({
          type: PUT_PIN_FAIL_DATA_SUCCESS,
          numberOfAttemptsMessage: 'Too many failed attempts.',
          lockdownTimeMessage: 'App is permanently locked.',
          shouldLockApp: true,
        })
        return
      } else {
        const lockdownTime =
          failedPinAttemptsToLockdownTimes[numberOfFailedPinAttempts.toString()]
        yield put({
          type: PUT_PIN_FAIL_DATA_SUCCESS,
          numberOfAttemptsMessage: `${numberOfFailedPinAttempts} failed attempts.`,
          lockdownTimeMessage: `App is locked for ${lockdownTime} minute${
            lockdownTime > 1 ? 's.' : '.'
          }`,
          shouldLockApp: true,
        })
      }
    }

    yield call(delay, 60000)
  }
}

export function* watchGetPinFailData(): any {
  yield takeLatest(PUT_PIN_FAIL_DATA, getPinFailDataSaga)
}

export function* watchEnableTouchId(): any {
  yield takeLatest(ENABLE_TOUCHID, enableTouchId)
}
export function* watchDisableTouchId(): any {
  yield takeLatest(DISABLE_TOUCHID, disableTouchId)
}

export function* watchSetPin(): any {
  yield takeLatest(SET_PIN, setPin)
}

export const checkPinSuccess = (): CheckPinSuccessAction => ({
  type: CHECK_PIN_SUCCESS,
})

export const checkPinFail = (
  numberOfFailedPinAttempts?: number,
  recordedTimeOfPinFailedAttempt?: string
): CheckPinFailAction => ({
  type: CHECK_PIN_FAIL,
  numberOfFailedPinAttempts,
  recordedTimeOfPinFailedAttempt,
})

export const checkPinAction = (
  pin: string,
  isAppLocked: boolean
): CheckPinAction => ({
  type: CHECK_PIN,
  pin,
  isAppLocked,
})

export const enableDevMode = (): EnableDevMode => ({
  type: SHOW_DEV_MODE,
})

export const disableDevMode = (): DisableDevMode => ({
  type: HIDE_DEV_MODE,
})

export function* checkPin(action: CheckPinAction): Generator<*, *, *> {
  const inRecovery: string | null = yield call(safeGet, IN_RECOVERY)

  if (inRecovery === 'true') {
    const vcxResult = yield* ensureVcxInitAndPoolConnectSuccess()
    if (vcxResult && vcxResult.fail) {
      return
    }
  }
  const salt: string = yield call(getHydrationItem, SALT)
  const expectedPinHash: string = yield call(getHydrationItem, PIN_HASH)
  const enteredPinHash: string = yield call(pinHash, action.pin, salt)

  let numberOfFailedPinAttemptsString: string = ''
  let numberOfFailedPinAttempts: number = 0
  const recordedTimeOfPinFailedAttempt = moment().format()
  if (action.isAppLocked) {
    numberOfFailedPinAttemptsString = yield call(
      safeGet,
      NUMBER_OF_FAILED_PIN_ATTEMPTS
    )
    numberOfFailedPinAttempts = parseInt(numberOfFailedPinAttemptsString)
    if (isNaN(numberOfFailedPinAttempts)) {
      numberOfFailedPinAttempts = 0
    }
  }

  if (expectedPinHash === enteredPinHash) {
    if (action.isAppLocked) {
      yield call(safeSet, NUMBER_OF_FAILED_PIN_ATTEMPTS, '0')
      yield call(safeSet, RECORDED_TIME_OF_PIN_FAILED_ATTEMPT, '')
    }
    yield put(checkPinSuccess())
    if (inRecovery == 'true') {
      yield call(safeSet, IN_RECOVERY, 'false')
      yield put(setInRecovery('false'))
    }
  } else {
    captureError(new Error('Check pin fail'))
    if (action.isAppLocked) {
      yield call(
        safeSet,
        NUMBER_OF_FAILED_PIN_ATTEMPTS,
        (numberOfFailedPinAttempts + 1).toString()
      )
      yield call(
        safeSet,
        RECORDED_TIME_OF_PIN_FAILED_ATTEMPT,
        recordedTimeOfPinFailedAttempt
      )
      yield put(
        checkPinFail(
          numberOfFailedPinAttempts + 1,
          recordedTimeOfPinFailedAttempt
        )
      )
      yield* getPinFailDataSaga()
    } else {
      yield put(checkPinFail())
    }
  }
}

export const longPressedInLockSelectionScreen = (): LongPressedInLockSelectionScreen => ({
  type: LONG_PRESSED_IN_LOCK_SELECTION_SCREEN,
})

export const pressedOnOrInLockSelectionScreen = (): PressedOnOrInLockSelectionScreen => ({
  type: PRESSED_ON_OR_IN_LOCK_SELECTION_SCREEN,
})

export const checkTouchIdAction = (
  isTouchIdEnabled: boolean
): CheckTouchIdAction => ({
  type: CHECK_TOUCHID,
  isTouchIdEnabled,
})

export function* checkTouchId(action: CheckTouchIdAction): Generator<*, *, *> {
  const isTouchIdEnabled = yield call(safeGet, TOUCH_ID_STORAGE_KEY)
  if (isTouchIdEnabled === true) {
    yield put(checkPinSuccess())
  } else {
    yield put(checkPinFail())
  }
}

export function* watchCheckPin(): any {
  yield takeLatest(CHECK_PIN, checkPin)
}

export function* watchPressEventInLockSelectionScreen(): any {
  while (true) {
    yield take('LONG_PRESSED_IN_LOCK_SELECTION_SCREEN')
    for (var i = 1; i <= 10; i++) {
      yield take('PRESSED_ON_OR_IN_LOCK_SELECTION_SCREEN')
    }
    yield put(enableDevMode())
  }
}

export const unlockApp = (): UnlockAppAction => ({
  type: UNLOCK_APP,
})

export const checkPinStatusIdle = (): CheckPinIdleAction => ({
  type: CHECK_PIN_IDLE,
})

export function* watchLock(): any {
  yield all([
    watchCheckPin(),
    watchSetPin(),
    watchEnableTouchId(),
    watchDisableTouchId(),
    watchGetPinFailData(),
  ])
}

export default function lockReducer(
  state: LockStore = initialState,
  action: LockActions
): LockStore {
  switch (action.type) {
    case PENDING_REDIRECT:
      return {
        ...state,
        pendingRedirection: action.pendingRedirection,
      }
    case LOCK_ENABLE:
      return {
        ...state,
        isLockEnabled: action.isLockEnable,
      }
    case IN_RECOVERY:
      return {
        ...state,
        inRecovery: action.inRecovery,
      }
    case LOCK_FAIL:
      return {
        ...state,
        isLockEnabled: 'false',
        error: action.error,
      }
    case CLEAR_PENDING_REDIRECT:
      return {
        ...state,
        pendingRedirection: null,
      }
    case CHECK_PIN_SUCCESS:
      return {
        ...state,
        checkPinStatus: CHECK_PIN_SUCCESS,
        lastUnlockSuccessTime: moment().format(),
      }
    case CHECK_PIN_FAIL:
      return {
        ...state,
        checkPinStatus: CHECK_PIN_FAIL,
        numberOfFailedPinAttempts: action.numberOfFailedPinAttempts,
        recordedTimeOfPinFailedAttempt: action.recordedTimeOfPinFailedAttempt,
      }
    case CHECK_PIN_IDLE:
      return {
        ...state,
        checkPinStatus: CHECK_PIN_IDLE,
      }
    case UNLOCK_APP:
      return {
        ...state,
        isAppLocked: false,
        lastUnlockSuccessTime: moment().format(),
      }
    case ENABLE_TOUCHID:
      return {
        ...state,
        isTouchIdEnabled: true,
      }
    case SHOW_DEV_MODE:
      return {
        ...state,
        showDevMode: true,
      }
    case HIDE_DEV_MODE:
      return {
        ...state,
        showDevMode: false,
      }
    case DISABLE_TOUCHID:
      return {
        ...state,
        isTouchIdEnabled: false,
      }
    case CHECK_TOUCHID:
      return {
        ...state,
        isTouchIdEnabled: action.isTouchIdEnabled,
      }
    case PUT_PIN_FAIL_DATA_SUCCESS:
      return {
        ...state,
        numberOfAttemptsMessage: action.numberOfAttemptsMessage,
        lockdownTimeMessage: action.lockdownTimeMessage,
        shouldLockApp: action.shouldLockApp,
      }
    default:
      return state
  }
}
