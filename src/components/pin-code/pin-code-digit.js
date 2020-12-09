// @flow
import React, { PureComponent } from 'react'
import { StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { CustomView } from '../../components/layout/custom-view'
import { color, OFFSET_1X } from '../../common/styles'
import type { PinCodeDigitProps } from './type-pin-code-box'

export default class PinCodeDigit extends PureComponent<
  PinCodeDigitProps,
  void
> {
  render() {
    const { entered, testID = undefined, onPress } = this.props
    const style = entered ? styles.entered : null

    return (
      <CustomView
        onPress={onPress}
        center
        style={[styles.digit, style]}
        testID={testID}
      >
        <Icon
          size={styles.icon.height}
          name="brightness-1"
          color={entered ? styles.icon.color : '#EAEAEA'}
        />
      </CustomView>
    )
  }
}

const iconDimension = 26

const styles = StyleSheet.create({
  digit: {
    marginHorizontal: OFFSET_1X / 2,
    height: 66,
    width: 38,
  },
  entered: {
    borderBottomColor: color.bg.tertiary.font.tertiary,
  },
  icon: {
    height: iconDimension,
    width: iconDimension,
    color: color.bg.tertiary.font.tertiary,
  },
})
