// @flow
import { Component } from 'react'
import { Platform } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import messaging from '@react-native-firebase/messaging'
import PushNotificationIOS from '@react-native-community/push-notification-ios'

import type {
  NotificationOpen,
  RemoteMessage,
} from '@react-native-firebase/app'
import type {
  PushNotificationProps,
  NotificationOpenOptions,
} from './type-push-notification'
import type { Store } from '../store/type-store'
import type { NotificationPayload } from '../common/type-common'

import {
  pushNotificationPermissionAction,
  updatePushToken,
  fetchAdditionalData,
} from './push-notification-store'
import { customLogger } from '../store/custom-logger'
import { getUnacknowledgedMessages } from '../store/config-store'
import { getNewMessagesCount } from '../store/store-selector'
import {usePushNotifications} from "../external-exports";

export const remoteMessageParser = (message: RemoteMessage) => {
  const {
    forDID,
    uid,
    type,
    remotePairwiseDID,
    pushNotifMsgText,
    pushNotifMsgTitle,
    senderLogoUrl,
    msg,
    msgType,
  } = message.data

  return {
    forDID,
    uid,
    type,
    remotePairwiseDID,
    senderLogoUrl,
    pushNotifMsgText,
    pushNotifMsgTitle,
    msg,
    msgType,
  }
}

export class PushNotification extends Component<PushNotificationProps, void> {
  notificationListener = null
  initialNotificationListener = null
  refreshTokenListener = null
  notificationDisplayedListener = null
  onNotificationOpenedListener = null
  messageListener = null

  componentDidMount = async () => {
    if (Platform.OS === 'ios' && usePushNotifications) {
      // Sets the current badge number on the app icon to zero. iOS only for now.
      PushNotificationIOS.setApplicationIconBadgeNumber(0)
      // Removes all delivered notifications from notification center
      PushNotificationIOS.removeAllDeliveredNotifications()
    }

    // When a notification is opened, the listener is invoked with the notification and the action that was invoked when it was clicked on.
    this.onNotificationOpenedListener = messaging().onNotificationOpenedApp(
      (notification: NotificationOpen) => {
        const payload = remoteMessageParser(notification)
        this.onPushNotificationReceived(payload, {
          openMessageDirectly: true,
          uid: payload.uid,
        })
      }
    )

    this.messageListener = messaging().onMessage((message: RemoteMessage) => {
      const payload = remoteMessageParser(message)
      this.onPushNotificationReceived(payload, {
        openMessageDirectly: true,
        uid: payload.uid,
      })
    })

    try {
      // Due to the delay in the React Native bridge, the onNotification listeners will not be available at startup, so this method can be used to check to see if the application was opened by a notification.
      const notification: NotificationOpen = await messaging().getInitialNotification()
      // App was opened by a notification
      if (notification) {
        const payload = remoteMessageParser(notification)
        this.onPushNotificationReceived(payload, {
          openMessageDirectly: true,
          uid: payload.uid,
        })
      }
    } catch (e) {
      // TODO: handle error better
      customLogger.log(e)
    }
  }

  listenForTokenUpdate() {
    this.refreshTokenListener = messaging().onTokenRefresh((token) => {
      this.saveDeviceToken(token)
    })
  }

  onPushNotificationReceived(
    notificationPayload: NotificationPayload,
    notificationOpenOptions: ?NotificationOpenOptions
  ) {
    if (notificationPayload) {
      this.props.fetchAdditionalData(
        notificationPayload,
        notificationOpenOptions
          ? { ...notificationOpenOptions, uid: notificationPayload.uid }
          : null
      )
    }
  }

  saveDeviceToken(token: string) {
    if (token) {
      this.props.updatePushToken(token)
    }
  }

  getToken() {
    messaging()
      .getToken()
      .then((token) => {
        if (token) {
          // user has a device token
          this.saveDeviceToken(token)
        } else {
          // user doesn't have a device token
        }
      })
      .catch(() => {
        // we didn't get a token
        // for now we can just ignore it
        // but we might need to add a feature which will remind user to give
        // permission and thereby getting token
        // or we need to retry getToken function a few times
        // TODO:KS Don't know what to do for now
      })
    this.listenForTokenUpdate()
  }

  componentDidUpdate(prevProps: PushNotificationProps) {
    const { newMessagesCount, isAllowed } = this.props

    if (isAllowed !== prevProps.isAllowed && isAllowed === true) {
      this.getToken()
    }

    if (
      Platform.OS === 'ios' && usePushNotifications &&
      newMessagesCount !== prevProps.newMessagesCount
    ) {
      PushNotificationIOS.setApplicationIconBadgeNumber(newMessagesCount || 0)
    }
  }

  componentWillUnmount() {
    // stop listening for events
    this.notificationListener &&
      this.notificationListener.remove &&
      this.notificationListener.remove()
    this.refreshTokenListener &&
      this.refreshTokenListener.remove &&
      this.refreshTokenListener.remove()
    this.notificationDisplayedListener &&
      this.notificationDisplayedListener.remove &&
      this.notificationDisplayedListener.remove()
    this.onNotificationOpenedListener &&
      this.onNotificationOpenedListener.remove &&
      this.onNotificationOpenedListener.remove()
    this.messageListener &&
      this.messageListener.remove &&
      this.messageListener.remove()
  }

  render() {
    return null
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      pushNotificationPermissionAction,
      updatePushToken,
      fetchAdditionalData,
      getUnacknowledgedMessages,
    },
    dispatch
  )

const mapStateToProps = (state: Store) => {
  const newMessagesCount = getNewMessagesCount(state)
  return {
    isAllowed: state.pushNotification.isAllowed,
    pushToken: state.pushNotification.pushToken,
    newMessagesCount,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PushNotification)
