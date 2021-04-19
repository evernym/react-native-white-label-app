// @flow
/**
 * Intend to verify user actions
 * we will ask authorize user for some actions in app
 * either by asking for TouchId or asking user to enter pin code
 */
import React, { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'

import type { LockAuthorizationProps } from './type-lock'

import { headerDefaultOptions } from '../navigation/navigation-header-config'
import LockEnter from './lock-enter'
import { lockAuthorizationHomeRoute } from '../common'
import { colors } from '../common/styles/constant'

export const LockAuthorization = ({
  navigation,
  route,
}: LockAuthorizationProps) => {
  const onSuccess = useCallback(() => {
    const { params } = route
    params && params.onSuccess && params.onSuccess()
  }, [])

  return (
    <View style={styles.container}>
      <LockEnter onSuccess={onSuccess} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
  },
})

export const lockAuthorizationScreen = {
  routeName: lockAuthorizationHomeRoute,
  screen: LockAuthorization,
  options: headerDefaultOptions({
    headline: undefined,
    headerHideShadow: true,
    transparent: false,
  })
}
