// @flow
import React from 'react'
import { Text, Image, View, StyleSheet } from 'react-native'
import { moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { ExpandableText } from '../expandable-text/expandable-text'

type ConnectionPendingProps = {
  date: string,
  title: string,
  content: string,
}

export const ConnectionPending = ({
  date,
  title,
  content,
}: ConnectionPendingProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.date}>{date}</Text>
      <View style={styles.innerWrapper}>
        <View style={styles.spinnerWrapper}>
          <Image
            style={styles.spinner}
            source={require('../../images/spinner.gif')}
          />
          <View style={styles.absolute} />
        </View>
        <View style={styles.textWrapper}>
          <ExpandableText text={title} style={styles.title} lines={1} />
          <Text style={styles.content}>{content}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '86%',
    marginLeft: '7%',
    paddingTop: moderateScale(15),
    paddingBottom: moderateScale(15),
  },
  innerWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: colors.gray5,
    borderRadius: 3,
    width: '100%',
    padding: moderateScale(12),
  },
  date: {
    color: colors.gray2,
    fontSize: moderateScale(fontSizes.size10),
    textAlign: 'left',
    fontFamily: fontFamily,
    paddingBottom: moderateScale(8),
  },
  spinnerWrapper: {
    position: 'relative',
  },
  spinner: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  absolute: {
    width: moderateScale(14),
    height: moderateScale(14),
    backgroundColor: colors.white,
    borderRadius: 7,
    position: 'absolute',
  },
  spinnerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    paddingLeft: moderateScale(12),
    flex: 1,
  },
  title: {
    color: colors.gray1,
    fontWeight: '700',
    fontSize: moderateScale(fontSizes.size7),
    textAlign: 'left',
    marginBottom: moderateScale(4),
    fontFamily: fontFamily,
  },
  content: {
    color: colors.gray2,
    fontWeight: '400',
    fontSize: moderateScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
})
