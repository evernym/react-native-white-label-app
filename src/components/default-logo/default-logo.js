// @flow
import React, { PureComponent } from 'react'
import { Text, View } from 'react-native'
import type { DefaultLogoProps } from './type-default-logo'
import { fontFamily, colors } from '../../common/styles'

export class DefaultLogo extends PureComponent<DefaultLogoProps, void> {
  render() {
    const { text, size, fontSize, shadow } = this.props

    const customStyles = {
      container: {
        ...styles.defaultContainer,
        width: size,
        height: size,
        borderRadius: size / 2,
        ...(shadow ? styles.shadow : {}),
      },
      text: {
        ...styles.defaultText,
        fontSize: fontSize,
      },
    }

    return (
      <View style={customStyles.container}>
        <Text
          style={customStyles.text}
          testID={'default-logo'}
          accessible={true}
          accessibilityLabel={'default-logo'}
        >
          {text ? text[0].toUpperCase() : ''}
        </Text>
      </View>
    )
  }
}

const styles = {
  defaultContainer: {
    backgroundColor: colors.gray2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    elevation: 3,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  defaultText: {
    fontFamily: fontFamily,
    fontWeight: 'bold',
    color: colors.white,
  },
}
