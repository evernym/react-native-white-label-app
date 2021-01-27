// @flow
import messaging from '@react-native-firebase/messaging'
import React, { Component } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  AppState,
} from 'react-native'

// $FlowExpectedError[cannot-resolve-module] external file
import { APP_NAME } from '../../../../../../app/evernym-sdk/app'

import {
  pushNotificationPermissionRoute,
  invitationRoute,
} from '../../common/route-constants'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'
import {
  allowPushNotifications,
  pushNotificationPermissionAction,
} from '../push-notification-store'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { ModalHeaderBar } from '../../components/modal-header-bar/modal-header-bar'

import type { Store } from '../../store/type-store'
import type {
  PushNotificationPermissionProps,
  PushNotificationPermissionState,
} from './type-push-notification-permission'

export const getPushNotificationAuthorizationStatus = async () => {
  const authorizationStatus: number = await messaging().hasPermission()
  // -1 = user has yet to be asked for permission
  // 0 = when the user denies permission
  // the default clause here handles the 1 and 2 scenarios which is
  // 1 = allowed push notifications
  // 2=  allowed provisioned push notifications
  switch (authorizationStatus) {
    case -1:
      return false
    case 0:
      return false
    default:
      return true
  }
}

class PushNotificationPermission extends Component<
  PushNotificationPermissionProps,
  PushNotificationPermissionState
> {
  state = {
    appState: AppState.currentState,
    isPushNotificationsAuthorized: -1,
  }

  async componentDidMount() {
    const isPushNotificationsAuthorized: number = await messaging().hasPermission()

    this.setState({ isPushNotificationsAuthorized })

    AppState.addEventListener('change', this.handleAppStateChange)
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.isAllowedPushNotification !==
        prevProps.isAllowedPushNotification &&
      this.props.isAllowedPushNotification === true
    ) {
      this.props.navigation.navigate(
        this.props.route.params.intendedRoute || invitationRoute,
        {
          senderDID: this.props.route.params.senderDID,
          backRedirectRoute: this.props.route.params?.intendedPayload
            ?.backRedirectRoute,
          uid: this.props.route.params?.intendedPayload?.uid,
          invitationPayload: this.props.route.params?.intendedPayload
            ?.invitationPayload,
          attachedRequest: this.props.route.params?.intendedPayload
            ?.attachedRequest,
          senderName: this.props.route.params?.intendedPayload?.senderName,
        }
      )
    }
  }

  handleAppStateChange = async (nextAppState) => {
    if (
      this.state.appState &&
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      const authorizationStatus = await messaging().hasPermission()

      if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED) {
        this.props.navigation.navigate(
          this.props.route.params.intendedRoute || invitationRoute,
          {
            senderDID: this.props.route.params.senderDID,
            backRedirectRoute: this.props.route.params?.intendedPayload
              ?.backRedirectRoute,
            uid: this.props.route.params?.intendedPayload?.uid,
            invitationPayload: this.props.route.params?.intendedPayload
              ?.invitationPayload,
            attachedRequest: this.props.route.params?.intendedPayload
              ?.attachedRequest,
            senderName: this.props.route.params?.intendedPayload?.senderName,
          }
        )
      } else return
    }
    this.setState({ appState: nextAppState })
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange)
  }

  openSettings = async () => {
    await Linking.openSettings()
  }

  getUrlAsync = async () => {
    const initialUrl = await Linking.getInitialURL()
    return initialUrl
  }

  renderInformationText = () => {
    const { isPushNotificationsAuthorized } = this.state

    if (isPushNotificationsAuthorized === -1) {
      return (
        <Text style={styles.informationText}>
          Enable push notifications so you don’t miss an important message.
        </Text>
      )
    } else if (isPushNotificationsAuthorized === 0) {
      return (
        <Text style={styles.informationText}>
          Enable push notifications so you don’t miss an important message.
          Please go to your device settings and enable push notifications for
          {APP_NAME}.
        </Text>
      )
    }
  }

  renderWarningText = () => {
    const { isPushNotificationsAuthorized } = this.state

    if (isPushNotificationsAuthorized === 0) {
      return (
        <Text style={styles.warningText}>
          You have disabled push notifications.
        </Text>
      )
    } else return <Text style={styles.emptyWarningText}></Text>
  }

  renderCorrectButton = () => {
    const { isPushNotificationsAuthorized } = this.state

    if (isPushNotificationsAuthorized === -1) {
      return (
        <TouchableOpacity
          style={styles.greenButton}
          accessibilityLabel="allow-notifications-button"
          accessible={true}
          onPress={this.closeModalAndAllowPushNotifications}
        >
          <Text style={styles.greenButtonText}>Allow Push Notifications</Text>
        </TouchableOpacity>
      )
    } else if (isPushNotificationsAuthorized === 0) {
      return (
        <TouchableOpacity
          style={styles.greenButton}
          onPress={this.openSettings}
        >
          <Text style={styles.greenButtonText}>Settings</Text>
        </TouchableOpacity>
      )
    }
  }

  closeModal = () => {
    const {
      route: {
        params: { senderDID },
      },
      navigation: { navigate },
      pushNotificationPermissionAction,
    } = this.props

    pushNotificationPermissionAction(false)

    navigate(this.props.route.params.intendedRoute || invitationRoute, {
      senderDID,
      backRedirectRoute: this.props.route.params?.intendedPayload
        ?.backRedirectRoute,
      uid: this.props.route.params?.intendedPayload?.uid,
      invitationPayload: this.props.route.params?.intendedPayload
        ?.invitationPayload,
      attachedRequest: this.props.route.params?.intendedPayload
        ?.attachedRequest,
      senderName: this.props.route.params?.intendedPayload?.senderName,
    })
  }

  closeModalAndAllowPushNotifications = () => {
    const {
      route: {
        params: { senderDID },
      },
      navigation: { navigate },
      allowPushNotifications,
    } = this.props

    navigate(this.props.route.params.intendedRoute || invitationRoute, {
      senderDID,
      backRedirectRoute: this.props.route.params?.intendedPayload
        ?.backRedirectRoute,
      uid: this.props.route.params?.intendedPayload?.uid,
      invitationPayload: this.props.route.params?.intendedPayload
        ?.invitationPayload,
      attachedRequest: this.props.route.params?.intendedPayload
        ?.attachedRequest,
      senderName: this.props.route.params?.intendedPayload?.senderName,
    })

    allowPushNotifications()
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.textSection}>
          <Text style={styles.headline}>Push Notifications Needed</Text>
          {this.renderWarningText()}
          {this.renderInformationText()}
        </View>
        <View style={styles.imageSection}>
          <Image
            style={styles.image}
            source={require('../../images/iphoneX.png')}
          />
          <View style={styles.buttonsSection} accessible={false} accessibilityLabel="push-notifications-buttons-container">
            {this.renderCorrectButton()}
            <TouchableOpacity
              style={styles.redButton}
              accessibilityLabel="not-now-notifications-button"
              accessible={true}
              onPress={this.closeModal}
            >
              <Text style={styles.redButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    isAllowedPushNotification:
      state.pushNotification && state.pushNotification.isAllowed,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      allowPushNotifications,
      pushNotificationPermissionAction,
    },
    dispatch
  )

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    width: '100%',
    height: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  imageSection: {
    width: '100%',
    height: '70%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  image: {
    position: 'absolute',
    top: -moderateScale(10, 0.1),
    width: moderateScale(300, 0.1),
    height: moderateScale(600, 0.1),
  },
  headline: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size2),
    marginTop: moderateScale(5),
    color: colors.cmGray2,
    fontWeight: '700',
  },
  informationText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size3),
    color: colors.cmGray1,
    fontWeight: '700',
    flexWrap: 'wrap',
  },
  emptyWarningText: {
    marginBottom: moderateScale(12),
    marginTop: moderateScale(12),
  },
  warningText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size3),
    color: colors.cmRed,
    fontWeight: '700',
    marginTop: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  greenButton: {
    backgroundColor: colors.cmGreen1,
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(56),
    borderRadius: 5,
    width: '100%',
    marginBottom: 8,
  },
  buttonsSection: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '40%',
    bottom: -15,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.cmWhite,
  },
  greenButtonText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size4),
    color: colors.cmWhite,
    fontWeight: 'bold',
  },
  redButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(56),
    borderRadius: 5,
    borderColor: colors.cmRed,
    borderWidth: 1,
    width: '100%',
  },
  redButtonText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size4),
    color: colors.cmRed,
    fontWeight: 'bold',
  },
})

export const pushNotificationPermissionScreen = {
  routeName: pushNotificationPermissionRoute,
  screen: connect(
    mapStateToProps,
    mapDispatchToProps
  )(PushNotificationPermission),
}

pushNotificationPermissionScreen.screen.navigationOptions = ({
  navigation: { goBack, isFocused },
}) => ({
  safeAreaInsets: { top: isFocused() ? verticalScale(85) : verticalScale(100) },
  cardStyle: {
    marginLeft: '2.5%',
    marginRight: '2.5%',
    marginBottom: '4%',
    borderRadius: 10,
    backgroundColor: colors.cmWhite,
  },
  cardOverlay: () => (
    <ModalHeaderBar
      headerTitle={''}
      dismissIconType={null}
      onPress={() => goBack(null)}
    />
  ),
})
