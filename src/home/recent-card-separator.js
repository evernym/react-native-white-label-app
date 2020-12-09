// @flow
import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { colors, fontFamily } from '../common/styles/constant'
import { moderateScale } from 'react-native-size-matters'

export const RecentCardSeparator = () => {
  return (
    <View style={styles.container}>
      <View style={styles.lineSection}>
        <View style={styles.line} />
      </View>
      <View style={styles.textSection}>
        <Text style={styles.text}>Recent</Text>
      </View>
      <View style={styles.lineSection}>
        <View style={styles.line} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 22,
    marginLeft: 20,
    marginRight: 20,
    flexDirection: 'row',
  },
  lineSection: {
    flex: 1,
    justifyContent: 'center',
  },
  textSection: {
    height: '100%',
    width: moderateScale(72),
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    height: 1,
    width: '100%',
    backgroundColor: colors.cmGray3,
  },
  text: {
    fontFamily: fontFamily,
    color: colors.cmGray3,
    fontSize: moderateScale(13, 0.1),
  },
})
