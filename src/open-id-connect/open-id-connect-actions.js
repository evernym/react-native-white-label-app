// @flow

import type { CustomError } from '../common/type-common'
import type { OIDCAuthenticationRequest } from '../components/qr-scanner/type-qr-scanner'

export const OPEN_ID_CONNECT_STATE = {
  REQUEST_RECEIVED: 'REQUEST_RECEIVED',
  SEEN: 'SEEN',
  YES_SELECTED: 'YES_SELECTED',
  YES_SEND_IN_PROGRESS: 'YES_SEND_IN_PROGRESS',
  YES_SEND_SUCCESS: 'YES_SEND_SUCCESS',
  YES_SEND_FAIL: 'YES_SEND_FAIL',
  NO_SELECTED: 'NO_SELECTED',
  NO_SEND_IN_PROGRESS: 'NO_SEND_IN_PROGRESS',
  NO_SEND_SUCCESS: 'NO_SEND_SUCCESS',
  NO_SEND_FAIL: 'NO_SEND_FAIL',
  NO_CONNECTION_ERROR_SEND_PROGRESS: 'NO_CONNECTION_ERROR_SEND_PROGRESS',
  NO_CONNECTION_ERROR_SEND_FAIL: 'NO_CONNECTION_ERROR_SEND_FAIL',
  NO_CONNECTION_ERROR_SEND_SUCCESS: 'NO_CONNECTION_ERROR_SEND_SUCCESS',
}
export type OpenIdConnectState = $Keys<typeof OPEN_ID_CONNECT_STATE>

export const OPEN_ID_CONNECT_UPDATE_STATUS = 'OPEN_ID_CONNECT_UPDATE_STATUS'
export const openIdConnectUpdateStatus = (
  oidcAuthenticationRequest: OIDCAuthenticationRequest,
  state: OpenIdConnectState,
  error?: CustomError
) => ({
  type: OPEN_ID_CONNECT_UPDATE_STATUS,
  oidcAuthenticationRequest,
  state,
  error,
})
export type OpenIdConnectUpdateStatusAction = {
  type: typeof OPEN_ID_CONNECT_UPDATE_STATUS,
  oidcAuthenticationRequest: OIDCAuthenticationRequest,
  state: OpenIdConnectState,
  error?: ?CustomError,
}

export type OpenIdConnectActions = OpenIdConnectUpdateStatusAction

export type OpenIdConnectRequest = $ReadOnly<{
  oidcAuthenticationRequest: OIDCAuthenticationRequest,
  state: OpenIdConnectState,
  error: ?CustomError,
  version: number,
}>

export type OpenIdConnectStore = $ReadOnly<{
  data: $ReadOnly<{
    [id: string]: OpenIdConnectRequest,
  }>,
  version: number,
}>

export const OPEN_ID_ERROR = {
  NO_CONNECTION: () => ({
    code: 'OIDC-001',
    message:
      'Unable to approve login request. You do not have a connection with this entity.',
  }),
  NO_CONNECTION_HANDLE: (message: string) => ({
    code: 'OIDC-002',
    message,
    displayMessage: 'OIDC-002::Unable to approve login request.',
  }),
  ENCODING_HEADER: (message: string) => ({
    code: 'OIDC-003',
    message,
    displayMessage: 'OIDC-003::Unable to approve login request.',
  }),
  SIGNING_PAYLOAD: (message: string) => ({
    code: 'OIDC-004',
    message,
    displayMessage: 'OIDC-004::Unable to approve login request.',
  }),
  ENCODING_PAYLOAD: (message: string) => ({
    code: 'OIDC-005',
    message,
    displayMessage: 'OIDC-005::Unable to approve login request.',
  }),
  SEND_ERROR: (
    message: string,
    name: string,
    isResolvableByRetry?: boolean = true
  ) => ({
    code: 'OIDC-006',
    message,
    displayMessage: `Unable to approve login request. ${name} did not acknowledge approval.`,
    isResolvableByRetry,
  }),
  THUMBPRINT: (message: string) => ({
    code: 'OIDC-007',
    message,
    displayMessage: 'OIDC-007::Unable to approve login request.',
  }),
}
