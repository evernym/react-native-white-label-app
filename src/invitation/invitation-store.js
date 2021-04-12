// @flow
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'redux-saga/effects'
import type {
  AriesOutOfBandInvite,
  Invitation,
  InvitationAction,
  InvitationPayload,
  InvitationReceivedActionData,
  InvitationResponseSendAction,
  InvitationResponseSendData,
  InvitationStore,
  OutOfBandInvitationAcceptedAction,
} from './type-invitation'
import {
  CONNECTION_INVITE_TYPES,
  ERROR_INVITATION_ALREADY_ACCEPTED,
  ERROR_INVITATION_CONNECT,
  HYDRATE_INVITATIONS,
  INVITATION_ACCEPTED,
  INVITATION_RECEIVED,
  INVITATION_REJECTED,
  INVITATION_RESPONSE_FAIL,
  INVITATION_RESPONSE_SEND,
  INVITATION_RESPONSE_SUCCESS,
  OUT_OF_BAND_INVITATION_ACCEPTED,
} from './type-invitation'
import { ResponseType } from '../components/request/type-request'
import { ERROR_INVITATION_RESPONSE_FAILED } from '../api/api-constants'
import {
  getAllInvitations,
  getConnection,
  getConnectionByUserDid,
  getConnectionExists,
  getInvitationPayload,
} from '../store/store-selector'
import {
  connectionAttachRequest,
  connectionDeleteAttachedRequest,
  connectionRequestSent,
  deletePendingConnection,
  saveNewOneTimeConnection,
  saveNewPendingConnection,
  sendConnectionReuse,
  updateConnection,
  updateConnectionSerializedState,
} from '../store/connections-store'
import {
  acceptInvitationVcx,
  connectionGetState,
  connectionUpdateStateWithMessage,
  createConnectionWithAriesInvite,
  createConnectionWithAriesOutOfBandInvite,
  createConnectionWithInvite,
  createCredentialWithAriesOfferObject,
  getHandleBySerializedConnection,
  serializeConnection,
  toUtf8FromBase64,
} from '../bridge/react-native-cxs/RNCxs'
import type { CustomError, GenericObject } from '../common/type-common'
import { ID, RESET, TYPE } from '../common/type-common'
import { captureError } from '../services/error/error-handler'
import { ensureVcxInitSuccess } from '../store/route-store'
import type { Connection, MyPairwiseInfo } from '../store/type-connection-store'
import { connectionFail, connectionSuccess, ERROR_CONNECTION } from '../store/type-connection-store'
import { flattenAsync } from '../common/flatten-async'
import { flatJsonParse } from '../common/flat-json-parse'
import {
  acceptClaimOffer,
  acceptOutofbandClaimOffer,
  saveSerializedClaimOffer,
} from '../claim-offer/claim-offer-store'
import {
  CLOUD_AGENT_UNAVAILABLE,
  CONNECTION_ALREADY_EXISTS,
  CONNECTION_ALREADY_EXISTS_MESSAGE,
} from '../bridge/react-native-cxs/error-cxs'
import {
  acceptOutofbandPresentationRequest,
  outOfBandConnectionForPresentationEstablished,
} from '../proof-request/proof-request-store'
import Snackbar from 'react-native-snackbar'
import { colors, venetianRed } from '../common/styles'
import { getHydrationItem, secureSet } from '../services/storage'
import { INVITATIONS } from '../common'
import { customLogger } from '../store/custom-logger'
import { retrySaga } from '../api/api-utils'
import { checkProtocolStatus } from '../store/protocol-status'
import { isConnectionCompleted } from '../store/store-utils'

export const invitationInitialState = {}

export const invitationReceived = (data: InvitationReceivedActionData) => ({
  type: INVITATION_RECEIVED,
  data,
})

export const sendInvitationResponse = (data: InvitationResponseSendData) => ({
  type: INVITATION_RESPONSE_SEND,
  data,
})

export const invitationAccepted = (
  senderDID: string,
  payload: InvitationPayload
) => ({
  type: INVITATION_ACCEPTED,
  senderDID,
  payload,
})

export const invitationSuccess = (senderDID: string) => ({
  type: INVITATION_RESPONSE_SUCCESS,
  senderDID,
})

export const invitationFail = (error: CustomError, senderDID: string) => ({
  type: INVITATION_RESPONSE_FAIL,
  error,
  senderDID,
})

export const invitationRejected = (senderDID: string) => ({
  type: INVITATION_REJECTED,
  senderDID,
})

export const acceptOutOfBandInvitation = (
  invitationPayload: InvitationPayload,
  attachedRequest: GenericObject
): OutOfBandInvitationAcceptedAction => ({
  type: OUT_OF_BAND_INVITATION_ACCEPTED,
  invitationPayload,
  attachedRequest,
})

export const hydrateInvitations = (invitations: { +[string]: Invitation }) => ({
  type: HYDRATE_INVITATIONS,
  invitations,
})

export function* sendResponse(
  action: InvitationResponseSendAction
): Generator<*, *, *> {
  const { senderDID } = action.data

  const payload: InvitationPayload = yield select(
    getInvitationPayload,
    senderDID
  )

  const connection = yield select(getConnection, senderDID)

  // connections exists + it is not completed
  // we are truing to establish it again
  // as new pairwise keys will be generated we need to remove the old one
  if (connection && connection.length > 0 && !connection[0].isCompleted) {
    yield put(deletePendingConnection(connection[0].identifier))
  }

  try {
    // aries connection
    if (payload.type === CONNECTION_INVITE_TYPES.ARIES_V1_QR) {
      yield call(sendResponseOnAriesConnectionInvitation, payload)
    } else if (payload.type === CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND) {
      // aries out-of-band connection
      yield call(sendResponseOnAriesOutOfBandInvitation, payload)
    } else {
      // proprietary connection
      yield call(sendResponseOnProprietaryConnectionInvitation, payload)
    }
  } catch (e) {
    yield call(handleConnectionError, e, payload.senderDID)
  }
}

export function* savePendingConnection(
  payload: InvitationPayload
): Generator<*, *, *> {
  try {
    yield put(invitationAccepted(payload.senderDID, payload))

    const connection = {
      identifier: payload.senderDID,
      logoUrl: payload.senderLogoUrl,
      senderDID: payload.senderDID,
      senderName: payload.senderName,
      publicDID: payload.senderDetail.publicDID,
      senderEndpoint: '',
      myPairwiseDid: '',
      myPairwiseVerKey: '',
      myPairwiseAgentDid: '',
      myPairwiseAgentVerKey: '',
      myPairwisePeerVerKey: '',
      ...payload,
    }

    yield put(saveNewPendingConnection(connection))
  } catch (e) {
    yield call(handleConnectionError, e, payload.senderDID)
  }
}

export function* sendResponseOnProprietaryConnectionInvitation(
  payload: InvitationPayload
): Generator<*, *, *> {
  try {
    yield call(savePendingConnection, payload)

    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      throw new Error({ message: vcxResult.fail.message })
    }

    const connectionHandle: number = yield call(
      createConnectionWithInvite,
      payload
    )

    let pairwiseInfo: MyPairwiseInfo = yield* retrySaga(
      call(acceptInvitationVcx, connectionHandle),
      CLOUD_AGENT_UNAVAILABLE
    )

    // once the connection is successful, we need to save serialized connection
    // in secure storage as well, because libIndy does not handle persistence
    // once we have persisted serialized state, we can hydrate vcx
    // if we need anything from that connection
    const vcxSerializedConnection: string = yield call(
      serializeConnection,
      connectionHandle
    )

    const connection = {
      identifier: pairwiseInfo.myPairwiseDid,
      logoUrl: payload.senderLogoUrl,
      senderDID: payload.senderDID,
      senderName: payload.senderName,
      senderEndpoint: payload.senderEndpoint,
      myPairwiseDid: pairwiseInfo.myPairwiseDid,
      myPairwiseVerKey: pairwiseInfo.myPairwiseVerKey,
      myPairwiseAgentDid: pairwiseInfo.myPairwiseAgentDid,
      myPairwiseAgentVerKey: pairwiseInfo.myPairwiseAgentVerKey,
      myPairwisePeerVerKey: pairwiseInfo.myPairwisePeerVerKey,
      vcxSerializedConnection,
      publicDID: payload.senderDetail.publicDID,
      isCompleted: false,
      ...payload,
    }

    yield put(updateConnection(connection))
    yield put(invitationSuccess(payload.senderDID))
    yield put(connectionSuccess(connection.identifier, connection.senderDID))
  } catch (e) {
    yield call(handleConnectionError, e, payload.senderDID)
  }
}

export function* sendResponseOnAriesConnectionInvitation(
  payload: InvitationPayload
): Generator<*, *, *> {
  try {
    yield call(savePendingConnection, payload)

    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      throw new Error({ message: vcxResult.fail.message })
    }

    const connectionHandle: number = yield call(
      createConnectionWithAriesInvite,
      payload
    )

    let pairwiseInfo: MyPairwiseInfo = yield* retrySaga(
      call(acceptInvitationVcx, connectionHandle),
      CLOUD_AGENT_UNAVAILABLE
    )

    // once the connection is successful, we need to save serialized connection
    // in secure storage as well, because libIndy does not handle persistence
    // once we have persisted serialized state, we can hydrate vcx
    // if we need anything from that connection
    const vcxSerializedConnection: string = yield call(
      serializeConnection,
      connectionHandle
    )

    const connection = {
      identifier: pairwiseInfo.myPairwiseDid,
      logoUrl: payload.senderLogoUrl,
      myPairwiseDid: pairwiseInfo.myPairwiseDid,
      myPairwiseVerKey: pairwiseInfo.myPairwiseVerKey,
      myPairwiseAgentDid: pairwiseInfo.myPairwiseAgentDid,
      myPairwiseAgentVerKey: pairwiseInfo.myPairwiseAgentVerKey,
      myPairwisePeerVerKey: pairwiseInfo.myPairwisePeerVerKey,
      vcxSerializedConnection,
      publicDID: payload.senderDetail.publicDID,
      isCompleted: false,
      ...payload,
    }
    yield put(updateConnection(connection))
    yield put(invitationSuccess(connection.senderDID))
    yield put(connectionRequestSent(connection.senderDID))

    yield call(
      checkConnectionStatus,
      connection.identifier,
      connection.senderName,
      connection.senderDID
    )
  } catch (e) {
    yield call(handleConnectionError, e, payload.senderDID)
  }
}

export function* checkConnectionStatus(
  identifier: string,
  senderName: string,
  senderDID: string
): Generator<*, *, *> {
  const error = ERROR_CONNECTION(senderName)
  const failAction = connectionFail(error, senderDID)

  yield spawn(checkProtocolStatus, {
    identifier: identifier,
    getObjectFunc: getConnectionByUserDid,
    isCompletedFunc: isConnectionCompleted,
    error: error,
    onErrorEvent: failAction,
  })
}

export function* sendResponseOnAriesOutOfBandInvitation(
  payload: InvitationPayload
): Generator<*, *, *> {
  if (!payload.originalObject) {
    return
  }

  if (
    payload.originalObject.handshake_protocols &&
    payload.originalObject.handshake_protocols.length > 0
  ) {
    yield call(sendResponseOnAriesOutOfBandInvitationWithHandshake, payload)
  } else {
    yield call(sendResponseOnAriesOutOfBandInvitationWithoutHandshake, payload)
  }
}

export function* sendResponseOnAriesOutOfBandInvitationWithHandshake(
  payload: InvitationPayload
): Generator<*, *, *> {
  try {
    yield call(savePendingConnection, payload)

    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      throw new Error({ message: vcxResult.fail.message })
    }

    const attachedRequest = yield call(
      getAttachedRequest,
      ((payload.originalObject: any): AriesOutOfBandInvite)
    )

    const connectionHandle: number = yield call(
      createConnectionWithAriesOutOfBandInvite,
      payload
    )

    // we need to setup regular connection
    let pairwiseInfo: MyPairwiseInfo = yield* retrySaga(
      call(acceptInvitationVcx, connectionHandle),
      CLOUD_AGENT_UNAVAILABLE
    )

    //  we need to save serialized connection
    // in secure storage as well, because VCX does not handle persistence
    // once we have persisted serialized state, we can hydrate vcx
    // if we need anything from that connection
    const vcxSerializedConnection: string = yield call(
      serializeConnection,
      connectionHandle
    )

    const connection = {
      identifier: pairwiseInfo.myPairwiseDid,
      logoUrl: payload.senderLogoUrl,
      myPairwiseDid: pairwiseInfo.myPairwiseDid,
      myPairwiseVerKey: pairwiseInfo.myPairwiseVerKey,
      myPairwiseAgentDid: pairwiseInfo.myPairwiseAgentDid,
      myPairwiseAgentVerKey: pairwiseInfo.myPairwiseAgentVerKey,
      myPairwisePeerVerKey: pairwiseInfo.myPairwisePeerVerKey,
      vcxSerializedConnection,
      publicDID: payload.senderDetail.publicDID,
      attachedRequest,
      isCompleted: false,
      ...payload,
    }
    yield put(updateConnection(connection))
    yield put(invitationSuccess(connection.senderDID))
    yield put(connectionRequestSent(connection.senderDID))
  } catch (e) {
    yield call(handleConnectionError, e, payload.senderDID)
  }
}

export function* sendResponseOnAriesOutOfBandInvitationWithoutHandshake(
  payload: InvitationPayload
): Generator<*, *, *> {
  try {
    const attachedRequest = yield call(
      getAttachedRequest,
      ((payload.originalObject: any): AriesOutOfBandInvite)
    )

    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      throw new Error({ message: vcxResult.fail.message })
    }

    const connectionHandle: number = yield call(
      createConnectionWithAriesOutOfBandInvite,
      payload
    )

    yield put(invitationSuccess(payload.senderDID))

    // we received an invitation reflecting one-time channel
    const vcxSerializedConnection: string = yield call(
      serializeConnection,
      connectionHandle
    )

    const connection = {
      identifier: payload.senderDID,
      logoUrl: payload.senderLogoUrl,
      senderDID: payload.senderDID,
      senderEndpoint: payload.senderEndpoint,
      senderName: payload.senderName,
      publicDID: payload.senderDetail.publicDID,
      vcxSerializedConnection,
      attachedRequest,
      myPairwiseDid: '',
      myPairwiseVerKey: '',
      myPairwiseAgentDid: '',
      myPairwiseAgentVerKey: '',
      myPairwisePeerVerKey: '',
    }

    yield put(saveNewOneTimeConnection(connection))
    yield* processAttachedRequest(payload.senderDID)
  } catch (e) {
    yield call(handleConnectionError, e, payload.senderDID)
  }
}

export function* updateAriesConnectionState(
  identifier: string,
  vcxSerializedConnection: string,
  message: string,
): Generator<*, *, *> {
  const connection = yield select(getConnectionByUserDid, identifier)

  try {
    const connectionHandle = yield call(
      getHandleBySerializedConnection,
      vcxSerializedConnection
    )

    yield* retrySaga(
      call(connectionUpdateStateWithMessage, connectionHandle, message),
      CLOUD_AGENT_UNAVAILABLE
    )

    const connectionState: number = yield call(
      connectionGetState,
      connectionHandle
    )

    // we need to take serialized connection state again
    // and update serialized state on MSDK side
    const updateVcxSerializedConnection = yield call(
      serializeConnection,
      connectionHandle
    )

    if (connectionState === 0) {
      // if connection object moved into state = 1 it means connection failed
      // TODO: update VCX Null state to contain details about connection failure reason
      yield call(
        handleConnectionError,
        Error(ERROR_INVITATION_RESPONSE_FAILED),
        connection.senderDID
      )
      return
    }

    const isCompleted = connectionState === 4

    yield put(
      updateConnectionSerializedState({
        identifier: identifier,
        vcxSerializedConnection: updateVcxSerializedConnection,
        isCompleted: isCompleted,
      })
    )

    if (isCompleted) {
      yield put(connectionSuccess(connection.identifier, connection.senderDID))
      yield* processAttachedRequest(identifier)
    }
  } catch (e) {
    yield call(handleConnectionError, e, connection.senderDID)
  }
}

export function* handleConnectionError(
  e: CustomError,
  senderDID: string
): Generator<*, *, *> {
  captureError(new Error(e.message))
  console.log(`handleConnectionError: ${e.message}`)
  let message
  if (e.code === CONNECTION_ALREADY_EXISTS) {
    yield put(
      invitationFail(ERROR_INVITATION_ALREADY_ACCEPTED(e.message), senderDID)
    )
    message = CONNECTION_ALREADY_EXISTS_MESSAGE
  } else {
    yield put(invitationFail(ERROR_INVITATION_CONNECT(e.message), senderDID))
    message = ERROR_INVITATION_RESPONSE_FAILED
  }
  yield put(connectionFail(e, senderDID))
  Snackbar.show({
    text: message,
    duration: Snackbar.LENGTH_LONG,
    backgroundColor: venetianRed,
    textColor: colors.white,
  })
}

function* outOfBandInvitationAccepted(
  action: OutOfBandInvitationAcceptedAction
): Generator<*, *, *> {
  const { invitationPayload, attachedRequest } = action

  const connectionExists = yield select(
    getConnectionExists,
    action.invitationPayload.senderDID
  )
  if (!connectionExists) {
    yield put(
      invitationReceived({
        payload: invitationPayload,
      })
    )

    yield put(
      sendInvitationResponse({
        response: ResponseType.accepted,
        senderDID: invitationPayload.senderDID,
      })
    )
  } else {
    const [connection]: Connection[] = yield select(
      getConnection,
      action.invitationPayload.senderDID
    )

    yield put(connectionAttachRequest(connection.identifier, attachedRequest))

    if (!invitationPayload.originalObject) {
      return
    }

    const invitation = ((invitationPayload.originalObject: any): AriesOutOfBandInvite)

    yield put(
      sendConnectionReuse(invitation, {
        senderDID: action.invitationPayload.senderDID,
      })
    )
  }

  if (attachedRequest[TYPE].endsWith('offer-credential')) {
    yield put(
      acceptOutofbandClaimOffer(
        action.attachedRequest[ID],
        action.invitationPayload.senderDID,
        connectionExists
      )
    )
  } else if (attachedRequest[TYPE].endsWith('request-presentation')) {
    yield put(
      acceptOutofbandPresentationRequest(
        action.attachedRequest[ID],
        action.invitationPayload.senderDID,
        connectionExists
      )
    )
  }
}

export async function getAttachedRequest(
  invite: AriesOutOfBandInvite
): GenericObject {
  const requests = invite['request~attach']
  if (!requests || !requests.length) {
    return null
  }

  const req = requests[0].data
  if (!req) {
    return null
  }

  if (req.json) {
    const [error, reqData] = flatJsonParse(req.json)
    if (error || !reqData) {
      return null
    }

    return reqData
  } else if (req.base64) {
    const [decodeError, decodedRequest] = await flattenAsync(toUtf8FromBase64)(
      req.base64
    )
    if (decodeError || decodedRequest === null) {
      return null
    }

    const [error, reqData] = flatJsonParse(decodedRequest)
    if (error || !reqData) {
      return null
    }

    return reqData
  }

  return null
}

export function* processAttachedRequest(did: string): Generator<*, *, *> {
  const connection = yield select(getConnectionByUserDid, did)
  const attachedRequest = connection.attachedRequest
  if (!attachedRequest) {
    return
  }

  yield put(connectionDeleteAttachedRequest(connection.identifier))

  const uid = attachedRequest[ID]

  if (attachedRequest[TYPE].endsWith('offer-credential')) {
    const { claimHandle } = yield call(
      createCredentialWithAriesOfferObject,
      uid,
      attachedRequest
    )

    yield call(
      saveSerializedClaimOffer,
      claimHandle,
      connection.identifier,
      uid
    )
    yield put(acceptClaimOffer(uid, connection.senderDID))
  } else if (attachedRequest[TYPE].endsWith('request-presentation')) {
    yield put(outOfBandConnectionForPresentationEstablished(uid))
  }
}

export function* persistInvitations(): Generator<*, *, *> {
  try {
    const invitations = yield select(getAllInvitations)
    yield call(secureSet, INVITATIONS, JSON.stringify(invitations))
  } catch (e) {
    captureError(e)
    customLogger.log(`persistInvitations Error: ${e}`)
  }
}

export function* hydrateInvitationsSaga(): Generator<*, *, *> {
  try {
    const invitations = yield call(getHydrationItem, INVITATIONS)
    if (invitations) {
      yield put(hydrateInvitations(JSON.parse(invitations)))
    }
  } catch (e) {
    // to capture secure get
    captureError(e)
    customLogger.log(`hydrateInvitationsSaga: ${e}`)
  }
}


function* watchInvitationReceived(): any {
  yield takeEvery(
    [
      INVITATION_ACCEPTED,
      INVITATION_RESPONSE_SUCCESS,
      INVITATION_RESPONSE_FAIL,
      INVITATION_REJECTED,
    ],
    persistInvitations
  )
}

function* watchOutOfBandInvitationAccepted(): any {
  yield takeEvery(OUT_OF_BAND_INVITATION_ACCEPTED, outOfBandInvitationAccepted)
}

function* watchSendInvitationResponse(): any {
  yield takeLatest(INVITATION_RESPONSE_SEND, sendResponse)
}

export function* watchInvitation(): any {
  yield all([
    watchInvitationReceived(),
    watchOutOfBandInvitationAccepted(),
    watchSendInvitationResponse(),
  ])
}

export default function invitationReducer(
  state: InvitationStore = invitationInitialState,
  action: InvitationAction
) {
  switch (action.type) {
    case INVITATION_RECEIVED:
      return {
        ...state,
        [action.data.payload.senderDID]: {
          ...action.data,
          status: ResponseType.none,
          isFetching: false,
          error: null,
        },
      }

    case INVITATION_RESPONSE_SEND:
      return {
        ...state,
        [action.data.senderDID]: {
          ...state[action.data.senderDID],
          isFetching: true,
          status: action.data.response,
          error: null,
        },
      }

    case INVITATION_RESPONSE_SUCCESS: {
      const { [action.senderDID]: deleted, ...invitations } = state
      return invitations
    }

    case INVITATION_RESPONSE_FAIL:
      return {
        ...state,
        [action.senderDID]: {
          ...state[action.senderDID],
          isFetching: false,
          error: action.error,
          status: ResponseType.none,
        },
      }

    case INVITATION_REJECTED: {
      const { [action.senderDID]: deleted, ...invitations } = state
      return invitations
    }

    case HYDRATE_INVITATIONS:
      return {
        ...state,
        ...action.invitations,
      }

    case RESET:
      return invitationInitialState

    default:
      return state
  }
}
