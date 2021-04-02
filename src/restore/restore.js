// @flow

import React, { Component } from 'react'
import {
  Image,
  StyleSheet,
  ImageBackground,
  View,
  Dimensions,
} from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { moderateScale } from 'react-native-size-matters'

import { CustomView, CustomText } from '../components'
import {
  isBiggerThanShortDevice,
  venetianRed,
  colors,
  fontSizes,
  OFFSET_2X,
} from '../common/styles'
import {
  eulaRoute,
  lockPinSetupRoute,
  restorePassphraseRoute,
  restoreRoute,
  selectRestoreMethodRoute,
} from '../common'
import { updateStatusBarTheme } from '../store/connections-store'
import type { RestoreProps } from './type-restore'

import { saveFileToAppDirectory } from './restore-store'
import type { Store } from '../store/type-store'
import { RestoreStatus } from './type-restore'
import { appName, startupBackgroundImage } from '../external-imports'
import { Button } from '../components/buttons/button'

const { width } = Dimensions.get('screen')

const restoreBackground =
  startupBackgroundImage || require('../images/home_background.png')
const restoreBackgroundMode = startupBackgroundImage ? 'cover' : 'contain'
const powerByLogo = require('../images/powered_by_logo.png')

export class RestoreStartScreen extends Component<RestoreProps, void> {
  restoreBackup = () => {
    if (this.props.isEulaAccepted) {
      this.props.navigation.navigate(selectRestoreMethodRoute)
    } else {
      this.props.navigation.navigate(eulaRoute, { inRecovery: true })
    }
  }

  startFresh = () => {
    this.props.navigation.navigate(lockPinSetupRoute)
  }

  componentDidUpdate(prevProps: RestoreProps) {
    if (
      this.props.restore.status !== prevProps.restore.status &&
      this.props.restore.status === RestoreStatus.FILE_SAVED_TO_APP_DIRECTORY &&
      this.props.route === restoreRoute
    ) {
      this.props.navigation.navigate(restorePassphraseRoute)
    }
    let statusBarColor =
      this.props.restore.error && this.props.route === restoreRoute
        ? venetianRed
        : colors.white
    this.props.updateStatusBarTheme(statusBarColor)
  }

  componentDidMount() {
    if (!this.props.restore.error) {
      this.props.updateStatusBarTheme(colors.white)
    } else {
      this.props.updateStatusBarTheme(venetianRed)
    }
  }

  render() {
    //TODO set error to display screen in error mode
    const error =
      this.props.restore.status === RestoreStatus.RESTORE_FAILED ||
      (this.props.restore.status === RestoreStatus.FILE_SAVE_ERROR &&
        this.props.restore.error)

    const restoreButtonTitle = error
      ? 'Select A Different File'
      : 'Restore From A Backup'

    return (
      <ImageBackground
        source={restoreBackground}
        style={styles.background}
        resizeMode={restoreBackgroundMode}
      >
        <View style={styles.wrapper}>
          <CustomView verticalSpace>
            {error ? (
              <CustomView center doubleVerticalSpace>
                <CustomText
                  transparentBg
                  style={[styles.errorText]}
                  medium
                  h4a
                  center
                >
                  Either your passphrase was incorrect or the backup file you
                  chose is corrupt or not a {appName} backup file. Please try
                  again or start fresh.
                </CustomText>
              </CustomView>
            ) : null}
            {!error ? (
              <CustomView
                center
                doubleVerticalSpace
                style={[styles.textContainer]}
              >
                <CustomText
                  center
                  transparentBg
                  style={[styles.marginHorizontal, styles.textBox]}
                  medium
                  h4a
                >
                  You can restore from a backup or start with a brand new
                  install.
                </CustomText>
                <CustomText transparentBg style={[styles.textBox]} h4a medium>
                  How would you like to proceed?
                </CustomText>
              </CustomView>
            ) : null}
            <View style={styles.buttonContainer}>
              <Button
                buttonStyle={[
                  styles.customButton,
                  error ? { backgroundColor: colors.red } : {},
                ]}
                label={restoreButtonTitle}
                onPress={this.restoreBackup}
                testID={'restore-from-backup'}
                labelStyle={styles.buttonText}
              />
              <Button
                buttonStyle={[styles.customButton]}
                label={'Start Fresh'}
                onPress={this.startFresh}
                testID={'start-fresh'}
                labelStyle={styles.buttonText}
              />
            </View>
          </CustomView>
          {!startupBackgroundImage && (
            <Image source={powerByLogo} style={styles.image} />
          )}
        </View>
      </ImageBackground>
    )
  }
}

const styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  wrapper: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customButton: {
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: colors.gray2,
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowRadius: 5,
    shadowOpacity: 0.3,
    elevation: 7,
    height: isBiggerThanShortDevice ? 58 : 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.main,
    width: width - OFFSET_2X * 2,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.size3,
  },
  textContainer: {
    marginBottom: '10%',
  },
  errorText: {
    color: colors.red,
    paddingLeft: '5%',
    paddingRight: '5%',
    marginBottom: '10%',
  },
  marginHorizontal: {
    marginLeft: '6%',
    marginRight: '6%',
    marginBottom: '6%',
  },
  textBox: {
    color: '#717171',
  },
  image: {
    position: 'absolute',
    bottom: moderateScale(32),
    right: moderateScale(10),
  },
})

const mapStateToProps = (state: Store) => {
  return {
    restore: state.restore,
    route: state.route.currentScreen,
    isEulaAccepted: state.eula && state.eula.isEulaAccept,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ saveFileToAppDirectory, updateStatusBarTheme }, dispatch)

export const restoreStartScreen = {
  routeName: restoreRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(RestoreStartScreen),
}
