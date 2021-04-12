// @flow
import { StyleSheet, Platform } from 'react-native'
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'
import { verticalScale, moderateScale } from 'react-native-size-matters'

const styles = StyleSheet.create({
  animatedContainer: {
    position: 'absolute',
    zIndex: 1000,
    width: '100%',
    height: moderateScale(90, 0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    width: '47%',
    minHeight: moderateScale(120, 2),
    marginRight: 20,
    marginBottom: 35,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2.5 },
    shadowColor: colors.black,
    shadowOpacity: Platform.OS === 'android' ? 0.05 : 0.1,
    elevation: Platform.OS === 'android' ? 10 : 20,
    backgroundColor: colors.white,
    paddingVertical: verticalScale(16),
    display: 'flex',
    justifyContent: 'center',
  },
  itemFailed: {
    borderWidth: 2,
    borderColor: colors.red,
  },
  initialsContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray5,
  },
  initialsText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: 'bold',
    color: colors.gray1,
  },
  avatarSection: {
    alignItems: 'center',
    borderRadius: 50,
  },
  dateButtonSection: {
    width: '32%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  buttonSection: {
    height: '50%',
    width: '30%',
    justifyContent: 'flex-end',
  },
  companyNameText: {
    paddingLeft: '5%',
    paddingRight: '5%',
    marginTop: 5,
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: '400',
    color: colors.gray1,
    textAlign: 'center',
  },
  newButtonSection: {
    height: '100%',
    width: '30%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  newLabel: {
    width: moderateScale(64),
    height: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.main,
    marginBottom: 5,
  },
  newLabelText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size9),
    fontWeight: '500',
    color: colors.white,
  },
  outerContainer: {
    position: 'absolute',
    zIndex: 1000,
    width: '100%',
    height: moderateScale(90, 0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStyle: {
    width: 80,
    height: 80,
    borderRadius: 100,
  },
  customGreenBadgeContainer: {
    position: 'absolute',
    top: verticalScale(10),
    right: verticalScale(10),
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(22) / 2,
    backgroundColor: colors.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.white,
  },
  errorImage: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 24,
    height: 24,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  }
})

export { styles }
