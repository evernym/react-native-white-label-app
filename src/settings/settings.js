// @flow
import React, { Component } from 'react'
import {
  Platform,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native'
import { moderateScale, verticalScale } from 'react-native-size-matters'
import { Apptentive } from 'apptentive-react-native'
import moment from 'moment'
import { ListItem } from 'react-native-elements'
import get from 'lodash.get'

import { CameraButton, CustomText } from '../components'
import { Container, CustomView } from '../components/layout'
import {
  aboutAppRoute,
  cloudBackupRoute,
  designStyleGuideRoute,
  exportBackupFileRoute,
  genRecoveryPhraseRoute,
  lockAuthorizationHomeRoute,
  lockPinSetupRoute,
  lockTouchIdSetupRoute,
  qrCodeScannerTabRoute,
  settingsRoute,
} from '../common/route-constants'
import ToggleSwitch from 'react-native-flip-toggle-button'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { colors } from '../common/styles/constant'
import type { Store } from '../store/type-store'
import type { SettingsProps, SettingsState } from './type-settings'
import { selectUserAvatar } from '../store/user/user-store'
import {
  cloudBackupStart,
  exportBackup,
  generateBackupFile,
  generateRecoveryPhrase,
} from '../backup/backup-store'
import {
  cloudBackupFailure,
  setAutoCloudBackupEnabled,
  viewedWalletError,
} from '../backup/backup-actions'

import {
  getHasVerifiedRecoveryPhrase,
  getWalletBalance,
} from '../store/store-selector'
import SvgCustomIcon from '../components/svg-setting-icons'
import { withStatusBar } from '../components/status-bar/status-bar'
import {
  AUTO_CLOUD_BACKUP_ENABLED,
  CLOUD_BACKUP_FAILURE,
  WALLET_BACKUP_FAILURE,
} from '../backup/type-backup'
import { safeSet, walletSet } from '../services/storage'
import { addPendingRedirection } from '../lock/lock-store'
import { setupApptentive } from '../feedback'
import { customLogger } from '../store/custom-logger'
import { NotificationCard } from '../in-app-notification/in-app-notification-card'
import {
  ARROW_RIGHT_ICON,
  CHAT_ICON,
  EvaIcon,
  INFO_ICON,
  SAVE_ICON,
} from '../common/icons'
import { sendLogsRoute } from '../common'
import { style } from './settings-styles'
import { formatBackupString } from './settings-utils'
import {
  ABOUT,
  VIEW_BACKUP_PASSPHRASE,
  BIOMETRICS,
  CLOUD_BACKUP,
  DEFAULT_OPTIONS,
  DESIGN_STYLE_GUIDE,
  FEEDBACK,
  LOGS,
  MANUAL_BACKUP,
  PASSCODE,
} from './settings-constants'

import {
  appName,
  apptentiveCredentials,
  customSettingsOptions,
  CustomSettingsScreen,
  settingsShowCameraButton,
  settingsHeadline,
} from '../external-imports'

export const headlineForSettingRoute = settingsHeadline || 'Settings'
const showCameraButton =
  typeof settingsShowCameraButton === 'boolean'
    ? settingsShowCameraButton
    : true
const settingsOptions = customSettingsOptions || DEFAULT_OPTIONS

export class Settings extends Component<SettingsProps, SettingsState> {
  state = {
    walletBackupModalVisible: false,
    disableTouchIdSwitch: false,
  }

  onAuthSuccess = () => {
    this.props.navigation.push(lockPinSetupRoute, {
      existingPin: true,
    })
  }

  onChangePinClick = () => {
    const { navigation } = this.props
    navigation.navigate(lockAuthorizationHomeRoute, {
      onSuccess: this.onAuthSuccess,
    })
  }

  onChangeTouchId = (switchState: boolean) => {
    const { navigation } = this.props
    // when the navigation from settings is done by touching the Switch, then the touch id enables with weird behaviour
    // reason for the behaviour: the onChangeTouchId function is being invoked twice making to navigate twice.
    // solution: the if condition will check for the current state of the switch and compares with the actual state of the switch
    // this confirms to make the onChangeTouchId function to invoke only once at all the times
    if (this.props.touchIdActive !== switchState && navigation.isFocused()) {
      navigation.push &&
        navigation.push(lockTouchIdSetupRoute, {
          fromSettings: true,
        })
    }
  }
  toggleAutoCloudBackupEnabled = (switchState: boolean) => {
    // popup modal to enable cloud back but no modal needed when setting automatic
    // backup to false
    // NOTE: might swtich to - this.props.navigation.navigate(cloudBackupRoute, {fromToggleAction: true, switchState})
    if (switchState) {
      this.props.navigation.navigate(cloudBackupRoute, {})
    } else {
      walletSet(AUTO_CLOUD_BACKUP_ENABLED, switchState.toString())
      safeSet(AUTO_CLOUD_BACKUP_ENABLED, switchState.toString())
      this.props.setAutoCloudBackupEnabled(switchState)
    }
  }

  onBackup = () => {
    const {
      generateRecoveryPhrase,
      hasVerifiedRecoveryPhrase,
      navigation: { navigate, state },
    } = this.props
    // If no there is no route, then default to Settings
    const initialRoute = get(state, 'routeName', settingsRoute)

    //goto genRecoveryPhraseRoute if no cloudbackup or zip backup
    if (!hasVerifiedRecoveryPhrase) {
      navigate(genRecoveryPhraseRoute, {
        initialRoute,
      })
    } else {
      generateRecoveryPhrase()
      navigate(exportBackupFileRoute, {
        initialRoute,
      })
    }
  }

  viewRecoveryPhrase = () => {
    const { navigation } = this.props
    navigation.navigate(lockAuthorizationHomeRoute, {
      onSuccess: () => {
        this.props.navigation.push(genRecoveryPhraseRoute, {
          viewOnlyMode: true,
        })
      },
    })
  }

  openAboutApp = () => {
    if (this.props.navigation.isFocused()) {
      this.props.navigation.navigate(aboutAppRoute, {})
    }
  }

  openSendErrorLogs = () => {
    this.props.navigation.navigate(sendLogsRoute)
  }

  // openOnfido = () => {
  //   const locales = RNLocalize.getLocales()
  //   let showComingSoonAlert = false
  //
  //   if (locales.length > 0) {
  //     const countryCode = locales[0].countryCode
  //     if (['US', 'GB', 'CA'].includes(countryCode)) {
  //       this.props.navigation.navigate(onfidoRoute, {})
  //     } else {
  //       showComingSoonAlert = true
  //     }
  //   } else {
  //     showComingSoonAlert = true
  //   }
  //
  //   if (showComingSoonAlert) {
  //     Alert.alert(
  //       'Coming Soon',
  //       'The Onfido digital credential feature is not yet available in your region',
  //       [{ text: 'OK' }],
  //       {
  //         cancelable: false,
  //       }
  //     )
  //   }
  // }

  openStyleGuide = () => {
    this.props.navigation.navigate(designStyleGuideRoute, {})
  }

  openFeedback = () => {
    try {
      Apptentive.presentMessageCenter()
    } catch (e) {
      customLogger.log(e)
    }
  }

  hideWalletPopupModal = () => {
    this.setState({
      walletBackupModalVisible: false,
    })
  }

  UNSAFE_componentWillReceiveProps(nextProps: SettingsProps) {
    if (
      !this.props.hasViewedWalletError &&
      this.props.cloudBackupError !== null &&
      (this.props.currentScreen === 'Settings' ||
        nextProps.currentScreen === 'Settings')
    ) {
      this.props.viewedWalletError(true)
    }
    if (
      this.props.currentScreen === nextProps.currentScreen &&
      nextProps.currentScreen === settingsRoute &&
      this.props.timeStamp !== nextProps.timeStamp
    ) {
      this.setState({ disableTouchIdSwitch: false })
    } else if (
      nextProps.currentScreen === lockTouchIdSetupRoute &&
      this.props.currentScreen === settingsRoute
    ) {
      // if user has left settings screen and navigated to lockTouchIdSetup screen
      this.setState({ disableTouchIdSwitch: true })
    }
    if (
      nextProps.walletBackup.status !== this.props.walletBackup.status &&
      nextProps.walletBackup.status === 'SUCCESS'
    ) {
      this.setState({
        walletBackupModalVisible: true,
      })
    }
  }

  componentDidMount() {
    const feedback = settingsOptions.find(
      (setting) => setting.name === FEEDBACK
    )
    if (feedback && apptentiveCredentials) {
      setupApptentive().catch((e) => {
        customLogger.log(e)
      })
    }
  }

  getLastBackupTitle = () => {
    return this.getLastBackupTime()
  }

  getLastBackupTime() {
    // return this.props.connectionsUpdated === false || this.props.autoCloudBackupEnabled? (
    return this.props.connectionsUpdated === false ? (
      <CustomText transparentBg h7 bold style={[style.backupTimeSubtitleStyle]}>
        Choose where to save a .zip backup file
      </CustomText>
    ) : (
      `You have unsaved ${appName} information`
    )
  }

  // getCloudBackupSubtitle = () => {
  //   if (this.props.cloudBackupStatus === CLOUD_BACKUP_LOADING) {
  //     return 'Backing up...'
  //   } else if (
  //     this.props.cloudBackupStatus === CLOUD_BACKUP_FAILURE ||
  //     this.props.cloudBackupStatus === WALLET_BACKUP_FAILURE
  //   ) {
  //     return (
  //       <CustomText
  //         transparentBg
  //         h7
  //         bold
  //         style={[style.backupTimeSubtitleStyle, style.subtitleFail]}
  //       >
  //         {this.props.cloudBackupStatus === CLOUD_BACKUP_FAILURE
  //           ? 'Backup failed. Tap to retry'
  //           : 'Backup failed, size limit exceeded'}
  //       </CustomText>
  //     )
  //   } else return this.getLastCloudBackupTime()
  // }

  getLastCloudBackupTime() {
    // return this.props.lastSuccessfulCloudBackup === 'error' ? (
    return this.props.cloudBackupError === WALLET_BACKUP_FAILURE ? (
      'Backup failed, size limit exceeded'
    ) : // ) : this.props.lastSuccessfulCloudBackup === 'Failed to create backup: Timed out in push notifications' ? (
    this.props.cloudBackupStatus === CLOUD_BACKUP_FAILURE ? (
      'Backup failed. Tap to retry'
    ) : this.props.lastSuccessfulCloudBackup !== '' ? (
      <CustomText transparentBg h7 bold style={[style.backupTimeSubtitleStyle]}>
        Last backup was{' '}
        <CustomText transparentBg h7 bold style={[style.subtitleColor]}>
          {formatBackupString(this.props.lastSuccessfulCloudBackup)}
        </CustomText>
      </CustomText>
    ) : (
      'Sync your app backup in the cloud.'
    )
  }

  onCloudBackupPressed = () => {
    if (
      this.props.cloudBackupStatus === CLOUD_BACKUP_FAILURE ||
      this.props.cloudBackupStatus === WALLET_BACKUP_FAILURE ||
      this.props.cloudBackupError === WALLET_BACKUP_FAILURE
    ) {
      this.props.cloudBackupStart()
      return
    }
    const {
      navigation: { navigate },
    } = this.props
    navigate(cloudBackupRoute, {})
  }

  renderLastBackupText = () => {
    if (this.props.lastSuccessfulBackup !== '') {
      const lastSuccessfulBackup = formatBackupString(
        this.props.lastSuccessfulBackup
      )

      if (this.props.lastSuccessfulCloudBackup !== '') {
        const lastSuccessfulCloudBackup = formatBackupString(
          this.props.lastSuccessfulCloudBackup
        )

        if (
          moment(this.props.lastSuccessfulCloudBackup).isBefore(
            this.props.lastSuccessfulBackup
          )
        ) {
          return `Last Backup: ${lastSuccessfulBackup}`
        } else {
          return `Last Backup: ${lastSuccessfulCloudBackup}`
        }
      }
      return `Last Backup: ${lastSuccessfulBackup}`
    } else if (this.props.lastSuccessfulCloudBackup !== '') {
      const lastSuccessfulCloudBackup = formatBackupString(
        this.props.lastSuccessfulCloudBackup
      )

      if (this.props.lastSuccessfulBackup !== '') {
        const lastSuccessfulBackup = formatBackupString(
          this.props.lastSuccessfulBackup
        )

        if (
          moment(this.props.lastSuccessfulBackup).isBefore(
            this.props.lastSuccessfulCloudBackup
          )
        ) {
          return `Last Backup: ${lastSuccessfulCloudBackup}`
        } else {
          return `Last Backup: ${lastSuccessfulBackup}`
        }
      }
      return `Last Backup: ${lastSuccessfulCloudBackup}`
    } else return 'Last Backup: Never'
  }

  renderBackupTitleText = () => {
    if (
      !this.props.lastSuccessfulBackup &&
      !this.props.lastSuccessfulCloudBackup
    ) {
      return 'Create a Backup'
    } else if (this.props.connectionsUpdated) {
      return this.renderLastBackupText()
    } else {
      return 'Manual Backup'
    }
  }

  render() {
    const { hasVerifiedRecoveryPhrase, cloudBackupError } = this.props
    const hasBackupError = cloudBackupError === WALLET_BACKUP_FAILURE
    const hasCloudBackupFailed =
      this.props.cloudBackupStatus === WALLET_BACKUP_FAILURE ||
      this.props.cloudBackupStatus === CLOUD_BACKUP_FAILURE ||
      cloudBackupError === WALLET_BACKUP_FAILURE

    const toggleSwitch =
      Platform.OS === 'ios' ? (
        <Switch
          disabled={this.state.disableTouchIdSwitch}
          trackColor={{ true: colors.main }}
          onValueChange={this.onChangeTouchId}
          value={this.props.touchIdActive}
        />
      ) : (
        <ToggleSwitch
          onToggle={this.onChangeTouchId}
          value={this.props.touchIdActive}
          buttonWidth={moderateScale(55)}
          buttonHeight={moderateScale(30)}
          buttonRadius={moderateScale(30)}
          sliderWidth={moderateScale(28)}
          sliderHeight={moderateScale(28)}
          sliderRadius={moderateScale(58)}
          buttonOnColor={colors.main}
          buttonOffColor={colors.gray4}
          sliderOnColor={colors.white}
          sliderOffColor={colors.white}
        />
      )
    // const cloudToggleSwitch =
    //   Platform.OS === 'ios' ? (
    //     <Switch
    //       disabled={this.state.disableTouchIdSwitch}
    //       trackColor={{ true: colors.main }}
    //       onValueChange={this.toggleAutoCloudBackupEnabled}
    //       value={this.props.autoCloudBackupEnabled}
    //     />
    //   ) : (
    //     <ToggleSwitch
    //       isOn={true}
    //       onToggle={this.toggleAutoCloudBackupEnabled}
    //       value={this.props.autoCloudBackupEnabled}
    //       buttonWidth={moderateScale(55)}
    //       buttonHeight={moderateScale(30)}
    //       buttonRadius={moderateScale(30)}
    //       sliderWidth={moderateScale(28)}
    //       sliderHeight={moderateScale(28)}
    //       sliderRadius={moderateScale(58)}
    //       buttonOnColor={colors.main}
    //       buttonOffColor={colors.gray4}
    //       sliderOnColor={colors.white}
    //       sliderOffColor={colors.white}
    //     />
    //   )

    const defaultSettingsItemList = {
      [MANUAL_BACKUP]: {
        title: this.renderBackupTitleText(),
        subtitle: this.getLastBackupTitle(),
        avatar: (
          <EvaIcon
            name={SAVE_ICON}
            color={
              this.props.connectionsUpdated && !this.props.isAutoBackupEnabled
                ? // || (this.props.connectionsUpdated && this.props.isAutoBackupEnabled && hasCloudBackupFailed)
                  colors.red
                : colors.gray2
            }
          />
        ),
        rightIcon: null,
        onPress: this.onBackup,
      },
      // [CLOUD_BACKUP]: {
      //   title: 'Automatic Cloud Backups',
      //   subtitle: this.getCloudBackupSubtitle(),
      //   avatar: <EvaIcon
      //     name={BACKUP_ICON}
      //     color={hasCloudBackupFailed ? colors.red : colors.gray2}
      //   />,
      //   rightIcon: cloudBackupStatus === CLOUD_BACKUP_LOADING ? (
      //     <ActivityIndicator />
      //   ) : (
      //     cloudToggleSwitch
      //   ),
      //   onPress: cloudBackupStatus === CLOUD_BACKUP_LOADING
      //     ? () => {}
      //     : this.onCloudBackupPressed,
      // },
      [BIOMETRICS]: {
        title: 'Biometrics',
        subtitle: 'Use your finger or face to secure app',
        avatar: <SvgCustomIcon fill={colors.gray2} name="Biometrics" />,
        rightIcon: toggleSwitch,
        onPress: () => {},
      },
      [PASSCODE]: {
        title: 'Passcode',
        subtitle: `Change your ${appName} passcode`,
        avatar: (
          <SvgCustomIcon
            name="Passcode"
            fill={colors.gray2}
            width={verticalScale(32)}
            height={verticalScale(19)}
          />
        ),
        rightIcon: <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3} />,
        onPress: this.onChangePinClick,
      },
      [VIEW_BACKUP_PASSPHRASE]: {
        title: 'Recovery Phrase',
        subtitle: `View your Recovery Phrase`,
        avatar: <SvgCustomIcon name="ViewPassPhrase" fill={colors.gray2} />,
        rightIcon: <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3} />,
        onPress: this.viewRecoveryPhrase,
      },
      [FEEDBACK]: {
        title: 'Give app feedback',
        subtitle: `Tell us what you think of ${appName}`,
        avatar: <EvaIcon name={CHAT_ICON} />,
        rightIcon: <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3} />,
        onPress: this.openFeedback,
      },
      [ABOUT]: {
        title: 'About',
        subtitle: `Legal, Version, and Network Information`,
        avatar: <EvaIcon name={INFO_ICON} />,
        rightIcon: <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3} />,
        onPress: this.openAboutApp,
      },
      [LOGS]: {
        title: 'Send Logs',
        subtitle: `Help us improve our app by sending your errors`,
        avatar: <EvaIcon name={INFO_ICON} />,
        rightIcon: <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3} />,
        onPress: this.openSendErrorLogs,
      },
      [DESIGN_STYLE_GUIDE]: {
        title: 'Design styleguide',
        subtitle: 'Development only',
        avatar: <EvaIcon name={INFO_ICON} />,
        rightIcon: <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3} />,
        onPress: this.openStyleGuide,
      },
    }

    const options = settingsOptions
      .map((option) => {
        const defaultOptionData = defaultSettingsItemList[option.name] || {}

        // Cloud backups are disabled
        if (option.name === CLOUD_BACKUP) {
          return null
        }
        // if (option.name === CLOUD_BACKUP) {
        //   if (!this.props.isCloudBackupEnabled || !hasVerifiedRecoveryPhrase) {
        //     return null
        //   }
        // }
        if (option.name === VIEW_BACKUP_PASSPHRASE) {
          if (!hasVerifiedRecoveryPhrase) {
            return null
          }
        }
        if (option.name === FEEDBACK) {
          if (!apptentiveCredentials) {
            return null
          }
        }
        if (option.name === DESIGN_STYLE_GUIDE) {
          // for dev builds only
          if (__DEV__ === false) {
            return null
          }
        }

        return {
          name: option.name,
          title: option.title || defaultOptionData.title,
          subtitle: option.subtitle || defaultOptionData.subtitle,
          avatar: option.avatar || defaultOptionData.avatar,
          rightIcon: option.rightIcon || defaultOptionData.rightIcon,
          onPress: option.onPress || defaultOptionData.onPress,
        }
      })
      .filter((option) => option)

    return (
      <Container>
        <NotificationCard />
        <View
          style={[style.secondaryContainer]}
          testID="settings-container"
          accessible={false}
          accessibilityLabel="settings-container"
        >
          <ScrollView>
            <CustomView style={[style.secondaryContainer, style.listContainer]}>
              {options.map((item) => {
                return (
                  <TouchableOpacity onPress={item.onPress} key={item.name}>
                    <ListItem.Content style={style.listItemContainer}>
                      <View style={style.avatarView}>
                        {item && item.avatar}
                      </View>
                      <ListItem.Content style={style.listItemText}>
                        <ListItem.Title
                          style={[
                            (this.props.connectionsUpdated &&
                              item.name === MANUAL_BACKUP &&
                              !this.props.isAutoBackupEnabled) ||
                            (item.name === CLOUD_BACKUP && hasCloudBackupFailed)
                              ? style.walletNotBackedUpTitleStyle
                              : style.titleStyle,
                          ]}
                        >
                          {item && item.title}
                        </ListItem.Title>
                        <ListItem.Subtitle
                          style={[
                            (this.props.connectionsUpdated &&
                              item.name === MANUAL_BACKUP &&
                              !this.props.isAutoBackupEnabled) ||
                            (item.name === CLOUD_BACKUP && hasBackupError)
                              ? // && this.props.lastSuccessfulCloudBackup === 'error'
                                style.walletNotBackedUpSubtitleStyle
                              : style.subtitleStyle,
                          ]}
                        >
                          {item && item.subtitle}
                        </ListItem.Subtitle>
                      </ListItem.Content>
                      {item.rightIcon && item.rightIcon}
                    </ListItem.Content>
                  </TouchableOpacity>
                )
              })}
            </CustomView>
          </ScrollView>
        </View>
        {showCameraButton && (
          <CameraButton
            onPress={() =>
              this.props.navigation.navigate(qrCodeScannerTabRoute)
            }
          />
        )}
      </Container>
    )
  }
}

const mapStateToProps = (state: Store) => ({
  status: state.backup.status,
  cloudBackupError: state.backup.cloudBackupError,
  touchIdActive: state.lock.isTouchIdEnabled,
  walletBackup: state.wallet.backup,
  currentScreen: state.route.currentScreen,
  timeStamp: state.route.timeStamp,
  lastSuccessfulBackup: state.backup && state.backup.lastSuccessfulBackup,
  lastSuccessfulCloudBackup:
    state.backup && state.backup.lastSuccessfulCloudBackup,
  autoCloudBackupEnabled: state.backup.autoCloudBackupEnabled,
  cloudBackupStatus: state.backup.cloudBackupStatus,
  hasViewedWalletError: state.backup.hasViewedWalletError,
  connectionsUpdated:
    state.history.data && state.history.data.connectionsUpdated,
  walletBalance: getWalletBalance(state),
  hasVerifiedRecoveryPhrase: getHasVerifiedRecoveryPhrase(state),
  isCloudBackupEnabled: false,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      cloudBackupFailure,
      selectUserAvatar,
      setAutoCloudBackupEnabled,
      exportBackup,
      generateBackupFile,
      addPendingRedirection,
      generateRecoveryPhrase,
      viewedWalletError,
      cloudBackupStart,
    },
    dispatch
  )

const screen = CustomSettingsScreen || Settings

export const SettingsScreen = withStatusBar()(
  connect(mapStateToProps, mapDispatchToProps)(screen)
)
