// @flow
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import SplashScreen from 'react-native-splash-screen'
import {
  splashScreenRoute,
  lockSelectionRoute,
  startUpRoute,
  restoreRoute,
  homeRoute,
} from '../common'
import { Container, Loader } from '../components'
import { addPendingRedirection, unlockApp } from '../lock/lock-store'
import type { SplashScreenProps } from './type-splash-screen'
import { isLocalBackupsEnabled } from '../settings/settings-utils'
import { useEffect } from 'react'
import { getIsEulaAccepted, getIsInitialized, getLockStore } from '../store/store-selector'
import { useSelector } from 'react-redux'
import { authForAction } from '../lock/lock-auth-for-action'

export const SplashScreenView = (props: SplashScreenProps) => {
  const isInitialized = useSelector(getIsInitialized)
  const isEulaAccept = useSelector(getIsEulaAccepted)
  const lock = useSelector(getLockStore)

  useEffect(() => {
    if (isInitialized) {
      onAppInitialized()
    }
  }, [isInitialized])

  const onSuccess = () => {
    props.navigation.navigate(homeRoute)
    SplashScreen.hide()
    props.unlockApp()
  }

  const onAppInitialized = () => {
    if (!isEulaAccept) {
      SplashScreen.hide()
    }
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

    authForAction({
      lock,
      navigation: props.navigation,
      onSuccess
    })
  }

  return isInitialized ? null : (
    <Container center>
      <Loader/>
    </Container>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      addPendingRedirection,
      unlockApp,
    },
    dispatch,
  )

export const splashScreenScreen = {
  routeName: splashScreenRoute,
  screen: connect(mapDispatchToProps)(SplashScreenView),
}
