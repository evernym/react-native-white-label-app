// @flow

import React from 'react'
import { Text, StyleSheet, Platform } from 'react-native'
import { colors, fontFamily, fontSizes } from '../../common/styles'

export const HeaderTitle = ({ title }: { title: string }) => {
  return <Text style={headerTitleStyle.title}>{title}</Text>
}

export const headerTitleStyle = StyleSheet.create({
  title: {
    fontSize: fontSizes.size4,
    fontFamily: fontFamily,
    color: colors.gray2,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
  },
})
