// @flow
import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native'
import {
  blackTransparent,
  cmGrey5,
  OFFSET_3X,
  OFFSET_1X,
  cmGrey4,
  font,
  cmGrey1,
  white,
  color,
  cmRed,
  deviceHeight,
  primaryGreen,
} from '../common/styles'

const QUESTION_SENDER_LOGO_DIMENSION = 100
const questionScreenSpacing = '5%'

export const getQuestionStylesObject = (
  questionSenderLogoBorderRadius: number
) => ({
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
    backgroundColor: cmGrey5,
  },
  mainContainer: {
    backgroundColor: blackTransparent,
  },
  screenContainer: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingLeft: questionScreenSpacing,
    paddingRight: questionScreenSpacing,
    backgroundColor: color.bg.tertiary.color,
  },
  questionSenderContainer: {
    minHeight: deviceHeight * 0.35,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionSenderLogo: {
    width: QUESTION_SENDER_LOGO_DIMENSION,
    height: QUESTION_SENDER_LOGO_DIMENSION,
    borderRadius: questionSenderLogoBorderRadius,
    borderWidth: 0,
    marginBottom: 15,
  },
  questionSenderName: {
    marginTop: 10,
    marginBottom: 20,
  },
  questionTitle: {
    marginBottom: OFFSET_1X,
  },
  questionText: {
    marginBottom: OFFSET_3X,
  },
  questionResponsesContainer: {
    maxHeight: getQuestionResponsesHeight(),
  },
  questionResponsesContainerSingleResponse: {
    flex: 1,
  },
  questionResponseRadio: {
    borderWidth: 0,
    backgroundColor: cmGrey4,
  },
  questionResponseRadioWrapper: {
    marginLeft: 0,
  },
  questionResponseRadioLabel: {
    fontFamily: font.family,
    fontSize: font.size.M,
    color: cmGrey1,
    fontWeight: 'normal',
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
    backgroundColor: 'transparent',
    maxWidth: '94%',
    marginLeft: '3%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  buttonSpacing: {
    marginRight: '3%',
  },
  actionWrapper: {
    width: '94%',
    marginLeft: '3%',
  },
  actionButtonContainer: {
    marginBottom: 15,
    borderRadius: 5,
    borderColor: white,
    borderWidth: 1,
    minHeight: 56,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 56,
    borderRadius: 5,
  },
  submitButton: {
    borderColor: primaryGreen,
    backgroundColor: primaryGreen,
  },
  cancelButton: {
    borderColor: cmRed,
  },
  feedbackIcon: {
    width: 150,
    height: 150,
  },
  responseButton: {
    marginTop: OFFSET_1X,
  },
  questionLoaderContainer: {
    minHeight: '20%',
    marginVertical: '10%',
  },
  questionErrorContainer: {
    marginVertical: '10%',
    minHeight: 200,
  },
  questionSuccessContainer: {
    marginVertical: '10%',
    minHeight: 200,
  },
  bottomContainer: {
    padding: 15,
    paddingTop: 0,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    padding: 16,
    marginTop: Platform.OS !== 'android' ? StatusBar.currentHeight || 30 : 0,
  },
  cancelBtnColor: {
    color: cmRed,
    backgroundColor: 'white',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },
  listStyle: { flex: 1, padding: 20 },
  questionDetails: {
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: 150,
    justifyContent: 'center',
    marginBottom: 25,
  },
  transparentBack: {
    backgroundColor: 'transparent',
  },
  placeholderIfNoImage: {
    width: QUESTION_SENDER_LOGO_DIMENSION,
    fontSize: font.size.L,
  },
})

export const questionStyles = StyleSheet.create(
  getQuestionStylesObject(QUESTION_SENDER_LOGO_DIMENSION / 2)
)

export const questionActionButtonDefaultProps = {
  fontSize: font.size.M,
  fontWeight: 'bold',
  fontFamily: font.family,
}

export const disabledStyle = {
  backgroundColor: primaryGreen,
}

function getQuestionResponsesHeight(singleResponse: ?boolean) {
  const { height } = Dimensions.get('window')
  const headerHeight = (height * 10) / 100
  const bottomActionsHeight = (height * (singleResponse ? 10 : 20)) / 100
  const senderDetailsHeight = 100
  const titleHeight = 100

  return (
    height -
    headerHeight -
    bottomActionsHeight -
    senderDetailsHeight -
    titleHeight
  )
}
