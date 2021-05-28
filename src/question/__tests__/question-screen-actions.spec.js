// @flow

import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import merge from 'lodash.merge'

import type { GenericObject } from '../../common/type-common'
import type { QuestionResponse } from '../type-question'
import type { QuestionActionProps } from '../components/question-screen-actions'

import { QuestionActions } from '../components/question-screen-actions'
import {
  mockQuestionReceivedState,
  mockQuestionPayload,
  mockQuestionPayload2,
  mockQuestionPayload3,
} from '../../../__mocks__/data/question-store-mock-data'
import { QUESTION_STATUS } from '../type-question'
import { testID } from './question-screen.spec'

describe('<QuestionActions />', () => {
  describe('when one response is present', () => {
    it('render Ignore and response button', () => {
      const { component } = oneResponseSetup()
      expect(component.toJSON()).toMatchSnapshot()
    })

    it('should call onPress with response if response button is clicked ', () => {
      const { component, props } = oneResponseSetup()
      const response = props.question
        ? props.question.payload.valid_responses[0]
        : { text: 'No Question' }
      const responseButton = component.root.findByProps({
        title: response.text,
      })
      responseButton.props.onPress()
      expect(props.onSelectResponseAndSubmit).toHaveBeenCalledTimes(1)
      expect(props.onSelectResponseAndSubmit).toHaveBeenCalledWith(response)
    })

    it('match snapshot if in error status', () => {
      const { component } = oneResponseSetup({
        status: QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
      })
      expect(component.toJSON()).toMatchSnapshot()
    })

    it('match snapshot if in success status', () => {
      const { component } = oneResponseSetup({
        status: QUESTION_STATUS.SEND_ANSWER_SUCCESS_TILL_CLOUD_AGENT,
      })
      expect(component.toJSON()).toMatchSnapshot()
    })

    function oneResponseSetup(extraProps: ?GenericObject = {}) {
      const overrideProps = {
        payload: mockQuestionPayload3,
      }
      const commonProps = getProps(extraProps)
      const oneResponseProps = {
        ...commonProps,
        question: {
          ...commonProps.question,
          ...overrideProps,
        },
      }
      const { component, props } = setup({}, oneResponseProps)
      return { component, props }
    }
  })

  describe('when two responses are present', () => {
    it('render both response buttons and no ignore button', () => {
      const { component } = setup()
      expect(component.toJSON()).toMatchSnapshot()
    })

    it('should call onPress with response for each button that is clicked', () => {
      const { component, props } = setup()
      if (props.question) {
        props.question.payload.valid_responses.map(
          (response: QuestionResponse) => {
            const responseButton = component.root.findByProps({
              title: response.text,
            })
            responseButton.props.onPress()
            expect(props.onSelectResponseAndSubmit).toHaveBeenCalledWith(
              response
            )
          }
        )
      }
    })

    it('match snapshot if in error status', () => {
      const { component } = setup({
        status: QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
      })
      expect(component.toJSON()).toMatchSnapshot()
    })

    it('match snapshot if in success status', () => {
      const { component } = setup({
        status: QUESTION_STATUS.SEND_ANSWER_SUCCESS_TILL_CLOUD_AGENT,
      })
      expect(component.toJSON()).toMatchSnapshot()
    })
  })

  describe('when more than two responses are present', () => {
    const overrideProps = {
      payload: mockQuestionPayload2,
    }

    it('render Ignore and Submit button', () => {
      const { component } = setup(overrideProps)
      expect(component.toJSON()).toMatchSnapshot()
    })

    it('call onPress without any response if submit is pressed', () => {
      const { component, props } = setup(overrideProps)
      const submitButton = component.root.findByProps({
        accessibilityLabel: testID,
      })
      submitButton.props.onPress()
      expect(props.onSubmit).toHaveBeenCalledTimes(1)
      expect(props.onSubmit).toHaveBeenCalledWith(undefined)
    })

    it('match snapshot if in error status', () => {
      const { component } = setup({
        ...overrideProps,
        status: QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
      })
      expect(component.toJSON()).toMatchSnapshot()
    })

    it('match snapshot if in success status', () => {
      const { component } = setup({
        ...overrideProps,
        status: QUESTION_STATUS.SEND_ANSWER_SUCCESS_TILL_CLOUD_AGENT,
      })
      expect(component.toJSON()).toMatchSnapshot()
    })
  })
})

function getProps(extraProps: ?GenericObject = {}) {
  return {
    selectedResponse: null,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    onSelectResponseAndSubmit: jest.fn(),
    question: merge(
      {},
      mockQuestionReceivedState.data[mockQuestionPayload.uid],
      extraProps
    ),
  }
}

function setup(
  extraProps: ?GenericObject = {},
  passedProps: ?QuestionActionProps
) {
  const props = passedProps || getProps(extraProps)
  const component = renderer.create(<QuestionActions {...props} />)

  return { component, props }
}
