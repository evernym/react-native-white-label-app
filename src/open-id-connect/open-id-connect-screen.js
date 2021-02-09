// @flow

import React, { useEffect, useCallback } from 'react'
import { View } from 'react-native'
import { connect } from 'react-redux'
import urlParse from 'url-parse'

import { useNavigation } from '@react-navigation/native'

// $FlowExpectedError[cannot-resolve-module] external file
import { APP_NAME } from '../../../../../app/evernym-sdk/app'

import type { OIDCAuthenticationRequest } from '../components/qr-scanner/type-qr-scanner'
import type { ReduxConnect } from '../common/type-common'
import type { Store } from '../store/type-store'
import type { OpenIdConnectRequest } from './open-id-connect-actions'
import type { Connection } from '../store/type-connection-store'

import { withBottomUpSliderScreen } from '../components/bottom-up-slider-screen/bottom-up-slider-screen'
import { openIdConnectRoute, homeRoute } from '../common'
import {
  openIdStyles,
  actionButtonDefaultProps,
} from './open-id-connect-styles'
import { BottomUpSliderContentHeader } from '../components/bottom-up-slider-screen/components/bottom-up-slider-screen-content-header'
import { BottomUpSliderText } from '../components/bottom-up-slider-screen/components/bottom-up-slider-screen-text'
import { BottomUpSliderLoader } from '../components/bottom-up-slider-screen/components/bottom-up-slider-loader'
import { CustomView, Container, CustomButton } from '../components'
import {
  openIdConnectUpdateStatus,
  OPEN_ID_CONNECT_STATE,
} from './open-id-connect-actions'
import { BottomUpSliderSuccess } from '../components/bottom-up-slider-screen/components/bottom-up-slider-success'
import { BottomUpSliderError } from '../components/bottom-up-slider-screen/components/bottom-up-slider-error'
import { GENERIC_ERROR_MESSAGE } from '../common/type-common'
import { defaultUserAvatar } from '../components/user-avatar/user-avatar'
import { getDIDFromFullyQualifiedDID } from '../store/store-utils'
import { getConnectionByProp } from '../store/store-selector'

export const OpenIdConnectScreen = ({
  request,
  dispatch,
  connection,
}: OpenIdConnectScreenProps) => {
  const navigation = useNavigation()
  const onYes = useCallback(() => {
    if (!request) {
      return
    }
    dispatch(
      openIdConnectUpdateStatus(
        request.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SELECTED
      )
    )
  }, [request])

  const onNo = useCallback(() => {
    if (request) {
      dispatch(
        openIdConnectUpdateStatus(
          request.oidcAuthenticationRequest,
          OPEN_ID_CONNECT_STATE.NO_SELECTED
        )
      )
    }
    navigation.navigate(homeRoute)
  }, [request])

  const onRetry = useCallback(() => {
    // if user has re-tried, that means user saw an error state
    // error can only be in one states of redux store for this request
    // i.e. YES_SEND_FAIL
    // so we just trigger onYes again
    onYes()
    // we might argue that if we are just calling onYes, from here
    // then why not directly use onYes function
    // This is totally valid point
    // As of writing this code, when user click on NO, then also
    // we need to send a rejected response to remote service
    // but we do not show loader when user taps on NO
    // instead we send rejected response in background
    // However, it may be decided that if NO response also fails
    // then also we need to show it that even rejection could not be sent
    // but this is all speculation as of now and we should not overly optimize
    // Since we are not doing any logic here for now, it should be okay for now
  }, [onYes])

  const onCancel = useCallback(() => {
    onNo()
  }, [onNo])

  const afterSuccessShown = useCallback(() => {
    navigation.navigate(homeRoute)
  }, [])

  const afterErrorShown = useCallback(() => {}, [])

  useEffect(() => {
    if (request) {
      dispatch(
        openIdConnectUpdateStatus(
          request.oidcAuthenticationRequest,
          OPEN_ID_CONNECT_STATE.SEEN
        )
      )
    }
  }, [])

  if (!request) {
    return null
  }

  const { state, oidcAuthenticationRequest } = request

  if (state === OPEN_ID_CONNECT_STATE.YES_SEND_IN_PROGRESS) {
    return <BottomUpSliderLoader />
  }

  if (state === OPEN_ID_CONNECT_STATE.YES_SEND_SUCCESS) {
    return (
      <BottomUpSliderSuccess
        afterSuccessShown={afterSuccessShown}
        successText="Request approved."
        textStyles={[openIdStyles.successText]}
      />
    )
  }

  if (state === OPEN_ID_CONNECT_STATE.YES_SEND_FAIL) {
    const { error } = request
    const errorText = error
      ? error.displayMessage || error.message || GENERIC_ERROR_MESSAGE
      : GENERIC_ERROR_MESSAGE
    return (
      <CustomView
        style={[openIdStyles.screenContainer, openIdStyles.errorContainer]}
      >
        <BottomUpSliderError
          afterErrorShown={afterErrorShown}
          errorText={errorText}
          textStyles={[openIdStyles.errorText]}
          containerStyles={[openIdStyles.errorTextContainer]}
        />
        <OpenIdConnectActions
          onLeftButtonPress={onCancel}
          leftButtonText="Cancel"
          onRightButtonPress={onRetry}
          rightButtonText="Retry"
        />
      </CustomView>
    )
  }

  let senderLogoUrl = defaultUserAvatar
  let senderName = 'Anonymous'
  if (connection) {
    senderLogoUrl = connection.logoUrl
      ? { uri: connection.logoUrl }
      : senderLogoUrl
    senderName = connection.senderName ? connection.senderName : senderName
  }
  const { hostname: websiteToLogin } = urlParse(
    oidcAuthenticationRequest.oidcAuthenticationQrCode.requestUri
  )
  const signatureVerificationFailed =
    !oidcAuthenticationRequest.jwtAuthenticationRequest.encodedSignature ||
    oidcAuthenticationRequest.jwtAuthenticationRequest.header.alg === 'none'

  return (
    <View style={[openIdStyles.screenContainer]}>
      <BottomUpSliderContentHeader
        source={senderLogoUrl}
        senderName={senderName}
      />
      <CustomView bg="tertiary" center style={[openIdStyles.contentContainer]}>
        {signatureVerificationFailed && (
          <BottomUpSliderText
            center
            size="h4"
            bold={false}
            style={[openIdStyles.verificationFailedText]}
          >
            {`${APP_NAME} is unable to verify that this request really comes from ${senderName}`}
          </BottomUpSliderText>
        )}
        <BottomUpSliderText bold={false} size="h5">
          {signatureVerificationFailed
            ? `Approve login to ${websiteToLogin} anyway?`
            : `Are you trying to login to ${websiteToLogin}?`}
        </BottomUpSliderText>
      </CustomView>
      <OpenIdConnectActions
        onLeftButtonPress={onNo}
        leftButtonText="No"
        onRightButtonPress={onYes}
        rightButtonText="Yes"
      />
    </View>
  )
}

const mapStateToProps = (state: Store, props: OpenIdConnectNavigation) => {
  const { oidcAuthenticationRequest } = props.route.params
  const possibleConnections = getConnectionByProp(
    state,
    'publicDID',
    getDIDFromFullyQualifiedDID(
      oidcAuthenticationRequest.jwtAuthenticationRequest.body.iss
    )
  )
  const connection =
    possibleConnections.length > 0 ? possibleConnections[0] : null

  return {
    request: state.openIdConnect.data[oidcAuthenticationRequest.id],
    connection,
  }
}

export const openIdConnectScreen = withBottomUpSliderScreen(
  { routeName: openIdConnectRoute },
  connect(mapStateToProps)(OpenIdConnectScreen)
)

const OpenIdConnectActions = ({
  leftButtonText,
  onLeftButtonPress,
  rightButtonText,
  onRightButtonPress,
}: OpenIdConnectActionsProps) => {
  return (
    <CustomView safeArea>
      <CustomView row style={[openIdStyles.actionContainer]}>
        <Container style={[openIdStyles.buttonSpacing]}>
          <CustomButton
            {...actionButtonDefaultProps}
            twelfth
            title={leftButtonText}
            onPress={onLeftButtonPress}
            testID={'open-id-no'}
            style={[openIdStyles.actionButtons, openIdStyles.noButton]}
          />
        </Container>
        <Container>
          <CustomButton
            {...actionButtonDefaultProps}
            eleventh
            title={rightButtonText}
            onPress={onRightButtonPress}
            testID={'open-id-yes'}
            style={[openIdStyles.actionButtons, openIdStyles.yesButton]}
          />
        </Container>
      </CustomView>
    </CustomView>
  )
}

export type OpenIdConnectNavigation = {
  route: {
    params: {|
      oidcAuthenticationRequest: OIDCAuthenticationRequest,
    |},
  },
}

type OpenIdConnectScreenProps = {
  request: ?OpenIdConnectRequest,
  connection: ?Connection,
} & OpenIdConnectNavigation &
  ReduxConnect

type OpenIdConnectActionsProps = {
  onLeftButtonPress: () => void,
  onRightButtonPress: () => void,
  leftButtonText: string,
  rightButtonText: string,
}
