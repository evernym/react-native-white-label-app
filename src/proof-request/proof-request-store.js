// @flow
import { put, takeEvery, call, select } from 'redux-saga/effects'
import type { CustomError, RequestedAttrsJson } from '../common/type-common'
import type {
  ProofRequestStore,
  ProofRequestAction,
  ProofRequestShownAction,
  SendProofSuccessAction,
  SendProofFailAction,
  SendProofAction,
  ProofRequestIgnoredAction,
  ProofRequestRejectedAction,
  ProofRequestAcceptedAction,
  ProofRequestPayload,
  AdditionalProofDataPayload,
  MissingAttribute,
  MissingAttributes,
  ProofRequestReceivedAction,
  DissatisfiedAttribute,
  DenyProofRequestAction,
  DenyProofRequestSuccessAction,
  AcceptOutofbandPresentationRequestAction,
  DeleteOutofbandPresentationRequestAction,
  OutOfBandConnectionForPresentationEstablishedAction,
  ApplyAttributesForPresentationRequestAction,
  SelfAttestedAttributes,
} from './type-proof-request'
import {
  getUserPairwiseDid,
  getProofRequestPairwiseDid,
  getRemotePairwiseDidAndName,
  getProofRequest,
  getConnection,
} from '../store/store-selector'
import {
  PROOF_REQUESTS,
  PROOF_REQUEST_RECEIVED,
  PROOF_REQUEST_STATUS,
  PROOF_STATUS,
  PROOF_REQUEST_SHOWN,
  PROOF_REQUEST_IGNORED,
  PROOF_REQUEST_ACCEPTED,
  PROOF_REQUEST_REJECTED,
  PROOF_REQUEST_AUTO_FILL,
  SEND_PROOF,
  SEND_PROOF_SUCCESS,
  SEND_PROOF_FAIL,
  MISSING_ATTRIBUTES_FOUND,
  ERROR_SEND_PROOF,
  HYDRATE_PROOF_REQUESTS,
  PROOF_SERIALIZED,
  UPDATE_PROOF_HANDLE,
  PROOF_REQUEST_SHOW_START,
  PROOF_REQUEST_DISSATISFIED_ATTRIBUTES_FOUND,
  DENY_PROOF_REQUEST,
  DENY_PROOF_REQUEST_SUCCESS,
  DENY_PROOF_REQUEST_FAIL,
  ACCEPT_OUTOFBAND_PRESENTATION_REQUEST,
  DELETE_OUTOFBAND_PRESENTATION_REQUEST,
  OUT_OF_BAND_CONNECTION_FOR_PRESENTATION_ESTABLISHED,
  APPLY_ATTRIBUTES_FOR_PRESENTATION_REQUEST,
} from './type-proof-request'
import type {
  NotificationPayloadInfo,
  Attribute,
} from '../push-notification/type-push-notification'
import {
  sendProof as sendProofApi,
  getHandleBySerializedConnection,
  proofSerialize,
  proofReject,
  proofDeserialize,
} from '../bridge/react-native-cxs/RNCxs'
import type { Connection } from '../store/type-connection-store'
import { RESET } from '../common/type-common'
import { getProofRequests } from '../store/store-selector'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'
import {
  resetTempProofData,
  errorSendProofFail,
  updateAttributeClaim,
} from '../proof/proof-store'
import { secureSet, getHydrationItem } from '../services/storage'
import { retrySaga } from '../api/api-utils'
import { ensureVcxInitAndPoolConnectSuccess } from '../store/route-store'
import { PROOF_FAIL } from '../proof/type-proof'

const proofRequestInitialState = {}

export const ignoreProofRequest = (uid: string): ProofRequestIgnoredAction => ({
  type: PROOF_REQUEST_IGNORED,
  uid,
})

export const rejectProofRequest = (
  uid: string
): ProofRequestRejectedAction => ({
  type: PROOF_REQUEST_REJECTED,
  uid,
})

export const acceptProofRequest = (
  uid: string
): ProofRequestAcceptedAction => ({
  type: PROOF_REQUEST_ACCEPTED,
  uid,
})

export const denyProofRequest = (uid: string): DenyProofRequestAction => ({
  type: DENY_PROOF_REQUEST,
  uid,
})

export const denyProofRequestSuccess = (
  uid: string
): DenyProofRequestSuccessAction => ({
  type: DENY_PROOF_REQUEST_SUCCESS,
  uid,
})

export const proofRequestShown = (uid: string): ProofRequestShownAction => ({
  type: PROOF_REQUEST_SHOWN,
  uid,
})

export const sendProof = (uid: string): SendProofAction => ({
  type: SEND_PROOF,
  uid,
})

export const sendProofSuccess = (uid: string): SendProofSuccessAction => ({
  type: SEND_PROOF_SUCCESS,
  uid,
})
export const hydrateProofRequests = (proofRequests: ProofRequestStore) => ({
  type: HYDRATE_PROOF_REQUESTS,
  proofRequests,
})

export const sendProofFail = (
  uid: string,
  error: CustomError
): SendProofFailAction => ({
  type: SEND_PROOF_FAIL,
  error,
  uid,
})

export function convertMissingAttributeListToObject(
  missingAttributes: Array<MissingAttribute>
): MissingAttributes {
  return missingAttributes.reduce(
    (selfAttestedAttributes, missingAttribute: MissingAttribute) => ({
      ...selfAttestedAttributes,
      [missingAttribute.name.toLocaleLowerCase()]: {
        name: missingAttribute.name,
        data: '',
        key: missingAttribute.key,
      },
    }),
    {}
  )
}

export const missingAttributesFound = (
  missingAttributeList: MissingAttribute[],
  uid: string
) => ({
  type: MISSING_ATTRIBUTES_FOUND,
  missingAttributes: convertMissingAttributeListToObject(missingAttributeList),
  uid,
})

export const dissatisfiedAttributesFound = (
  dissatisfiedAttributes: DissatisfiedAttribute[],
  uid: string
) => ({
  type: PROOF_REQUEST_DISSATISFIED_ATTRIBUTES_FOUND,
  dissatisfiedAttributes,
  uid,
})

export function* persistProofRequestsSaga(): Generator<*, *, *> {
  try {
    const proofRequests = yield select(getProofRequests)
    yield call(secureSet, PROOF_REQUESTS, JSON.stringify(proofRequests))
  } catch (e) {
    // capture error for safe set
    captureError(e)
    customLogger.log(`persistProofRequestsSaga: ${e}`)
  }
}

export function* hydrateProofRequestsSaga(): Generator<*, *, *> {
  try {
    const proofRequests: string = yield call(getHydrationItem, PROOF_REQUESTS)
    if (proofRequests) {
      yield put(hydrateProofRequests(JSON.parse(proofRequests)))
    }
  } catch (e) {
    // capture error for safe get
    captureError(e)
    customLogger.log(`hydrateProofRequestSaga: ${e}`)
  }
}

export const ERROR_ACCEPT_PROOF_REQUEST_FAIL =
  'Unable to generate proof. Check your internet connection or try to restart app.'

export function* proofAccepted(
  action: ProofRequestAcceptedAction
): Generator<*, *, *> {
  const { uid } = action
  const proofRequestPayload: ProofRequestPayload = yield select(
    getProofRequest,
    uid
  )
  const {
    proofHandle,
    ephemeralProofRequest,
    remotePairwiseDID,
  } = proofRequestPayload
  // for ephemeral proof request there will be no pairwise connection
  // so we are keeping connection handle to 0
  let connectionHandle = 0
  if (!ephemeralProofRequest) {
    // if this proof request is not ephemeral, then we expects a pairwise connection
    connectionHandle = yield* getConnectionHandle(remotePairwiseDID, uid)
  }

  if (typeof connectionHandle === 'undefined') {
    // connection handle was returned as undefined by getConnectionHandle
    // so we stop processing further
    return
  }

  const vcxResult = yield* ensureVcxInitAndPoolConnectSuccess()
  if (vcxResult && vcxResult.fail) {
    errorSendProofFail(
      uid,
      remotePairwiseDID,
      ERROR_SEND_PROOF(ERROR_ACCEPT_PROOF_REQUEST_FAIL)
    )
    return
  }

  try {
    yield* retrySaga(call(sendProofApi, proofHandle, connectionHandle))
    yield put(sendProofSuccess(uid))
    yield put(resetTempProofData(uid))
  } catch (e) {
    captureError(e)
    yield put(
      errorSendProofFail(uid, remotePairwiseDID, ERROR_SEND_PROOF(e.message))
    )
  }
}

function* getConnectionHandle(
  remoteDid: string,
  uid: string
): Generator<*, *, *> {
  try {
    const [connection]: [Connection] = yield select(getConnection, remoteDid)

    if (!connection.vcxSerializedConnection) {
      captureError(new Error('OCS-002 No pairwise connection found'))
      yield put(
        errorSendProofFail(uid, remoteDid, {
          code: 'OCS-002',
          message: 'No pairwise connection found',
        })
      )
      return
    }

    const connectionHandle: number = yield call(
      getHandleBySerializedConnection,
      connection.vcxSerializedConnection
    )
    return connectionHandle
  } catch (e) {
    return
  }
}

export function* watchProofRequestAccepted(): any {
  yield takeEvery(PROOF_REQUEST_ACCEPTED, proofAccepted)
}

export function* watchPersistProofRequests(): any {
  yield takeEvery(
    [PROOF_REQUEST_SHOWN, PROOF_REQUEST_RECEIVED, PROOF_SERIALIZED],
    persistProofRequestsSaga
  )
}

export const proofRequestAutoFill = (
  uid: string,
  requestedAttributes: Array<Attribute>
) => ({
  type: PROOF_REQUEST_AUTO_FILL,
  uid,
  requestedAttributes,
})

export const proofRequestReceived = (
  payload: AdditionalProofDataPayload,
  payloadInfo: NotificationPayloadInfo
) => ({
  type: PROOF_REQUEST_RECEIVED,
  payload,
  payloadInfo,
})

export const proofSerialized = (serializedProof: string, uid: string) => ({
  type: PROOF_SERIALIZED,
  serializedProof,
  uid,
})

export function* serializeProofRequestSaga(
  action: ProofRequestReceivedAction
): Generator<*, *, *> {
  try {
    const { proofHandle } = action.payload
    if (proofHandle) {
      const serializedProof: string = yield call(proofSerialize, proofHandle)
      yield put(proofSerialized(serializedProof, action.payloadInfo.uid))
    }
  } catch (e) {
    captureError(e)
    // TODO:KS Add action for serialization failure
    // need to figure out what happens if serialization fails
    customLogger.log('failed to serialize proof')
  }
}

export function* watchProofRequestReceived(): any {
  yield takeEvery(PROOF_REQUEST_RECEIVED, serializeProofRequestSaga)
}

function* denyProofRequestSaga(
  action: DenyProofRequestAction
): Generator<*, *, *> {
  try {
    const { uid } = action
    const remoteDid: string = yield select(getProofRequestPairwiseDid, uid)
    const userPairwiseDid: string | null = yield select(
      getUserPairwiseDid,
      remoteDid
    )

    if (!userPairwiseDid) {
      customLogger.log(
        'Connection not found while trying to deny proof request.'
      )

      return
    }

    const proofRequestPayload: ProofRequestPayload = yield select(
      getProofRequest,
      uid
    )
    const { proofHandle } = proofRequestPayload
    const connection: {
      remotePairwiseDID: string,
      remoteName: string,
    } & Connection = yield select(getRemotePairwiseDidAndName, userPairwiseDid)
    if (!connection.vcxSerializedConnection) {
      customLogger.log(
        'Serialized connection not found while trying to deny proof request.'
      )
      return
    }

    try {
      const connectionHandle: number = yield call(
        getHandleBySerializedConnection,
        connection.vcxSerializedConnection
      )
      try {
        try {
          yield call(proofReject, proofHandle, connectionHandle)
        } catch (e) {
          // user can kill app or memory might have re-assigned
          // get proof handle again, if previous one gets error
          const newProofHandle = yield call(
            proofDeserialize,
            proofRequestPayload.vcxSerializedProofRequest || ''
          )
          // update proof handle in store, because it would be used by proof-request store
          yield put(updateProofHandle(newProofHandle, uid))
          yield call(proofReject, newProofHandle, connectionHandle)
        }
        yield put(denyProofRequestSuccess(uid))
      } catch (e) {
        yield put({
          type: DENY_PROOF_REQUEST_FAIL,
          uid,
        })
        customLogger.log(
          'error calling vcx deny API while denying proof request.'
        )
      }
    } catch (e) {
      yield put({
        type: DENY_PROOF_REQUEST_FAIL,
        uid,
      })
      customLogger.log(
        'connection handle not found while denying proof request.'
      )
    }
  } catch (e) {
    yield put({
      type: DENY_PROOF_REQUEST_FAIL,
      uid: action.uid,
    })
    customLogger.log('something went wrong trying to deny proof request.')
  }
}

export function* watchProofRequestDeny(): any {
  yield takeEvery(DENY_PROOF_REQUEST, denyProofRequestSaga)
}

export const updateProofHandle = (proofHandle: number, uid: string) => ({
  type: UPDATE_PROOF_HANDLE,
  proofHandle,
  uid,
})

export const proofRequestShowStart = (uid: string) => ({
  type: PROOF_REQUEST_SHOW_START,
  uid,
})

export const applyAttributesForPresentationRequest = (
  uid: string,
  requestedAttrsJson: RequestedAttrsJson,
  selfAttestedAttributes: SelfAttestedAttributes
): ApplyAttributesForPresentationRequestAction => ({
  type: APPLY_ATTRIBUTES_FOR_PRESENTATION_REQUEST,
  uid,
  requestedAttrsJson,
  selfAttestedAttributes,
})

export const acceptOutofbandPresentationRequest = (
  uid: string,
  senderDID: string,
  show: boolean
): AcceptOutofbandPresentationRequestAction => ({
  type: ACCEPT_OUTOFBAND_PRESENTATION_REQUEST,
  uid,
  senderDID,
  show,
})

export const deleteOutofbandPresentationRequest = (
  uid: string
): DeleteOutofbandPresentationRequestAction => ({
  type: DELETE_OUTOFBAND_PRESENTATION_REQUEST,
  uid,
})

export const outOfBandConnectionForPresentationEstablished = (
  uid: string
): OutOfBandConnectionForPresentationEstablishedAction => ({
  type: OUT_OF_BAND_CONNECTION_FOR_PRESENTATION_ESTABLISHED,
  uid,
})

function* outOfBandConnectionForPresentationEstablishedSaga(
  action: OutOfBandConnectionForPresentationEstablishedAction
): Generator<*, *, *> {
  const proofRequestPayload: ProofRequestPayload = yield select(
    getProofRequest,
    action.uid
  )

  if (!proofRequestPayload.requestedAttrsJson) {
    throw Error('Cannot get requestedAttrsJson')
  }

  if (!proofRequestPayload.selfAttestedAttributes) {
    throw Error('Cannot get selfAttestedAttributes')
  }

  yield put(
    updateAttributeClaim(
      proofRequestPayload.uid,
      proofRequestPayload.remotePairwiseDID,
      proofRequestPayload.requestedAttrsJson,
      proofRequestPayload.selfAttestedAttributes
    )
  )
}

export function* watchOutOfBandConnectionForPresentationEstablished(): any {
  yield takeEvery(
    OUT_OF_BAND_CONNECTION_FOR_PRESENTATION_ESTABLISHED,
    outOfBandConnectionForPresentationEstablishedSaga
  )
}

export default function proofRequestReducer(
  state: ProofRequestStore = proofRequestInitialState,
  action: ProofRequestAction
) {
  switch (action.type) {
    case PROOF_REQUEST_RECEIVED: {
      return {
        ...state,
        [action.payloadInfo.uid]: {
          ...action.payload,
          ...action.payloadInfo,
          status: PROOF_REQUEST_STATUS.RECEIVED,
          proofStatus: PROOF_STATUS.NONE,
        },
      }
    }

    case PROOF_REQUEST_SHOW_START: {
      const data = state[action.uid].data
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: PROOF_REQUEST_STATUS.RECEIVED,
          proofStatus: PROOF_STATUS.NONE,
          missingAttributes: {},
          dissatisfiedAttributes: [],
          data: {
            ...data,
            requestedAttributes: data.requestedAttributes.map((attribute) => {
              if (Array.isArray(attribute) && attribute.length > 0) {
                return {
                  label: attribute[0].label,
                  values: attribute[0].values,
                }
              }
              return {
                label: attribute.label,
                values: attribute.values,
              }
            }),
          },
        },
      }
    }

    case APPLY_ATTRIBUTES_FOR_PRESENTATION_REQUEST:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          requestedAttrsJson: action.requestedAttrsJson,
          selfAttestedAttributes: action.selfAttestedAttributes,
        },
      }

    case DELETE_OUTOFBAND_PRESENTATION_REQUEST:
      const { [action.uid]: proofRequest, ...newState } = state
      return newState

    case PROOF_REQUEST_SHOWN:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: PROOF_REQUEST_STATUS.SHOWN,
        },
      }

    case PROOF_REQUEST_ACCEPTED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: PROOF_REQUEST_STATUS.ACCEPTED,
        },
      }

    case ACCEPT_OUTOFBAND_PRESENTATION_REQUEST:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: PROOF_REQUEST_STATUS.ACCEPTED,
        },
      }

    case PROOF_REQUEST_IGNORED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: PROOF_REQUEST_STATUS.IGNORED,
        },
      }

    case PROOF_REQUEST_REJECTED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          status: PROOF_REQUEST_STATUS.REJECTED,
        },
      }

    case PROOF_REQUEST_AUTO_FILL:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          data: {
            ...state[action.uid].data,
            requestedAttributes: [...action.requestedAttributes],
          },
        },
      }

    case SEND_PROOF:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofStatus: PROOF_STATUS.SENDING_PROOF,
        },
      }

    case SEND_PROOF_SUCCESS:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofStatus: PROOF_STATUS.SEND_PROOF_SUCCESS,
        },
      }

    case PROOF_FAIL:
    case SEND_PROOF_FAIL:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofStatus: PROOF_STATUS.SEND_PROOF_FAIL,
        },
      }

    case MISSING_ATTRIBUTES_FOUND:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          missingAttributes: action.missingAttributes,
        },
      }
    case HYDRATE_PROOF_REQUESTS:
      return action.proofRequests

    case RESET:
      return proofRequestInitialState

    case PROOF_SERIALIZED:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          vcxSerializedProofRequest: action.serializedProof,
        },
      }

    case UPDATE_PROOF_HANDLE:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofHandle: action.proofHandle,
        },
      }
    case PROOF_REQUEST_DISSATISFIED_ATTRIBUTES_FOUND:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          dissatisfiedAttributes: action.dissatisfiedAttributes,
        },
      }
    default:
      return state
  }
}
