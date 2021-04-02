// @flow
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  homeRoute,
  lockPinSetupRoute,
  lockSelectionRoute,
  lockSetupSuccessRoute,
} from '../common'
import type { ReactNavigation } from '../common/type-common'
import { Container, CustomText, PinCodeBox, CustomView } from '../components'
import { setPinAction } from './lock-store'
import { PIN_SETUP_STATE } from './type-lock'
import { Keyboard, StyleSheet, Platform, View } from 'react-native'
import { colors, OFFSET_2X, fontFamily } from '../common/styles'
import { moderateScale, scale, verticalScale } from 'react-native-size-matters'
import { Header } from '../components'
import { useFocusEffect } from '@react-navigation/native'
import { headerNavigationOptions } from '../navigation/navigation-header-config'
import { LockHeader } from '../external-imports'
import { getIsInRecovery } from '../store/store-selector'

let keyboardDidHideListener
let keyboardDidShowListener

const defaults = {
  pinSetupState: PIN_SETUP_STATE.INITIAL,
  failedPin: false,
  enteredPin: null,
  confirmedPin: null,
  keyboardHidden: false,
  showCustomKeyboard: false,
}

export function LockPinSetup(props: ReactNavigation) {
  const { navigation, route } = props
  const dispatch = useDispatch()
  const [pinSetupState, setPinSetupState] = useState(defaults.pinSetupState)
  const [failedPin, setFailedPin] = useState(defaults.failedPin)
  const [enteredPin, setEnteredPin] = useState(defaults.enteredPin)
  const [confirmedPin, setConfirmedPin] = useState(defaults.confirmedPin)
  const [keyboardHidden, setKeyboardHidden] = useState(defaults.keyboardHidden)
  const [showCustomKeyboard, setShowCustomKeyboard] = useState(
    defaults.showCustomKeyboard
  )
  const inRecovery = useSelector(getIsInRecovery)
  const pinCodeBox = useRef<any>()

  useFocusEffect(
    React.useCallback(() => {
      setPinSetupState(defaults.pinSetupState)
      setFailedPin(defaults.failedPin)
      setEnteredPin(defaults.enteredPin)
      setConfirmedPin(defaults.confirmedPin)
      setKeyboardHidden(defaults.keyboardHidden)
      setShowCustomKeyboard(defaults.showCustomKeyboard)
      pinCodeBox.current.clear()
      pinCodeBox.current.showKeyboard()
    }, [])
  )

  const existingPin = route && route.params && route.params.existingPin === true
  const enterPasscodeText = existingPin
    ? 'Create new passcode'
    : 'Set a passcode to secure this app'
  const handleKeyboardChange = useCallback((status, event) => {
    if (keyboardHidden !== status) {
      setKeyboardHidden(status)
      setShowCustomKeyboard(false)
      return
    }
    const shouldShowCustomKeyboard =
      status === false &&
      event &&
      event.endCoordinates.height < 100 &&
      !keyboardHidden &&
      Platform.OS === 'ios'

    setShowCustomKeyboard(shouldShowCustomKeyboard)
  })

  const handlePinComplete = useCallback((pin: string) => {
    if (!enteredPin) {
      setEnteredPin(pin)
      setPinSetupState(PIN_SETUP_STATE.REENTER)
      setFailedPin(false)
      pinCodeBox.current.clear()
      return
    }
    if (enteredPin !== pin) {
      // handle error state
      setEnteredPin(null)
      setPinSetupState(PIN_SETUP_STATE.REENTER_FAIL)
      setFailedPin(true)
      setTimeout(() => {
        setFailedPin(false)
      }, 2000)
      pinCodeBox.current.clear()
      setTimeout(() => setPinSetupState(PIN_SETUP_STATE.INITIAL), 1000)
      return
    }
    pinCodeBox.current.hideKeyboard()
    setConfirmedPin(pin)
    setPinSetupState(PIN_SETUP_STATE.REENTER_SUCCESS)
    setFailedPin(false)
  })

  useEffect(() => {
    keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      handleKeyboardChange(true)
    })
    keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        handleKeyboardChange(false, event)
      }
    )
    return () => {
      keyboardDidShowListener && keyboardDidShowListener.remove()
      keyboardDidHideListener && keyboardDidHideListener.remove()
    }
  }, [])

  useEffect(() => {
    if (
      keyboardHidden &&
      pinSetupState === PIN_SETUP_STATE.REENTER_SUCCESS &&
      navigation.isFocused()
    ) {
      dispatch(setPinAction(confirmedPin || ''))
      if (existingPin) {
        navigation.navigate(lockSetupSuccessRoute, {
          changePin: true,
        })
      } else if (inRecovery === 'true') {
        navigation.navigate(homeRoute)
      } else {
        navigation.navigate(lockSelectionRoute)
      }
    }
  }, [keyboardHidden, pinSetupState])

  return (
    <Container tertiary>
      <Header
        navigation={props.navigation}
        route={props.route}
        transparent={true}
      />
      <CustomView center>{LockHeader ? <LockHeader /> : <View />}</CustomView>
      <CustomText center h4 bg="tertiary" style={[styles.title]} tertiary thick>
        {`${enteredPin ? 'Re-enter passcode' : enterPasscodeText}`}
      </CustomText>
      <CustomText center bg="tertiary" tertiary style={[styles.message]}>
        {failedPin && 'Your passcodes do not match'}
      </CustomText>
      <CustomView center>
        <PinCodeBox
          ref={pinCodeBox}
          onPinComplete={handlePinComplete}
          enableCustomKeyboard={showCustomKeyboard}
        />
      </CustomView>
    </Container>
  )
}

const styles = StyleSheet.create({
  title: {
    fontFamily,
    fontSize: moderateScale(26, 0.1),
    fontStyle: 'normal',
    lineHeight: moderateScale(31, 0.1),
    height: verticalScale(80),
    marginTop: verticalScale(40),
    marginBottom: verticalScale(40),
    paddingHorizontal: OFFSET_2X,
    textAlign: 'center',
    fontWeight: '700',
  },
  message: {
    height: scale(20),
    marginBottom: scale(12),
    fontFamily,
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: moderateScale(17, 0.1),
    lineHeight: moderateScale(20, 0.1),
    justifyContent: 'center',
    color: colors.red,
  },
})

export const lockPinSetupScreen = {
  routeName: lockPinSetupRoute,
  screen: LockPinSetup,
  options: {
    ...headerNavigationOptions({
      title: 'App Security',
      backReset: true,
    }),
  },
}
