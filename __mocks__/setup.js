import React from 'react'
import * as ReactNative from 'react-native'
import fetch from './fetch-mock'
import mockModal from './modal-mock'
import mockView from './view-mock'

// mock Math.random for <Loader />
const mockMath = Object.create(global.Math)
mockMath.random = () => 0.1
global.Math = mockMath

global.fetch = fetch

jest.doMock('react-native', () => {
  // Extend ReactNative
  return Object.setPrototypeOf(
    {
      // ...ReactNative,
      Animated: {
        ...ReactNative.Animated,
      },

      StyleSheet: {
        ...ReactNative.StyleSheet,
      },

      LayoutAnimation: {
        ...ReactNative.LayoutAnimation,
        configureNext: jest.fn(),
      },

      Linking: {
        ...ReactNative.Linking,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        openURL: jest.fn(() => Promise.resolve()),
        canOpenURL: jest.fn(() => Promise.resolve()),
        getInitialURL: jest.fn(() => Promise.resolve()),
      },

      PixelRatio: {
        get: jest.fn(() => 3), //PixelRatio.get() === 3 then iPhone 6 plus
        roundToNearestPixel: jest.fn((num) => num),
      },

      // Mock a native module
      NativeModules: {
        ...ReactNative.NativeModules,
        BlobModule: {
          ...ReactNative.NativeModules.BlobModule,
          addNetworkingHandler: jest.fn(),
        },
        RNIndy: {
          // Add mock for RNIndy on NativeModules
          // we don't want to mock NativeModules the way we are doing for all above
          // because then we would have to mock everything else as well of NativeModules
          // a lot of other modules depend on it, so we are adding RNIndy
          // which is what we need to mock
          deserializeConnection: jest.fn((_) => Promise.resolve(1)),
          setWalletItem: jest.fn((_) => Promise.resolve(1)),
          deleteWalletItem: jest.fn((_) => Promise.resolve(1)),
          updateWalletItem: jest.fn((_) => Promise.resolve(1)),
          createWalletKey: jest.fn((_) => Promise.resolve('walletKey')),
          setVcxLogger: jest.fn((_) =>
            Promise.resolve('./connectme.rotating.93939939.log')
          ),
          writeToVcxLog: jest.fn(),
          encryptVcxLog: jest.fn(),
          exitAppAndroid: jest.fn(),
          updateMessages: jest.fn(),
        },
        RNCNetInfo: {
          getCurrentState: jest.fn(() => Promise.resolve()),
          addListener: jest.fn(),
          removeListeners: jest.fn(),
        },
      },
      Dimensions: {
        ...ReactNative.Dimensions,
        get: jest.fn(() => ({
          width: 320,
          height: 540,
        })),
      },
      UIManager: {
        ...ReactNative.UIManager,
        configureNextLayoutAnimation: jest.fn(),
        getViewManagerConfig: jest.fn(),
      },
      InteractionManager: {
        ...ReactNative.InteractionManager,
        runAfterInteractions(fn) {
          fn()
        },
        createInteractionHandle: jest.fn(),
        clearInteractionHandle: jest.fn(),
      },
      BackHandler: {
        ...ReactNative.BackHandler,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      Platform: {
        ...ReactNative.Platform,
      },

      Modal: mockModal,
      View: ReactNative.View,
      Text: ReactNative.Text,
      Image: ReactNative.Image,
      TextInput: ReactNative.TextInput,
    },
    ReactNative
  )
})

jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper')

jest.doMock('react-native-vector-icons/lib/icon-button', () => () => {
  const { View, Text } = require('react-native')
  const mockIcon = (props: any) => (
    <View {...props}>
      {props.children !== null ? props.children : <Text>Test children</Text>}
    </View>
  )
})

jest.mock('react-native-zip-archive', () => ({
  zip: jest.fn(() => Promise.resolve()),
  unzip: jest.fn(() => Promise.resolve()),
}))

jest.mock('@react-native-firebase/messaging', () => () => ({
  requestPermission: jest.fn(() => Promise.resolve(true)),
  onTokenRefresh: jest.fn(() => Promise.resolve('refreshed-token-value')),
  getToken: jest.fn(() => Promise.resolve('token-value')),
  hasPermission: jest.fn(() => Promise.resolve(true)),
  getInitialNotification: jest.fn(() => Promise.resolve()),
  onNotificationOpenedApp: jest.fn(() => Promise.resolve()),
}))

jest.mock('@react-native-community/push-notification-ios', () => ({
  removeAllDeliveredNotifications: jest.fn(),
}))

jest.mock('react-native-sensitive-info', () => {
  // todo: need to handle empty key-chain case
  const secureStorage = {
    ConnectMeKeyChain: {
      identifier: '26u37qFNUk3QwCUQ9ctest',
      phone: '6428900484',
      seed: 'S1StqtsAL4zkFZxmW57sL75zmufmVFQ3',
      pushComMethod: 'dehVox1KRqM:APA91bFWrJea1avml_ELw2MaH60abydtest',
    },
  }
  return {
    setItem: jest.fn((key, value, st) =>
      Promise.resolve((secureStorage['ConnectMeKeyChain'][key] = value))
    ),
    getItem: jest.fn((key) =>
      Promise.resolve(secureStorage['ConnectMeKeyChain'][key])
    ),
    deleteItem: jest.fn((key) =>
      Promise.resolve(delete secureStorage['ConnectMeKeyChain'][key])
    ),
  }
})

jest.mock('@react-native-community/async-storage')

jest.mock('@react-native-community/blur')

jest.mock('@babel/plugin-proposal-decorators')

jest.mock('react-native-modal', () => mockModal)

jest.mock('rn-fetch-blob', () => ({
  fetch: jest.fn((type, url) => Promise.resolve()),
  fs: {
    dirs: {
      DocumentDir: '/var/application/DocumentDir',
    },
    exists: jest.fn((path) => Promise.resolve(true)),
    unlink: jest.fn((path) => Promise.resolve(true)),
    cp: jest.fn((source, destination) => Promise.resolve(destination)),
  },
}))

jest.mock('react-native-webview')

jest.mock('moment', () =>
  jest.fn((date) => ({
    format(format) {
      if (format === 'MM/DD/YYYY') {
        return '01/10/2018'
      }

      if (format === 'MMMM YYYY') {
        return 'January 2018'
      }

      return '2018-01-10T04:32:43+05:30'
    },
    year(year: number) {
      return this
    },
  }))
)

jest.mock('react-native-share', () => {})

jest.mock('react-native-mail', () => {})

jest.mock('react-native-branch', () => {
  return {
    ADD_TO_CART_EVENT: 'Add to Cart',
    ADD_TO_WISHLIST_EVENT: 'Add to Wishlist',
    PURCHASE_INITIATED_EVENT: 'Purchase Started',
    PURCHASED_EVENT: 'Purchased',
    REGISTER_VIEW_EVENT: 'View',
    SHARE_COMPLETED_EVENT: 'Share Completed',
    SHARE_INITIATED_EVENT: 'Share Started',

    STANDARD_EVENT_ADD_TO_CART: 'ADD_TO_CART',
    STANDARD_EVENT_ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
    STANDARD_EVENT_VIEW_CART: 'VIEW_CART',
    STANDARD_EVENT_INITIATE_PURCHASE: 'INITIATE_PURCHASE',
    STANDARD_EVENT_ADD_PAYMENT_INFO: 'ADD_PAYMENT_INFO',
    STANDARD_EVENT_PURCHASE: 'PURCHASE',
    STANDARD_EVENT_SPEND_CREDITS: 'SPEND_CREDITS',

    STANDARD_EVENT_SEARCH: 'SEARCH',
    STANDARD_EVENT_VIEW_ITEM: 'VIEW_ITEM',
    STANDARD_EVENT_VIEW_ITEMS: 'VIEW_ITEMS',
    STANDARD_EVENT_RATE: 'RATE',
    STANDARD_EVENT_SHARE: 'SHARE',

    STANDARD_EVENT_COMPLETE_REGISTRATION: 'COMPLETE_REGISTRATION',
    STANDARD_EVENT_COMPLETE_TUTORIAL: 'COMPLETE_TUTORIAL',
    STANDARD_EVENT_ACHIEVE_LEVEL: 'ACHIEVE_LEVEL',
    STANDARD_EVENT_UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',

    // don't need any type checks for mocks, because they are not used
    // for type checking in code
    subscribe(cb) {},
  }
})

jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
}))

jest.mock('react-native-unique-id', () =>
  jest.fn(() => Promise.resolve('uniqueDeviceId'))
)

jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(() =>
    Promise.resolve({ path: '/var/application/DocumentDir/user-avatar.jpeg' })
  ),
}))

jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(),
}))

jest.mock('react-native-version-number', () => ({
  appVersion: '1.0',
  buildVersion: '500',
}))

jest.mock('apptentive-react-native', () => ({
  Apptentive: {
    register: () => Promise.resolve(null),
    presentMessageCenter: jest.fn(),
    onAuthenticationFailed: (reason) => null,
  },
  ApptentiveConfiguration: () => null,
}))

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View')

  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {
      END: 'END',
    },
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    /* Buttons */
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    /* Other */
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  }
})

jest.mock('react-native-snackbar', () => ({
  show: jest.fn(),
  LENGTH_LONG: 3,
}))

jest.mock('react-native-localize', () => ({
  getLocales: () => [{ countryCode: 'US' }],
}))

jest.mock('reactotron-react-native', () => ({
  configure: () => ({ useReactNative: () => ({ connect() {} }) }),
}))

jest.mock('react-native-document-picker', () => ({
  show: (config: Object, callback: (error: any, result: any) => void) => {
    callback(null, {
      fileName: 'test-file-name',
      fileSize: 1200,
      type: 'zip',
      uri: 'file:///document-directory',
    })
  },
}))

jest.mock('react-native-shake')

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}))

jest.mock('react-native-file-viewer', () => ({
  open: jest.fn((path, options) => Promise.resolve()),
}))

jest.mock('react-native-reanimated', () =>
  jest.requireActual('../node_modules/react-native-reanimated/mock')
)

jest.mock('react-native-redash/lib/module/v1', () => ({
  min: jest.fn(),
  mix: jest.fn(),
  snapPoint: jest.fn(),
  timing: jest.fn(),
  usePanGestureHandler: jest.fn(),
  useTransition: jest.fn(),
  useValue: jest.fn(),
}))
