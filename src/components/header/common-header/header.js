// @flow
import React from 'react'
import { View, TouchableOpacity, Text, Platform } from 'react-native'

import type { HeaderProps } from '../type-header'
import { styles } from '../type-header'

import {
  EvaIcon,
  ANDROID_BACK_ARROW_ICON,
  IOS_BACK_ARROW_ICON,
} from '../../../common/icons'
import { moderateScale } from 'react-native-size-matters'

export const Header = (props: HeaderProps) => {
  const iOS = Platform.OS === 'ios'
  const {
    transparent,
    hideBackButton,
    headline,
    additionalActionOnBackPress,
  } = props

  const onPress = () => {
    goBack(props)
    additionalActionOnBackPress && additionalActionOnBackPress()
  }

  return (
    <View style={transparent ? styles.containerTransparent : styles.container}>
      <View
        accessible={true}
        accessibilityLabel="left-icon"
        style={styles.iconSection}
      >
        {!hideBackButton && (
          <TouchableOpacity testID="left-icon" onPress={onPress}>
            <EvaIcon
              name={iOS ? IOS_BACK_ARROW_ICON : ANDROID_BACK_ARROW_ICON}
              width={moderateScale(32)}
              height={moderateScale(32)}
              style={styles.menuIcon}
              {...(props.color ? { color: props.color } : {})}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.labelSection}>
        <Text style={styles.label}>{headline}</Text>
      </View>
    </View>
  )
}

const goBack = (props: any) => {
  const { navigation } = props
  const backRedirectRoute = props.route && props.route.params?.backRedirectRoute
  if (backRedirectRoute) {
    navigation.navigate(backRedirectRoute)
  } else {
    navigation.goBack(null)
  }
}
