// @flow

import { StyleSheet, Platform } from 'react-native'

import {
  color,
  OFFSET_1X,
  OFFSET_3X,
  OFFSET_2X,
  OFFSET_9X, fontSizes as fonts,
} from '../../common/styles/constant'

// TODO:KS Move this file to common/styles

const commonStyles = {
  padding: 0,
  shadowColor: 'transparent',
  shadowOpacity: 0,
  shadowOffset: {
    height: 0,
  },
  shadowRadius: 0,
  elevation: 0,
}

export default StyleSheet.create({
  header: {
    backgroundColor: color.bg.secondary.color,
    minHeight: 75,
    borderBottomWidth: 0,
    ...commonStyles,
  },
  headerLeft: {
    marginLeft: OFFSET_3X / 2,
  },
  headerLogoContainer: {
    height: OFFSET_9X + (Platform.OS === 'ios' ? 0 : OFFSET_1X),
  },
  clearBg: { backgroundColor: 'transparent' },
  centerTitle: {
    alignSelf: 'center',
  },
})

export const tertiaryHeaderStyles = StyleSheet.create({
  header: {
    backgroundColor: color.bg.tertiary.color,
    minHeight: 64,
    paddingHorizontal: OFFSET_2X,
    borderBottomWidth: 0,
    ...commonStyles,
  },
  title: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: fonts.size4,
    fontWeight: '600',
    color: color.bg.tertiary.font.tertiary,
  },
})

export const transparentHeaderStyle = {
  backgroundColor: 'transparent',
}

export const noBorderNoShadowHeaderStyle = {
  borderBottomWidth: 0,
  shadowOpacity: 0,
  shadowOffset: {
    height: 0,
  },
  shadowRadius: 0,
  elevation: 0,
}
