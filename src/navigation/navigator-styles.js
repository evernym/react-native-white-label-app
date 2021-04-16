import { StyleSheet } from 'react-native';

import { moderateScale, verticalScale } from 'react-native-size-matters'

import { colors, fontFamily } from '../common/styles'
import { unreadMessageContainerCommonStyle } from '../components/unread-messages-badge/unread-messages-badge'

export const styles = StyleSheet.create({
  icon: {
    marginBottom: verticalScale(2),
  },
  drawerOuterContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopRightRadius: verticalScale(14),
    borderBottomRightRadius: verticalScale(14),
  },
  drawerHeader: {
    width: '100%',
    height: moderateScale(180),
    justifyContent: 'space-evenly',
    paddingLeft: moderateScale(20),
    marginTop: moderateScale(20),
  },
  drawerFooterContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerFooter: {
    width: '100%',
    height: moderateScale(50),
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamily,
    fontSize: verticalScale(10),
    color: colors.gray3,
    fontWeight: 'bold',
  },
  labelContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(15),
    fontWeight: '500',
    color: colors.gray3,
  },
  labelTextFocusedColor: {
    color: colors.main,
  },
  customGreenBadgeContainer: {
    ...unreadMessageContainerCommonStyle,
  },
  companyIconImage: {
    width: verticalScale(26),
    height: verticalScale(26),
    marginLeft: moderateScale(20),
    marginRight: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  companyIconTextContainer: {
    height: verticalScale(26),
    marginBottom: moderateScale(20),
  },
  companyIconLogoText: {
    height: '50%',
    justifyContent: 'flex-start',
  },
  companyIconBuildText: {
    height: '50%',
    justifyContent: 'flex-end',
  },
  drawerIconWrapper: {
    width: moderateScale(22),
    alignItems: 'center',
  },
})
