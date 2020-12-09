// @flow

import React, { useCallback } from 'react'
import { TouchableOpacity, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { moderateScale } from 'react-native-size-matters'
import {
  EvaIcon,
  ANDROID_BACK_ARROW_ICON,
  IOS_BACK_ARROW_ICON,
} from '../../common/icons'
import { lockSelectionRoute } from '../../common/route-constants'
import { CommonActions } from '@react-navigation/native'

export const BackButton = ({ backReset }: { backReset?: boolean }) => {
  const navigation = useNavigation()
  const onPress = useCallback(() => {
    backReset
      ? navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: lockSelectionRoute }],
          })
        )
      : navigation.goBack()
  }, [])
  const iOS = Platform.OS === 'ios'
  return (
    <TouchableOpacity
      testID="back-button-component"
      onPress={onPress}
      hitSlop={hitSlop}
    >
      <EvaIcon
        name={iOS ? IOS_BACK_ARROW_ICON : ANDROID_BACK_ARROW_ICON}
        width={moderateScale(32)}
        height={moderateScale(32)}
      />
    </TouchableOpacity>
  )
}

const hitSlop = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20,
}
