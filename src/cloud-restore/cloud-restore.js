// @flow

import React, { Component } from 'react'
import { Keyboard } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import type {
  VerifyRecoveryPhraseProps,
  VerifyRecoveryPhraseState,
  ReactNavigationBackup,
} from '../backup/type-backup'
import type { Store } from '../store/type-store'

import { CustomView, Icon, CustomHeader } from '../components'
import {
  cloudRestoreModalRoute,
  cloudRestoreRoute,
  selectRestoreMethodRoute,
} from '../common'
import { color } from '../common/styles/constant'
import styles from '../backup/styles'
import {
  VERIFY_BACK_TEST_ID,
  VERIFY_CLOSE_TEST_ID,
  VERIFY_CONTAINER_TEST_ID,
  VERIFY_INPUT_PLACEHOLDER,
} from '../backup/backup-constants'
import EnterPassphrase from '../components/backup-restore-passphrase/backup-restore-passphrase'
import { getBackupPassphrase, getRestoreStatus } from '../store/store-selector'
import { withStatusBar } from '../components/status-bar/status-bar'
import { submitPassphrase, resetError } from './cloud-restore-store'
import { RestoreStatus } from '../restore/type-restore'
import { restoreStatus } from '../restore/restore-store'

const backImage = require('../images/icon_backArrow_white.png')
const closeImage = require('../images/iconClose.png')

export class CloudRestore extends Component<
  VerifyRecoveryPhraseProps,
  VerifyRecoveryPhraseState
> {
  state = {
    error: false,
  }

  componentDidMount = () => {
    this.props.navigation.setParams({
      navigateBack: () => this.navigateBack(this.props.navigation.navigate),
    })
    this.props.restoreStatus(RestoreStatus.PASSPHRASE_PAGE_LOADED)
  }

  navigateBack = (navigate: any) => {
    if (this.props.status === RestoreStatus.PASSPHRASE_PAGE_LOADED) {
      this.props.restoreStatus(RestoreStatus.none)
    }
    navigate(selectRestoreMethodRoute)
  }
  static navigationOptions = ({
    route: { params },
  }: ReactNavigationBackup) => ({
    header: () => (
      <CustomHeader
        backgroundColor={color.bg.twelfth.color}
        largeHeader
        flatHeader
      >
        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={params.navigateBack}
            testID={VERIFY_BACK_TEST_ID}
            iconStyle={[styles.headerBackIcon]}
            src={backImage}
          />
        </CustomView>

        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={params.navigateBack}
            testID={VERIFY_CLOSE_TEST_ID}
            iconStyle={[styles.headerIcon]}
            src={closeImage}
          />
        </CustomView>
      </CustomHeader>
    ),
    gestureEnabled: false,
    headerShown: true,
  })

  verifyRecoveryPhrase = async (passphrase: string) => {
    let cleanedPassphrase = passphrase
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .replace(/\s\s+/gm, ' ')
      .toLowerCase()
      .trim()
    this.props.submitPassphrase(cleanedPassphrase)
    this.props.navigation.navigate(cloudRestoreModalRoute)
    Keyboard.dismiss()
  }

  componentWillUnmount = () => {
    this.setState({ error: false })
    // reset error on cloudRestore
    this.props.resetError()
  }

  render() {
    // TODO: Add error UI when that is designed
    return (
      <EnterPassphrase
        testID={VERIFY_CONTAINER_TEST_ID}
        placeholder={VERIFY_INPUT_PLACEHOLDER}
        onSubmit={this.verifyRecoveryPhrase}
        errorState={this.props.error}
        isCloudRestoreAttempt={true}
      />
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    recoveryPassphrase: getBackupPassphrase(state),
    error: state.cloudRestore.error,
    status: getRestoreStatus(state),
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ submitPassphrase, restoreStatus, resetError }, dispatch)

export const cloudRestoreScreen = {
  routeName: cloudRestoreRoute,
  screen: withStatusBar({ color: color.bg.twelfth.color })(
    connect(mapStateToProps, mapDispatchToProps)(CloudRestore)
  ),
}
