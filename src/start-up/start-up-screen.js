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
} from 'react-native'
import { startUpRoute, lockPinSetupRoute } from '../common'
import { OFFSET_2X, colors, fontFamily, fontSizes } from '../common/styles'
import { verticalScale, moderateScale } from 'react-native-size-matters'

import {
    startupBackgroundImage,
    CustomStartUpScreen,
} from '../external-imports'

const { width } = Dimensions.get('screen')

const defaultBackground = require('../images/home_background.png')
const powerByLogo = require('../images/powered_by_logo.png')

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

    const renderButton = useCallback(
        () => ( <
            TouchableOpacity style = { style.button }
            onPress = { handlePress } >
            <
            CustomText h4 transparentBg thick >
            Set Up <
            /CustomText> <
            /TouchableOpacity>
        ), [handlePress]
    )

    const renderCustomStartUpScreen = useCallback(
        () => ( <
            View style = { style.container } >
            <
            ImageBackground source = { startupBackgroundImage }
            style = { style.background }
            resizeMode = "cover" >
            <
            Animated.View style = {
                {
                    ...style.wrapper,
                        transform: [{ translateX: animation }],
                }
            } >
            { renderButton() } <
            /Animated.View> <
            /ImageBackground> <
            /View>
        ), [startupBackgroundImage]
    )

    const renderDefaultStartUpScreen = useCallback(
        () => ( <
            View style = { style.container } >
            <
            ImageBackground source = { defaultBackground }
            style = { style.background }
            resizeMode = "contain" >
            <
            Animated.View style = {
                {
                    ...style.wrapper,
                        transform: [{ translateX: animation }],
                }
            } >
            <
            Text style = { style.infoText } > You splash screen goes here < /Text> { renderButton() } <
            Image source = { powerByLogo }
            style = { style.image }
            /> <
            /Animated.View> <
            /ImageBackground> <
            /View>
        ), [startupBackgroundImage]
    )

    return startupBackgroundImage ?
        renderCustomStartUpScreen() :
        renderDefaultStartUpScreen()
}

const screen = CustomStartUpScreen || StartUpScreen

export const startUpScreen = {
    routeName: startUpRoute,
    screen,
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