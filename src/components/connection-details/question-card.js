// @flow
import React, { useCallback } from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { questionRoute } from '../../common'
import { useNavigation } from '@react-navigation/native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { ExpandableText } from '../expandable-text/expandable-text'

export const QuestionCard = ({
  uid,
  colorBackground,
  messageDate,
  messageTitle,
  messageContent,
}: QuestionCardProps) => {
  const navigation = useNavigation()
  const navigateToQuestionScreen = useCallback(() => {
    navigation.navigate(questionRoute, { uid })
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.messageDate}>{messageDate}</Text>
      <ExpandableText text={messageTitle} style={styles.messageTitle} lines={1}/>
      <ExpandableText text={messageContent} style={styles.messageContent} lines={1}/>
      <View style={styles.buttonsWrapper}>
        <TouchableOpacity
          onPress={navigateToQuestionScreen}
          style={[styles.buttonView, { backgroundColor: colorBackground }]}
        >
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.helperView} />
    </View>
  )
}

type QuestionCardProps = {
  uid: string,
  colorBackground: string,
  messageDate: string,
  messageTitle: string,
  messageContent: string,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingLeft: '7%',
    paddingRight: '7%',
    paddingTop: moderateScale(15),
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  absolute: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: moderateScale(45),
  },
  messageDate: {
    color: colors.cmGray2,
    fontSize: verticalScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  messageTitle: {
    color: colors.cmGray1,
    fontWeight: '500',
    fontSize: moderateScale(fontSizes.size5),
    textAlign: 'left',
    marginTop: verticalScale(2),
    marginBottom: verticalScale(2),
    fontFamily: fontFamily,
  },
  messageContent: {
    color: colors.cmGray1,
    fontSize: moderateScale(fontSizes.size7),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  buttonsWrapper: {
    flexDirection: 'row',
    width: '100%',
    marginTop: moderateScale(15),
  },
  buttonView: {
    padding: moderateScale(6.5),
    paddingLeft: moderateScale(26),
    paddingRight: moderateScale(26),
    borderRadius: moderateScale(5),
  },
  viewText: {
    color: colors.cmWhite,
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  buttonIgnore: {
    backgroundColor: 'transparent',
    padding: moderateScale(6.5),
    paddingLeft: moderateScale(26),
    paddingRight: moderateScale(26),
    borderRadius: moderateScale(5),
  },
  ignoreText: {
    color: colors.cmGray2,
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  helperView: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cmGray5,
    width: '100%',
    paddingTop: moderateScale(15),
  },
})
