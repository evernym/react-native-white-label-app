// @flow
import React from 'react'
import { StyleSheet, View } from 'react-native'

import type { RequestDetailTextProps } from './type-request'

import { CustomView } from '../layout/custom-view'
import CustomText from '../text'
import { colors, fontFamily, fontSizes, OFFSET_1X, OFFSET_3X } from '../../common/styles'
import { ExpandableText } from '../expandable-text/expandable-text'
import { moderateScale } from 'react-native-size-matters'

export const RequestDetailText = (props: RequestDetailTextProps) => {
  const { testID } = props
  return (
    <View>
      <CustomView center testID={`${testID}-text-container-message-title`}>
        <CustomText
          testID={`${testID}-text-title`}
          h4
          center
          thick
          bg="fifth"
          style={[styles.textTitle]}
          accessible={true}
          accessibilityLabel={`${testID}-text-title`}
        >
          {props.title}
        </CustomText>
        <ExpandableText
          style={styles.textMessage}
          text={props.message}
          testID={`${testID}-text-message`}
          accessible={true}
          accessibilityLabel={props.message}
        />
      </CustomView>
    </View>
  )
}

const styles = StyleSheet.create({
  textMessage: {
    margin: OFFSET_1X,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.gray1,
    fontSize: moderateScale(fontSizes.size6),
    fontFamily: fontFamily,
  },
  textTitle: {
    marginVertical: OFFSET_1X,
    marginHorizontal: OFFSET_3X,
    lineHeight: OFFSET_3X,
  },
})
