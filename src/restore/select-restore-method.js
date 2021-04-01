// @flow

import React, { Component } from 'react'
import { Image, ImageBackground, View } from 'react-native'
import { Platform } from 'react-native'

import {
  selectRestoreMethodRoute,
  // selectRestoreMethod, not exported
  restoreRoute,
  cloudRestoreRoute,
  restorePassphraseRoute,
} from '../common'
import { colors, venetianRed } from '../common/styles/constant'
import { withStatusBar } from '../components/status-bar/status-bar'
import { updateStatusBarTheme } from '../store/connections-store'
import type { Store } from '../store/type-store'
import type { ReactNavigationBackup } from '../backup/type-backup'
import { saveFileToAppDirectory } from './restore-store'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import {
  Container,
  CustomView,
  CustomText,
  Icon,
  CustomHeader,
} from '../components'
import DocumentPicker  from 'react-native-document-picker'
import { color } from '../common/styles/constant'
import styles from '../backup/styles'
import { customLogger } from '../store/custom-logger'
import { RestoreStatus } from './type-restore'
import type { RestoreProps } from './type-restore'
import {appName, startupBackgroundImage} from '../external-imports'
const closeImage = require('../images/icon-Close.png')
const backup = require('../images/upload13x.png')
const download = require('../images/download3x.png')


const restoreBackground = startupBackgroundImage || require('../images/home_background.png')
const restoreBackgroundMode = startupBackgroundImage ? 'cover' : 'contain'
const powerByLogo = require('../images/powered_by_logo.png');

export class SelectRestoreMethod extends Component<RestoreProps, void> {
  static navigationOptions = ({
    navigation: { navigate },
  }: ReactNavigationBackup) => ({
    header: () => (
      <CustomHeader
        backgroundColor={color.bg.fifth.color}
        largeHeader
        flatHeader
      >
        <CustomView style={[styles.headerSpacer]} />
        <CustomView style={[styles.headerSpacer]}>
          <Icon
            mediumLarge
            onPress={() => navigate(restoreRoute)}
            iconStyle={[styles.headerIcon]}
            src={closeImage}
          />
        </CustomView>
      </CustomHeader>
    ),
    gestureEnabled: false,
    headerShown: true,
  })

  componentDidUpdate(prevProps: RestoreProps) {
    if (
      this.props.restore.status !== prevProps.restore.status &&
      this.props.restore.status === RestoreStatus.FILE_SAVED_TO_APP_DIRECTORY &&
      // not sure about this route might need to change to "selectRestoreMethod"
      this.props.route === selectRestoreMethodRoute
    ) {
      this.props.navigation.navigate(restorePassphraseRoute)
    }
    let statusBarColor =
      this.props.restore.error && this.props.route === selectRestoreMethodRoute
        ? venetianRed
        : colors.white
    this.props.updateStatusBarTheme(statusBarColor)
  }

  zipRestore = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [
          Platform.OS === 'android' ? 'application/zip' : 'public.zip-archive',
        ],
      });
      console.log(
        res.uri,
        res.type, // mime type
        res.name,
        res.size
      );
      this.props.saveFileToAppDirectory(res)
    } catch (err) {
      console.log('error')
      console.log(err)
      customLogger.log('err', err)
    }
  }

  cloudRestore = () => {
    this.props.navigation.navigate(cloudRestoreRoute)
  }

  render() {
    return (
      <Container style={[styles.selectRecoveryMethod]}>
        <ImageBackground
          source={restoreBackground}
          style={styles.background}
          resizeMode={restoreBackgroundMode}>
          <View style={styles.wrapper}>
            <CustomView center>
              <CustomText transparentBg center style={[styles.backuptitle]}>
                Where is your backup?
              </CustomText>
            </CustomView>
            <Container
              {...(this.props.isCloudBackupEnabled
                ? { spaceBetween: true }
                : { center: true })}
              style={[styles.selectContainer]}
            >
              {/*{this.props.isCloudBackupEnabled && (*/}
              {/*  <CustomView*/}
              {/*    onPress={this.cloudRestore}*/}
              {/*    spaceAround*/}
              {/*    center*/}
              {/*    style={[styles.selectMethod, { backgroundColor: '#86B93B' }]}*/}
              {/*  >*/}
              {/*    <Icon*/}
              {/*      iconStyle={[{ marginBottom: 10 }]}*/}
              {/*      mediumLarge*/}
              {/*      src={backup}*/}
              {/*    />*/}
              {/*    <CustomText center transparentBg style={[styles.title2]}>*/}
              {/*      In the Evernym Cloud*/}
              {/*    </CustomText>*/}
              {/*    <CustomText*/}
              {/*      size="14"*/}
              {/*      center*/}
              {/*      transparentBg*/}
              {/*      style={{ color: colors.white }}*/}
              {/*    >*/}
              {/*      You have a backup in the Evernym Cloud and you have your*/}
              {/*      Recovery Phrase.*/}
              {/*    </CustomText>*/}
              {/*  </CustomView>*/}
              {/*)}*/}
              {/*{this.props.isCloudBackupEnabled && (*/}
              {/*  <CustomView center>*/}
              {/*    <CustomText primary transparentBg center style={[styles.title1]}>*/}
              {/*      or*/}
              {/*    </CustomText>*/}
              {/*  </CustomView>*/}
              {/*)}*/}
              <CustomView
                onPress={this.zipRestore}
                spaceAround
                secondary
                center
                style={[styles.selectMethod]}
              >
                <Icon
                  mediumLarge
                  iconStyle={[{ marginBottom: 10 }]}
                  src={download}
                />
                <CustomText transparentBg center style={[styles.title2]}>
                  On this device
                </CustomText>
                <CustomText
                  size="14"
                  transparentBg
                  center
                  style={[{ color: colors.white }]}
                >
                  You have a {appName} backup .zip file on this device and your
                  Recovery Phrase ready.
                </CustomText>
              </CustomView>
            </Container>
            {!startupBackgroundImage &&
            <Image
              source={powerByLogo}
              style={styles.image}
            />}
          </View>
        </ImageBackground>
      </Container>
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    restore: state.restore,
    route: state.route.currentScreen,
    isCloudBackupEnabled: false,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ saveFileToAppDirectory, updateStatusBarTheme }, dispatch)

export const selectRestoreMethodScreen = {
  routeName: selectRestoreMethodRoute,
  screen: withStatusBar({ color: colors.white })(
    connect(mapStateToProps, mapDispatchToProps)(SelectRestoreMethod)
  ),
}
