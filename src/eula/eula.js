// @flow

// this page displays a webview with our terms and conditions
// you should get the url value and title from constants
// on click accept take user to lock selection screen

import React, { useState, useCallback, useMemo } from 'react'
import { Alert, View, StyleSheet, TouchableOpacity } from 'react-native'
import WebView from 'react-native-webview'
import { connect, useSelector } from 'react-redux'

import { TermsAndConditionsTitle } from '../common/privacyTNC-constants'
import type {
  CustomError,
  ReactNavigation,
  ReduxConnect,
} from '../common/type-common'

import { Container, FooterActions } from '../components'
import { eulaRoute, homeRoute } from '../common'
import { eulaAccept, shareEula } from './eula-store'
import { EULA_URL, localEulaSource } from './type-eula'
import { OrangeLoader } from '../components/loader-gif/loader-gif'
import { clearPendingRedirect, unlockApp } from '../lock/lock-store'
import { vcxInitStart } from '../store/route-store'
import { moderateScale, verticalScale } from 'react-native-size-matters'
import { EvaIcon, SHARE_ICON } from '../common/icons'

import { getPendingRedirection } from '../store/store-selector'
import { CustomEulaScreen } from '../external-exports'

export const EulaScreen = ({
  dispatch,
  navigation,
}: ReactNavigation & ReduxConnect) => {
  const pendingRedirection = useSelector(getPendingRedirection)

  const [error, setError] = useState<CustomError | null>(null)

  const onReject = useCallback(() => {
    Alert.alert(
      'Alert',
      `You will not be able to use the application without accepting ${TermsAndConditionsTitle}`
    )
  }, [])

  const onAccept = useCallback(() => {
    dispatch(eulaAccept(true))
    dispatch(unlockApp())
    dispatch(vcxInitStart())

    if (pendingRedirection) {
      pendingRedirection.map((pendingRoute) => {
        navigation.navigate(pendingRoute.routeName, pendingRoute.params || {})
      })
      dispatch(clearPendingRedirect())
    } else {
      // if we have to enable choice for restore and start fresh screen, then redirect user to restoreRoute instead of homeRoute
      navigation.navigate(homeRoute)
    }
  }, [])

  const renderLoader = useCallback(() => Loader, [])
  const renderError = useCallback(() => emptyError, [])
  const webViewUri = error ? localEulaSource : EULA_URL
  const source = useMemo(() => ({ uri: webViewUri }), [webViewUri])

  const onShareEula = useCallback(() => {
    dispatch(shareEula(webViewUri))
  }, [webViewUri])

  return (
    <Container fifth>
      <TouchableOpacity style={style.shareLinkContainer} onPress={onShareEula}>
        <EvaIcon
          name={SHARE_ICON}
          width={moderateScale(32)}
          height={moderateScale(32)}
        />
      </TouchableOpacity>
      <WebView
        source={source}
        startInLoadingState={true}
        renderLoading={renderLoader}
        onError={setError}
        renderError={renderError}
        automaticallyAdjustContentInsets={false}
      />
      <FooterActions
        onAccept={onAccept}
        onDecline={onReject}
        denyTitle="Decline"
        acceptTitle="Accept"
        testID="eula"
      />
    </Container>
  )
}

const screen = CustomEulaScreen || EulaScreen

export const eulaScreen = {
  routeName: eulaRoute,
  screen: connect()(screen),
}

const style = StyleSheet.create({
  loaderContainer: {
    flex: 1,
  },
  shareLinkContainer: {
    zIndex: 900,
    position: 'absolute',
    top: 0,
    right: 0,
    padding: verticalScale(20),
  },
})
const Loader = <View style={style.loaderContainer}>{OrangeLoader}</View>
const emptyError = <View />
