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
import {
  resetBackgroundTimeout,
  watchApplicationInactivity,
} from '../bridge/react-native-cxs/RNCxs'

export class AppStatusComponent extends React.Component<
  AppStatusProps,
  AppStatusState
> {
  state = {
    appState: AppState.currentState,
  }

  subscription = null;

  componentDidMount() {
    this.subscription = AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount() {
    this.subscription.remove()
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

  componentDidUpdate() {
    if (
      this.state.appState &&
      this.state.appState.match(/inactive|background/)
    ) {
      watchApplicationInactivity().then((r) => r)
    } else {
      resetBackgroundTimeout()
    }
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
