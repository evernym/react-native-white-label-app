// @flow
import React from 'react'

import { color } from '../../../common/styles'
import { CustomText } from '../../../components'

const QuestionScreenText = (props: any) => {
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

export default QuestionScreenText
