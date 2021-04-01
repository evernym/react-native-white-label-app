// @flow

import React, { Component } from 'react'
import { Image } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import {
  Container,
  CustomView,
  CustomText,
  Icon,
  CustomHeader,
  Loader,
} from '../components'

import {
  exportBackupFileRoute,
  backupCompleteRoute,
  backupErrorRoute,
} from '../common'
import {
  isBiggerThanVeryShortDevice,
} from '../common/styles'
import { color } from '../common/styles/constant'
import type {
  ExportBackupFileProps,
  ReactNavigationBackup,
} from './type-backup'
import styles from './styles'
import { exportBackup } from './backup-store'
import type { Store } from '../store/type-store'
import {
  EXPORT_BACKUP_BACK_TEST_ID,
  EXPORT_BACKUP_CLOSE_TEST_ID,
  EXPORT_BACKUP_SUBMIT_BUTTON_TEST_ID,
  EXPORT_BACKUP_BUTTON_TITLE,
} from './backup-constants'
import { BACKUP_STORE_STATUS } from './type-backup'
import { getBackupStatus, getBackupWalletPath } from '../store/store-selector'
import { withStatusBar } from '../components/status-bar/status-bar'
import { appName } from '../external-imports'
import {Button} from "../components/buttons/button";

const transparentBands = require('../images/transparentBands.png')
const backImage = require('../images/icon_backArrow_white.png')
const closeImage = require('../images/iconClose.png')
const encryptedFile = require('../images/encryptedFile.png')

export class ExportBackupFile extends Component<ExportBackupFileProps, void> {
  parseFilePath = (path: string) => {
    const beginning = path.lastIndexOf('/') + 1
    const end = path.length

    return path.slice(beginning, end)
  }

  componentDidUpdate(prevProps: ExportBackupFileProps) {
    const {
      navigation: { navigate },
      route,
      backupStatus,
    } = this.props
    if (
      prevProps.backupStatus !== BACKUP_STORE_STATUS.BACKUP_COMPLETE &&
      backupStatus === BACKUP_STORE_STATUS.BACKUP_COMPLETE
    ) {
      navigate(backupCompleteRoute, {
        initialRoute: route.params.initialRoute,
      })
    } else if (
      prevProps.backupStatus !== BACKUP_STORE_STATUS.EXPORT_BACKUP_FAILURE &&
      backupStatus === BACKUP_STORE_STATUS.EXPORT_BACKUP_FAILURE
    ) {
      navigate(backupErrorRoute, {
        initialRoute: route.params.initialRoute,
      })
    }
  }

  encryptAndBackup = () => {
    this.props.exportBackup()
  }

  BackupPath = (path: string) => {
    if (path) {
      return (
        <CustomView center>
          <CustomText center transparentBg style={[styles.exportBackupFile]}>
            {this.parseFilePath(path)}
          </CustomText>
        </CustomView>
      )
    }

    return null
  }

  ExportImage = (status: string) => {
    if (
      status === BACKUP_STORE_STATUS.EXPORT_BACKUP_LOADING ||
      status === BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_LOADING ||
      status === BACKUP_STORE_STATUS.GENERATE_PHRASE_LOADING
    ) {
      return (
        <CustomView doubleVerticalSpace>
          <Loader showMessage={false} type="light" />
        </CustomView>
      )
    }

    return (
      <CustomView center style={[styles.lockIconImage]}>
        <Image source={encryptedFile} style={[styles.imageIconEncryptFile]} />
      </CustomView>
    )
  }

  static navigationOptions = ({
    navigation: { goBack, navigate },
    route,
  }: ReactNavigationBackup) => ({
    header: () => (
      <CustomHeader
        flatHeader
        largeHeader
        backgroundColor={color.bg.thirteenth.color}
      >
        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={() => goBack(null)}
            testID={EXPORT_BACKUP_BACK_TEST_ID}
            iconStyle={[styles.headerBackIcon]}
            src={backImage}
          />
        </CustomView>

        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={() => navigate(route.params.initialRoute)}
            testID={EXPORT_BACKUP_CLOSE_TEST_ID}
            iconStyle={[styles.headerIcon]}
            src={closeImage}
          />
        </CustomView>
      </CustomHeader>
    ),
    gestureEnabled: true,
    headerShown: true,
  })

  render() {
    const { backupPath, backupStatus } = this.props
    const disableButton =
      backupStatus === BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_LOADING ||
      backupStatus === BACKUP_STORE_STATUS.GENERATE_PHRASE_LOADING
        ? true
        : false

    return (
      <Container style={[styles.exportBackup]} safeArea>
        <Image source={transparentBands} style={[styles.backgroundImage]} />
        <Container style={[styles.wrapper]}>
          <CustomView center>
            <CustomText transparentBg center style={[styles.exportBackupTitle]}>
              Export your encrypted backup file
            </CustomText>
          </CustomView>
          <CustomView center>
            <CustomText
              center
              transparentBg
              style={[styles.exportBackupMainText]}
            >
              You will need your recovery phrase to unlock this backup file.
            </CustomText>
          </CustomView>
          <CustomView
            center
            verticalSpace
            doubleVerticalSpace={isBiggerThanVeryShortDevice ? true : false}
          >
            <CustomText
              center
              transparentBg
              style={[styles.exportBackupMainText]}
            >
              Don’t worry, only you can decrypt the backup with your recovery
              phrase.
            </CustomText>
          </CustomView>

          {this.ExportImage(backupStatus)}
          {this.BackupPath(backupPath)}
        </Container>

        <CustomView verticalSpace={isBiggerThanVeryShortDevice ? true : false}>
          <CustomView center>
            <CustomText
              center
              transparentBg
              bold
              style={[styles.exportBackupSmallMessage]}
            >
              This backup contains all your data in {appName}. Store it
              somewhere safe.
            </CustomText>
          </CustomView>
          <Button
            onPress={this.encryptAndBackup}
            label={EXPORT_BACKUP_BUTTON_TITLE}
            disabled={disableButton}
            buttonStyle={styles.submitButton}
            labelStyle={{
              color: color.bg.thirteenth.color,
              fontWeight: '600',
              fontSize: 18,
            }}
            testID={EXPORT_BACKUP_SUBMIT_BUTTON_TEST_ID}
          />
        </CustomView>
      </Container>
    )
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ exportBackup }, dispatch)

const mapStateToProps = (state: Store) => {
  return {
    backupStatus: getBackupStatus(state),
    backupPath: getBackupWalletPath(state),
  }
}

export const exportBackupFileScreen = {
  routeName: exportBackupFileRoute,
  screen: withStatusBar({ color: color.bg.thirteenth.color })(
    connect(mapStateToProps, mapDispatchToProps)(ExportBackupFile)
  ),
}
