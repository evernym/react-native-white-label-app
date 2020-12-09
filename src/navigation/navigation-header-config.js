// @flow

import React from 'react'

import { BackButton } from '../components/back-button/back-button'
import {
  HeaderTitle,
  headerTitleStyle,
} from '../components/header-title/header-title'

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
