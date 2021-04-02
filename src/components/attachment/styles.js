// @flow
import { StyleSheet, Platform } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollViewWrapper: {
    backgroundColor: colors.white,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  wrapper: {
    backgroundColor: colors.white,
    paddingTop: moderateScale(12),
    ...Platform.select({
      ios: {
        borderBottomColor: colors.gray5,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomColor: colors.gray5,
        borderBottomWidth: 1,
      },
    }),
  },
  title: {
    fontSize: verticalScale(fontSizes.size6),
    color: colors.gray3,
    width: '100%',
    textAlign: 'left',
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
    lineHeight: verticalScale(17),
  },
  content: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '700',
    color: '#505050',
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    lineHeight: verticalScale(23),
  },
  contentGray: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  textAvatarWrapper: {
    width: '98.5%',
    flexDirection: 'row',
  },
  textWrapper: {
    width: '90%',
    paddingBottom: moderateScale(10),
  },
  avatarWrapper: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAttachment: {
    width: moderateScale(150),
    height: moderateScale(150),
  },
  attachmentIcon: {
    width: moderateScale(64),
    height: moderateScale(64),
  },
  nameIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentNameContainer: {
    flex: 1,
    marginLeft: moderateScale(10),
  },
  parentWrapper: {
    flexDirection: 'row',
  },
  svgStyles: {
    marginRight: moderateScale(16),
  },
  extensionNameStyle: {
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '600',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
})
