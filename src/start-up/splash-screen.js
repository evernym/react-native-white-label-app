// @flow
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import SplashScreen from 'react-native-splash-screen'
import {
  splashScreenRoute,
  lockSelectionRoute,
  lockEnterPinRoute,
  lockEnterFingerprintRoute,
  startUpRoute,
  restoreRoute,
} from '../common'
import { Container, Loader } from '../components'
import { addPendingRedirection } from '../lock/lock-store'
import type { SplashScreenProps } from './type-splash-screen'
import { isLocalBackupsEnabled } from '../settings/settings-utils'
import { useEffect } from 'react'
import {
  getIsEulaAccepted,
  getIsInitialized,
  getLockStore,
} from '../store/store-selector'
import { useSelector } from 'react-redux'
export const SplashScreenView = (props: SplashScreenProps) => {
  const isInitialized = useSelector(getIsInitialized)
  const isEulaAccept = useSelector(getIsEulaAccepted)
  const lock = useSelector(getLockStore)
  useEffect(() => {
    if (isInitialized) {
      onAppInitialized()
    }
  }, [isInitialized])
  const onAppInitialized = () => {
    SplashScreen.hide()
    // now we can safely check value of isAlreadyInstalled
    // check for need for set up
    if (!lock.isLockEnabled || lock.isLockEnabled === 'false') {
      if (isLocalBackupsEnabled()) {
        props.navigation.navigate(restoreRoute)
      } else {
        props.navigation.navigate(startUpRoute)
      }
      return
    }
    // enabled lock but have not accepted EULA
    if (!isEulaAccept) {
      // short term this will navigate to lock selection
      // this.props.navigation.navigate(eulaRoute)
      props.navigation.navigate(lockSelectionRoute)
      return
    }
    // not the first time user is opening app
    const initialRoute = lock.isTouchIdEnabled
      ? lockEnterFingerprintRoute
      : lockEnterPinRoute
    props.navigation.navigate(initialRoute)
  }
  return isInitialized ? null : (
    <Container center>
      <Loader />
    </Container>
  )
}
const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      addPendingRedirection,
    },
    dispatch
  )
export const splashScreenScreen = {
  routeName: splashScreenRoute,
  screen: connect(null, mapDispatchToProps)(SplashScreenView),
}
