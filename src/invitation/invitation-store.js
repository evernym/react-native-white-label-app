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
  HANDLE_INVITATION,
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
  getConnectionPairwiseAgentInfo,
  getInvitationPayload,
} from '../store/store-selector'
import {
  connectionAttachRequest,
  connectionDeleteAttachedRequest,
  connectionRequestSent,
  createPairwiseAgentSaga,
  deletePendingConnection,
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
} from '../bridge/react-native-cxs/RNCxs'
import type { CustomError, GenericObject } from '../common/type-common'
import { RESET, TYPE } from '../common/type-common'
import { captureError } from '../services/error/error-handler'
import { ensureVcxInitSuccess } from '../store/route-store'
import type { Connection } from '../store/type-connection-store'
import { connectionFail, connectionSuccess, ERROR_CONNECTION } from '../store/type-connection-store'
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
import { getHydrationItem, secureSet } from '../services/storage'
import { INVITATIONS } from '../common'
import { customLogger } from '../store/custom-logger'
import { retrySaga } from '../api/api-utils'
import { checkProtocolStatus } from '../store/protocol-status'
import { isConnectionCompleted } from '../store/store-utils'
import { outofbandProofProposalAccepted, proofProposalAccepted } from '../verifier/verifier-store'
import { watchHandleInvitation } from './invitation-handler'
import { showSnackError } from '../store/config-store'
import { getAttachedRequestId } from './invitation-helpers'

export const invitationInitialState = {}

export const invitationReceived = (data: InvitationReceivedActionData) => ({
  type: INVITATION_RECEIVED,
  data,
})

export const sendInvitationResponse = (data: InvitationResponseSendData) => ({
  type: INVITATION_RESPONSE_SEND,
  data,
})

export const handleInvitation = (invitation: any, token?: string): any => ({
  type: HANDLE_INVITATION,
  invitation,
  token,
})

export const invitationAccepted = (
  senderDID: string,
  payload: InvitationPayload,
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
): OutOfBandInvitationAcceptedAction => ({
  type: OUT_OF_BAND_INVITATION_ACCEPTED,
  invitationPayload,
})

export const hydrateInvitations = (invitations: { +[string]: Invitation }) => ({
  type: HYDRATE_INVITATIONS,
  invitations,
})

export function* savePendingConnection(
  payload: InvitationPayload,
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

export function* makeConnection(
  connectionHandle: number,
): Generator<*, *, *> {
  const agentInfo = yield select(getConnectionPairwiseAgentInfo)

  const {
    connection,
    serializedConnection,
  } = yield* retrySaga(
    call(acceptInvitationVcx, connectionHandle, agentInfo),
    CLOUD_AGENT_UNAVAILABLE,
  )

  // create new pairwise agent
  yield spawn(createPairwiseAgentSaga)

  return {
    pairwiseInfo: connection,
    vcxSerializedConnection: serializedConnection,
  }
}

export function* checkConnectionStatus(
  identifier: string,
  senderName: string,
  senderDID: string,
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

export function* sendResponse(
  action: InvitationResponseSendAction,
): Generator<*, *, *> {
  const { senderDID } = action.data

  const payload: InvitationPayload = yield select(
    getInvitationPayload,
    senderDID,
  )

  const connection = yield select(getConnection, senderDID)

  // connections exists + it is not completed
  // we are truing to establish it again
  // as new pairwise keys will be generated we need to remove the old one
  if (connection && connection.length > 0 && !connection[0].isCompleted) {
    yield put(deletePendingConnection(connection[0].identifier))
  }

  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    throw new Error({ message: vcxResult.fail.message })
  }

  yield call(savePendingConnection, payload)

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

export function* sendResponseOnProprietaryConnectionInvitation(
  payload: InvitationPayload,
): Generator<*, *, *> {
  try {
    const connectionHandle: number = yield call(
      createConnectionWithInvite,
      payload,
    )

    const {
      pairwiseInfo,
      vcxSerializedConnection,
    } = yield* retrySaga(call(makeConnection, connectionHandle))

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
  payload: InvitationPayload,
): Generator<*, *, *> {
  try {
    const connectionHandle: number = yield call(
      createConnectionWithAriesInvite,
      payload,
    )

    const {
      pairwiseInfo,
      vcxSerializedConnection,
    } = yield* retrySaga(call(makeConnection, connectionHandle))

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
      connection.senderDID,
    )
  } catch (e) {
    yield call(handleConnectionError, e, payload.senderDID)
  }
}

export function* sendResponseOnAriesOutOfBandInvitation(
  payload: InvitationPayload,
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
  payload: InvitationPayload,
): Generator<*, *, *> {
  try {
    const connectionHandle: number = yield call(
      createConnectionWithAriesOutOfBandInvite,
      payload,
    )

    const {
      pairwiseInfo,
      vcxSerializedConnection,
    } = yield* retrySaga(call(makeConnection, connectionHandle))

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
      attachedRequest: payload.attachedRequest,
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
  payload: InvitationPayload,
): Generator<*, *, *> {
  try {
    const connectionHandle: number = yield call(
      createConnectionWithAriesOutOfBandInvite,
      payload,
    )

    let pairwiseInfo = {}
    let vcxSerializedConnection

    const attachedRequest = payload.attachedRequest

    if (attachedRequest &&
      (attachedRequest[TYPE].endsWith('offer-credential') || attachedRequest[TYPE].endsWith('propose-presentation'))) {
      // for these message we need to create pairwise agent to use service decorator
      const data = yield* retrySaga(call(makeConnection, connectionHandle))
      pairwiseInfo = data.pairwiseInfo
      vcxSerializedConnection = data.vcxSerializedConnection
    } else {
      vcxSerializedConnection = yield call(
        serializeConnection,
        connectionHandle,
      )
    }

    const identifier = pairwiseInfo.myPairwiseDid || payload.senderDID

    const connection = {
      identifier,
      logoUrl: payload.senderLogoUrl,
      senderDID: payload.senderDID,
      senderEndpoint: payload.senderEndpoint,
      senderName: payload.senderName,
      publicDID: payload.senderDetail.publicDID,
      vcxSerializedConnection,
      attachedRequest,
      myPairwiseDid: pairwiseInfo.myPairwiseDid,
      myPairwiseVerKey: pairwiseInfo.myPairwiseVerKey,
      myPairwiseAgentDid: pairwiseInfo.myPairwiseAgentDid,
      myPairwiseAgentVerKey: pairwiseInfo.myPairwiseAgentVerKey,
      myPairwisePeerVerKey: pairwiseInfo.myPairwisePeerVerKey,
    }

    yield put(updateConnection(connection))
    yield put(invitationSuccess(connection.senderDID))
    yield put(connectionSuccess(identifier, connection.senderDID))

    yield* processAttachedRequest(connection)
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
      vcxSerializedConnection,
    )

    yield* retrySaga(
      call(connectionUpdateStateWithMessage, connectionHandle, message),
      CLOUD_AGENT_UNAVAILABLE,
    )

    const connectionState: number = yield call(
      connectionGetState,
      connectionHandle,
    )

    // we need to take serialized connection state again
    // and update serialized state on MSDK side
    const updateVcxSerializedConnection = yield call(
      serializeConnection,
      connectionHandle,
    )

    if (connectionState === 0) {
      // if connection object moved into state = 1 it means connection failed
      // TODO: update VCX Null state to contain details about connection failure reason
      yield call(
        handleConnectionError,
        Error(ERROR_INVITATION_RESPONSE_FAILED),
        connection.senderDID,
      )
      return
    }

    const isCompleted = connectionState === 4

    yield put(
      updateConnectionSerializedState({
        identifier: identifier,
        vcxSerializedConnection: updateVcxSerializedConnection,
        isCompleted: isCompleted,
      }),
    )

    if (isCompleted) {
      yield put(connectionSuccess(connection.identifier, connection.senderDID))
      yield* processAttachedRequest(connection)
    }
  } catch (e) {
    yield call(handleConnectionError, e, connection.senderDID)
  }
}

export function* handleConnectionError(
  e: CustomError,
  senderDID: string,
): Generator<*, *, *> {
  captureError(new Error(e.message))
  let message
  if (e.code === CONNECTION_ALREADY_EXISTS) {
    yield put(
      invitationFail(ERROR_INVITATION_ALREADY_ACCEPTED(e.message), senderDID),
    )
    message = CONNECTION_ALREADY_EXISTS_MESSAGE
  } else {
    yield put(invitationFail(ERROR_INVITATION_CONNECT(e.message), senderDID))
    message = ERROR_INVITATION_RESPONSE_FAILED
  }
  yield put(connectionFail(e, senderDID))
  yield call(showSnackError, message)
}

function* outOfBandInvitationAccepted(
  action: OutOfBandInvitationAcceptedAction,
): Generator<*, *, *> {
  const { invitationPayload } = action

  const connectionExists = yield select(
    getConnectionExists,
    action.invitationPayload.senderDID,
  )
  if (!connectionExists) {
    yield put(
      invitationReceived({
        payload: invitationPayload,
      }),
    )

    yield put(
      sendInvitationResponse({
        response: ResponseType.accepted,
        senderDID: invitationPayload.senderDID,
      }),
    )
  } else {
    const [connection]: Connection[] = yield select(
      getConnection,
      action.invitationPayload.senderDID,
    )

    if (invitationPayload.attachedRequest) {
      yield put(connectionAttachRequest(connection.identifier, invitationPayload.attachedRequest))
    }

    if (!invitationPayload.originalObject) {
      return
    }

    const invitation = ((invitationPayload.originalObject: any): AriesOutOfBandInvite)

    yield put(
      sendConnectionReuse(invitation, {
        senderDID: action.invitationPayload.senderDID,
      }),
    )

    if (!invitationPayload.attachedRequest) {
      return
    }

    const type_ = invitationPayload.attachedRequest[TYPE]
    const id = getAttachedRequestId(invitationPayload.attachedRequest)

    if (type_.endsWith('offer-credential')) {
      yield put(
        acceptOutofbandClaimOffer(
          id,
          action.invitationPayload.senderDID,
          connectionExists,
        ),
      )
    } else if (type_.endsWith('request-presentation')) {
      yield put(
        acceptOutofbandPresentationRequest(
          id,
          action.invitationPayload.senderDID,
          connectionExists,
        ),
      )
    } else if (type_.endsWith('propose-presentation')) {
      yield put(
        outofbandProofProposalAccepted(id),
      )
    }
  }
}

export function* processAttachedRequest(connection: GenericObject): Generator<*, *, *> {
  const attachedRequest = connection.attachedRequest
  if (!attachedRequest) {
    return
  }
  const uid = getAttachedRequestId(attachedRequest)
  const type_ = attachedRequest[TYPE]
  if (type_.endsWith('offer-credential')) {
    const { claimHandle } = yield call(
      createCredentialWithAriesOfferObject,
      uid,
      attachedRequest,
    )

    yield call(
      saveSerializedClaimOffer,
      claimHandle,
      connection.identifier,
      uid,
    )
    yield put(acceptClaimOffer(uid, connection.senderDID))
  } else if (type_.endsWith('request-presentation')) {
    yield put(outOfBandConnectionForPresentationEstablished(uid))
  } else if (type_.endsWith('propose-presentation')) {
    yield put(proofProposalAccepted(uid))
  }

  yield put(connectionDeleteAttachedRequest(connection.identifier))
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
    persistInvitations,
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
    watchHandleInvitation(),
  ])
}

export default function invitationReducer(
  state: InvitationStore = invitationInitialState,
  action: InvitationAction,
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
