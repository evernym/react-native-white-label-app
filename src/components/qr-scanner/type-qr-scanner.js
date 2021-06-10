// @flow

import type {
  AriesConnectionInvite,
  AriesOutOfBandInvite,
  InvitationPayload,
  ShortProprietaryConnectionInvitation,
} from '../../invitation/type-invitation'
import type {QrCodeEphemeralProofRequest} from '../../proof-request/type-proof-request'
import type { QrCodeEphemeralCredentialOffer } from '../../claim-offer/ephemeral-claim-offer'

export const SCAN_STATUS = {
  SCANNING: 'scanning...',
  SUCCESS: 'Success!',
  FAIL: 'QR code format is invalid.',
  DOWNLOADING_INVITATION: 'Downloading invitation...',
  NO_INVITATION_DATA: 'No message found behind this QR code.',
  DOWNLOADING_AUTHENTICATION_JWT: 'Loading authentication request...',
  NO_AUTHENTICATION_REQUEST:
    'No authentication request found behind this QR code.',
  AUTH_REQUEST_DOWNLOAD_FAILED: 'Failed to load authentication request.',
  AUTH_REQUEST_INVALID_HEADER_DECODE_ERROR:
    '001::Malformed authentication request.',
  AUTH_REQUEST_INVALID_HEADER_SCHEMA: '002::Malformed authentication request.',
  AUTH_REQUEST_INVALID_BODY_DECODE_ERROR:
    '003::Malformed authentication request.',
  AUTH_REQUEST_INVALID_BODY_SCHEMA: '004::Malformed authentication request.',
  AUTH_REQUEST_INVALID_SIGNATURE: '005::Malformed authentication request.',
  AUTH_REQUEST_INVALID_BODY_SCHEMA_AND_SEND_FAIL:
    '006::Malformed authentication request.',
  DOWNLOADING: 'Downloading...',
  INVALID_DOWNLOADED_DATA: '007::Invalid data from QR Code.',
  INVALID_URL_QR_CODE: '008::Invalid QR code.',
}

export type QR_SCAN_STATUS =
  | typeof SCAN_STATUS.SCANNING
  | typeof SCAN_STATUS.FAIL
  | typeof SCAN_STATUS.SUCCESS
  | typeof SCAN_STATUS.DOWNLOADING_INVITATION
  | typeof SCAN_STATUS.NO_INVITATION_DATA
  | typeof SCAN_STATUS.DOWNLOADING_AUTHENTICATION_JWT
  | typeof SCAN_STATUS.NO_AUTHENTICATION_REQUEST
  | typeof SCAN_STATUS.AUTH_REQUEST_DOWNLOAD_FAILED
  | typeof SCAN_STATUS.AUTH_REQUEST_INVALID_HEADER_DECODE_ERROR
  | typeof SCAN_STATUS.AUTH_REQUEST_INVALID_HEADER_SCHEMA
  | typeof SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_DECODE_ERROR
  | typeof SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_SCHEMA
  | typeof SCAN_STATUS.AUTH_REQUEST_INVALID_SIGNATURE
  | typeof SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_SCHEMA_AND_SEND_FAIL
  | typeof SCAN_STATUS.DOWNLOADING
  | typeof SCAN_STATUS.INVALID_DOWNLOADED_DATA
  | typeof SCAN_STATUS.INVALID_URL_QR_CODE

export type QrScannerState = {
  scanStatus: QR_SCAN_STATUS,
}

export type QrScannerProps = {
  onShortProprietaryInvitationRead: (ShortProprietaryConnectionInvitation) => Promise<void>,
  onClose: () => void,
  onProprietaryInvitationRead: (InvitationPayload) => Promise<void>,
  onOIDCAuthenticationRequest: (OIDCAuthenticationRequest) => void,
  onAriesConnectionInviteRead: (AriesConnectionInvite) => Promise<void>,
  onAriesOutOfBandInviteRead: (AriesOutOfBandInvite) => Promise<void>,
  onEphemeralProofRequest: (QrCodeEphemeralProofRequest) => void,
  onEphemeralCredentialOffer: (QrCodeEphemeralCredentialOffer) =>  Promise<void>,
}

export type CameraMarkerProps = {
  status: QR_SCAN_STATUS,
  onClose: () => void,
}

export const TOP_LEFT = 'topLeft'
export const TOP_RIGHT = 'topRight'
export const BOTTOM_LEFT = 'bottomLeft'
export const BOTTOM_RIGHT = 'bottomRight'

export type CornerBoxProps = {
  status: QR_SCAN_STATUS,
  position:
    | typeof TOP_LEFT
    | typeof TOP_RIGHT
    | typeof BOTTOM_LEFT
    | typeof BOTTOM_RIGHT,
}

export const QR_CODE_TYPES = {
  INVITATION: 'INVITATION',
  URL_INVITATION: 'URL_INVITATION',
  ENV_SWITCH_URL: 'ENV_SWITCH_URL',
  OIDC: 'OIDC',
  EPHEMERAL_PROOF_REQUEST_V1: 'EPHEMERAL_PROOF_REQUEST_V1',
  // this is the type of QR code, where QR code is a url, and response from URL is not a json object, instead it is non-json string
  // it could be a base64 encoded data, so we need to keep this type
  // so that other types of QR handler can handle such type of qr codes
  URL_NON_JSON_RESPONSE: 'URL_NON_JSON_RESPONSE',
  OUTOFBAND_PROOF_REQUEST: 'OUTOFBAND_PROOF_REQUEST',
  EPHEMERAL_CREDENTIAL_OFFER: 'EPHEMERAL_CREDENTIAL_OFFER',
}
export type QrCodeTypes = $Keys<typeof QR_CODE_TYPES>

export type QrCodeOIDC = {
  type: 'OIDC',
  version: string,
  clientId: string,
  requestUri: string,
  responseType: string,
}

export type JWTAuthenticationRequest = {
  header: {
    alg: string,
    typ: string,
    kid: ?string,
  },
  body: {
    iss: string,
    response_type: string,
    client_id: string,
    scope: string,
    state: string,
    nonce: string,
    response_mode: string,
    registration: {
      request_object_signing_alg: ?string,
      jwks_uri: ?string,
      id_token_signed_response_alg: Array<string>,
    },
  },
  encodedSignature: ?string,
}

export type OIDCAuthenticationRequest = {
  oidcAuthenticationQrCode: QrCodeOIDC,
  jwtAuthenticationRequest: JWTAuthenticationRequest,
  id: string,
}

export type QrCodeNonJsonUrl = {
  type: 'URL_NON_JSON_RESPONSE',
  data: string,
}
