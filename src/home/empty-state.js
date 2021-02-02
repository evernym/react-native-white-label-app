// @flow
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontFamily, fontSizes } from '../common/styles/constant'
import { verticalScale, moderateScale } from 'react-native-size-matters'

export const EmptyState = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        You design goes here
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size0),
    fontWeight: '700',
    color: colors.gray3,
    marginTop: moderateScale(-98),
    marginLeft: moderateScale(24),
    marginRight: moderateScale(48),
  },
})
