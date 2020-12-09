// @flow
import React, { Component } from 'react'
import EnterPassphrase from '../components/backup-restore-passphrase/backup-restore-passphrase'
import { color } from '../common/styles/constant'
import { restorePassphraseRoute, restoreWaitRoute } from '../common'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import type { RestorePassphraseProps } from './type-restore'
import type { Store } from '../store/type-store'
import type { ReactNavigation } from '../common/type-common'

import { submitPassphrase } from './restore-store'
import { CustomView, Icon, CustomHeader } from '../components'
import {
  RESTORE_BACK_BUTTON_TEST_ID,
  RESTORE_CLOSE_BUTTON_TEST_ID,
} from './type-restore'
import styles from '../backup/styles'
import { withStatusBar } from '../components/status-bar/status-bar'

const backImage = require('../images/icon_backArrow_white.png')
const closeImage = require('../images/iconClose.png')

export class RestorePassphrase extends Component<RestorePassphraseProps, void> {
  static navigationOptions = ({ navigation }: ReactNavigation) => ({
    header: (
      <CustomHeader flatHeader backgroundColor={color.bg.twelfth.color}>
        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={() => {
              navigation.goBack(null)
            }}
            testID={RESTORE_BACK_BUTTON_TEST_ID}
            iconStyle={[styles.headerBackIcon]}
            src={backImage}
          />
        </CustomView>

        <CustomView style={[styles.headerSpacer]}>
          <Icon
            medium
            onPress={() => {
              navigation.goBack(null)
            }}
            testID={RESTORE_CLOSE_BUTTON_TEST_ID}
            iconStyle={[styles.headerIcon]}
            src={closeImage}
          />
        </CustomView>
      </CustomHeader>
    ),
    gesturesEnabled: false,
  })

  submitPhrase = (passphrase: string) => {
    this.props.submitPassphrase(passphrase)
    this.props.navigation.navigate(restoreWaitRoute)
  }

  componentDidMount() {
    this.props.navigation.setParams({
      ...this.props,
    })
  }

  render() {
    const filename = this.props.restore.restoreFile.fileName

    return (
      <EnterPassphrase
        testID={'restore-encrypt-phrase'}
        onSubmit={this.submitPhrase}
        placeholder={'Enter Recovery Phrase here'}
        filename={filename}
      />
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    restore: state.restore,
    route: state.route.currentScreen,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ submitPassphrase }, dispatch)

export const restorePassphraseScreen = {
  routeName: restorePassphraseRoute,
  screen: withStatusBar({ color: color.bg.twelfth.color })(
    connect(mapStateToProps, mapDispatchToProps)(RestorePassphrase)
  ),
}
