// @flow
import React, { useEffect, useRef, useCallback } from 'react'
import { Container, CustomText } from '../components'
import {
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters'
import { headerOptionsWithNoBack } from '../navigation/navigation-header-config'
import { startUpRoute, lockPinSetupRoute } from '../common'
import { OFFSET_2X, colors } from '../common/styles'

// $FlowExpectedError[cannot-resolve-module] external file
import { BACKGROUND_IMAGE } from '../../../../../app/evernym-sdk/startup'

const { width } = Dimensions.get('screen')

const image = BACKGROUND_IMAGE || require('../images/setup_background.png')

function StartUpScreen(props: { navigation: Function }) {
  const { navigation } = props
  const animation = useRef(new Animated.Value(width * 2)).current
  const handlePress = useCallback(() => {
    navigation.navigate(lockPinSetupRoute)
  })

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [animation])

  return (
    <Container tertiary>
      <ImageBackground source={image} style={style.backgroundImage}>
        <Animated.View
          style={{
            ...style.buttonWrapper,
            transform: [{ translateX: animation }],
          }}
        >
          <TouchableOpacity style={style.button} onPress={handlePress}>
            <CustomText h4 transparentBg thick>
              Set Up
            </CustomText>
          </TouchableOpacity>
          {
            !BACKGROUND_IMAGE &&
            <Image
              source={require('../images/powered_by_logo.png')}
              style={style.image}
              resizeMode="contain"
            />
          }
        </Animated.View>
      </ImageBackground>
    </Container>
  )
}

export const startUpScreen = {
  routeName: startUpRoute,
  screen: StartUpScreen,
  options: headerOptionsWithNoBack({
    title: '',
    headerShown: false,
  }),
}

const style = StyleSheet.create({
  startUpContainer: {
    paddingTop: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonWrapper: {
    alignSelf: 'flex-end',
    position: 'relative',
  },
  button: {
    padding: moderateScale(17),
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.main,
    width: width - OFFSET_2X * 2,
    alignSelf: 'flex-end',
    marginBottom: 100,
    borderRadius: 5,
  },
  image: {
    position: 'absolute',
    bottom: moderateScale(32),
    right: moderateScale(0),
  },
})
