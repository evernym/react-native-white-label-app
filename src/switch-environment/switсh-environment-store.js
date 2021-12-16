import type { ConfigStore } from '../store/type-config-store'
import {
  ERROR_HYDRATE_SWITCH_ENVIRONMENT,
  ERROR_SAVE_SWITCH_ENVIRONMENT,
  MESSAGE_FAIL_ENVIRONMENT_SWITCH_ERROR,
  MESSAGE_FAIL_ENVIRONMENT_SWITCH_INVALID_DATA,
  MESSAGE_FAIL_ENVIRONMENT_SWITCH_TITLE,
  MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_DESCRIPTION,
  MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_TITLE,
  schemaDownloadedEnvironmentDetails,
  STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL,
  UNSAFE_SCREENS_TO_DOWNLOAD_SMS,
} from '../store/type-config-store'
import type { EnvironmentDetailUrlDownloaded } from '../api/type-api'
import { call, put, select, take, takeLatest } from 'redux-saga/effects'
import { downloadEnvironmentDetails } from '../api/api'
import { schemaValidator } from '../services/schema-validator'
import { Alert } from 'react-native'
import { resetStore, vcxInitReset } from '../store/config-store'
import { usePushNotifications } from '../external-imports'
import {
  getAgencyUrl,
  getConfig,
  getCurrentScreen,
  getPushToken,
} from '../store/store-selector'
import { updatePushToken } from '../push-notification/push-notification-store'
import { captureError } from '../services/error/error-handler'
import { getHydrationItem, secureSet } from '../services/storage'
import type { CustomError } from '../common/type-common'
import { customLogger } from '../store/custom-logger'
import { SAFE_TO_DOWNLOAD_SMS_INVITATION } from '../sms-pending-invitation/type-sms-pending-invitation'
import { environments } from '../environment'
import findKey from 'lodash.findkey'
import type {
  ChangeEnvironment,
  ChangeEnvironmentUrlAction,
  ServerEnvironment,
  ServerEnvironmentChangedAction,
  SwitchEnvironmentAction,
} from './type-switch-environment'
import {
  CHANGE_ENVIRONMENT_VIA_URL,
  HYDRATE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  SAVE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  SERVER_ENVIRONMENT,
  SERVER_ENVIRONMENT_CHANGED,
  SWITCH_ENVIRONMENT,
} from './type-switch-environment'

/*
 * NOTE: It uses Reducer from store/config-store.js file
 * */

export const changeEnvironmentUrl = (url: string) => ({
  type: CHANGE_ENVIRONMENT_VIA_URL,
  url,
})

export const hydrateSwitchedEnvironmentDetailFail = (error: CustomError) => ({
  type: HYDRATE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  error,
})

export const changeServerEnvironment = (
  serverEnvironment: ServerEnvironment
): ServerEnvironmentChangedAction => ({
  type: SERVER_ENVIRONMENT_CHANGED,
  serverEnvironment,
})
export const saveSwitchedEnvironmentDetailFail = (error: CustomError) => ({
  type: SAVE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  error,
})

export function* onChangeEnvironmentUrl(
  action: ChangeEnvironmentUrlAction
): Generator<*, *, *> {
  try {
    const { url } = action
    const environmentDetails: EnvironmentDetailUrlDownloaded = yield call(
      downloadEnvironmentDetails,
      url
    )
    if (
      !schemaValidator.validate(
        schemaDownloadedEnvironmentDetails,
        environmentDetails
      )
    ) {
      // TODO: We need to make a component which displays message
      // in whole app, something like toast in android
      // for now, we are using native alert to show error and messages
      Alert.alert(
        MESSAGE_FAIL_ENVIRONMENT_SWITCH_TITLE,
        MESSAGE_FAIL_ENVIRONMENT_SWITCH_INVALID_DATA(url)
      )

      return
    }

    // TODO:KS When we pick up environment switch story using QR code
    // then we need to fix below stuff
    // yield* deleteDeviceSpecificData()
    // yield* deleteWallet()
    yield* resetStore()

    yield put(
      changeEnvironment(
        environmentDetails.agencyUrl,
        environmentDetails.agencyDID,
        environmentDetails.agencyVerificationKey,
        environmentDetails.poolConfig,
        environmentDetails.paymentMethod,
        environmentDetails.domainDID,
        environmentDetails.verityFlowBaseUrl,
        environmentDetails.identityCardCredDefId,
        environmentDetails.drivingLicenseCredDefId,
        environmentDetails.passportCredDefId
      )
    )

    if (usePushNotifications) {
      const pushToken: string = yield select(getPushToken)
      yield put(updatePushToken(pushToken))
    }

    // TODO Un-comment and call vcx reset when we re-enable this feature
    // yield call(reset, environmentDetails.poolConfig)
    yield put(vcxInitReset())

    // if we did not get any exception till this point
    // that means environment is switched
    Alert.alert(
      MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_TITLE,
      MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_DESCRIPTION
    )
  } catch (e) {
    captureError(e)
    Alert.alert(
      MESSAGE_FAIL_ENVIRONMENT_SWITCH_TITLE,
      MESSAGE_FAIL_ENVIRONMENT_SWITCH_ERROR(e.message)
    )
  }
}

export const changeEnvironment = (
  agencyUrl: string,
  agencyDID: string,
  agencyVerificationKey: string,
  poolConfig: string,
  paymentMethod: string,
  domainDID: string,
  verityFlowBaseUrl: string,
  identityCardCredDefId: string,
  drivingLicenseCredDefId: string,
  passportCredDefId: string
) => {
  let updatedPoolConfig = poolConfig

  // We can get pool config from user that does not have \n
  // or it might contain \\n or it might contain just \n
  if (poolConfig) {
    if (poolConfig.indexOf('\\n') > -1) {
      updatedPoolConfig = poolConfig.split('\\n').join('\n')
    }

    // TODO: Raise error about invalid pool config
  }

  let updatedAgencyUrl = agencyUrl.trim()
  const endIndex = agencyUrl.length - 1

  if (updatedAgencyUrl[endIndex] === '/') {
    // if we got the agency url that ends to with '/'
    // then we save it after removing that slash
    updatedAgencyUrl = updatedAgencyUrl.slice(0, endIndex)
  }

  return {
    type: SWITCH_ENVIRONMENT,
    poolConfig: updatedPoolConfig,
    agencyDID,
    agencyVerificationKey,
    agencyUrl: updatedAgencyUrl,
    paymentMethod,
    domainDID,
    verityFlowBaseUrl,
    identityCardCredDefId,
    drivingLicenseCredDefId,
    passportCredDefId,
  }
}

export function* onEnvironmentSwitch(
  action: SwitchEnvironmentAction
): Generator<*, *, *> {
  const { type, ...switchedEnvironmentDetail } = action
  try {
    yield call(
      secureSet,
      STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL,
      JSON.stringify(switchedEnvironmentDetail)
    )
  } catch (e) {
    captureError(e)
    // we need to add some fallback if user storage is not available
    // or is full or if user deleted our data
    yield put(
      saveSwitchedEnvironmentDetailFail({
        code: ERROR_SAVE_SWITCH_ENVIRONMENT.code,
        message: `${ERROR_SAVE_SWITCH_ENVIRONMENT.message}${e.message}`,
      })
    )
  }
}

export function* hydrateSwitchedEnvironmentDetails(): any {
  try {
    const switchedEnvironmentDetail: string | null = yield call(
      getHydrationItem,
      STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL
    )
    // if we did not find any saved environment details
    // then we are running an older version of the app where we did not save
    // environment details with which app was running
    // In all those previous instances our default environment was DEMO
    // so now, we have to switch default environment to DEMO
    const {
      agencyUrl,
      agencyDID,
      agencyVerificationKey,
      poolConfig,
      paymentMethod,
      domainDID,
      verityFlowBaseUrl,
      identityCardCredDefId,
      drivingLicenseCredDefId,
      passportCredDefId,
    }: ChangeEnvironment = switchedEnvironmentDetail
      ? JSON.parse(switchedEnvironmentDetail)
      : environments[SERVER_ENVIRONMENT.DEMO]
    // if environment that is saved is same as what we have as default
    // then there is no need to raise change environment action
    const currentAgencyUrl = yield select(getAgencyUrl)
    if (currentAgencyUrl !== agencyUrl) {
      yield put(
        changeEnvironment(
          agencyUrl,
          agencyDID,
          agencyVerificationKey,
          poolConfig,
          paymentMethod,
          domainDID,
          verityFlowBaseUrl,
          identityCardCredDefId,
          drivingLicenseCredDefId,
          passportCredDefId
        )
      )
    }
  } catch (e) {
    captureError(e)
    customLogger.log(`hydrateSwitchedEnvironmentDetails: ${e}`)
    yield put(
      hydrateSwitchedEnvironmentDetailFail({
        code: ERROR_HYDRATE_SWITCH_ENVIRONMENT.code,
        message: `${ERROR_HYDRATE_SWITCH_ENVIRONMENT.message}${e.message}`,
      })
    )
  }
}

export function* persistEnvironmentDetails(): any {
  // we wait to persist environment details till we know that now user can't
  // change environment in UX flow
  const currentScreen: string = yield select(getCurrentScreen)
  if (UNSAFE_SCREENS_TO_DOWNLOAD_SMS.indexOf(currentScreen) > -1) {
    // user is on screens where he has chance to change environment details
    // so we wait for event which tells that we are safe
    yield take(SAFE_TO_DOWNLOAD_SMS_INVITATION)
  }

  const {
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
    paymentMethod,
    domainDID,
    verityFlowBaseUrl,
    identityCardCredDefId,
    drivingLicenseCredDefId,
    passportCredDefId,
  }: ConfigStore = yield select(getConfig)
  yield call(onEnvironmentSwitch, {
    type: SWITCH_ENVIRONMENT,
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
    paymentMethod,
    domainDID,
    verityFlowBaseUrl,
    identityCardCredDefId,
    drivingLicenseCredDefId,
    passportCredDefId,
  })
}

export const getEnvironmentName = (configStore: ConfigStore) => {
  const { agencyUrl } = configStore

  return findKey(
    environments,
    (environment) => environment.agencyUrl === agencyUrl
  )
}

export function* watchSwitchEnvironment(): any {
  yield takeLatest(SWITCH_ENVIRONMENT, onEnvironmentSwitch)
}

export function* watchChangeEnvironmentUrl(): any {
  yield takeLatest(CHANGE_ENVIRONMENT_VIA_URL, onChangeEnvironmentUrl)
}
