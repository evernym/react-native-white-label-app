// @flow
import React from 'react'
import { Image, StyleSheet, Platform, Text } from 'react-native'

import { CustomView, Container } from '../../layout/'
import { BottomUpSliderText } from './bottom-up-slider-screen-text'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../../common/styles'

export function BottomUpSliderContentHeaderDetail(props: {
  source: number,
  senderName: string,
  headerInfo: string,
  headerTitle: string,
}) {
  return (
    <CustomView column style={[styles.contentHeaderContainer]}>
      <CustomView row center>
        <CustomView>
          <Image
            style={[styles.headerLogo]}
            source={props.source}
            resizeMode="cover"
          />
        </CustomView>
        <Container style={[styles.headerName]}>
          <BottomUpSliderText style={[styles.headerNameText]} numberOfLines={1}>
            {props.senderName}
          </BottomUpSliderText>
          <Text
            style={[
              styles.slideHeaderUpAboutText,
              {
                fontSize: infoSize(
                  props.headerInfo ? props.headerInfo.length : 0
                ),
              },
            ]}
          >
            {props.headerInfo}
          </Text>
        </Container>
      </CustomView>
      <Text
        style={[
          styles.slideHeaderUpText,
          {
            fontSize: headerNameText(
              props.headerTitle ? props.headerTitle.length : 0
            ),
          },
        ]}
        numberOfLines={1}
      >
        {props.headerTitle}
      </Text>
    </CustomView>
  )
}

const infoSize = (wordLength: number): number => {
  switch (true) {
    case wordLength < 25:
      return scale(14)
    default:
      return scale(10)
  }
}

const headerNameText = (wordLength: number): number => {
  switch (true) {
    case wordLength < 19:
      return scale(22)
    case wordLength < 23:
      return scale(18)
    case wordLength < 27:
      return scale(16)
    default:
      return scale(14)
  }
}

const styles = StyleSheet.create({
  contentHeaderContainer: {
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: colors.cmWhite,
    height: verticalScale(96),
    shadowColor: colors.cmBlack,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    zIndex: 200,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  headerLogo: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1,
  },
  headerName: {
    marginLeft: '5%',
  },
  headerNameText: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  slideHeaderUpText: {
    color: colors.cmGray1,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  slideHeaderUpAboutText: {
    color: colors.cmGray2,
    fontSize: verticalScale(10),
    fontFamily: fontFamily,
  },
})
