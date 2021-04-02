// @flow
import React from 'react'
import { StyleSheet, TouchableOpacity, Text } from 'react-native'
import { colors, fontFamily, fontSizes } from '../../common/styles'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import SvgCustomIcon from '../svg-custom-icon'

type ButtonProps = {
  onPress: () => any,
  label: string,
  svgIcon?: string,
  buttonStyle?: any,
  labelStyle?: any,
  disabled?: boolean,
  testID?: string,
}

export const Button = ({
  onPress,
  label,
  svgIcon,
  buttonStyle,
  labelStyle,
  disabled,
  testID,
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={buttonStyle || styles.button}
      testID={testID}
    >
      <Text style={labelStyle || styles.label}>{label}</Text>
      {svgIcon && <SvgCustomIcon style={styles.icon} name={svgIcon} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '94%',
    marginLeft: '3%',
    borderRadius: 5,
    padding: moderateScale(17),
    paddingHorizontal: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '35%',
    backgroundColor: colors.main,
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '700',
    color: colors.white,
    fontFamily: fontFamily,
  },
  icon: {
    position: 'absolute',
    right: 10,
  },
})
