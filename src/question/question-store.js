// @flow

import moment from 'moment'
import uniqBy from 'lodash.uniqby'

import type {
  QuestionPayload,
  QuestionReceivedAction,
  QuestionStore,
  QuestionAction,
  SendAnswerToQuestionAction,
  QuestionStatus,
  QuestionResponse,
  QuestionStoreData,
} from './type-question'
import type { Store } from '../store/type-store'
import type { Connection } from '../store/type-connection-store'
import type {
  CustomError,
  StorageStatus,
  ComponentStatus,
} from '../common/type-common'
import type { SignDataResponse } from '../bridge/react-native-cxs/type-cxs'
import {
  QUESTION_RECEIVED,
  SEND_ANSWER_TO_QUESTION,
  QUESTION_STATUS,
  UPDATE_QUESTION_STATUS,
  UPDATE_QUESTION_ANSWER,
  ERROR_GET_CONNECTION_HANDLE,
  COMMITEDANSWER_QUESTION_PROTOCOL,
  ERROR_QUESTION_ANSWER_SEND,
  MESSAGE_TYPE_ANSWER,
  MESSAGE_TITLE_ANSWER,
  HYDRATE_QUESTION_STORE,
  UPDATE_QUESTION_STORAGE_STATUS,
  QUESTION_STORAGE_KEY,
  ERROR_NO_QUESTION_DATA,
  ERROR_NO_RESPONSE_ARRAY,
  ERROR_NOT_ENOUGH_RESPONSES,
  ERROR_RESPONSE_NOT_PROPERLY_FORMATTED,
  ERROR_RESPONSE_NOT_UNIQUE_NONCE,
  ERROR_TOO_MANY_RESPONSES,
  ERROR_RESPONSE_NOT_UNIQUE_ANSWERS,
  ERROR_NO_QUESTION_NONCE,
  QUESTIONANSWER_PROTOCOL,
} from './type-question'
import { put, takeLatest, call, all, select, take } from 'redux-saga/effects'
import {
  RESET,
  ERROR_VCX_INIT_FAIL,
  STORAGE_STATUS,
} from '../common/type-common'
import { ensureVcxInitSuccess } from '../store/route-store'
import { getConnection } from '../store/store-selector'
import {
  getHandleBySerializedConnection,
  connectionSignData,
  connectionSendMessage,
  connectionSendAnswer,
} from '../bridge/react-native-cxs/RNCxs'
import { secureSet, getHydrationItem } from '../services/storage'
import { retrySaga } from '../api/api-utils'
import { uuid } from '../services/uuid'

export function* watchQuestion(): any {
  yield all([
    watchAnswerToQuestion(),
    watchQuestionReceived(),
    watchQuestionSeen(),
  ])
}

function* watchAnswerToQuestion(): any {
  yield takeLatest(SEND_ANSWER_TO_QUESTION, answerToQuestionSaga)
}

function* watchQuestionReceived(): any {
  yield takeLatest(QUESTION_RECEIVED, persistQuestionSaga)
}

function* watchQuestionSeen(): any {
  yield takeLatest(isQuestionSeen, persistQuestionSaga)
}

export function* answerToQuestionSaga(
  action: SendAnswerToQuestionAction
): Generator<*, *, *> {
  const { answer, uid } = action
  yield put(updateQuestionStatus(uid, QUESTION_STATUS.SEND_ANSWER_IN_PROGRESS))

  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    yield put(
      updateQuestionStatus(
        uid,
        QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
        ERROR_VCX_INIT_FAIL()
      )
    )
    return
  }

  try {
    const question: QuestionPayload = yield select(selectQuestion, uid)
    const [connection]: Connection[] = yield select(
      getConnection,
      question.from_did
    )
    const connectionHandle: number = yield call(
      getHandleBySerializedConnection,
      connection.vcxSerializedConnection
    )

    try {
      let answerMsgId = ''

      if (question.protocol === QUESTIONANSWER_PROTOCOL) {
        if (!question.originalQuestion) return
        yield* retrySaga(
          yield call(
            connectionSendAnswer,
            connectionHandle,
            question.originalQuestion,
            JSON.stringify(answer)
          )
        )
      } else {
        if (!answer.nonce) return
        const { data, signature }: SignDataResponse = yield call(
          connectionSignData,
          connectionHandle,
          answer.nonce
        )

        let userAnswer = getUserAnswer({ data, signature }, question.messageId)

        answerMsgId = yield* retrySaga(
          call(connectionSendMessage, connectionHandle, {
            message: JSON.stringify(userAnswer),
            messageType: MESSAGE_TYPE_ANSWER,
            messageTitle: MESSAGE_TITLE_ANSWER,
            refMessageId: uid,
          })
        )
      }

      yield put(
        updateQuestionStatus(
          uid,
          QUESTION_STATUS.SEND_ANSWER_SUCCESS_TILL_CLOUD_AGENT
        )
      )

      yield put(updateQuestionAnswer(uid, answer, answerMsgId))

      // since answer is complete, we need to persist new state
      yield call(persistQuestionSaga)
    } catch (e) {
      yield put(
        updateQuestionStatus(
          uid,
          QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
          ERROR_QUESTION_ANSWER_SEND(e.message)
        )
      )
    }
  } catch (e) {
    yield put(
      updateQuestionStatus(
        uid,
        QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
        ERROR_GET_CONNECTION_HANDLE(e.message)
      )
    )
  }
}

export function* persistQuestionSaga(
  action: ?QuestionReceivedAction
): Generator<*, *, *> {
  try {
    const storageStatus: StorageStatus = yield select(
      selectQuestionStorageStatus
    )
    if (storageStatus === STORAGE_STATUS.RESTORE_START) {
      yield take(isQuestionRestoreConcluded)
    }
    yield put(updateQuestionStorageStatus(STORAGE_STATUS.PERSIST_START))
    // once we know that now there is nothing new being restored
    // we can take state from redux store as current state
    const questionState: QuestionStoreData = yield select(
      selectQuestionStoreData
    )
    yield call(secureSet, QUESTION_STORAGE_KEY, JSON.stringify(questionState))
    yield put(updateQuestionStorageStatus(STORAGE_STATUS.PERSIST_SUCCESS))
  } catch (e) {
    yield put(updateQuestionStorageStatus(STORAGE_STATUS.PERSIST_FAIL))
  }
}

export function* hydrateQuestionSaga(): Generator<*, *, *> {
  try {
    yield put(updateQuestionStorageStatus(STORAGE_STATUS.RESTORE_START))
    const data: string = yield call(getHydrationItem, QUESTION_STORAGE_KEY)
    if (data) {
      yield put(hydrateQuestionStore(JSON.parse(data)))
    }
    yield put(updateQuestionStorageStatus(STORAGE_STATUS.RESTORE_SUCCESS))
  } catch (e) {
    yield put(updateQuestionStorageStatus(STORAGE_STATUS.RESTORE_FAIL))
  }
}

export function getUserAnswer(
  { data, signature }: SignDataResponse,
  thid: string
) {
  return {
    '@type': COMMITEDANSWER_QUESTION_PROTOCOL,
    '@id': uuid(),
    'response.@sig': {
      signature,
      sig_data: data,
      timestamp: moment().format(),
    },
    '~thread': {
      thid: thid,
    },
  }
}

export const questionReceived = (
  question: QuestionPayload
): QuestionReceivedAction => {
  return {
    type: QUESTION_RECEIVED,
    question,
  }
}

export const sendAnswerToQuestion = (
  uid?: string,
  answer: QuestionResponse
) => ({
  type: SEND_ANSWER_TO_QUESTION,
  uid,
  answer,
})

export const updateQuestionStatus = (
  uid: string,
  status: QuestionStatus,
  error: ?CustomError
) => ({
  type: UPDATE_QUESTION_STATUS,
  uid,
  status,
  error,
})

export const updateQuestionAnswer = (
  uid: string,
  answer: QuestionResponse,
  answerMsgId: string
) => ({
  type: UPDATE_QUESTION_ANSWER,
  uid,
  answer,
  answerMsgId,
})

export const updateQuestionStorageStatus = (status: StorageStatus) => ({
  type: UPDATE_QUESTION_STORAGE_STATUS,
  status,
})

export const hydrateQuestionStore = (data: QuestionStoreData) => ({
  type: HYDRATE_QUESTION_STORE,
  data,
})

const questionRestoreConcludedStates = [
  STORAGE_STATUS.RESTORE_SUCCESS,
  STORAGE_STATUS.RESTORE_FAIL,
]

// action is typed any because action can be of any type
// since redux-saga passes every action through to check if it matches
function isQuestionRestoreConcluded(action: any): boolean {
  // we wait question restore to conclude
  // by checking whether restore either failed or success
  return (
    action.type === UPDATE_QUESTION_STORAGE_STATUS &&
    questionRestoreConcludedStates.indexOf(action.status) > -1
  )
}

// action is typed any because action can be of any type
// since redux-saga passes every action through to check if it matches
function isQuestionSeen(action: any): boolean {
  // we check if question status is updated and is updated with SEEN
  // if we have seen status, then we need to persist question store to seen
  return (
    action.type === UPDATE_QUESTION_STATUS &&
    action.status === QUESTION_STATUS.SEEN
  )
}

const initialState = {
  data: {},
  storageStatus: STORAGE_STATUS.IDLE,
}

export function selectQuestion(state: Store, uid: string) {
  return state.question.data[uid].payload
}

export function selectQuestionStorageStatus(state: Store) {
  return state.question.storageStatus
}

export function selectQuestionStoreData(state: Store) {
  return state.question.data
}

export function getScreenStatus(
  questionStatus?: QuestionStatus
): ComponentStatus {
  const errorStates = [
    QUESTION_STATUS.SEND_ANSWER_FAIL_TILL_CLOUD_AGENT,
    QUESTION_STATUS.SEND_ANSWER_FAIL_END_TO_END,
  ]
  const error = errorStates.indexOf(questionStatus) > -1

  const successStates = [
    QUESTION_STATUS.SEND_ANSWER_SUCCESS_TILL_CLOUD_AGENT,
    QUESTION_STATUS.SEND_ANSWER_SUCCESS_END_TO_END,
  ]
  const success = successStates.indexOf(questionStatus) > -1

  const loadingStates = [QUESTION_STATUS.SEND_ANSWER_IN_PROGRESS]
  const loading = loadingStates.indexOf(questionStatus) > -1

  // if neither success, nor error or not loading, then idle to be true
  const idle = !error && !success && !loading ? true : false

  return {
    loading,
    success,
    error,
    idle,
  }
}

// Passing explicit any because we need to validate this structure
// at runtime, and we can't perform validation with exact type
// QuestionMessage
export function getQuestionValidity(question: any): null | CustomError {
  if (!question) {
    return ERROR_NO_QUESTION_DATA
  }

  if (question.protocol === QUESTIONANSWER_PROTOCOL) {
    return getQuestionanswerQuestionValidity(question)
  } else {
    return getCommitedanswerQuestionValidity(question)
  }
}

export function getCommitedanswerQuestionValidity(
  question: any
): null | CustomError {
  const { valid_responses } = question
  if (!Array.isArray(valid_responses)) {
    return ERROR_NO_RESPONSE_ARRAY
  }

  if (valid_responses.length === 0) {
    return ERROR_NOT_ENOUGH_RESPONSES
  }

  if (valid_responses.length > 1000) {
    return ERROR_TOO_MANY_RESPONSES
  }

  const everyResponseValid = valid_responses.every(
    (response: QuestionResponse) => {
      const { text, nonce } = response
      // check both text and nonce are string and has some value
      return (
        typeof text === 'string' && typeof nonce === 'string' && text && nonce
      )
    }
  )
  if (!everyResponseValid) {
    return ERROR_RESPONSE_NOT_PROPERLY_FORMATTED
  }

  const uniqueResponses = uniqBy(valid_responses, 'nonce')
  const isEveryNonceUnique = uniqueResponses.length === valid_responses.length
  if (!isEveryNonceUnique) {
    return ERROR_RESPONSE_NOT_UNIQUE_NONCE
  }

  return null
}

export function getQuestionanswerQuestionValidity(
  question: any
): null | CustomError {
  if (!question.nonce) {
    return ERROR_NO_QUESTION_NONCE
  }

  const { valid_responses } = question
  if (!Array.isArray(valid_responses)) {
    return ERROR_NO_RESPONSE_ARRAY
  }

  if (valid_responses.length === 0) {
    return ERROR_NOT_ENOUGH_RESPONSES
  }

  if (valid_responses.length > 1000) {
    return ERROR_TOO_MANY_RESPONSES
  }

  const everyResponseValid = valid_responses.every(
    (response: QuestionResponse) => {
      const { text } = response
      // check text is string and has some value
      return typeof text === 'string' && text
    }
  )
  if (!everyResponseValid) {
    return ERROR_RESPONSE_NOT_PROPERLY_FORMATTED
  }

  const uniqueResponses = uniqBy(valid_responses, 'text')
  const isEveryAnswerUnique = uniqueResponses.length === valid_responses.length
  if (!isEveryAnswerUnique) {
    return ERROR_RESPONSE_NOT_UNIQUE_ANSWERS
  }

  return null
}

export default function questionReducer(
  state: QuestionStore = initialState,
  action: QuestionAction
) {
  switch (action.type) {
    case QUESTION_RECEIVED:
      return {
        ...state,
        data: {
          ...state.data,
          [action.question.uid]: {
            payload: action.question,
            status: QUESTION_STATUS.RECEIVED,
            error: null,
            answer: null,
            answerMsgId: null,
          },
        },
      }

    case UPDATE_QUESTION_STATUS:
      return {
        ...state,
        data: {
          ...state.data,
          [action.uid]: {
            ...state.data[action.uid],
            status: action.status,
            error: action.error || null,
          },
        },
      }

    case UPDATE_QUESTION_ANSWER:
      return {
        ...state,
        data: {
          ...state.data,
          [action.uid]: {
            ...state.data[action.uid],
            answer: action.answer,
            answerMsgId: action.answerMsgId,
          },
        },
      }

    case UPDATE_QUESTION_STORAGE_STATUS:
      return {
        ...state,
        storageStatus: action.status,
      }

    case HYDRATE_QUESTION_STORE:
      return {
        ...state,
        data: {
          ...state.data,
          ...action.data,
        },
        storageStatus: STORAGE_STATUS.RESTORE_SUCCESS,
      }

    case RESET:
      return initialState

    default:
      return state
  }
}
