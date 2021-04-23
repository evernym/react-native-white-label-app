//@flow
import React, { Component } from 'react'
import { StyleSheet } from 'react-native'
import { CommonActions } from '@react-navigation/native'
import { TouchId } from '../components/touch-id/touch-id'
import { Container, CustomText, CustomButton } from '../components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  homeRoute,
  lockEnterPinRoute,
  lockEnterFingerprintRoute,
} from '../common'
import { unlockApp, clearPendingRedirect } from './lock-store'
import type { Store } from '../store/type-store'
import { UNLOCKING_APP_WAIT_MESSAGE } from '../common/message-constants'
import type {
  LockEnterFingerProps,
  LockEnterFingerState,
  PendingRedirection,
} from './type-lock'
import { AllowedFallbackToucheIDErrors } from './type-lock'
import { headerDefaultOptions } from '../navigation/navigation-header-config'

export let lockEnterFingerprintOptions = null

export class LockEnterFingerprint extends Component<
  LockEnterFingerProps,
  LockEnterFingerState
> {
  state = {
    authenticationSuccess: false,
    failedAttempts: 0,
    errorMessage: null,
  }

  UNSAFE_componentWillReceiveProps(nextProps: LockEnterFingerProps) {
    //if fetching Invitation prop has changed and its fetched then only check for authentication
    if (
      this.props.isFetchingInvitation !== nextProps.isFetchingInvitation &&
      nextProps.isFetchingInvitation === false
    ) {
      if (this.state.authenticationSuccess) {
        this.onAuthenticationSuccess(nextProps.pendingRedirection)
      }
    }
  }

  onAuthenticationSuccess = (
    pendingRedirection: ?Array<PendingRedirection>
  ) => {
    //this method will be called in fingerprint authentication screen
    //or any where in app if there is a invitation received.
    if (pendingRedirection && pendingRedirection.length) {
      pendingRedirection.map((pendingRedirection) => {
        this.props.navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: pendingRedirection.routeName,
                params: pendingRedirection.params || {},
              },
            ],
          })
        )
      })
      this.props.clearPendingRedirect()
    } else if (this.props.onSuccess) {
      this.props.onSuccess()
    } else if (this.props.isAppLocked === true) {
      // * if app is unlocked and invitation is fetched , with out this condition we are redirecting user to home screen from invitation screen.
      // * this condition will avoid redirecting user to home screen if app is already unlocked
      this.props.navigation.navigate(homeRoute)
    }
    this.props.unlockApp()
  }

  touchIdHandler = () => {
    TouchId.isSupported()
      .then(() => {
        TouchId.authenticate(
          {
            title: 'Authentication Required',
          },
          this.touchIdHandler
        )
          .then(() => {
            TouchId.release()
            this.setState({ authenticationSuccess: true, errorMessage: null })
            this.onAuthenticationSuccess(this.props.pendingRedirection)
          })
          .catch((error) => {
            this.handleFailedAuth(error)
          })
      })
      .catch((error) => {
        this.handleFailedAuth(error)
      })
  }

  componentDidMount() {
    if (this.props.onSuccess) {
      lockEnterFingerprintOptions = 
      headerDefaultOptions({
        headline: undefined,
        headerHideShadow: true,
        transparent: true,
        isGoHomeOnArrowPress: true,
      })
    }
    
    this.touchIdHandler()
  }

  handleFailedAuth = (error: Error) => {
    TouchId.release()
    const { failedAttempts } = this.state
    TouchId.release()
    if (failedAttempts > 0) {
      if (AllowedFallbackToucheIDErrors.indexOf(error.name) >= 0) {
        this.setState({ failedAttempts: 0, errorMessage: null })
        this.props.navigation.navigate(lockEnterPinRoute)
      }
    }
    this.setState({
      failedAttempts: failedAttempts + 1,
      errorMessage: error.message,
    })
  }

  retryAuth = () => {
    this.setState({ errorMessage: null })
    this.touchIdHandler()
  }

  render() {
    const { isFetchingInvitation } = this.props
    const { errorMessage } = this.state
    const message =
      isFetchingInvitation && this.state.authenticationSuccess
        ? UNLOCKING_APP_WAIT_MESSAGE
        : ''

    if (isFetchingInvitation) {
      return (
        <Container center>
          <CustomText bg="tertiary" h5 tertiary demiBold center transparentBg>
            {message}
          </CustomText>
        </Container>
      )
    }

    return (
      <Container center>
        <CustomText bg="tertiary" h5 tertiary demiBold center transparentBg>
          {errorMessage}
        </CustomText>
        <CustomButton
          primary
          style={[style.tryAgainButton]}
          title={'Try again'}
          onPress={this.retryAuth}
        />
      </Container>
    )
  }
}

const mapStateToProps = (state: Store, { route: { params } }: any) => {
  const { onSuccess } = params || { onSuccess: null }
  return {
    pendingRedirection: state.lock.pendingRedirection,
    pendingRedirectionParams: state.lock.pendingRedirectionParams || {},
    isFetchingInvitation: Object.keys(state.smsPendingInvitation).some(
      (smsToken) =>
        state.smsPendingInvitation[smsToken] &&
        state.smsPendingInvitation[smsToken].isFetching === true
    ),
    isAppLocked: state.lock.isAppLocked,
    onSuccess,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      clearPendingRedirect,
      unlockApp,
    },
    dispatch
  )

export const lockEnterFingerprintScreen = {
  routeName: lockEnterFingerprintRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(LockEnterFingerprint),
}

const style = StyleSheet.create({
  tryAgainButton: {
    marginTop: 10,
  },
})
