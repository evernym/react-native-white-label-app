// @flow
import React, { Component } from 'react'
import EnterPassphrase from '../components/backup-restore-passphrase/backup-restore-passphrase'
import { color } from '../common/styles/constant'
import { restorePassphraseRoute, restoreWaitRoute } from '../common'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import type { RestorePassphraseProps } from './type-restore'
import type { Store } from '../store/type-store'

import { submitPassphrase } from './restore-store'
import { withStatusBar } from '../components/status-bar/status-bar'

export class RestorePassphrase extends Component<RestorePassphraseProps, void> {
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
        navigation={this.props.navigation}
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
