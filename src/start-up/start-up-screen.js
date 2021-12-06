// @flow
import React, { useEffect, useRef, useCallback } from 'react'
import { CustomText } from '../components'
import {
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Animated,
  Image,
  Text,
  View,
  Alert,
  Platform,
  NativeModules,
} from 'react-native'
import useSagaReducer from 'use-saga-reducer'
import { verticalScale, moderateScale } from 'react-native-size-matters'

import type { DeviceCheckState } from './device-check-saga'

import { startUpRoute, lockPinSetupRoute } from '../common'
import { OFFSET_2X, colors, fontFamily, fontSizes } from '../common/styles'
import {
  checkDeviceSecuritySaga,
  deviceCheckReducer,
  DEVICE_SECURITY_OK,
  START_DEVICE_SECURITY_CHECK,
  DEVICE_SECURITY_CHECK_IN_PROGRESS,
  DEVICE_SECURITY_CHECK_FAILED,
  PLAY_SERVICE_NOT_AVAILABLE,
  PLAY_SERVICE_NEED_UPDATE,
} from './device-check-saga'
import {
  startupBackgroundImage,
  CustomStartUpScreen,
  deviceSecurityCheckFailedMessage,
  devicePlayServiceRequiredMessage,
  devicePlayServiceUpdateRequiredMessage,
} from '../external-imports'

const { width } = Dimensions.get('screen')

const defaultBackground = require('../images/home_background.png')
const powerByLogo = require('../images/powered_by_logo.png')

function StartUpScreen(props: { navigation: Function }) {
  const { navigation } = props
  const [state, dispatch] = useSagaReducer(
    checkDeviceSecuritySaga,
    deviceCheckReducer
  )
  const animation = useRef(new Animated.Value(width * 2)).current
  const handlePress = useCallback(() => {
    dispatch({ type: START_DEVICE_SECURITY_CHECK })
  })

  useEffect(() => {
    if (state === DEVICE_SECURITY_OK) {
      navigation.navigate(lockPinSetupRoute)
    }
    if (state === DEVICE_SECURITY_CHECK_FAILED) {
      Alert.alert('Device not secure', deviceSecurityCheckFailedMessage)
    }

    if (state === PLAY_SERVICE_NEED_UPDATE) {
      Alert.alert(
        'Play Service Update Required',
        devicePlayServiceUpdateRequiredMessage,
        [
          {
            text: 'Update',
            onPress: async () => {
              if (Platform.OS === 'android') {
                await NativeModules.RNUtils.goToGooglePlayServicesMarketLink()
              }
            },
          },
        ]
      )
    }

    if (state === PLAY_SERVICE_NOT_AVAILABLE) {
      Alert.alert('Play Service  Required', devicePlayServiceRequiredMessage, [
        {
          text: 'Settings',
          onPress: async () => {
            if (Platform.OS === 'android') {
              await NativeModules.RNUtils.goToGooglePlayServicesSetting()
            }
          },
        },
      ])
    }
  }, [state])

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [animation])

  const renderButton = () => (
    <TouchableOpacity style={style.button} onPress={handlePress}>
      <CustomText h4 transparentBg thick>
        {getSetupButtonText(state)}
      </CustomText>
    </TouchableOpacity>
  )

  const renderCustomStartUpScreen = useCallback(
    () => (
      <View style={style.container}>
        <ImageBackground
          source={startupBackgroundImage}
          style={style.background}
          resizeMode="cover"
        >
          <Animated.View
            style={{
              ...style.wrapper,
              transform: [{ translateX: animation }],
            }}
          >
            {renderButton()}
          </Animated.View>
        </ImageBackground>
      </View>
    ),
    [startupBackgroundImage, state]
  )

  const renderDefaultStartUpScreen = useCallback(
    () => (
      <View style={style.container}>
        <ImageBackground
          source={defaultBackground}
          style={style.background}
          resizeMode="contain"
        >
          <Animated.View
            style={{
              ...style.wrapper,
              transform: [{ translateX: animation }],
            }}
          >
            <Text style={style.infoText}>You splash screen goes here</Text>
            {renderButton()}
            <Image source={powerByLogo} style={style.image} />
          </Animated.View>
        </ImageBackground>
      </View>
    ),
    [startupBackgroundImage, state]
  )

  return startupBackgroundImage
    ? renderCustomStartUpScreen()
    : renderDefaultStartUpScreen()
}

const screen = CustomStartUpScreen || StartUpScreen

export const startUpScreen = {
  routeName: startUpRoute,
  screen,
}

function getSetupButtonText(state: DeviceCheckState) {
  switch (state) {
    case DEVICE_SECURITY_CHECK_IN_PROGRESS:
      return 'Verifying device security...'
    default:
      return 'Set Up'
  }
}

const style = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    justifyContent: 'center',
    flexDirection: 'row',
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
  },
  button: {
    padding: moderateScale(17),
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.main,
    width: width - OFFSET_2X * 2,
    alignSelf: 'center',
    marginBottom: 100,
    borderRadius: 5,
  },
  image: {
    position: 'absolute',
    bottom: moderateScale(32),
    right: moderateScale(10),
  },
  infoText: {
    textAlign: 'center',
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size0),
    fontWeight: '700',
    color: colors.gray3,
    marginHorizontal: moderateScale(36),
    marginBottom: verticalScale(100),
  },
})
