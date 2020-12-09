// @flow
import React from 'react'
import RadioForm, {
  RadioButton,
  RadioButtonInput,
  RadioButtonLabel,
} from 'react-native-simple-radio-button'
import { caribbeanGreen, cmGrey4 } from '../../../common/styles'
import type { QuestionResponse } from '../../type-question'

const QuestionResponses = (props: {
  responses: ?Array<QuestionResponse>,
  selectedResponse: ?QuestionResponse,
  onResponseSelect: (responseIndex: number) => void,
  questionStyles: any,
}) => {
  const { responses = [], selectedResponse, questionStyles } = props
  if (!responses || responses.length < 3) {
    return null
  }
  // as per our requirement, we need to show max 20 responses to user
  // our product team feels that we should limit the responses
  // a question can have
  const trimmedResponses = responses.slice(0, 20)

  return (
    <RadioForm animation={true}>
      {trimmedResponses.map((response, i) => {
        const radioData = { label: response.text, value: i }
        const isSelected =
          selectedResponse && selectedResponse.text === response.text

        return (
          <RadioButton
            labelHorizontal={true}
            key={i}
            style={questionStyles.questionRadioStyle}
          >
            <RadioButtonInput
              obj={radioData}
              index={i}
              isSelected={isSelected}
              onPress={props.onResponseSelect}
              buttonInnerColor={isSelected ? caribbeanGreen : cmGrey4}
              buttonOuterColor={cmGrey4}
              buttonSize={16}
              buttonOuterSize={24}
              buttonStyle={questionStyles.questionResponseRadio}
              buttonWrapStyle={questionStyles.questionResponseRadioWrapper}
            />
            <RadioButtonLabel
              obj={radioData}
              index={i}
              labelHorizontal={true}
              onPress={props.onResponseSelect}
              labelStyle={questionStyles.questionResponseRadioLabel}
              labelWrapStyle={questionStyles.questionResponseRadioLabelWrapper}
            />
          </RadioButton>
        )
      })}
    </RadioForm>
  )
}
export default QuestionResponses
