// @flow

import { takeLatest, all, call, put } from 'redux-saga/effects'
import { UPDATE_LOG_ISENCRYPTED, ENCRYPT_LOG_FILE } from './type-send-logs'
import type {
  SendLogsStore,
  SendLogsStoreAction,
  LogIsEncryptedAction,
} from './type-send-logs'
import { customLogger } from '../store/custom-logger'

const initialState = {
  encryptLogStatus: false,
}

export function* encryptLogSaga(
  action: LogIsEncryptedAction
): Generator<*, *, *> {
  yield call(customLogger.encryptLogFile.bind(customLogger))

  yield put({
    type: UPDATE_LOG_ISENCRYPTED,
    logIsEncrypted: true,
  })
}

function* watchEncryptLog(): any {
  yield takeLatest(ENCRYPT_LOG_FILE, encryptLogSaga)
}

export function* watchSendLogs(): any {
  yield all([watchEncryptLog()])
}

export default function sendlogsReducer(
  state: SendLogsStore = initialState,
  action: SendLogsStoreAction
) {
  switch (action.type) {
    case UPDATE_LOG_ISENCRYPTED: {
      return {
        ...state,
        encryptLogStatus: action.logIsEncrypted,
        error: null,
      }
    }
    default:
      return state
  }
}
