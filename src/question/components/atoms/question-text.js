// @flow
import React from 'react'
import QuestionScreenText from './question-screen-text'

const QuestionText = (props: { text: ?string, questionStyles: any }) => {
  if (!props.text) {
    return null
  }

  return (
    <QuestionScreenText
      bold={false}
      size="h5"
      style={[props.questionStyles.questionText]}
    >
      {props.text}
    </QuestionScreenText>
  )
}

export default QuestionText
