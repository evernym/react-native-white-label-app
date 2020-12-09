// @flow
import { useCallback, useState } from 'react'
import {
  useFocusEffect,
  useNavigationState,
  CommonActions,
} from '@react-navigation/native'
import { BackHandler, Platform, ToastAndroid } from 'react-native'
import { exitAppAndroid } from '../bridge/react-native-cxs/RNCxs'
import type { NavigationState, NavigationRoute } from '../common/type-common'

import {
  qrCodeScannerTabRoute,
  homeRoute,
  genRecoveryPhraseRoute,
  backupCompleteRoute,
  lockPinSetupHomeRoute,
  settingsRoute,
  lockSetupSuccessRoute,
  invitationRoute,
  lockEnterPinRoute,
  splashScreenRoute,
  eulaRoute,
  lockSelectionRoute,
  lockAuthorizationHomeRoute,
  restoreRoute,
  restoreWaitRoute,
  expiredTokenRoute,
  startUpRoute,
  homeDrawerRoute,
} from '../common'
import { useDispatch } from 'react-redux'

const backButtonDisableRoutes = [
  lockEnterPinRoute,
  homeRoute,
  settingsRoute,
  qrCodeScannerTabRoute,
  invitationRoute,
  lockSetupSuccessRoute,
  eulaRoute,
  lockSelectionRoute,
  lockPinSetupHomeRoute,
  lockAuthorizationHomeRoute,
  genRecoveryPhraseRoute,
  backupCompleteRoute,
  restoreRoute,
  restoreWaitRoute,
  expiredTokenRoute,
  splashScreenRoute,
  startUpRoute,
  homeDrawerRoute,
]

const backButtonExitRoutes = [
  homeRoute,
  settingsRoute,
  qrCodeScannerTabRoute,
  eulaRoute,
  lockSelectionRoute,
]

const backButtonConditionalRoutes = [
  lockPinSetupHomeRoute,
  lockAuthorizationHomeRoute,
]

function getCurrentRoute(navigationState: NavigationState) {
  const { routes, index } = navigationState
  const route: NavigationRoute = routes[index]
  // dive into nested navigators
  if (route.state) {
    return getCurrentRoute(route.state)
  }

  return route
}

export default function useBackHandler() {
  const { key, name, params } = useNavigationState(getCurrentRoute)
  const dispatch = useDispatch()
  const [exitTimeout, setExitTimeout] = useState()

  const onBack = () => {
    if (key !== '' && name !== '') {
      if (backButtonConditionalRoutes.includes(name)) {
        let navigateAction = CommonActions.navigate({
          name: lockSelectionRoute,
        })

        switch (name) {
          case lockPinSetupHomeRoute:
            if (
              params &&
              typeof params.existingPin === 'boolean' &&
              params.existingPin === true
            ) {
              navigateAction = CommonActions.navigate({
                lockSelectionRoute,
              })
            }
            dispatch(navigateAction)
            return true
          case lockAuthorizationHomeRoute:
            params &&
              params.onAvoid &&
              typeof params.onAvoid === 'function' &&
              params.onAvoid()
            return false
        }
      }

      if (backButtonExitRoutes.includes(name)) {
        if (exitTimeout && exitTimeout + 2000 >= Date.now()) {
          exitAppAndroid()
          return true
        }
        setExitTimeout(Date.now())
        ToastAndroid.show('Press again to exit!', ToastAndroid.SHORT)
      }

      if (!backButtonDisableRoutes.includes(name)) {
        return false
      }
    }
    return true
  }

  const focusEffectCallback = useCallback(() => {
    if (Platform.OS !== 'android') {
      return
    }
    BackHandler.addEventListener('hardwareBackPress', onBack)
    return () => BackHandler.removeEventListener('hardwareBackPress', onBack)
  })

  useFocusEffect(focusEffectCallback)
}
