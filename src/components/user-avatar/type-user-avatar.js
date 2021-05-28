// @flow
import * as React from 'react'
import type { ImageSource } from '../../common/type-common'

export type UserAvatarProps = {
  userCanChange?: boolean,
  selectUserAvatar: () => void,
  avatarName?: ?ImageSource,
  testID?: string,
  children?: (
    avatarSource: ImageSource | number | string,
    props?: any
  ) => React.Element<*>,
  size?: string,
  round?: boolean,
  imageStyle?: any,
}
