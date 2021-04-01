// @flow

import React, { PureComponent } from 'react'
import { Image } from 'react-native'

import type { BackupCompleteProps, ReactNavigationBackup } from './type-backup'

import {
  Container,
  CustomView,
  CustomText,
  Icon,
  CustomHeader,
} from '../components'
import { backupCompleteRoute, settingsRoute } from '../common'
import {
  isBiggerThanVeryShortDevice,
} from '../common/styles'
import { color } from '../common/styles/constant'
import {
  BACKUP_COMPLETE_CLOSE_TEST_ID,
  BACKUP_COMPLETE_SUBMIT_BUTTON,
  BACKUP_COMPLETE_SUBMIT_BUTTON_TITLE
} from './backup-constants'
import styles from './styles'
import { withStatusBar } from '../components/status-bar/status-bar'
import { appName } from '../external-imports'
import {Button} from "../components/buttons/button";

const transparentBands = require('../images/transparentBands.png')
const closeImage = require('../images/iconClose.png')
// TODO: use real asset
const successCheck = require('../images/successCheck.png')

export class BackupComplete extends PureComponent<BackupCompleteProps, void> {
  backupComplete = () => {
    const {
      navigation: { navigate },
    } = this.props

    return navigate(settingsRoute)
  }

  static navigationOptions = ({
    navigation: { navigate },
  }: ReactNavigationBackup) => ({
    header: () => (
      <CustomHeader
        backgroundColor={color.bg.fourteenth.color}
        largeHeader
        flatHeader
      >
        <CustomView style={[styles.headerSpacer]} />

        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={() => navigate(settingsRoute)}
            testID={BACKUP_COMPLETE_CLOSE_TEST_ID}
            iconStyle={[styles.headerIcon]}
            src={closeImage}
          />
        </CustomView>
      </CustomHeader>
    ),
    gestureEnabled: false,
    headerShown: true,
  })

  render() {
    return (
      <Container style={[styles.backupComplete]} safeArea>
        <Image source={transparentBands} style={[styles.backgroundImage]} />
        <Container style={[styles.wrapper]}>
          <Container>
            <CustomView center>
              <CustomText transparentBg center style={[styles.title]}>
                Backup complete
              </CustomText>
            </CustomView>
            <CustomView center>
              <Image source={successCheck} />
            </CustomView>
            <CustomView horizontalSpace>
              <CustomView
                verticalSpace
                doubleVerticalSpace={isBiggerThanVeryShortDevice ? true : false}
              >
                <CustomText
                  transparentBg
                  center
                  style={styles.backupCompleteText}
                >
                  If you ever have to start with a new installation of
                  {appName} you will need to recover from this saved backup
                  file.
                </CustomText>
              </CustomView>
              <CustomView
                doubleVerticalSpace={isBiggerThanVeryShortDevice ? true : false}
              >
                <CustomText
                  transparentBg
                  center
                  style={styles.backupCompleteText}
                >
                  You will be asked to enter your Recovery Phrase during setup
                  of your new {appName} application.
                </CustomText>
              </CustomView>
            </CustomView>
          </Container>
          <Button
            onPress={this.backupComplete}
            label={BACKUP_COMPLETE_SUBMIT_BUTTON_TITLE}
            buttonStyle={styles.submitButton}
            labelStyle={{
              color: color.bg.fourteenth.color,
              fontWeight: '600',
              fontSize: 18,
            }}
            testID={BACKUP_COMPLETE_SUBMIT_BUTTON}
          />
        </Container>
      </Container>
    )
  }
}

export const backupCompleteScreen = {
  routeName: backupCompleteRoute,
  screen: withStatusBar({ color: color.bg.fourteenth.color })(BackupComplete),
}
