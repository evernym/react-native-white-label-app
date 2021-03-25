// @flow
import React from 'react'

// styles
import { CustomText } from '../../components'
import { color } from '../../common/styles'

export const ActionText = (props: any) => {
  return (
    <CustomText
      bg={false}
      bold
      {...props}
      style={[
        { color: props.color || color.bg.tertiary.font.seventh },
        ...(props.style || []),
      ]}
    >
      {props.children}
    </CustomText>
  )
}
