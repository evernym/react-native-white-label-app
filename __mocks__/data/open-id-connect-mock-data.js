// @flow

import { OPEN_ID_CONNECT_STATE } from '../../src/open-id-connect/open-id-connect-actions'

export const mockOpenIdConnectRequest1Id =
  'a35dc33c-b88f-4c55-a4b1-1a9451b54cf7'

export const mockOpenIdConnectRequestData1 = {
  id: mockOpenIdConnectRequest1Id,
  jwtAuthenticationRequest: {
    body: {
      client_id: 'http://192.168.1.4:4005/cb',
      iss: 'did:sov:3C4TKPKo3wRi3AMmXVjaHc',
      nonce: 'GKSYeFnP2bSPBMvX8CFlg99lA_u_HQwC3xtbULY17ew',
      registration: {
        id_token_signed_response_alg: ['Ed25519'],
        jwks_uri: null,
        request_object_signing_alg: 'none',
      },
      response_mode: 'form_post',
      response_type: 'id_token',
      scope: 'openid did_authn',
      state: 'brYg8-5-1nlCcRtSAa5Y6n_W9WcpyMhdXerhGUNtAxI',
    },
    encodedSignature:
      'BukDc87nGbYnhdOZmcxTWTMZRQuuP8h3z2n0eqIWU5MzM-XT7z5QINgdw6Gl_lrLr_LUYiwyATmPe-jJKocSCQ==',
    header: {
      alg: 'Ed25519',
      kid:
        'did:sov:3C4TKPKo3wRi3AMmXVjaHc#2CFbxj7zy4HDKQkVKfPwH2LTKCoFRHoiCW7CbJxFwYj9',
      typ: 'JWT',
    },
  },
  oidcAuthenticationQrCode: {
    clientId: 'http://192.168.1.4:4005/cb',
    requestUri: 'http://192.168.1.4:4005/nRTsiNc_kwPane04tbKJRA',
    responseType: 'id_token',
    type: 'OIDC',
    version: '0.1',
  },
}

export const mockOpenIdConnectRequest1 = {
  error: undefined,
  oidcAuthenticationRequest: mockOpenIdConnectRequestData1,
  state: OPEN_ID_CONNECT_STATE.REQUEST_RECEIVED,
  version: 1,
}

export const mockOpenIdConnectReceivedState = {
  data: {
    [mockOpenIdConnectRequest1Id]: mockOpenIdConnectRequest1,
  },
  version: 1,
}
