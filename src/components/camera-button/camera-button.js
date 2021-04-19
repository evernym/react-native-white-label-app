// @flow
import React from 'react'
import { TouchableOpacity, StyleSheet, Text, Platform } from 'react-native'
import { useDispatch } from 'react-redux' 

import { colors, fontFamily } from '../../common/styles/constant'
import { moderateScale } from 'react-native-size-matters'

import { EvaIcon, CAMERA_ICON } from '../../common/icons'

import type { CameraButtonProps } from './type-camera-button'

import { SCAN_QR_BUTTON } from '../../feedback/log-to-apptentive/'

export const CameraButton = (props: CameraButtonProps) => {
  const dispatch = useDispatch()

  const onPress = () => {
    props.onPress()
    dispatch(SCAN_QR_BUTTON)
  }

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
      <EvaIcon name={CAMERA_ICON} />
      <Text style={styles.text}>Scan</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: moderateScale(42, 3),
    height: moderateScale(42, 3),
    borderRadius: moderateScale(42, 3) / 2,
    backgroundColor: colors.white,
    position: 'absolute',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: Platform.OS === 'android' ? 8 : 0,
    zIndex: 1000,
    bottom: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fontFamily,
    fontSize: moderateScale(9, 0.1),
    color: colors.gray2,
  },
})
