import { StyleSheet } from 'react-native';

import { moderateScale, verticalScale } from 'react-native-size-matters'

import { colors, fontFamily, fontSizes } from '../common/styles'

export const style = StyleSheet.create({
  secondaryContainer: {
    backgroundColor: colors.gray5,
    flex: 1,
  },
  listContainer: {
    borderBottomWidth: 0,
    borderTopWidth: 0,
    backgroundColor: colors.gray5,
    padding: 0,
  },
  listItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderBottomColor: colors.gray4,
    backgroundColor: colors.gray5,
    minHeight: verticalScale(52),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(16),
  },
  listItemText: {
    flex: 1,
    paddingHorizontal: verticalScale(10),
  },
  titleStyle: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: 'bold',
    color: colors.gray2,
  },
  walletNotBackedUpTitleStyle: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: 'bold',
    color: colors.red,
  },
  subtitleStyle: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size8),
    color: colors.gray2,
  },
  walletNotBackedUpSubtitleStyle: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size8),
    color: colors.red,
  },
  subtitleFail: {
    color: colors.red,
  },
  avatarStyle: { backgroundColor: colors.gray5, padding: moderateScale(5) },
  username: {
    fontSize: verticalScale(fontSizes.size4),
    padding: '3%',
  },
  tokenText: {
    fontSize: verticalScale(fontSizes.size8),
    paddingTop: moderateScale(5),
    paddingBottom: moderateScale(5),
    textAlign: 'center',
  },
  editIcon: {
    width: 30,
    height: 30,
  },
  labelImage: {
    marginRight: moderateScale(10),
  },
  floatTokenAmount: {
    color: colors.gray1,
    paddingHorizontal: moderateScale(8),
  },
  backupTimeSubtitleStyle: {
    marginLeft: moderateScale(10),
    color: colors.gray2,
    fontFamily: fontFamily,
  },
  subtitleColor: {
    color: colors.gray2,
    fontFamily: fontFamily,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: colors.white,
  },
  avatarView: {
    width: moderateScale(40),
    alignItems: 'center',
  },
})
