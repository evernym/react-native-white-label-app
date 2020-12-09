// @flow
import React from 'react'

import { CustomView } from '../../../components/layout'
import QuestionScreenText from './question-screen-text'

const QuestionTitle = (props: { title: string, questionStyles: any }) => {
  const maxLength = 500
  let title =
    props.title.length < maxLength
      ? props.title
      : `${props.title.substring(0, maxLength)}...`
  return (
    <CustomView style={props.questionStyles.questionTitle}>
      <QuestionScreenText size="h3b">{title}</QuestionScreenText>
    </CustomView>
  )
}
export default QuestionTitle
