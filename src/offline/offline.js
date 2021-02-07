// @flow

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect, useSelector } from 'react-redux'
import { bindActionCreators } from 'redux'
import { useNetInfo } from '@react-native-community/netinfo'

import type { OfflineProps } from './type-offline'

import { offline } from './offline-store'
import { getOfflineStatus } from '../store/store-selector'
import { Container } from '../components'
import { EvaIcon, NO_WIFI } from '../common/icons'
import { colors } from '../common/styles/constant'

const Offline = ({ offline, overlay }: OfflineProps) => {
  const netInfo = useNetInfo()
  const isOffline = useSelector(getOfflineStatus)

  useEffect(() => {
    offline(!netInfo.isInternetReachable)
  }, [netInfo])

  return isOffline && overlay ?
    <View style={styles.overlay}>
      <Container vCenter hCenter>
        <EvaIcon
          name={NO_WIFI}
          width={64}
          height={64}
          fill={colors.white}
        />
      </Container>
    </View> :
    null
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ offline }, dispatch)

export default connect(null, mapDispatchToProps)(Offline)

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
})
