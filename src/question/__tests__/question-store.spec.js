// @flow

import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import questionReducer, {
  answerToQuestionSaga,
  questionReceived,
  sendAnswerToQuestion,
  updateQuestionStatus,
  updateQuestionAnswer,
  getUserAnswer,
  updateQuestionStorageStatus,
  hydrateQuestionStore,
  getQuestionValidity,
} from '../question-store'
import { initialTestAction, STORAGE_STATUS } from '../../common/type-common'
import {
  mockQuestionPayload,
  mockQuestionReceivedState,
} from '../../../__mocks__/data/question-store-mock-data'
import {
  QUESTION_STATUS,
  ERROR_QUESTION_ANSWER_SEND,
  MESSAGE_TYPE_ANSWER,
  MESSAGE_TITLE_ANSWER,
} from '../type-question'
import { VCX_INIT_SUCCESS } from '../../store/type-config-store'
import {
  pairwiseConnection,
  vcxSerializedConnection,
} from '../../../__mocks__/static-data'
import {
  getHandleBySerializedConnection,
  connectionSignData,
  connectionSendMessage,
} from '../../bridge/react-native-cxs/RNCxs'

describe('Question Store', () => {
  const { uid, valid_responses, messageId } = mockQuestionPayload
  const answer = valid_responses[0]
  const answerMsgId = 'answerMsgId'

  let initialState
  beforeEach(() => {
    initialState = questionReducer(undefined, initialTestAction())
  })

  it('action:questionReceived', () => {
    expect(
      questionReducer(initialState, questionReceived(mockQuestionPayload))
    ).toMatchSnapshot()
  })

  it('action:sendAnswerToQuestion', () => {
    const afterQuestionReceivedState = getAfterQuestionReceivedState()
    expect(
      questionReducer(
        afterQuestionReceivedState,
        sendAnswerToQuestion(uid, answer)
      )
    ).toMatchSnapshot()
  })

  it('action:updateQuestionStatus', () => {
    const afterQuestionReceivedState = getAfterQuestionReceivedState()
    expect(
      questionReducer(
        afterQuestionReceivedState,
        updateQuestionStatus(uid, QUESTION_STATUS.SEND_ANSWER_IN_PROGRESS)
      )
    ).toMatchSnapshot()
    expect(
      questionReducer(
        afterQuestionReceivedState,
        updateQuestionStatus(
          uid,
          QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
          ERROR_QUESTION_ANSWER_SEND('HTTP error')
        )
      )
    ).toMatchSnapshot()
  })

  it('action:updateQuestionAnswer', () => {
    expect(
      questionReducer(
        getAfterQuestionReceivedState(),
        updateQuestionAnswer(uid, answer, answerMsgId)
      )
    ).toMatchSnapshot()
  })

  it('action:updateQuestionStorageStatus', () => {
    expect(
      questionReducer(
        getAfterQuestionReceivedState(),
        updateQuestionStorageStatus(STORAGE_STATUS.RESTORE_START)
      )
    ).toMatchSnapshot()
  })

  it('action:hydrateQuestionStore', () => {
    expect(
      questionReducer(
        initialState,
        hydrateQuestionStore(mockQuestionReceivedState.data)
      )
    ).toMatchSnapshot()
    expect(
      questionReducer(
        getAfterQuestionReceivedState(),
        hydrateQuestionStore(mockQuestionReceivedState.data)
      )
    ).toMatchSnapshot()
  })

  it('saga:answerToQuestionSaga', () => {
    const userDID = pairwiseConnection.identifier

    const stateWithConnectionQuestionVcxSuccess = {
      config: {
        vcxInitializationState: VCX_INIT_SUCCESS,
      },
      connections: {
        data: {
          [userDID]: {
            ...pairwiseConnection,
            senderDID: mockQuestionPayload.from_did,
            vcxSerializedConnection: vcxSerializedConnection,
          },
        },
      },
      question: mockQuestionReceivedState,
    }
    const connectionHandle = 1
    const signDataResponse = {
      data: 'dataInBase64',
      signature: 'signatureInBase64GenerateByDataInBase64',
    }

    const message = getUserAnswer(signDataResponse, messageId)
    return expectSaga(answerToQuestionSaga, sendAnswerToQuestion(uid, answer))
      .withState(stateWithConnectionQuestionVcxSuccess)
      .provide([
        [matchers.call.fn(getHandleBySerializedConnection), connectionHandle],
        [matchers.call.fn(connectionSignData), signDataResponse],
        [matchers.call.fn(connectionSendMessage), answerMsgId],
      ])
      .call(getHandleBySerializedConnection, vcxSerializedConnection)
      .call(connectionSignData, connectionHandle, answer.nonce)
      .call(connectionSendMessage, connectionHandle, {
        message: JSON.stringify(message),
        messageType: MESSAGE_TYPE_ANSWER,
        messageTitle: MESSAGE_TITLE_ANSWER,
        refMessageId: uid,
      })
      .put(
        updateQuestionStatus(
          uid,
          QUESTION_STATUS.SEND_ANSWER_SUCCESS_TILL_CLOUD_AGENT
        )
      )
      .put(updateQuestionAnswer(uid, answer, answerMsgId))
      .run()
  })
})

describe('fn:getQuestionValidity', () => {
  it('should return error ERROR_NO_QUESTION_DATA', () => {
    expect(getQuestionValidity()).toMatchSnapshot()
  })

  it('should return error ERROR_NO_RESPONSE_ARRAY', () => {
    expect(getQuestionValidity({})).toMatchSnapshot()
    expect(
      getQuestionValidity({ response: [{ nonce: '1', text: '2' }] })
    ).toMatchSnapshot()
  })

  it('should return error ERROR_NOT_ENOUGH_RESPONSES', () => {
    expect(getQuestionValidity({ valid_responses: [] })).toMatchSnapshot()
  })

  it('should return error ERROR_TOO_MANY_RESPONSES', () => {
    const valid_responses = Array.from({ length: 1001 }, (v, index) => index++)
    expect(getQuestionValidity({ valid_responses })).toMatchSnapshot()
  })

  it('should return error ERROR_RESPONSE_NOT_PROPERLY_FORMATTED', () => {
    const valid_responses = [
      { text: 'some valid text', nonce: 'some valid nonce' },
      { text: '', nonce: 'valid nonce, but invalid text' },
    ]
    expect(getQuestionValidity({ valid_responses })).toMatchSnapshot()

    const valid_responses1 = [
      { text: 'only text, no nonce' },
      { text: 'some valid text', nonce: 'some valid nonce' },
    ]
    expect(
      getQuestionValidity({ valid_responses: valid_responses1 })
    ).toMatchSnapshot()

    const valid_responses2 = [
      { nonce: 'only nonce, no text' },
      { text: 'valid text', nonce: 'valid nonce' },
    ]
    expect(
      getQuestionValidity({ valid_responses: valid_responses2 })
    ).toMatchSnapshot()
  })

  it('should return error ERROR_RESPONSE_NOT_UNIQUE_NONCE', () => {
    const valid_responses = [
      { text: 'valid text', nonce: 'same nonce' },
      { text: 'another valid text', nonce: 'same nonce' },
    ]
    expect(getQuestionValidity({ valid_responses })).toMatchSnapshot()
  })

  it('should return null if everything is fine', () => {
    const valid_responses = [
      { text: 'valid text', nonce: 'same nonce' },
      { text: 'another valid text', nonce: 'unique nonce' },
    ]
    expect(getQuestionValidity({ valid_responses })).toMatchSnapshot()
  })
})

function getAfterQuestionReceivedState() {
  return questionReducer(
    questionReducer(undefined, initialTestAction()),
    questionReceived(mockQuestionPayload)
  )
}
