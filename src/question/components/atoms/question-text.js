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
      testID={`question-description`}
      accessible={true}
      accessibilityLabel={`question-description`}
    >
      {props.text}
    </QuestionScreenText>
  )
}

export default QuestionText
