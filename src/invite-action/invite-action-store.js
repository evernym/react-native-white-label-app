// @flow
// packages
import { put, takeLatest, call, all, select, take } from 'redux-saga/effects'
import {
  getHandleBySerializedConnection,
  connectionSendMessage,
} from '../bridge/react-native-cxs/RNCxs'

// types
import type { Store } from '../store/type-store'
import type {
  InviteActionStore,
  InviteActionAction,
  InviteActionPayload,
  InviteActionReceivedAction,
  InviteActionStoreData,
  InviteActionStatus,
  FinalizeActionState,
  InviteActionAcknowledgePayload,
} from './type-invite-action'
import type { StorageStatus, CustomError } from '../common/type-common'
import type { Connection } from '../store/type-connection-store'

// store
import { ensureVcxInitSuccess } from '../store/route-store'
import { getConnection } from '../store/store-selector'

// actions / constants
import {
  INVITE_ACTION_RECEIVED,
  INVITE_ACTION_STATUS,
  INVITE_ACTION_STORAGE_KEY,
  HYDRATE_INVITE_ACTION_STORE,
  FINALIZE_INITIATED_ACTION,
  UPDATE_INVITE_ACTION_STATUS,
  INVITE_ACTION_ERROR_GET_CONNECTION_HANDLE,
  INVITE_ACTION_ERROR_FINALIZING_ACTION,
  INVITE_ACTION_REJECTED,
  INVITE_ACTION_ACCEPTED,
  INVITE_ACTION_RESPONSES,
  INVITE_ACTION_REJECTED_TYPE,
  INVITE_ACTION_ACCEPTED_TYPE,
} from './type-invite-action'
import {
  RESET,
  STORAGE_STATUS,
  ERROR_VCX_INIT_FAIL,
} from '../common/type-common'
import { UPDATE_INVITE_ACTION_STORAGE_STATUS } from './type-invite-action'

// services
import { secureSet, getHydrationItem } from '../services/storage'
import { uuid } from '../services/uuid'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'

// utils
import { retrySaga } from '../api/api-utils'
import { ensureConnectionsSync } from '../store/connections-store'

export function* watchInviteAction(): any {
  yield all([
    watchInviteActionReceived(),
    watchInitiateFinalizedInviteAction(),
    watchInviteActionSeen(),
  ])
}

export const hydrateInviteActionStore = (data: InviteActionStoreData) => ({
  type: HYDRATE_INVITE_ACTION_STORE,
  data,
})

function* watchInviteActionReceived(): any {
  yield takeLatest(INVITE_ACTION_RECEIVED, persistInviteActionSaga)
}

function* watchInitiateFinalizedInviteAction(): any {
  yield takeLatest(FINALIZE_INITIATED_ACTION, finalizeAction)
}

function* watchInviteActionSeen(): any {
  yield takeLatest(isInviteActionSeen, persistInviteActionSaga)
}

function isInviteActionSeen(action: any): boolean {
  return (
    action.type === UPDATE_INVITE_ACTION_STATUS &&
    action.status === INVITE_ACTION_STATUS.INVITE_ACTION_SEEN
  )
}

export const inviteActionReceived = (
  inviteAction: InviteActionPayload
): InviteActionReceivedAction => {
  return {
    type: INVITE_ACTION_RECEIVED,
    inviteAction,
  }
}

export const initiateFinalizedAction = (
  uid?: string,
  actionResponse: string
) => ({
  type: FINALIZE_INITIATED_ACTION,
  uid,
  actionResponse,
})

export const updateInviteActionStatus = (
  uid: string,
  status: InviteActionStatus,
  error: ?CustomError | null
) => {
  return {
    type: UPDATE_INVITE_ACTION_STATUS,
    uid,
    status,
    error,
  }
}

export function selectInviteAction(state: Store, uid: string) {
  return state.inviteAction.data[uid].payload
}

export const updateInviteAction = (
  uid: string,
  actionResponse: string,
  inviteActionId: string
) => ({
  type:
    actionResponse === INVITE_ACTION_RESPONSES.REJECTED
      ? INVITE_ACTION_REJECTED
      : INVITE_ACTION_ACCEPTED,
  uid,
  actionResponse,
  inviteActionId,
})

const convertToInviteActionResponse = (
  actionResponse: string,
  inviteActionData: InviteActionPayload
) => {
  const inviteActionUUID = uuid()
  const parsedOriginalMsg: InviteActionAcknowledgePayload = JSON.parse(
    inviteActionData.originalInviteAction
  )

  if (actionResponse === INVITE_ACTION_RESPONSES.REJECTED) {
    return {
      '@type': INVITE_ACTION_REJECTED_TYPE,
      '@id': inviteActionUUID,
      description: 'Invitation was rejected',
      '~thread': { thid: parsedOriginalMsg['@id'] },
    }
  } else {
    return {
      '@type': INVITE_ACTION_ACCEPTED_TYPE,
      '@id': inviteActionUUID,
      status: 'OK',
      '~thread': { thid: parsedOriginalMsg['@id'] },
    }
  }
}

export function* finalizeAction(
  action: FinalizeActionState
): Generator<*, *, *> {
  const { actionResponse, uid } = action
  yield put(
    updateInviteActionStatus(
      uid,
      INVITE_ACTION_STATUS.INITIATING_FINALIZATION_OF_INVITE_ACTION,
      null
    )
  )

  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    yield put(
      updateInviteActionStatus(
        uid,
        INVITE_ACTION_STATUS.INVITE_ACTION_VCX_INIT_FAIL,
        ERROR_VCX_INIT_FAIL()
      )
    )
    return
  }

  yield call(ensureConnectionsSync)

  try {
    const inviteActionState: InviteActionPayload = yield select(
      selectInviteAction,
      uid
    )

    const [connection]: Connection[] = yield select(
      getConnection,
      inviteActionState.from_did
    )

    const connectionHandle: number = yield call(
      getHandleBySerializedConnection,
      connection.vcxSerializedConnection
    )

    try {
      let inviteActionId = ''

      if (!inviteActionState.originalInviteAction) return
      const inviteActionResponse = convertToInviteActionResponse(
        actionResponse,
        inviteActionState
      )

      inviteActionId = yield* retrySaga(
        yield call(connectionSendMessage, connectionHandle, {
          message: JSON.stringify(inviteActionResponse),
          messageType:
            actionResponse === INVITE_ACTION_RESPONSES.REJECTED
              ? 'problem-report'
              : 'ack',
          messageTitle: 'Acknowledged Action',
          refMessageId: uid,
        })
      )

      yield put(
        updateInviteActionStatus(
          uid,
          INVITE_ACTION_STATUS.INVITE_ACTION_FINALIZATION_SUCCESS,
          null
        )
      )

      yield put(updateInviteAction(uid, actionResponse, inviteActionId))

      yield call(persistInviteActionSaga)
    } catch (e) {
      captureError(e)

      yield put(
        updateInviteActionStatus(
          uid,
          INVITE_ACTION_STATUS.INVITE_ACTION_SEND_MESSAGE_FAILURE,
          INVITE_ACTION_ERROR_FINALIZING_ACTION(e.message)
        )
      )
    }
  } catch (e) {
    captureError(e)

    yield put(
      updateInviteActionStatus(
        uid,
        INVITE_ACTION_STATUS.INVITE_ACTION_GET_CONNECTION_HANDLE_FAILURE,
        INVITE_ACTION_ERROR_GET_CONNECTION_HANDLE(e.message)
      )
    )
  }
}

export function selectInviteActionStoreData(state: Store) {
  return state.inviteAction.data
}

export function selectInviteActionStorageStatus(state: Store) {
  return state.inviteAction.storageStatus
}

export const updateInviteActionStorageStatus = (status: StorageStatus) => ({
  type: UPDATE_INVITE_ACTION_STORAGE_STATUS,
  status,
})

function isInviteActionRestoreConcluded(action: any): boolean {
  const inviteActionRestoreConcludedStates = [
    STORAGE_STATUS.RESTORE_SUCCESS,
    STORAGE_STATUS.RESTORE_FAIL,
  ]

  // we wait for "inviteAction" restore to conclude
  // by checking whether restore either failed or success
  return (
    action.type === UPDATE_INVITE_ACTION_STORAGE_STATUS &&
    inviteActionRestoreConcludedStates.indexOf(action.status) > -1
  )
}

export function* persistInviteActionSaga(): Generator<*, *, *> {
  try {
    const storageStatus: StorageStatus = yield select(
      selectInviteActionStorageStatus
    )

    if (storageStatus === STORAGE_STATUS.RESTORE_START) {
      yield take(isInviteActionRestoreConcluded)
    }

    yield put(updateInviteActionStorageStatus(STORAGE_STATUS.PERSIST_START))
    // once we know that now there is nothing new being restored
    // we can take state from redux store as current state

    const InviteActionState: InviteActionStoreData = yield select(
      selectInviteActionStoreData
    )

    yield call(
      secureSet,
      INVITE_ACTION_STORAGE_KEY,
      JSON.stringify(InviteActionState)
    )

    yield put(updateInviteActionStorageStatus(STORAGE_STATUS.PERSIST_SUCCESS))
  } catch (e) {
    captureError(e)
    customLogger.log(`persistInviteActionSaga: ${e}`)

    yield put(updateInviteActionStorageStatus(STORAGE_STATUS.PERSIST_FAIL))
  }
}

export function* hydrateInviteActionSaga(): Generator<*, *, *> {
  try {
    yield put(updateInviteActionStorageStatus(STORAGE_STATUS.RESTORE_START))
    const data: string = yield call(getHydrationItem, INVITE_ACTION_STORAGE_KEY)
    if (data) {
      yield put(hydrateInviteActionStore(JSON.parse(data)))
    }
    yield put(updateInviteActionStorageStatus(STORAGE_STATUS.RESTORE_SUCCESS))
  } catch (e) {
    captureError(e)
    customLogger.log(`hydrateInviteActionSaga: ${e}`)

    yield put(updateInviteActionStorageStatus(STORAGE_STATUS.RESTORE_FAIL))
  }
}

const initialState = {
  data: {},
  storageStatus: STORAGE_STATUS.IDLE,
}

export default function inviteActionReducer(
  state: InviteActionStore = initialState,
  action: InviteActionAction
) {
  switch (action.type) {
    case INVITE_ACTION_RECEIVED:
      return {
        ...state,
        data: {
          ...state.data,
          [action.inviteAction.uid]: {
            payload: action.inviteAction,
            status: INVITE_ACTION_STATUS.INVITE_ACTION_RECEIVED,
            error: null,
          },
        },
      }

    case UPDATE_INVITE_ACTION_STATUS:
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

    case INVITE_ACTION_REJECTED:
      return {
        ...state,
        data: {
          ...state.data,
          [action.uid]: {
            ...state.data[action.uid],
            actionResponse: action.actionResponse,
            inviteActionId: action.inviteActionId,
          },
        },
      }

    case INVITE_ACTION_ACCEPTED:
      return {
        ...state,
        data: {
          ...state.data,
          [action.uid]: {
            ...state.data[action.uid],
            actionResponse: action.actionResponse,
            inviteActionId: action.inviteActionId,
          },
        },
      }

    case UPDATE_INVITE_ACTION_STORAGE_STATUS:
      return {
        ...state,
        storageStatus: action.status,
      }

    case HYDRATE_INVITE_ACTION_STORE:
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
