// @flow
import type { LockStore } from './type-lock'
import moment from 'moment'
import {
  eulaRoute,
  lockAuthorizationHomeRoute,
  lockPinSetupRoute,
  lockSelectionRoute,
} from '../common'
import type { NavigationLeafRoute, NavigationScreenProp } from '@react-navigation/native'
import { TouchId } from '../components/touch-id/touch-id'
import { Alert, Platform } from 'react-native'
import {
  AllowedFallbackToucheIDErrors,
  LAErrorTouchIDTooManyAttempts,
  touchIDAlerts,
  touchIDNotSupportAlertAndroid,
} from './type-lock'
import { captureError } from '../services/error/error-handler'
import { getBiometricError } from '../bridge/react-native-cxs/RNCxs'

type Params = {
  lock: LockStore,
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  onSuccess: () => void
}

export const freshnessThreshold = 30

export function authForAction(params: Params) {
  const timeSinceLastSuccess =
    moment.duration(
      moment().diff(moment(params.lock.lastUnlockSuccessTime)),
    ).asSeconds()

  const pinCodeAuth = () => {
    params.navigation.navigate(lockAuthorizationHomeRoute, {
      onSuccess: params.onSuccess,
    })
  }

  if (timeSinceLastSuccess < freshnessThreshold) {
    params.onSuccess()
  } else if (params.lock.isTouchIdEnabled) {
    const handleFailedAuth = () => {
      TouchId.release()
      TouchId.release()
      pinCodeAuth()
    }

    const touchIdHandler = () => {
      TouchId.isSupported()
        .then(() => {
          TouchId.authenticate(
            {
              title: 'Authentication Required',
            },
            touchIdHandler
          )
            .then(() => {
              TouchId.release()
              params.onSuccess()
            })
            .catch(() => handleFailedAuth())
        })
        .catch(() => handleFailedAuth())
    }

    touchIdHandler()
  } else {
    pinCodeAuth()
  }
}

interface ISetupTouchId {
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  fromSettings: boolean,
  fromSetup: boolean,
  touchIdActive: boolean | string,
  disableTouchIdAction: () => void,
  enableTouchIdAction: () => void,
}

export const setupTouchId = ({
  navigation,
  fromSettings,
  fromSetup,
  touchIdActive,
  disableTouchIdAction,
  enableTouchIdAction
}: ISetupTouchId) => {
  const onSettingsScreen = () => {
    console.log(touchIdActive)
    if (touchIdActive) {
      Alert.alert(
        null,
        touchIDAlerts.usePasscodeAlert,
        [
          {
            text: 'Ok',
            onPress: () => disableTouchIdAction()
          },
        ],
        { cancelable: false }
      )
    } else {
      enableTouchIdAction()
    }
  }

  const goToPinSetupScreen = () => {
    enableTouchIdAction()
    navigation.navigate(lockPinSetupRoute, { touchIdActive: true })
  }

  const goToEulaScreen = () => {
    enableTouchIdAction()
    navigation.navigate(eulaRoute)
  }

  const popUpNativeAlert = (message: string) => {
    Alert &&
    Alert.alert(
      null,
      message,
      [
        {
          text: 'Ok',
          onPress: () => {
            !fromSettings && navigation.navigate(lockSelectionRoute)
          },
        },
      ],
      { cancelable: false }
    )
  }

  const handleTouchID = () => {
    touchIdHandler().then()
  }

  const touchIdHandler = async () => {
    TouchId.isSupported()
      .then(() => {
        return TouchId.authenticate(
          {
            title: 'Authentication Required',
          },
          handleTouchID
        )
          .then(() => {
            TouchId.release()
            if (fromSettings) {
              return onSettingsScreen()
            }
            if (fromSetup) {
              return goToEulaScreen()
            }
            return goToPinSetupScreen()
          })
          .catch((error) => {
            if (AllowedFallbackToucheIDErrors.indexOf(error.name) >= 0) {
              TouchId.release()
              if (error.code === LAErrorTouchIDTooManyAttempts) {
                popUpNativeAlert(touchIDAlerts.biometricsExceedAlert)
              } else {
                !fromSettings && navigation.navigate(lockSelectionRoute)
              }
            }
          })
      })
      .catch((error) => {
        captureError(error)
        TouchId.release()
        if (AllowedFallbackToucheIDErrors.indexOf(error.name) >= 0) {
          let alertMessage = touchIDAlerts.notSupportedBiometrics
          if (Platform.OS === 'android') {
            if (touchIDNotSupportAlertAndroid.indexOf(error.code) < 0) {
              alertMessage = touchIDAlerts.enableBiometrics
            }
            popUpNativeAlert(alertMessage)
          } else {
            getBiometricError().catch((err) => {
              if (err.code === 'BiometricsLockOut') {
                alertMessage = touchIDAlerts.biometricsExceedAlert
              } else if (err.code === 'BiometricsNotEnrolled') {
                alertMessage = touchIDAlerts.enableBiometrics
              } else {
                alertMessage = touchIDAlerts.notSupportedBiometrics
              }
              popUpNativeAlert(alertMessage)
            })
          }
        }
      }
    )
  }
  handleTouchID()
}
