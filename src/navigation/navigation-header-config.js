// @flow

import React from 'react'
import { Text, TouchableOpacity, Platform } from 'react-native'
import { moderateScale } from 'react-native-size-matters'
import {
  EvaIcon,
  ANDROID_BACK_ARROW_ICON,
  IOS_BACK_ARROW_ICON,
} from '../common/icons'
import { BackButton } from '../components/back-button/back-button'
import {
  HeaderTitle,
  headerTitleStyle,
} from '../components/header-title/header-title'
import {
  SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_TITLE,
  styles,
} from '../components/header/type-header'
import { HeaderWithMenu } from '../components'
import type { ReactNavigation } from '../common/type-common'

// TODO: DA check if this code is still required after headers update
export const headerNavigationOptions = ({
  title,
  backReset,
  ...rest
}: {
  backReset?: boolean,
  title: string,
}) => {
  return {
    headerShown: title ? true : false,
    headerTitleAlign: 'center',
    headerCenter: () => {
      return <HeaderTitle {...{ title }} />
    },
    headerLeft: () => {
      return <BackButton {...{ backReset }} />
    },
    headerStyle: {
      borderBottomWidth: 0,
    },
    headerHideShadow: false,
    ...rest,
  }
}

// TODO: DA check if this code is still required after headers update
export const headerOptionsWithNoBack = ({
  title,
  headerShown = true,
}: {
  title: string,
  headerShown?: boolean,
}) => ({
  title,
  gestureEnabled: false,
  headerHideBackButton: true,
  headerTitleStyle: headerTitleStyle.title,
  headerHideShadow: true,
  headerShown,
})

export const headerOptionForDrawerStack = ({
  navigation: { navigation, route },
  headline,
}: {
  navigation: ReactNavigation,
  headline: string,
}) => ({
  header: () => (
    <HeaderWithMenu
      headline={headline}
      navigation={navigation}
      route={route}
      showUnreadMessagesBadge={SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_TITLE}
    />
  ),
  headerShown: true,
})

export const headerDefaultOptions = ({
  navigation: { navigation },
  headline,
  headerHideShadow,
  transparent,
  headerStyles = {},
  arrowColor = '',
}: {
  navigation: ReactNavigation,
  headline?: string,
  headerHideShadow: boolean,
  transparent: boolean,
  headerStyles?: any,
  arrowColor?: any,
}) => {
  return {
    headerStyle: transparent
      ? { ...styles.headerTransparent, ...headerStyles }
      : { headerStyles },
    headerCenter: () => (
      <Text
        style={{ ...styles.labelForOptions, marginRight: moderateScale(0) }}
      >
        {headline}
      </Text>
    ),
    headerLeft: () => (
      <TouchableOpacity testID="left-icon" onPress={() => navigation.goBack()}>
        <EvaIcon
          name={
            Platform.OS === 'ios'
              ? IOS_BACK_ARROW_ICON
              : ANDROID_BACK_ARROW_ICON
          }
          width={moderateScale(32)}
          height={moderateScale(32)}
          {...(arrowColor ? { color: arrowColor } : {})}
        />
      </TouchableOpacity>
    ),
    headerHideShadow,
    headerShown: true,
  }
}

export const emptyHeaderOptions = () => ({
  headerCenter: () => null,
  headerLeft: () => null,
  headerShown: true,
  headerHideShadow: true,
})
