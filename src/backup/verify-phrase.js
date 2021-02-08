// @flow

import React, { Component } from 'react'
import { Keyboard } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import type {
  VerifyRecoveryPhraseProps,
  VerifyRecoveryPhraseState,
  ReactNavigationBackup,
} from './type-backup'
import type { Store } from '../store/type-store'

import { HAS_VERIFIED_RECOVERY_PHRASE } from './type-backup'
import { CustomView, Icon, CustomHeader } from '../components'
import {
  verifyRecoveryPhraseRoute,
  exportBackupFileRoute,
  selectRecoveryMethodRoute,
} from '../common'
import { colors } from '../common/styles/constant'
import styles from './styles'
import {
  VERIFY_BACK_TEST_ID,
  VERIFY_CONTAINER_TEST_ID,
  VERIFY_INPUT_PLACEHOLDER,
} from './backup-constants'
import { pinHash as generateKey } from '../lock/pin-hash'
import VerifyPhrase from '../components/backup-restore-passphrase/backup-restore-passphrase'
import { getBackupPassphrase } from '../store/store-selector'
import { withStatusBar } from '../components/status-bar/status-bar'
import {
  hasVerifiedRecoveryPhrase,
  generateBackupFile,
} from '../backup/backup-store'
import { safeSet, walletSet } from '../services/storage'

const backImage = require('../images/icon_backArrow_white.png')

export class VerifyRecoveryPhrase extends Component<
  VerifyRecoveryPhraseProps,
  VerifyRecoveryPhraseState
> {
  state = {
    error: false,
  }

  static navigationOptions = ({
    navigation: { goBack },
  }: ReactNavigationBackup) => ({
    header: () => (
      <CustomHeader backgroundColor={colors.main} largeHeader flatHeader>
        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={() => goBack(null)}
            testID={VERIFY_BACK_TEST_ID}
            iconStyle={[styles.headerBackIcon]}
            src={backImage}
          />
        </CustomView>
      </CustomHeader>
    ),
    gestureEnabled: false,
    headerShown: true,
  })

  verifyRecoveryPhrase = async (passphrase: string) => {
    const cleanedPassphrase = passphrase
      .replace(/\s\s+/g, ' ')
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .toLowerCase()
      .trim()
    const { recoveryPassphrase } = this.props
    const { initialRoute } = this.props.route.params

    const hashedPassphrase: string | null = await generateKey(
      cleanedPassphrase,
      this.props.recoveryPassphrase.salt
    )

    if (recoveryPassphrase.hash === hashedPassphrase) {
      if (this.props.isCloudBackupEnabled) {
        this.props.navigation.navigate(selectRecoveryMethodRoute, {
          initialRoute,
        })
      } else {
        this.props.hasVerifiedRecoveryPhrase()
        this.props.generateBackupFile()
        try {
          walletSet(HAS_VERIFIED_RECOVERY_PHRASE, 'true')
          safeSet(HAS_VERIFIED_RECOVERY_PHRASE, 'true')
        } catch (e) {
        } finally {
          this.props.navigation.navigate(exportBackupFileRoute, {
            initialRoute,
          })
        }
      }
      this.setState({ error: false })
    } else {
      this.setState({ error: true })
    }

    Keyboard.dismiss()
  }

  componentWillUnmount = () => {
    this.setState({ error: false })
  }

  render() {
    // TODO: Add error UI when that is designed
    return (
      <VerifyPhrase
        testID={VERIFY_CONTAINER_TEST_ID}
        placeholder={VERIFY_INPUT_PLACEHOLDER}
        onSubmit={this.verifyRecoveryPhrase}
        errorState={this.state.error}
      />
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    recoveryPassphrase: getBackupPassphrase(state),
    isCloudBackupEnabled: false,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      hasVerifiedRecoveryPhrase,
      generateBackupFile,
    },
    dispatch
  )

export const verifyRecoveryPhraseScreen = {
  routeName: verifyRecoveryPhraseRoute,
  screen: withStatusBar({ color: colors.main })(
    connect(mapStateToProps, mapDispatchToProps)(VerifyRecoveryPhrase)
  ),
}
