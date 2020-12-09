// @flow
import { Dimensions } from 'react-native'
import { isIphoneX, isIphoneXR } from './constant'

const windowSize = Dimensions.get('screen')
const WINDOW_HEIGHT = windowSize.height

let bottomNavBarHeight
let bottomBlurNavBarHeight
let settingsHeader
let connectionDetailsNav
let connectionDetailsBlurNav

if (isIphoneXR) {
  bottomNavBarHeight = 84
  bottomBlurNavBarHeight = 83
} else if (isIphoneX) {
  bottomNavBarHeight = 60
  bottomBlurNavBarHeight = 59
} else {
  bottomNavBarHeight = 60
  bottomBlurNavBarHeight = 59
}

if (isIphoneXR || isIphoneX) {
  settingsHeader = 200
  connectionDetailsNav = 96
  connectionDetailsBlurNav = 95
} else {
  settingsHeader = 180
  connectionDetailsNav = 72
  connectionDetailsBlurNav = 71
}

export const measurements = {
  WINDOW_HEIGHT,
  bottomNavBarHeight,
  bottomBlurNavBarHeight,
  connectionDetailsNav,
  connectionDetailsBlurNav,
  settingsHeader,
}
