// @flow
import React from 'react'
import { Icon } from 'react-native-eva-icons'
import { colors } from './styles/constant'
import { moderateScale } from 'react-native-size-matters'

type IconProps = {
  width?: number,
  height?: number,
  color?: string,
}

type CommonIconProps = {
  name: string,
} & IconProps

export const HOME_ICON = 'home-outline'
export const CONNECTIONS_ICON = 'people-outline'
export const SETTINGS_ICON = 'settings-2-outline'

export const CAMERA_ICON = 'camera-outline'
export const CHECK_MARK_ICON = 'checkmark-circle-2-outline'
export const HOME_MENU_ICON = 'menu-outline'
export const ANDROID_BACK_ARROW_ICON = 'arrow-back-outline'
export const IOS_BACK_ARROW_ICON = 'arrow-ios-back-outline'
export const MORE_ICON = 'more-vertical-outline'
export const DELETE_ICON = 'trash-2-outline'
export const CLOSE_ICON = 'close-outline'
export const CHAT_ICON = 'message-square-outline'
export const INFO_ICON = 'info-outline'
export const ARROW_RIGHT_ICON = 'chevron-right-outline'
export const LOCK_ICON = 'lock'
export const SAVE_ICON = 'save-outline'
export const ALERT_ICON = 'alert-circle-outline'
export const ARROW_FORWARD_ICON = 'arrow-ios-forward-outline'
export const CHECKMARK_ICON = 'checkmark-outline'
export const SHARE_ICON = 'share-outline'
export const GRID_ICON = 'grid-outline'

// common icon class is implemented to set default values (except name) for icons
// in that case we should only set icon name and get an icon with default color and size
export const EvaIcon = (props: CommonIconProps) => {
  const { width, height, color } = props

  return (
    <Icon
      {...props}
      width={width ? width : moderateScale(24)}
      height={height ? height : moderateScale(24)}
      fill={color ? color : colors.gray2}
    />
  )
}
