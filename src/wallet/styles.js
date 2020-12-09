// @flow
import { StyleSheet } from 'react-native'
import {
  PADDING_VERTICAL,
  isBiggerThanShortDevice,
  color,
} from '../common/styles/constant'

const ctaButtonHeight = isBiggerThanShortDevice ? 63 : 43

const styles = StyleSheet.create({
  headerCloseIcon: {
    marginTop: PADDING_VERTICAL,
  },
  ctaButton: {
    flex: -1,
    height: ctaButtonHeight,
    borderRadius: 5,
    backgroundColor: color.bg.eighth.color,
  },
  signTaaButton: {
    marginTop: 20,
    marginBottom: 6,
    marginHorizontal: '5%',
  },
  alignItemsCenter: {
    marginBottom: 6,
    marginHorizontal: '5%',
  },
  verticalSpacing: {
    flexDirection: 'column',
    alignContent: 'center',
    justifyContent: 'space-around',
  },
  horizontalSpacing: {
    flexDirection: 'column',
    alignContent: 'center',
    marginTop: 6,
    marginLeft: 6,
    marginRight: 6,
  },
})

export default styles
