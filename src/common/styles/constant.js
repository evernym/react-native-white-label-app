// @flow
import DeviceInfo from 'react-native-device-info'
import { StyleSheet } from 'react-native'
import { Dimensions, Platform } from 'react-native'

// Colors
// $FlowExpectedError[cannot-resolve-module] external file
export { colors } from '../../../../../../app/evernym-sdk/colors'

// Fonts
export const fontFamily = 'Lato'
export const fontSizes = {
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

// >>> We should not use the code below this comment for sizes, colors and other constants.
// >>> The code beow this comment should be removed after we remove CustomText, CustomView,
// >>> etc. because only those still depend on these constants.

const { width, height } = Dimensions.get('screen')
export const isiPhone5 = width >= 320 && width < 375

const zircon = '#ebebea'
export const nightRider = '#333333'
export const grey = '#777777'
export const matterhornSecondary = '#505050'
export const charcoal = '#464646'
export const whiteSmoke = '#f0f0f0'
export const whiteSmokeSecondary = '#f7f7f7'
export const whiteSmokeRGBA = 'rgba(240, 240, 240, 0)'
export const mantis = '#85bf43'
export const greyRGB = '119, 119, 119'
export const white = '#ffffff'
export const whisper = '#EAEAEA'
export const cardBorder = '#f2f2f2'
export const grey4 = whisper
export const lightDarkBlue = '#4A8FE3'
export const darkGray = '#505050'
export const maroonRed = '#d1021b'
export const lightDarkGray = '#F4F4F4'
export const dodgerBlue = '#0d8ffc'
export const toryBlue = '#303F9F'
export const gainsBoro = '#E3E3E3'
export const mediumGray = '#a5a5a5'
export const caribbeanGreen = '#01C8A1'
export const darkGray2 = '#A5A5A5'
const eclipse = '#3f3f3f'
const matterhorn = '#535353'
export const dimGray = '#686868'
const dimGraySecondary = '#6D6D6D'
export const lightGray = '#D8D8D8'
const nobelSecondary = '#9B9B9B'
export const venetianRed = '#d0021b'
export const veniceBlue = '#2A5270'
export const hitSlop = { top: 15, bottom: 15, left: 15, right: 15 }
export const iPhoneXHeight = 812

export const primaryGreen = '#86B93B'
export const black = '#000000'
export const yellowSea = '#EB9B2D'
export const cornFlowerBlue = '#4A90E2'
export const atlantis = '#86B93B'
export const atlantisOpacity = 'rgba(134, 185, 59, 0.15)'
const gamboge = '#DD9012'
const blueViolet = '#8D13FE'
const seaBuckthorn = '#f79347'
const pumpkin = '#F68127'
const olivine = '#97C85F'
export const buttonGreen = '#008000'
export const orange = 'rgba(237, 156, 46, 1)'
const orangeDisabled = 'rgba(237, 156, 46, 0.5)'
export const darkOrange = 'rgba(207, 127, 20, 1)'
const errorBg = 'rgba(255, 214, 219, 1)'
const darkgray = '#4A4A4A'
const jordyBlue = '#79ade7'
const palePink = '#FFD5DB'
export const whiteTransparent = 'rgba(255, 255, 255, 0.85)'
export const whiteSolid = 'rgba(255, 255, 255, 255)'
export const grey5 = '#F2F2F2'
export const lightWhite = '#E5E5EA'
export const blackTransparent = `rgba(0, 0, 0, 0.8)`
export const grey1 = '#505050'
export const grey2 = grey
export const red = '#CE0B24'

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
    sixth: grey,
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
      twelfth: grey2,
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
      color: grey,
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
        tertiary: grey,
        quaternary: yellowSea,
        fifth: nobelSecondary,
        sixth: dimGraySecondary,
        seventh: grey1,
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
        primary: grey,
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
      color: whiteSmoke,
      font: {
        primary: nightRider,
        secondary: dimGray,
        tertiary: grey,
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
  },

  border: {
    primary: cardBorder,
    secondary: yellowSea,
  },
  textColor: {
    charcoal: charcoal,
    grey: grey,
    darkgray: darkgray,
    mediumGray: mediumGray,
  },
  palePink,
}

export const font = {
  size: {
    XXXXXS: 8,
    XXXXS: 9,
    XXXS: 10,
    XXS: 11,
    XS: 12,
    XS1: 13,
    S: 15,
    M: 17,
    M1: 18,
    ML: 19,
    ML1: 23,
    ML2: 26,
    L1: 34,
    L: 40,
    PREFIX: 14,
  },
  family: 'Lato',
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
