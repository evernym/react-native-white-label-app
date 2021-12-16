// @flow

import React, { Component } from 'react'
import {
  View,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { PanGestureHandler, State } from 'react-native-gesture-handler'

import type { Store } from '../store/type-store'

import { cloudBackupRoute, settingsRoute } from '../common'
import { withStatusBar } from '../components/status-bar/status-bar'

import { Container, CustomView, CustomText, CustomButton } from '../components'
import {
  getCloudBackupStatus,
  getAutoCloudBackupEnabled,
} from '../store/store-selector'
import { connectionHistoryBackedUp } from '../connection-history/connection-history-store'
import { cloudBackupStart, resetCloudBackupStatus } from './backup-store'
import { setAutoCloudBackupEnabled } from './backup-actions'
import { color, colors } from '../common/styles/constant'

import { questionStyles } from './styles'
const appImage = require('../images/cb_app.png')
const downloadImage = require('../images/Group.png')

const successImg = require('../images/Success.png')
const errorImg = require('../images/Sad_Face_Red_Error.png')

import type {
  CloudBackupScreenProps,
  NavigateBackToSettingsType,
} from './type-backup'

import { QuestionScreenHeader } from '../question/components/question-screen-header'

import {
  CLOUD_BACKUP_LOADING,
  CLOUD_BACKUP_COMPLETE,
  CLOUD_BACKUP_FAILURE,
  AUTO_CLOUD_BACKUP_ENABLED,
  WALLET_BACKUP_FAILURE,
} from './type-backup'
import { safeSet, walletSet } from '../services/storage'
import { appName } from '../external-imports'

const { height } = Dimensions.get('window')

// TODO: this is copy and pasted questionStyles from the question modal, should refactor once generic modal is made
export class CloudBackup extends Component<CloudBackupScreenProps, void> {
  _translateY = new Animated.Value(0)

  componentDidMount = () => {
    this.props.resetCloudBackupStatus()

    // NOTE: automatically start backing up and show QuestionLoader
    if (this.props.isAutoBackupEnabled) {
      this.props.cloudBackupStart()
    }
    // NOTE: might switxh to automatically start backing up and show QuestionLoader
    // const {fromToggleAction, switchState} = this.props.route.params
    // if (this.props.isAutoBackupEnabled && !fromToggleAction) {
    //   this.props.cloudBackupStart()
    // } else if(fromToggleAction && !switchState) {
    //   walletSet(AUTO_CLOUD_BACKUP_ENABLED, 'false')
    //   this.props.setAutoCloudBackupEnabled(false)
    //   this.props.cloudBackupStart()
    //}
  }

  startCloudBackup = (autoCloudBackupEnabled: boolean) => {
    walletSet(AUTO_CLOUD_BACKUP_ENABLED, autoCloudBackupEnabled.toString())
    safeSet(AUTO_CLOUD_BACKUP_ENABLED, autoCloudBackupEnabled.toString())
    this.props.setAutoCloudBackupEnabled(autoCloudBackupEnabled)
    this.props.cloudBackupStart()
  }

  _getTransform = (translateY) => [{ translateY }]

  _getOpacity = (translateY) =>
    translateY.interpolate({
      inputRange: [0, height],
      outputRange: [1, 0.2],
      extrapolate: 'clamp',
    })

  // this a common pattern when we want to be sure that we are not running
  // actions after a component is unmounted
  // in our case, user can close modal either by pressing "okay" or clicking outside
  // so we need to be sure that we are not running code after this component
  // is unmounted from react-native tree
  isUnmounted = false
  // this variable is just to ensure that on slow devices
  // if user clicks on gray area and component was already scheduled to close
  // by auto close, or by user clicking on okay button and then auto-close trigger
  // we want to make sure that close is triggered by either action
  // and we don't want to run close again in any case
  isCloseTriggered = false

  componentWillUnmount() {
    this.isUnmounted = true
  }
  onCancel = () => {
    !this.isUnmounted &&
      !this.isCloseTriggered &&
      this.props.navigation.navigate(settingsRoute)
    this.isCloseTriggered = true
  }

  _onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationY: this._translateY,
        },
      },
    ],
    {
      useNativeDriver: true,
    }
  )

  _onHandlerStateChange = (event) => {
    const { state, velocityY, translationY } = event.nativeEvent
    if (state === State.END) {
      const minimumDistanceToClose = 150
      if (velocityY > 60 || translationY > minimumDistanceToClose) {
        this.onCancel()
        return
      }

      Animated.spring(this._translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
    }
  }

  getModalBody = (cloudBackupStatus: any) => {
    if (cloudBackupStatus === CLOUD_BACKUP_LOADING) {
      return <QuestionLoader />
    } else if (cloudBackupStatus === CLOUD_BACKUP_COMPLETE) {
      this.props.connectionHistoryBackedUp()
      return <Success navigateBackToSettings={this.navigateBackToSettings} />
    } else if (
      cloudBackupStatus === CLOUD_BACKUP_FAILURE ||
      cloudBackupStatus === WALLET_BACKUP_FAILURE
    ) {
      return <Error navigateBackToSettings={this.navigateBackToSettings} />
    } else {
      return this.mainBody()
    }
  }

  navigateBackToSettings = () => {
    this.props.navigation.navigate(settingsRoute)
  }

  mainBody = () => {
    return (
      <View>
        <CustomView row center>
          <Image
            style={[questionStyles.backupLogo]}
            source={downloadImage}
            resizeMode="cover"
          />
        </CustomView>
        <CustomView row center />
        <CustomText
          center
          size={23}
          numberOfLines={2}
          bg={false}
          bold
          style={[questionStyles.customTextHelperStyles]}
        >
          Enable Automatic Backups?
        </CustomText>
        <CustomText
          size="p"
          bg={false}
          style={[{ color: color.bg.tertiary.font.seventh }]}
        >
          When enabled, any changes to your {appName} app are automatically
          backed up to the Evernym Cloud. This makes recovery easier should you
          lose your phone.
        </CustomText>
        <CustomView style={questionStyles.customViewHelperStyles}>
          <CustomText
            size="p"
            bg={false}
            style={[{ color: color.bg.tertiary.font.seventh }]}
          >
            All {appName} backups are encrypted and anonymized before leaving
            your phone. You will still need your Recovery Phrase and a fresh
            install of {appName} to recover.
          </CustomText>
        </CustomView>

        <CustomView>
          <CustomView row style={[questionStyles.questionActionContainer]}>
            <Container>
              <CustomButton
                twelfth
                style={[
                  questionStyles.actionButton,
                  questionStyles.cancelButton,
                ]}
                title={'Just One Cloud Backup'}
                // testID={`${testID}-cancel`}
                onPress={() => this.startCloudBackup(false)}
              />

              <CustomView style={questionStyles.customViewHelperStyles}>
                <CustomButton
                  primary
                  style={[
                    questionStyles.actionButton,
                    questionStyles.submitButton,
                  ]}
                  title={'Enable Automatic Backups'}
                  // testID={`${testID}-submit`}
                  onPress={() => this.startCloudBackup(true)}
                />
              </CustomView>
            </Container>
          </CustomView>
        </CustomView>
      </View>
    )
  }

  render() {
    const transform = this._getTransform(this._translateY)
    const opacity = this._getOpacity(this._translateY)
    return (
      <Animated.View
        style={[
          questionStyles.container,
          questionStyles.mainContainer,
          {
            opacity,
          },
        ]}
      >
        <Animated.View style={[questionStyles.container, { transform }]}>
          <Container style={[questionStyles.headerContainer]}>
            <PanGestureHandler
              onGestureEvent={this._onPanGestureEvent}
              onHandlerStateChange={this._onHandlerStateChange}
            >
              <Animated.View style={[questionStyles.container]}>
                <QuestionScreenHeader onCancel={this.onCancel} />
              </Animated.View>
            </PanGestureHandler>
          </Container>
          <Animated.View style={[questionStyles.screenContainer]}>
            <View>
              <CustomView
                row
                style={[questionStyles.questionSenderContainer]}
                center
              >
                <CustomView>
                  <Image
                    style={[questionStyles.questionSenderLogo]}
                    source={appImage}
                    resizeMode="cover"
                  />
                </CustomView>
                <Container style={[questionStyles.questionSenderName]}>
                  <CustomText
                    size="h5"
                    numberOfLines={2}
                    bg={false}
                    bold
                    style={[{ color: color.bg.tertiary.font.seventh }]}
                  >
                    Cloud Backup
                  </CustomText>
                </Container>
              </CustomView>
              {this.getModalBody(this.props.cloudBackupStatus)}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    )
  }
}

function QuestionLoader() {
  return (
    <CustomView bg="tertiary" style={[questionStyles.questionLoaderContainer]}>
      <ActivityIndicator size="large" color={colors.gray3} />
      <CustomText center bg={false}>
        Creating Backup
      </CustomText>
    </CustomView>
  )
}
function Error({ navigateBackToSettings }: NavigateBackToSettingsType) {
  return (
    <CustomView bg="tertiary" style={[questionStyles.questionLoaderContainer]}>
      <Image
        style={[questionStyles.successErrorImg]}
        source={errorImg}
        resizeMode="cover"
      />
      <CustomText center bg={false}>
        Error creating backup!
      </CustomText>
      <CustomView style={questionStyles.dismissButton}>
        <CustomButton
          primary
          style={[questionStyles.actionButton, questionStyles.errorButton]}
          title={'Done'}
          onPress={navigateBackToSettings}
        />
      </CustomView>
    </CustomView>
  )
}
function Success({ navigateBackToSettings }: NavigateBackToSettingsType) {
  return (
    <CustomView bg="tertiary" style={[questionStyles.questionLoaderContainer]}>
      <Image
        style={[questionStyles.successErrorImg]}
        source={successImg}
        resizeMode="cover"
      />

      <CustomText center bg={false}>
        Successfully backed up
      </CustomText>
      <CustomView style={questionStyles.dismissButton}>
        <CustomButton
          primary
          style={[questionStyles.actionButton, questionStyles.submitButton]}
          title={'Done'}
          onPress={navigateBackToSettings}
        />
      </CustomView>
    </CustomView>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      cloudBackupStart,
      resetCloudBackupStatus,
      setAutoCloudBackupEnabled,
      connectionHistoryBackedUp,
    },
    dispatch
  )

const mapStateToProps = (state: Store) => {
  return {
    cloudBackupStatus: getCloudBackupStatus(state),
    isAutoBackupEnabled: getAutoCloudBackupEnabled(state),
  }
}

export const cloudBackupScreen = {
  routeName: cloudBackupRoute,
  screen: withStatusBar({ color: colors.white })(
    connect(mapStateToProps, mapDispatchToProps)(CloudBackup)
  ),
}
