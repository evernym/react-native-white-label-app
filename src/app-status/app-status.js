// @flow
import React from 'react'
import { connect } from 'react-redux'
import { AppState, StyleSheet, View } from 'react-native'
import { BlurView } from '@react-native-community/blur'

import { getUnacknowledgedMessages } from './../store/config-store'
import { getRestoreStatus } from './../store/store-selector'
import type { Store } from './../store/type-store'
import { RestoreStatus } from '../restore/type-restore'
import type {
  AppStatusProps,
  AppStatusState,
  ConnectProps,
} from './type-app-status'

export class AppStatusComponent extends React.Component<
  AppStatusProps,
  AppStatusState
> {
  state = {
    appState: AppState.currentState,
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange)
  }

  _handleAppStateChange = (nextAppState) => {
    if (
      this.state.appState &&
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active' &&
      (this.props.restoreStatus === RestoreStatus.none ||
        this.props.restoreStatus === RestoreStatus.RESTORE_DATA_STORE_SUCCESS)
    ) {
      this.props.dispatch(getUnacknowledgedMessages())
    }
    this.setState({ appState: nextAppState })
  }

  render() {
    if (
      this.state.appState &&
      this.state.appState.match(/inactive|background/)
    ) {
      return (
        <View style={styles.container}>
          <BlurView
            style={styles.blurView}
            // $FlowFixMe
            reducedTransparencyFallbackColor={String('gray')}
            blurType="light"
            blurAmount={20}
          />
        </View>
      )
    }

    return null
  }
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
})

const mapStateToProps = (state: Store): ConnectProps => {
  return {
    restoreStatus: getRestoreStatus(state),
  }
}

const AppStatus = connect<AppStatusProps, {||}, _, _, _, _>(mapStateToProps)(
  AppStatusComponent
)

export default AppStatus
