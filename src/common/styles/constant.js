// @flow
import DeviceInfo from 'react-native-device-info'
import { StyleSheet } from 'react-native'
import { Dimensions, Platform } from 'react-native'

// $FlowExpectedError[cannot-resolve-module] external file
import { COLORS } from '../../../../../../app/evernym-sdk/colors'
// $FlowExpectedError[cannot-resolve-module] external file
import { FONT_FAMILY, FONT_SIZES } from '../../../../../../app/evernym-sdk/font'

// Colors
export const colors = COLORS || {
  main: '#86B93B',
  secondary: 'rgba(134, 185, 59, 0.15)',
  green1: '#86B93B',
  green2: '#6C8E3A',
  green3: 'rgba(134, 185, 59, 0.15)',
  red: '#CE0B24',
  orange: '#EB9B2D',
  white: '#FFFFFF',
  gray5: '#F2F2F2',
  gray4: '#EAEAEA',
  gray3: '#A5A5A5',
  gray2: '#777777',
  gray1: '#505050',
  gray0: '#404040',
  black: '#000000',
  blue: '#11ABAE',
}

// Fonts
export const fontFamily = FONT_FAMILY || 'System'
export const fontSizes = FONT_SIZES || {
  size0: 42,
  size1: 26,
  size2: 23,
  size3: 19,
  size4: 17,
  size5: 15,
  size6: 14,
  size7: 13,
  size8: 11,
  size9: 10,
  size10: 9,
  size11: 8,
}

const { width, height } = Dimensions.get('screen')
export const isiPhone5 = width >= 320 && width < 375

// >>> We should not use the code below this comment for sizes, colors and other constants.
// >>> The code below this comment should be removed after we remove CustomText, CustomView,
// >>> etc. because only those still depend on these constants.

const zircon = '#ebebea'
export const nightRider = '#333333'
export const charcoal = '#464646'
export const whiteSmoke = '#f0f0f0'
export const whiteSmokeSecondary = '#f7f7f7'
export const mantis = '#85bf43'
export const greyRGB = '119, 119, 119'
export const white = '#ffffff'
export const whisper = '#EAEAEA'
export const cardBorder = '#f2f2f2'
export const lightDarkBlue = '#4A8FE3'
export const maroonRed = '#d1021b'
export const dodgerBlue = '#0d8ffc'
export const toryBlue = '#303F9F'
export const mediumGray = '#a5a5a5'
export const caribbeanGreen = '#01C8A1'
const eclipse = '#3f3f3f'
const matterhorn = '#535353'
export const dimGray = '#686868'
const dimGraySecondary = '#6D6D6D'
export const lightGray = '#D8D8D8'
const nobelSecondary = '#9B9B9B'
export const venetianRed = '#d0021b'
export const hitSlop = { top: 15, bottom: 15, left: 15, right: 15 }

export const black = '#000000'
export const yellowSea = '#EB9B2D'
export const cornFlowerBlue = '#4A90E2'
export const atlantis = '#86B93B'
export const atlantisOpacity = 'rgba(134, 185, 59, 0.15)'
export const gamboge = '#DD9012'
const blueViolet = '#8D13FE'
const seaBuckthorn = '#f79347'
const pumpkin = '#F68127'
const olivine = '#97C85F'
export const orange = 'rgba(237, 156, 46, 1)'
const orangeDisabled = 'rgba(237, 156, 46, 0.5)'
export const darkOrange = 'rgba(207, 127, 20, 1)'
const errorBg = 'rgba(255, 214, 219, 1)'
const darkgray = '#4A4A4A'
const jordyBlue = '#79ade7'
export const whiteSolid = 'rgba(255, 255, 255, 255)'
export const lightWhite = '#E5E5EA'
export const blackTransparent = `rgba(0, 0, 0, 0.8)`

// color shades
const primaryShade = '1.0'
const secondaryShade = '0.6'
export const alertCancel = { text: 'Cancel', style: 'cancel' }
export const color = {
  actions: {
    primary: pumpkin,
    secondary: seaBuckthorn,
    tertiary: mantis,
    quaternary: olivine,
    fifth: white,
    sixth: colors.gray2,
    eighth: white,
    ninth: toryBlue,
    dangerous: venetianRed,
    none: white,
    eleventh: caribbeanGreen,
    twelfth: white,
    button: {
      primary: {
        rgba: greyRGB + ', ' + primaryShade,
        shade: primaryShade,
      },
      secondary: {
        rgba: greyRGB + ', ' + secondaryShade,
        shade: secondaryShade,
      },
    },
    font: {
      primary: white,
      secondary: white,
      tertiary: white,
      quaternary: white,
      fifth: mantis,
      dangerous: white,
      sixth: white,
      seventh: yellowSea,
      eighth: lightDarkBlue,
      ninth: white,
      tenth: atlantis,
      eleventh: white,
      twelfth: colors.gray2,
    },
  },
  bg: {
    primary: {
      color: nightRider,
      font: {
        primary: white,
        secondary: zircon,
        tertiary: nightRider,
      },
    },
    secondary: {
      color: colors.gray2,
      font: {
        primary: white,
        secondary: matterhorn,
        tertiary: whiteSmoke,
        quaternary: dodgerBlue,
      },
    },
    tertiary: {
      color: white,
      font: {
        primary: nightRider,
        secondary: dimGray,
        tertiary: colors.gray2,
        quaternary: yellowSea,
        fifth: nobelSecondary,
        sixth: dimGraySecondary,
        seventh: colors.gray1,
      },
    },
    quaternary: {
      color: mantis,
      font: {
        primary: white,
      },
    },
    fifth: {
      color: white,
      font: {
        primary: colors.gray2,
        secondary: zircon,
        tertiary: eclipse,
        fifth: nightRider,
      },
    },
    sixth: {
      color: nightRider,
      font: {
        primary: white,
      },
    },
    seventh: {
      font: {
        primary: nightRider,
        secondary: dimGray,
        tertiary: colors.gray2,
        fifth: yellowSea,
        sixth: dimGraySecondary,
        seventh: nobelSecondary,
      },
    },
    eighth: {
      color: orange,
      disabled: orangeDisabled,
      border: {
        color: darkOrange,
      },
    },
    ninth: {
      color: dimGraySecondary,
    },
    tenth: {
      color: errorBg,
      font: {
        color: venetianRed,
      },
    },
    eleventh: {
      color: cornFlowerBlue,
    },
    twelfth: {
      color: atlantis,
    },
    thirteenth: {
      color: gamboge,
    },
    fourteenth: {
      color: blueViolet,
    },
    fifteenth: {
      color: jordyBlue,
    },
    sixteenth: {
      color: atlantisOpacity,
    },
    dark: {
      color: black,
      font: {
        primary: white,
      },
    },
    yellow: {
      color: yellowSea,
      font: {
        primary: white,
      },
    },
  },

  border: {
    primary: cardBorder,
    secondary: yellowSea,
  },
  textColor: {
    charcoal: charcoal,
    grey: colors.gray2,
    darkgray: darkgray,
    mediumGray: mediumGray,
  },
}

export const phoneModel = DeviceInfo.getModel()

export const PADDING_HORIZONTAL = 15
export const PADDING_VERTICAL = 8
export const MARGIN_BOTTOM = 4
export const OFFSET_1X = 10
export const OFFSET_2X = 20
export const OFFSET_3X = 30
export const OFFSET_4X = 40
export const OFFSET_5X = 50
export const OFFSET_6X = 60
export const OFFSET_7X = 70
export const OFFSET_9X = 90
export const barStyleDark = 'dark-content'
export const barStyleLight = 'light-content'
export const SHADOW_RADIUS = 8
export const HAIRLINE_WIDTH = StyleSheet.hairlineWidth / 2

export const bubbleSize = {
  XS: 40,
  S: 60,
  M: 80,
  L: 100,
  XL: 120,
  XXL: 140,
}

export const PIN_CODE_BORDER_BOTTOM = 4
export const isSmallWidthDevice = isiPhone5
export const responsiveHorizontalPadding = isSmallWidthDevice
  ? 5
  : PADDING_HORIZONTAL
export const MEDIUM_DEVICE = 700
export const SHORT_DEVICE = 600
export const VERY_SHORT_DEVICE = 570
export const errorBoxVerifyPassphraseContainer = height > SHORT_DEVICE ? 60 : 90
export const dangerBannerHeight = height > SHORT_DEVICE ? 64 : 90
export const inputBoxVerifyPassphraseHeight =
  height > SHORT_DEVICE || Platform.OS === 'ios' ? 137 : 40
export const isBiggerThanMediumDevice = height > MEDIUM_DEVICE
export const isBiggerThanShortDevice = height > SHORT_DEVICE
export const isBiggerThanVeryShortDevice = height > VERY_SHORT_DEVICE
export const isIphoneX =
  Platform.OS === 'ios' &&
  phoneModel &&
  (phoneModel.toLowerCase() === 'iphone x' ||
    phoneModel.toLowerCase() === 'iphone xs')
export const isIphoneXR =
  Platform.OS === 'ios' &&
  phoneModel &&
  (phoneModel.toLowerCase() === 'iphone xr' ||
    phoneModel.toLowerCase() === 'iphone xs max')
export const deviceHeight = height

export const verticalBreakpoint = {
  extraSmall: height <= 550,
  small: height <= VERY_SHORT_DEVICE,
  medium: height < MEDIUM_DEVICE && height > VERY_SHORT_DEVICE,
  large: height >= MEDIUM_DEVICE,
}
