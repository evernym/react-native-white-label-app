// @flow

import React from 'react'

import type { GenericObject } from '../../../common/type-common'

import CustomText from '../../text'
import { colors } from '../../../common/styles'

export function BottomUpSliderText(props: GenericObject) {
  return (
    <CustomText
      bg={false}
      bold
      {...props}
      style={[{ color: colors.cmOrange }, ...(props.style || [])]}
    >
      {props.children}
    </CustomText>
  )
}
