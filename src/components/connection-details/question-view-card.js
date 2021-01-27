// @flow
import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { ExpandableText } from '../expandable-text/expandable-text'

export const QuestionViewCard = ({
  messageDate,
  requestStatus,
  requestAction,
}: QuestionViewCardProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.content}>
          <Text style={styles.messageDate}>{messageDate} - </Text>
          <Text style={styles.requestStatus}>{requestStatus}</Text>
        </View>
        <ExpandableText
          style={styles.requestAction}
          text={requestAction}
          lines={1}
        />
      </View>
    </View>
  )
}

type QuestionViewCardProps = {
  uid: string,
  messageDate: string,
  requestStatus: string,
  requestAction: string,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '86%',
    marginLeft: '7%',
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(20),
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.cmGray5,
  },
  contentRow: {
    flex: 1,
    alignItems: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageDate: {
    color: colors.cmGray2,
    fontSize: moderateScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  requestStatus: {
    color: colors.cmGray2,
    fontSize: moderateScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  requestAction: {
    color: colors.cmGray3,
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    paddingTop: verticalScale(3),
    fontFamily: fontFamily,
  },
})
