// @flow
import 'react-native-gesture-handler'
import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { AppRegistry, Platform, UIManager, StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CommonActions, NavigationContainer } from '@react-navigation/native'
import RNShake from 'react-native-shake'

import type { AppProps } from './type-app'
import type {
  NavigationState,
  NavigationParams,
  NavigationRoute,
} from './common/type-common'

import store from './store'
import { ROUTE_UPDATE } from './store/route-store'
import { Container } from './components'
import { PushNotification, ScreenNavigator } from './push-notification'
import DeepLink from './deep-link'
import { colors } from './common/styles/constant'
import { MSDKAppNavigator } from './navigation/navigator'
import { sendLogsRoute } from './common'
import AppStatus from './app-status/app-status'
import Offline from './offline/offline'
import { usePushNotifications } from './external-imports'
import { SnackError } from './components/snack-error'

if (Platform.Version < 29) {
  // enable react-native-screens
  // TODO:KS Investigate why enableScreens break modals on Android
  // we can't tap anything on screen after modal is opened, but modal renders fine
  // Disable react-native-screens for android 10 and 11 (API level 29 and 30)
  // useScreens()
}

// FIXME: I disable warnings because they affect appium test. We rather should fix all warnings.
// $FlowFixMe
console.disableYellowBox = true

// enable layout animation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export class MSDKMeApp extends Component<AppProps, void> {
  currentRouteKey: string = ''
  currentRoute: string = ''
  navigatorRef = React.createRef<NavigationContainer>()
  currentRouteParams:
    | {
    onAvoid?: () => void,
    existingPin?: boolean,
    [key: string]: mixed,
  }
    | null
    | typeof undefined = null
  exitTimeout: number = 0

  componentDidMount() {
    RNShake.addEventListener('ShakeEvent', () => {
      if (this.currentRoute !== sendLogsRoute) {
        this.navigateToRoute(sendLogsRoute)
      }
    })
  }

  componentWillUnmount() {
    RNShake.removeEventListener('ShakeEvent', () => {})
  }

  // gets the current screen from navigation state
  getCurrentRoute = (navigationState: NavigationState) => {
    const route: NavigationRoute = navigationState.routes[navigationState.index]

    // dive into nested navigators
    if (route.state) {
      return this.getCurrentRoute(route.state)
    }

    return route
  }

  navigationChangeHandler = (navigationState: NavigationState) => {
    const { name, key, params } = this.navigatorRef.current
      ? this.navigatorRef.current.getCurrentRoute(navigationState)
      : {}
    const currentScreen = name

    this.currentRoute = name
    this.currentRouteKey = key
    this.currentRouteParams = params

    store.dispatch({
      type: ROUTE_UPDATE,
      currentScreen,
    })
  }

  navigateToRoute = (name: string, params: NavigationParams = {}) => {
    const navigateAction = CommonActions.navigate({
      name,
      params,
    })
    this.navigatorRef.current &&
    this.navigatorRef.current.dispatch(navigateAction)
  }

  render() {
    return (
      <Provider store={store}>
        <SafeAreaProvider>
          <Container>
            <StatusBar
              backgroundColor={colors.white}
              barStyle="dark-content"
            />
            {
              usePushNotifications &&
              <PushNotification navigateToRoute={this.navigateToRoute} />
            }
            <ScreenNavigator navigateToRoute={this.navigateToRoute} />
            <DeepLink navigateToRoute={this.navigateToRoute}/>
            <AppStatus />
            <NavigationContainer
              ref={this.navigatorRef}
              onStateChange={this.navigationChangeHandler}
            >
              <MSDKAppNavigator />
            </NavigationContainer>
            <Offline overlay />
            <SnackError/>
          </Container>
        </SafeAreaProvider>
      </Provider>
    )
  }
}

export function createApp(appName: string) {
  return AppRegistry.registerComponent(appName, () => MSDKMeApp)
}
