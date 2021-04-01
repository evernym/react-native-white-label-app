// @flow
import { StyleSheet, Platform } from 'react-native'
import {
  PADDING_HORIZONTAL,
  PADDING_VERTICAL,
  isBiggerThanShortDevice,
  color,
  isBiggerThanMediumDevice,
  fontSizes as fonts,
  fontFamily, colors,
} from '../common/styles/constant'
import {
  blackTransparent,
  OFFSET_3X,
  OFFSET_1X,
} from '../common/styles'
import { moderateScale } from 'react-native-size-matters';

const SPACE_FILLER = 50
const amountSpacing = isBiggerThanShortDevice ? PADDING_VERTICAL * 2 : 0
const showRecoveryButtonHeight = isBiggerThanShortDevice ? 150 : 100
const inputBoxHeight =
  isBiggerThanShortDevice || Platform.OS === 'ios' ? 137 : 40
export const chatBubbleTextOffset = 40
const styles = StyleSheet.create({
  tabContainer: {
    maxHeight: 60,
  },
  backgroundImage: {
    width: '100%',
    flex: 1,
    position: 'absolute',
  },
  headerCloseIcon: {
    marginRight: PADDING_HORIZONTAL,
    marginBottom: PADDING_VERTICAL,
    alignSelf: 'flex-end',
  },
  headerIcon: {
    marginRight: isBiggerThanShortDevice ? 5 : 0,
    marginTop: isBiggerThanShortDevice ? 15 : 0,
    alignSelf: 'flex-end',
  },
  headerBackIcon: {
    marginLeft: isBiggerThanShortDevice ? 5 : 0,
    marginTop: isBiggerThanShortDevice ? 15 : 5,
    alignSelf: 'flex-start',
  },
  headerSpacer: {
    height: '100%',
    width: isBiggerThanShortDevice ? SPACE_FILLER : (SPACE_FILLER * 3) / 4,
  },
  showRecoveryPassphrase: {
    width: '86%',
    height: showRecoveryButtonHeight,
    borderRadius: 5,
    alignSelf: 'center',
    backgroundColor: color.bg.tertiary.color,
    elevation: 7,
    marginBottom: 60,
  },
  genRecovery: {
    backgroundColor: color.bg.eleventh.color,
  },
  genRecoveryHeader: {
    width: '100%',
  },
  genRecoveryPhraseContainer: {
    position: 'absolute',
    top: 20,
    left: chatBubbleTextOffset / 2,
    paddingHorizontal: '7%',
  },
  genRecoveryPhraseLoadingContainer: {
    padding: 40,
    position: 'absolute',
    top: 0,
  },
  genRecoveryPhrase: {
    textAlign: 'center',
    color: color.bg.eleventh.color,
    fontSize: isBiggerThanShortDevice ? 20 : 18,
    lineHeight: isBiggerThanShortDevice ? 30 : 28,
    fontWeight: '900',
    flexWrap: 'wrap',
  },
  genRecoveryText: {
    marginBottom: isBiggerThanShortDevice ? 10 : '2%',
    alignSelf: 'center',
    fontSize: isBiggerThanShortDevice ? 22 : 20,
    fontWeight: '600',
  },
  genRecoveryMessage: {
    paddingHorizontal: 20,
    alignSelf: 'center',
    fontSize: isBiggerThanShortDevice ? 18 : 16,
    lineHeight: isBiggerThanShortDevice ? 22 : 20,
    fontWeight: '500',
    marginBottom: isBiggerThanShortDevice ? 20 : 5,
  },
  genRecoverySecondMessage: {
    paddingHorizontal: 20,
    alignSelf: 'center',
    fontSize: isBiggerThanShortDevice ? 18 : 16,
    lineHeight: isBiggerThanShortDevice ? 22 : 20,
    fontWeight: 'bold',
  },
  genRecoverySmallMessage: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: 'bold',
    marginBottom: isBiggerThanShortDevice ? 15 : '3%',
  },
  verifyMainContainer: {
    flex: 1,
    backgroundColor: color.bg.twelfth.color,
  },
  verifyMainText: {
    paddingHorizontal: 20,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: isBiggerThanShortDevice ? 40 : 20,
    marginBottom: isBiggerThanShortDevice ? 40 : 20,
  },
  exportBackupMainText: {
    paddingHorizontal: 10,
    fontSize: isBiggerThanShortDevice ? 18 : 16,
    lineHeight: isBiggerThanShortDevice ? 22 : 20,
    fontWeight: '500',
  },
  inputBox: {
    marginBottom: 24,
    marginRight: 20,
    marginLeft: 20,
    height: inputBoxHeight,
    backgroundColor: 'rgba(0,0,0,0.33)',
    color: colors.white,
    padding: 10,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginLeft: '2%',
    marginRight: '2%',
    marginBottom: 15,
    borderRadius: 5,
    shadowColor: colors.gray2,
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowRadius: 5,
    shadowOpacity: 0.3,
    elevation: 7,
    height: isBiggerThanShortDevice ? 58 : 48,
    width: '94%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  backgroundImageVerify: {
    flex: 1,
    position: 'absolute',
  },
  exportBackup: {
    backgroundColor: color.bg.thirteenth.color,
  },
  title: {
    fontWeight: '600',
    lineHeight: isBiggerThanShortDevice ? 27 : 22,
    fontSize: isBiggerThanShortDevice ? 22 : 20,
    marginBottom: isBiggerThanShortDevice ? 20 : 10,
    width: '100%',
  },

  exportBackupTitle: {
    fontWeight: '600',
    lineHeight: isBiggerThanShortDevice ? 27 : 22,
    fontSize: isBiggerThanShortDevice ? 22 : 20,
    marginBottom: isBiggerThanShortDevice ? 30 : 10,
    marginTop: isBiggerThanShortDevice ? 10 : 0,
    maxWidth: 290,
  },
  exportBackupText: {
    marginBottom: 20,
    backgroundColor: color.bg.thirteenth.color,
    alignSelf: 'center',
    fontSize: 22,
  },
  exportBackupMessage: {
    backgroundColor: color.bg.thirteenth.color,
    alignSelf: 'center',
    fontSize: 18,
  },
  exportBackupFile: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
  },
  exportBackupSmallMessage: {
    fontSize: 14,
    maxWidth: 300,
    lineHeight: 17,
    marginBottom: isBiggerThanShortDevice ? 30 : 10,
  },
  backupComplete: {
    backgroundColor: color.bg.fourteenth.color,
  },

  backupCompleteHeader: {
    width: '100%',
  },
  backupCompleteText: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 22,
  },
  alignItemsCenter: {
    marginBottom: 6,
    marginLeft: '5%',
    marginRight: '5%',
  },
  verticalSpacing: {
    paddingTop: amountSpacing,
  },
  customButtonColor: {
    fontWeight: '600',
    fontSize: 18,
  },
  lockIconImage: {
    paddingTop: isBiggerThanShortDevice ? 40 : '2%',
  },
  imageIcon: {
    resizeMode: 'stretch',
    width: '100%',
    marginBottom: isBiggerThanShortDevice ? 20 : 0,
  },
  imageIconEncryptFile: {
    resizeMode: 'contain',
    width: isBiggerThanShortDevice ? '100%' : '80%',
    marginBottom: isBiggerThanShortDevice ? 20 : 0,
  },
  selectContainer: {
    maxHeight: isBiggerThanMediumDevice
      ? 460
      : isBiggerThanShortDevice
      ? 400
      : 310,
    // marginHorizontal:20,
  },
  selectRecoveryMethod: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    backgroundColor: colors.white,
  },
  title1: {
    fontWeight: '400',
    lineHeight: isBiggerThanShortDevice ? 27 : 22,
    fontSize: isBiggerThanShortDevice ? 27 : 20,
    marginBottom: 10,
    width: '100%',
  },
  title2: {
    fontWeight: '400',
    lineHeight: isBiggerThanShortDevice ? 27 : 22,
    fontSize: 22,
    marginBottom: 10,
    width: '100%',
    color: colors.white,
  },
  backuptitle: {
    fontWeight: '400',
    lineHeight: isBiggerThanMediumDevice ? 27 : 22,
    fontSize: isBiggerThanMediumDevice ? 27 : 20,
    marginBottom: isBiggerThanMediumDevice
      ? 40
      : isBiggerThanShortDevice
      ? 20
      : 10,
    width: '100%',
    color: '#505050',
  },
  selectMethod: {
    padding: 20,
    borderRadius: 4,
  },
  background: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  wrapper: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  image: {
    position: 'absolute',
    bottom: moderateScale(32),
    right: moderateScale(10),
  },
})

const QUESTION_SENDER_LOGO_DIMENSION = 32
const questionScreenSpacing = '5%'

export const questionStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: 'transparent',
  },
  headerHandleContainer: {
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  headerHandlebar: {
    width: 51,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.grey5,
  },
  mainContainer: {
    backgroundColor: blackTransparent,
  },
  screenContainer: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingLeft: questionScreenSpacing,
    paddingRight: questionScreenSpacing,
    paddingBottom: 10,
    backgroundColor: color.bg.tertiary.color,
  },
  questionSenderContainer: {
    minHeight: 64,
    maxHeight: 90,
  },
  questionSenderLogo: {
    width: QUESTION_SENDER_LOGO_DIMENSION,
    height: QUESTION_SENDER_LOGO_DIMENSION,
  },
  backupLogo: {
    width: 80,
    height: 54,
  },
  questionSenderName: {
    marginLeft: questionScreenSpacing,
  },
  questionTitle: {
    marginBottom: OFFSET_1X,
  },
  questionText: {
    marginBottom: OFFSET_3X,
  },
  questionResponseRadio: {
    borderWidth: 0,
    backgroundColor: colors.gray4,
  },
  questionResponseRadioWrapper: {
    marginLeft: '5%',
  },
  questionResponseRadioLabel: {
    fontFamily: fontFamily,
    fontSize: fonts.size4,
    color: colors.gray1,
    fontWeight: 'bold',
  },
  questionResponseRadioLabelWrapper: {
    marginLeft: 16,
  },
  questionRadioStyle: {
    marginBottom: 16,
  },
  questionActionContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: '3%',
    paddingBottom: 20,
  },
  buttonSpacing: {
    marginRight: '3%',
  },
  actionButton: {
    borderRadius: 5,
    borderWidth: 1,
  },
  cancelButton: {
    borderColor: colors.gray3,
  },
  submitButton: {
    backgroundColor: colors.main,
    borderColor: colors.main,
  },
  errorButton: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  feedbackIcon: {
    width: 150,
    height: 150,
  },
  responseButton: {
    marginTop: OFFSET_1X,
  },
  questionLoaderContainer: {
    marginVertical: 32,
  },
  questionErrorContainer: {
    marginVertical: '10%',
  },
  questionSuccessContainer: {
    marginVertical: '10%',
  },
  successErrorImg: {
    width: 32,
    height: 32,
    alignSelf: 'center',
    marginBottom: 16,
  },
  customViewHelperStyles: {
    marginTop: 10,
  },
  dismissButton: {
    marginTop: 50,
  },
  customTextHelperStyles: {
    fontSize: 23,
    color: color.bg.tertiary.font.seventh,
    marginVertical: 20,
  },
})

export default styles
