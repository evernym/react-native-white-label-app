// @flow
import React from 'react'

import { CustomView } from '../../../components/layout'
import QuestionText from './question-text'
import QuestionTitle from './question-title'
import QuestionResponses from './question-responses'
import type {
  QuestionResponse,
  QuestionStoreMessage,
} from '../../type-question'
import { QuestionExternalLinks } from '../question-external-links'

const QuestionDetails = (props: {
  question?: QuestionStoreMessage,
  selectedResponse: ?QuestionResponse,
  onResponseSelect: (responseIndex: number) => void,
  questionStyles: any,
}) => {
  const { question, selectedResponse, onResponseSelect, questionStyles } = props
  if (!question) {
    return null
  }
  return (
    <CustomView style={questionStyles.questionDetails}>
      <QuestionTitle
        title={question.payload.messageTitle}
        questionStyles={questionStyles}
      />
      <QuestionText
        text={question.payload.messageText}
        questionStyles={questionStyles}
      />
      <QuestionResponses
        responses={question.payload.valid_responses}
        selectedResponse={selectedResponse}
        onResponseSelect={onResponseSelect}
        questionStyles={questionStyles}
      />
      <QuestionExternalLinks externalLinks={question.payload.externalLinks} />
    </CustomView>
  )
}
export default QuestionDetails
