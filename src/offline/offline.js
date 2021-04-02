// @flow

import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { connect, useSelector } from 'react-redux'
import { bindActionCreators } from 'redux'
import NetInfo, { useNetInfo } from '@react-native-community/netinfo'

import type { OfflineProps } from './type-offline'

import { color } from '../common/styles/constant'
import { offline } from './offline-store'
import { getUnacknowledgedMessages } from '../store/config-store'
import {
  getOfflineStatus,
  getIsLoading,
  getIsVcxPoolInitFailed,
  getIsVcxInitFailed,
  getIsGetMessagesFailed,
} from '../store/store-selector'
import { vcxInitPoolStart, vcxInitStart } from '../store/route-store'
import { CustomText, CustomView } from '../components'

export const Offline = ({
  offline,
  vcxInitPoolStart,
  vcxInitStart,
  getUnacknowledgedMessages,
  overlay,
}: OfflineProps) => {
  const netInfo = useNetInfo()
  const [isLoading, setIsLoading] = useState(false)

  const isOffline = useSelector(getOfflineStatus)
  const isPoolError = useSelector(getIsVcxPoolInitFailed)
  const isVcxError = useSelector(getIsVcxInitFailed)
  const isGetMessagesError = useSelector(getIsGetMessagesFailed)
  const isVcxLoading = useSelector(getIsLoading)

  const isShowLoader = useMemo(() => {
    return isOffline ? isLoading : isVcxLoading
  }, [isOffline, isLoading, isVcxLoading])

  const isNeedToReconnect = useMemo(() => {
    return isOffline || isVcxError || isPoolError || isGetMessagesError
  }, [isOffline, isVcxError, isPoolError, isGetMessagesError])

  const currentErrorForMessage = useMemo(() => {
    if (isOffline) {
      return 'internet'
    }
    if (isVcxError || isGetMessagesError) {
      return 'agent'
    }
    if (isPoolError) {
      return 'pool'
    }
    return ''
  }, [isOffline, isVcxError, isPoolError, isGetMessagesError])

  useEffect(() => {
    offline(!netInfo.isInternetReachable)
  }, [netInfo])

  const internetReconnect = () => {
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

  const getMessageRetry = () => getUnacknowledgedMessages()

  const poolReconnect = () => vcxInitPoolStart()

  const vcxReconnect = () => vcxInitStart()

  const initReconnectFunction = () => {
    if (isOffline) {
      return internetReconnect()
    }
    if (isVcxError) {
      return vcxReconnect()
    }
    if (isGetMessagesError) {
      return getMessageRetry()
    }
    if (isPoolError) {
      return poolReconnect()
    }
  }

  return isNeedToReconnect && overlay ? (
    <CustomView doubleVerticalSpace horizontalSpace bg={'yellow'}>
      {!isShowLoader ? (
        <CustomText bg center>
          {`No ${currentErrorForMessage} connection detected. `}
          <CustomText bg bold underline onPress={initReconnectFunction}>
            Reconnect
          </CustomText>
        </CustomText>
      ) : (
        <View style={styles.overlay}>
          <CustomText bg center>
            Attempting to reconnect...{' '}
          </CustomText>
          <ActivityIndicator size="large" color={color.actions.fifth} />
        </View>
      )}
    </CustomView>
  ) : null
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      offline,
      vcxInitPoolStart,
      vcxInitStart,
      getUnacknowledgedMessages,
    },
    dispatch
  )

export default connect(null, mapDispatchToProps)(Offline)

const styles = StyleSheet.create({
  overlay: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
