// @flow

import { verticalScale, moderateScale } from 'react-native-size-matters'
import { StyleSheet, Platform } from 'react-native'
import { colors, fontFamily } from '../../common/styles/constant'

export type HeaderProps = {
  headline?: string,
  hideBackButton?: boolean,
  transparent?: boolean,
}

export const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    height: Platform.OS === 'android' ? verticalScale(56) : verticalScale(80),
    width: '100%',
    flexDirection: 'row',
    backgroundColor: colors.cmWhite,
    shadowColor: colors.cmBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: Platform.OS === 'android' ? 8 : 0,
    paddingTop: Platform.OS === 'android' ? 0 : verticalScale(24),
  },
  containerTransparent: {
    height: Platform.OS === 'android' ? verticalScale(56) : verticalScale(80),
    width: '100%',
    flexDirection: 'row',
    paddingTop: Platform.OS === 'android' ? 0 : verticalScale(24),
  },
  iconSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '15%',
  },
  labelSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '85%',
  },
  menuIcon: {
    marginLeft: moderateScale(15),
    marginBottom: moderateScale(2),
  },
  label: {
    fontFamily: fontFamily,
    fontSize: moderateScale(22),
    marginLeft: moderateScale(-50),
    color: colors.cmGray2,
  },
  iconAndNameWrapper: {
    width: '65%',
    height: '100%',
    marginStart: moderateScale(-8),
    marginEnd: moderateScale(32),
    flexDirection: 'row',
  },
  labelWithIconSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '85%',
  },
  headerImageWrapper: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: 20,
  },
  headerIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
  },
  buttonMoreOptionsWrapper: {
    height: '100%',
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerImageOuterWrapper: {
    height: '100%',
    width: '35%',
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: moderateScale(10),
    marginRight: moderateScale(6),
    paddingBottom: moderateScale(6),
  },
})
