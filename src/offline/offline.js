// @flow

import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import NetInfo from '@react-native-community/netinfo'

import type { OfflineProps } from './type-offline'
import type { Store } from '../store/type-store'
import type { NetInfoState } from '@react-native-community/netinfo'

import { offline } from './offline-store'
import { getOfflineStatus } from '../store/store-selector'
import { Container } from '../components'
import VectorIcon from '../components/vector-icon/vector-icon'

export class Offline extends Component<OfflineProps> {
  unsubscribe = null

  componentDidMount() {
    this.unsubscribe = NetInfo.addEventListener(this.handleConnectivityChange)
  }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe()
  }

  handleConnectivityChange = (state: NetInfoState) => {
    // isInternetReachable starts as null and then changes to true/false
    if (state.isInternetReachable !== null) {
      this.props.offline(!state.isInternetReachable)
    }
  }

  render() {
    const { isOffline, overlay, render } = this.props
    // Will only render if it's passed the banner prop. This allows us to add the component
    // to the app root so that it's the only one setting/removing the connectionChange event listener

    if (isOffline && !overlay && render) {
      return render(!isOffline)
    }

    if (isOffline && overlay) {
      return (
        <View style={styles.overlay}>
          <Container vCenter hCenter>
            <VectorIcon icon="offline" width={64} height={64} />
          </Container>
        </View>
      )
    }

    return null
  }
}

const mapStateToProps = (state: Store) => ({
  isOffline: getOfflineStatus(state),
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ offline }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Offline)

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
})
