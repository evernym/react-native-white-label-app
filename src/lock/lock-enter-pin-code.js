// @flow
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import type { ReactNavigation } from '../common/type-common'
import type { Store } from '../store/type-store'
import type { LockEnterPinProps, LockEnterPinState } from './type-lock'

import LockEnter from './lock-enter'
import {
  lockEnterPinRoute,
  lockPinSetupRoute,
  homeRoute,
} from '../common'
import { clearPendingRedirect } from './lock-store'
import {
  ENTER_PASS_CODE_MESSAGE,
  ENTER_YOUR_PASS_CODE_MESSAGE,
} from '../common/message-constants'
import { colors } from '../common/styles/constant'
import { UNLOCKING_APP_WAIT_MESSAGE } from '../common/message-constants'
import { unlockApp } from './lock-store'
import { View, Keyboard, Platform, StyleSheet } from 'react-native'
import { Header } from '../components'

export class LockEnterPin extends PureComponent<
  LockEnterPinProps,
  LockEnterPinState
> {
  state = {
    authenticationSuccess: false,
    isKeyboardHidden: false,
    showCustomKeyboard: false,
  }

  keyboardListener = null
  keyboardShowListener = null

  componentDidMount() {
    this.keyboardListener = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardHideState
    )
    this.keyboardShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this.keyboardShowState
    )
  }

  keyboardShowState = (event: any) => {
    if (event && event.endCoordinates.height < 100 && Platform.OS === 'ios') {
      this.setState({
        showCustomKeyboard: true,
      })
    } else {
      this.setState({
        showCustomKeyboard: false,
      })
    }
  }

  keyboardHideState = () => {
    this.setState({
      isKeyboardHidden: true,
    })

    if (
      this.state.authenticationSuccess &&
      this.props.currentScreen === lockEnterPinRoute
    ) {
      // if we reach at this screen from settings page
      // then user is trying to enable/disable touch id
      if (this.props.existingPin) {
        this.props.navigation.push &&
          this.props.navigation.push(lockPinSetupRoute, {
            existingPin: true,
          })
      }
    }
  }

  componentDidUpdate(prevProps: LockEnterPinProps) {
    if (
      prevProps.isFetchingInvitation !== this.props.isFetchingInvitation &&
      this.props.isFetchingInvitation === false &&
      this.props.pendingRedirection
    ) {
      if (this.state.authenticationSuccess && this.state.isKeyboardHidden) {
        // passing the this.props in to the redirect function
        // the prop is being changed (pendingRedirection) from object to null
        // CLEAR_PENDING_REDIRECT clearing the pendingRedirection property to null
        // so, the previous props are being sent for the redirection
        this.redirect(this.props)
      }
    }

    // we are removing the keyboard listener every time we navigate out of this screen.
    if (this.props.navigation.isFocused()) {
      if (!this.keyboardListener) {
        this.keyboardListener = Keyboard.addListener(
          'keyboardDidHide',
          this.keyboardHideState
        )
      }
      if (!this.keyboardShowListener) {
        this.keyboardShowListener = Keyboard.addListener(
          'keyboardDidShow',
          this.keyboardShowState
        )
      }
    } else if (
      prevProps.currentScreen === lockEnterPinRoute &&
      this.props.currentScreen !== lockEnterPinRoute
    ) {
      this.keyboardListener && this.keyboardListener.remove()
      this.keyboardShowListener && this.keyboardShowListener.remove()
    }
  }

  // passing the props in to the function
  redirect = (props: LockEnterPinProps) => {
    //This will set isAppLocked to false
    props.unlockApp()
    if (props.pendingRedirection) {
      props.pendingRedirection.map((pendingRedirection) => {
        props.navigation.navigate(
          pendingRedirection.routeName,
          pendingRedirection.params || {}
        )
      })
      props.clearPendingRedirect()
    } else {
      // If the app doesn't know where to redirect, send it to home instead of sitting on the locked screen
      this.props.navigation.navigate(homeRoute)
    }
  }

  onSuccess = () => {
    if (!this.state.authenticationSuccess) {
      this.setState({ authenticationSuccess: true })
      // if we reach at this screen from settings page
      // then user is trying to enable/disable touch id
      if (!this.props.existingPin) {
        // user is trying to unlock the app
        // check if user has some pending action, so redirect to those
        this.redirect(this.props)
      }
    }
  }

  redirectToSetupPasscode = () => {
    this.props.navigation.navigate(lockPinSetupRoute, {
      fromRecovery: this.props.inRecovery
    })
  }

  render() {
    const { isFetchingInvitation } = this.props

    let message = this.props.existingPin
      ? ENTER_YOUR_PASS_CODE_MESSAGE
      : ENTER_PASS_CODE_MESSAGE

    if (isFetchingInvitation && this.state.authenticationSuccess) {
      message = UNLOCKING_APP_WAIT_MESSAGE
    }

    return (
      <View style={styles.container}>
        <Header
          hideBackButton={true}
          transparent={true}
          navigation={this.props.navigation}
          route={this.props.route}
        />
        <LockEnter
          fromRecovery={this.props.inRecovery}
          onSuccess={this.onSuccess}
          message={message}
          setupNewPassCode={this.redirectToSetupPasscode}
          enableCustomKeyboard={this.state.showCustomKeyboard}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
  },
})

const mapStateToProps = (state: Store, { route }: ReactNavigation) => ({
  pendingRedirection: state.lock.pendingRedirection,
  isFetchingInvitation: Object.keys(state.smsPendingInvitation).some(
    (smsToken) =>
      state.smsPendingInvitation[smsToken] &&
      state.smsPendingInvitation[smsToken].isFetching === true
  ),
  existingPin: route && route.params && route.params.existingPin || false,
  isAppLocked: state.lock.isAppLocked,
  inRecovery: state.lock.inRecovery === 'true',
  currentScreen: state.route.currentScreen,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      clearPendingRedirect,
      unlockApp,
    },
    dispatch
  )

export const lockEnterPinScreen = {
  routeName: lockEnterPinRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(LockEnterPin),
}
