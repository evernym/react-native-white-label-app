// @flow
import React from 'react'
import { StyleSheet, TouchableOpacity, Text } from 'react-native'
import { colors, fontFamily, fontSizes } from '../../common/styles'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import SvgCustomIcon from '../svg-custom-icon'
import { EvaIcon } from '../../common/icons'

type ButtonProps = {
  onPress: () => any,
  label: string,
  buttonStyle?: any,
  labelStyle?: any,
  disabled?: boolean,
  testID?: string,
  svgIcon?: string,
  evaIcon?: string,
}

export const Button = ({
                         onPress,
                         label,
                         svgIcon,
                         evaIcon,
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
      {svgIcon && <SvgCustomIcon style={styles.icon} name={svgIcon}/>}
      {evaIcon && <EvaIcon style={styles.icon} name={evaIcon}/>}
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
