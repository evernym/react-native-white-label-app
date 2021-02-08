// @flow

import { StyleSheet, Dimensions } from 'react-native'
import { color, fontFamily, fontSizes } from '../common/styles'
import { colors } from '../common/styles/constant'

const { height } = Dimensions.get('window')
const CONTENT_CONTAINER_HEIGHT = (height * 30) / 100 // keep content height at 30%

export const openIdStyles = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: '3%',
  },
  contentContainer: {
    height: CONTENT_CONTAINER_HEIGHT,
  },
  actionContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: '3%',
  },
  buttonSpacing: {
    marginRight: '3%',
  },
  actionButtons: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.actions.eleventh,
  },
  noButton: {},
  yesButton: {},
  errorText: {
    marginTop: '5%',
  },
  successText: {
    marginTop: '5%',
  },
  verificationFailedText: {
    color: colors.red,
    marginBottom: '3%',
  },
  errorContainer: {
    justifyContent: 'space-between',
    minHeight: '30%',
  },
  errorTextContainer: {
    marginVertical: '5%',
  },
})

export const actionButtonDefaultProps = {
  fontSize: fontSizes.size4,
  fontWeight: 'bold',
  fontFamily: fontFamily,
}
