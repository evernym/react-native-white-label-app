// @flow

import { put, takeLatest, call, all, select } from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import moment from 'moment'
import { stringify } from 'query-string'

import type {
  OpenIdConnectUpdateStatusAction,
  OpenIdConnectStore,
  OpenIdConnectActions,
  OpenIdConnectState,
} from './open-id-connect-actions'
import type { Connection } from '../store/type-connection-store'
import type { SignDataResponse } from '../bridge/react-native-cxs/type-cxs'

import {
  OPEN_ID_CONNECT_STATE,
  OPEN_ID_CONNECT_UPDATE_STATUS,
  openIdConnectUpdateStatus,
  OPEN_ID_ERROR,
} from './open-id-connect-actions'
import { getConnectionByProp } from '../store/store-selector'
import { flattenAsync } from '../common/flatten-async'
import {
  getHandleBySerializedConnection,
  connectionSignData,
  toBase64FromUtf8,
  generateThumbprint,
} from '../bridge/react-native-cxs/RNCxs'
import { flatFetch } from '../common/flat-fetch'
import { removeBase64Padding } from '../common/base64-padding'

export function* watchOpenIdConnectStore(): any {
  yield all([watchOnOpenIdConnectYes(), watchOnOpenIdConnectNo()])
}

export function* watchOnOpenIdConnectYes(): any {
  yield takeLatest(isOpenIdConnectYes, openIdConnectYesSaga)
}

export function* watchOnOpenIdConnectNo(): any {
  yield takeLatest(isOpenIdConnectNo, openIdConnectNoSaga)
}

// action is typed any because action can be of any type
// since redux passes every action all throughout reducers to check if it matches
function isOpenIdConnectYes(action: any): boolean {
  // we check if open id connect request status is being updated
  // and is updated with YES, if Yes, then we need to
  // run business logic in saga
  return (
    action.type === OPEN_ID_CONNECT_UPDATE_STATUS &&
    action.state === OPEN_ID_CONNECT_STATE.YES_SELECTED
  )
}

// action is typed any because action can be of any type
// since redux passes every action all throughout reducers to check if it matches
function isOpenIdConnectNo(action: any): boolean {
  // we check if open id connect request status is being updated
  // and is updated with NO, if No, then we need to
  // run business logic in saga
  return (
    action.type === OPEN_ID_CONNECT_UPDATE_STATUS &&
    action.state === OPEN_ID_CONNECT_STATE.NO_SELECTED
  )
}

export function* openIdConnectYesSaga(
  action: OpenIdConnectUpdateStatusAction
): Generator<*, *, *> {
  const {
    oidcAuthenticationRequest: {
      jwtAuthenticationRequest,
      oidcAuthenticationQrCode,
    },
  } = action

  const oidcResponseSendStartTime = moment()
  yield put(
    openIdConnectUpdateStatus(
      action.oidcAuthenticationRequest,
      OPEN_ID_CONNECT_STATE.YES_SEND_IN_PROGRESS
    )
  )

  const senderFullyQualifiedPublicDID = jwtAuthenticationRequest.body.iss
  // DID inside JWT body is in fully qualified format did:sov:<pairwise-did>
  // while, when we establish a connection it is without did:sov:
  // so, when we compare publicDID in MSDK with publicDID sent in JWT
  // we need to remove did:sov: and take just DID part
  const senderPublicDID = senderFullyQualifiedPublicDID.split(':').slice(-1)[0]

  // get pairwise connection, so that we should have details such as
  // public key of sender, MSDK side pairwise key, verKey
  const possibleConnections: Connection[] = yield select(
    getConnectionByProp,
    'publicDID',
    senderPublicDID
  )
  if (possibleConnections.length === 0) {
    // if we don't find a connection with sender's public DID
    // then we need to send this error to the requester website
    yield* sendErrorResponse(
      {
        error: 'connection_not_found',
        error_description: `No connection found with public DID: ${senderFullyQualifiedPublicDID}`,
        state: jwtAuthenticationRequest.body.state,
      },
      {
        PROGRESS: OPEN_ID_CONNECT_STATE.NO_CONNECTION_ERROR_SEND_PROGRESS,
        FAIL: OPEN_ID_CONNECT_STATE.NO_CONNECTION_ERROR_SEND_FAIL,
        SUCCESS: OPEN_ID_CONNECT_STATE.NO_CONNECTION_ERROR_SEND_SUCCESS,
      },
      action
    )

    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SEND_FAIL,
        OPEN_ID_ERROR.NO_CONNECTION()
      )
    )
    return
  }

  const [connection] = possibleConnections
  const [getHandleError, connectionHandle]: [typeof Error, number] = yield call(
    flattenAsync(getHandleBySerializedConnection),
    connection.vcxSerializedConnection
  )
  if (getHandleError) {
    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SEND_FAIL,
        OPEN_ID_ERROR.NO_CONNECTION_HANDLE(getHandleError.toString())
      )
    )
    return
  }

  // Now we know that we have connection and also we should be able to sign the request
  // we can now start building the response to authentication request
  // in JWT format
  const base64EncodedOption = 'URL_SAFE'

  // create Header
  const kid = `${connection.myPairwiseDid}#${connection.myPairwiseVerKey}`
  const header = {
    alg: 'Ed25519',
    typ: 'JWT',
    kid,
  }
  const [encodingError, base64EncodedHeader] = yield call(
    flattenAsync(toBase64FromUtf8),
    JSON.stringify(header),
    base64EncodedOption
  )
  if (encodingError) {
    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SEND_FAIL,
        OPEN_ID_ERROR.ENCODING_HEADER(encodingError.toString())
      )
    )
    return
  }

  // create payload
  const sub_jwk = {
    crv: 'Ed25519',
    kid,
    kty: 'OKP',
    x: connection.myPairwiseVerKey,
  }
  // to generate thumbprint, we need another object which is similar
  // to sub_jwk, but without property kid
  // below, we are removing that property and creating an object
  // which will be used for thumbprint generation
  const { kid: subKid, ...subForThumbprint } = sub_jwk
  // before hashing data for jwk, we need to convert to json to string
  // and conversion of json to string should have keys sorted lexically
  const dataForThumbprint = JSON.stringify(
    subForThumbprint,
    Object.keys(subForThumbprint).sort()
  )
  const [thumbprintError, thumbprint] = yield call(
    flattenAsync(generateThumbprint),
    dataForThumbprint,
    base64EncodedOption
  )
  if (thumbprintError) {
    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SEND_FAIL,
        OPEN_ID_ERROR.THUMBPRINT(thumbprintError.toString())
      )
    )
    return
  }

  const payload = {
    iss: 'https://self-issued.me',
    aud: oidcAuthenticationQrCode.clientId,
    nonce: jwtAuthenticationRequest.body.nonce,
    exp: moment.utc().add(6, 'minutes').format(),
    iat: moment.utc().format(),
    sub_jwk,
    sub: removeBase64Padding(thumbprint.trim()),
    did_comm: {
      did: connection.myPairwiseDid,
    },
  }
  const [signError, { data, signature }]: [
    typeof Error,
    SignDataResponse
  ] = yield call(
    flattenAsync(connectionSignData),
    connectionHandle,
    JSON.stringify(payload),
    base64EncodedOption,
    false
  )
  if (signError) {
    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SEND_FAIL,
        OPEN_ID_ERROR.SIGNING_PAYLOAD(signError.toString())
      )
    )
    return
  }
  const [payloadEncodingError, base64EncodedPayload] = yield call(
    flattenAsync(toBase64FromUtf8),
    data,
    base64EncodedOption
  )
  if (payloadEncodingError) {
    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SEND_FAIL,
        OPEN_ID_ERROR.ENCODING_PAYLOAD(payloadEncodingError.toString())
      )
    )
    return
  }

  // create final jwt response
  const jwtResponse = `${base64EncodedHeader}.${base64EncodedPayload}.${signature}`
  const response = {
    id_token: jwtResponse,
    state: jwtAuthenticationRequest.body.state,
  }
  const [sendError] = yield call(
    flatFetch,
    oidcAuthenticationQrCode.clientId,
    stringify(response),
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  )
  if (sendError) {
    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        OPEN_ID_CONNECT_STATE.YES_SEND_FAIL,
        OPEN_ID_ERROR.SEND_ERROR(
          sendError.toString(),
          connection.senderName || 'Anonymous',
          true
        )
      )
    )
    return
  }

  yield* addArtificialDelayIfNeeded(oidcResponseSendStartTime)

  yield put(
    openIdConnectUpdateStatus(
      action.oidcAuthenticationRequest,
      OPEN_ID_CONNECT_STATE.YES_SEND_SUCCESS
    )
  )
}

export function* openIdConnectNoSaga(
  action: OpenIdConnectUpdateStatusAction
): Generator<*, *, *> {
  const response = {
    error: 'access_denied',
    error_description: 'The user rejected the request',
    state: action.oidcAuthenticationRequest.jwtAuthenticationRequest.body.state,
  }

  yield* sendErrorResponse(
    response,
    {
      PROGRESS: OPEN_ID_CONNECT_STATE.NO_SEND_IN_PROGRESS,
      FAIL: OPEN_ID_CONNECT_STATE.NO_SEND_FAIL,
      SUCCESS: OPEN_ID_CONNECT_STATE.NO_SEND_SUCCESS,
    },
    action
  )
}

function* sendErrorResponse(
  response: { error: string, error_description: string, state: string },
  states: {
    PROGRESS: OpenIdConnectState,
    FAIL: OpenIdConnectState,
    SUCCESS: OpenIdConnectState,
  },
  action: OpenIdConnectUpdateStatusAction
): Generator<*, *, *> {
  yield put(
    openIdConnectUpdateStatus(action.oidcAuthenticationRequest, states.PROGRESS)
  )

  const [sendError] = yield call(
    flatFetch,
    action.oidcAuthenticationRequest.oidcAuthenticationQrCode.clientId,
    stringify(response),
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  )
  if (sendError) {
    yield put(
      openIdConnectUpdateStatus(
        action.oidcAuthenticationRequest,
        states.FAIL,
        OPEN_ID_ERROR.SEND_ERROR(sendError.toString(), 'Connection')
      )
    )
    return
  }

  yield put(
    openIdConnectUpdateStatus(action.oidcAuthenticationRequest, states.SUCCESS)
  )
}

// TODO:KS Move to a common place where we can use this anywhere it is needed
export function* addArtificialDelayIfNeeded(
  startTime: moment$Moment
): Generator<*, *, *> {
  const endTime = moment()
  const expectedDelayTime = startTime.add(1.5, 'seconds')
  if (expectedDelayTime.isAfter(endTime)) {
    // if we sign and send request successfully within two seconds
    // then on UI, we would see jumps with loader
    // it would be shown to user and immediately success would be shown
    // it would not be a good user experience
    // so we are ensuring that user sees Loader for at least two seconds
    // so that MSDK can avoid showing UI jumps

    // Now, since we know that less than 1.5 seconds has passed since
    // we started sending request, and hence we know that user will see
    // quick UI shift between loader and success
    // so we delay raising success action till user has perceived loading
    // for 1.5 seconds
    const remainingTime = moment
      .duration(expectedDelayTime.diff(endTime))
      .asMilliseconds()
    if (remainingTime > 100) {
      // if the remaining time for which we need to display loader is less than 100ms
      // then we won't delay it anymore
      yield call(delay, remainingTime)
    }
  }
}

const currentOpenIdConnectStoreVersion = 1
const currentOpenIdConnectRequestVersion = 1
const initialState: OpenIdConnectStore = {
  data: {},
  version: currentOpenIdConnectStoreVersion,
}

export function openIdConnectReducer(
  openIdConnectStore: OpenIdConnectStore = initialState,
  action: OpenIdConnectActions
): OpenIdConnectStore {
  switch (action.type) {
    case OPEN_ID_CONNECT_UPDATE_STATUS: {
      const existingRequest =
        openIdConnectStore.data[action.oidcAuthenticationRequest.id]
      return {
        ...openIdConnectStore,
        data: {
          ...openIdConnectStore.data,
          [action.oidcAuthenticationRequest.id]: {
            ...(existingRequest || {}),
            oidcAuthenticationRequest: action.oidcAuthenticationRequest,
            state: action.state,
            error: action.error,
            version: currentOpenIdConnectRequestVersion,
          },
        },
        version: currentOpenIdConnectStoreVersion,
      }
    }

    default:
      return openIdConnectStore
  }
}
