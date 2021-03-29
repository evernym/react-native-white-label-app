// @flow
import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import type { Store } from '../store/type-store'
import type { LockSetupSuccessProps, LockSetupSuccessState } from './type-lock'

import { Container, CustomText, CustomButton } from '../components'
import {
  settingsDrawerRoute,
  lockSetupSuccessRoute,
  homeRoute,
} from '../common'
import { unlockApp, clearPendingRedirect } from './lock-store'
import { OFFSET_1X, OFFSET_2X, OFFSET_4X, colors } from '../common/styles'
import { UNLOCKING_APP_WAIT_MESSAGE } from '../common/message-constants'

import { EvaIcon, LOCK_ICON } from '../common/icons'
import { moderateScale } from 'react-native-size-matters'
import { appName } from '../external-imports'

export class LockSetupSuccess extends Component<
  LockSetupSuccessProps,
  LockSetupSuccessState
> {
  onClose = () => {
    this.props.unlockApp()
    if (
      this.props.route &&
      this.props.route.params &&
      this.props.route.params.changePin === true
    ) {
      this.props.navigation.navigate(homeRoute, { screen: settingsDrawerRoute })
    } else if (this.props.pendingRedirection) {
      // if there is a redirection pending, then redirect and clear it
      this.props.pendingRedirection.map((pendingRedirection) => {
        this.props.navigation.navigate(
          pendingRedirection.routeName,
          pendingRedirection.params || {}
        )
      })
      this.props.clearPendingRedirect()
    } else {
      this.props.navigation.navigate(homeRoute)
    }
  }

  render() {
    const { isFetchingInvitation } = this.props
    let message =
      this.props.route &&
      this.props.route.params &&
      this.props.route.params.changePin === true
        ? `Your ${appName} app is secured.`
        : `Your ${appName} app is now secured`

    if (isFetchingInvitation === true) {
      message = UNLOCKING_APP_WAIT_MESSAGE
    }

    return (
      <Container tertiary safeArea>
        <Container clearBg center style={[style.successContainer]}>
          <View style={style.iconBorder}>
            <EvaIcon
              name={LOCK_ICON}
              width={moderateScale(40)}
              height={moderateScale(40)}
              color={colors.main}
            />
          </View>
          <CustomText
            h4
            bg="tertiary"
            tertiary
            thick
            center
            style={[style.successMessage]}
          >
            {message}
          </CustomText>
          <CustomText
            h6
            bg="tertiary"
            tertiary
            thick
            center
            style={[style.successMessage]}
          >
            {this.props.route &&
            this.props.route.params &&
            this.props.route.params.changePin
              ? "From now on you'll need to use your passcode to unlock this app."
              : ' '}
          </CustomText>
        </Container>
        <View style={style.buttonContainer}>
          <CustomButton
            primary
            raised
            medium
            disabled={isFetchingInvitation}
            testID="close-button"
            fontWeight="600"
            title="Close"
            onPress={this.onClose}
          />
        </View>
      </Container>
    )
  }
}

const mapStateToProps = (state: Store, props) => ({
  pendingRedirection: state.lock.pendingRedirection,
  pendingRedirectionParams: state.lock.pendingRedirectionParams || {},
  isFetchingInvitation: Object.keys(state.smsPendingInvitation).some(
    (smsToken) =>
      state.smsPendingInvitation[smsToken] &&
      state.smsPendingInvitation[smsToken].isFetching === true
  ),
  changePin:
    props.route.params !== undefined ? props.route.params.changePin : false,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      clearPendingRedirect,
      unlockApp,
    },
    dispatch
  )

export const lockSetupSuccessScreen = {
  routeName: lockSetupSuccessRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(LockSetupSuccess),
}

const style = StyleSheet.create({
  iconBorder: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderWidth: 2,
    borderColor: colors.main,
    borderRadius: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    paddingHorizontal: OFFSET_2X,
  },
  successMessage: {
    paddingVertical: OFFSET_4X,
  },
  successInfo: {
    paddingHorizontal: OFFSET_1X,
  },
  buttonContainer: {
    marginHorizontal: '2%',
  },
})
