// @flow

import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { connect, useSelector, useDispatch } from 'react-redux'
import { bindActionCreators } from 'redux'
import NetInfo, { useNetInfo } from '@react-native-community/netinfo'

import type { OfflineProps } from './type-offline'

import { color } from '../common/styles/constant'
import { offline } from './offline-store'
import {
  getOfflineStatus,
  getVcxPoolInitializationError,
  getVcxInitializationError,
  getIsLoading,
  getVcxPoolInitializationState,
  getIsVcxPoolInitFailed,
  getIsVcxInitFailed,
} from '../store/store-selector'
import { vcxInitPoolStart, vcxInitStart } from '../store/route-store'
import { Container } from '../components'
import { EvaIcon, NO_WIFI } from '../common/icons'
import { colors } from '../common/styles/constant'
import { CustomText, CustomView, Loader } from '../components'

const Offline = ({ offline, overlay }: OfflineProps) => {
  const netInfo = useNetInfo()
  const [isLoading, setIsLoading] = useState(false)

  const dispatch = useDispatch()

  const isOffline = useSelector(getOfflineStatus)
  const isPoolError = useSelector(getIsVcxPoolInitFailed)
  const isVcxError = useSelector(getIsVcxInitFailed)
  const isVcxLoading = useSelector(getIsLoading)
  
  const isShowLoader = useMemo(() => {
    return isLoading || isVcxLoading
  }, [isLoading, isVcxLoading])

  const isNeedToReconnect = useMemo(() => {
    return isOffline || isVcxError || isPoolError
  }, [isOffline, isVcxError, isPoolError])

  const currentErrorForMessage = useMemo(() => {
    if (isOffline) {
      return 'internet'
    }
    if (isVcxError) {
      return 'agent'
    }
    if (isPoolError) {
      return 'pool'
    }
  }, [isOffline, isVcxError, isPoolError])

  useEffect(() => {
    offline(!netInfo.isInternetReachable)
  }, [netInfo])

  const internetReconnect = () => () => {
    setIsLoading(true)
    const req = setInterval(async () => {
      const state = await NetInfo.fetch()
      offline(!state.isConnected)
    }, 500)
    setTimeout(() => {
      setIsLoading(false)
      clearInterval(req)
    }, 3000)
  }

  const poolReconnect = () =>  dispatch(vcxInitPoolStart())

  const vcxReconnect = () => dispatch(vcxInitStart())

  const initReconnectFunction = () => {
    if (isOffline) {
      return internetReconnect()
    }
    if (isVcxError) {
      return vcxReconnect()
    }
    if (isPoolError) {
      return poolReconnect()
    }
  }

  return isNeedToReconnect && overlay ?
    <CustomView doubleVerticalSpace horizontalSpace bg={'yellow'} >
      {!isShowLoader ?
      <CustomText bg center>
        {`No ${currentErrorForMessage} connection detected. `}
          <CustomText bg bold underline onPress={initReconnectFunction}>Reconnect</CustomText>
      </CustomText> :
      <View style={styles.overlay}>
        <CustomText bg center>Attempting to reconnect... </CustomText>
        <ActivityIndicator size='large' color={color.actions.fifth}/>
      </View>}
    </CustomView> :
    null

  // return isOffline && overlay ?
  //   <View style={styles.overlay}>
  //     <Container vCenter hCenter>
  //       <EvaIcon
  //         name={NO_WIFI}
  //         width={64}
  //         height={64}
  //         fill={colors.white}
  //       />
  //     </Container>
  //   </View> :
  //   null
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ offline }, dispatch)

export default connect(null, mapDispatchToProps)(Offline)

const styles = StyleSheet.create({
  overlay: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
})
