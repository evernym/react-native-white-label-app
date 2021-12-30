// @flow

export const TOKEN_EXPIRED_CODE = 'VES-101'
export const SERVER_ERROR_CODE = 'OCS-000'
export const SERVER_API_CALL_ERROR = 'OCS-001'

export const QR_CODE_REQUEST_ID = 'id'
export const QR_CODE_SENDER_DETAIL = 's'
export const QR_CODE_SENDER_DID = 'd'
export const QR_CODE_SENDER_NAME = 'n'
export const QR_CODE_LOGO_URL = 'l'
export const QR_CODE_SENDER_VERIFICATION_KEY = 'v'
export const QR_CODE_SENDER_KEY_DELEGATION = 'dp'
export const QR_CODE_DELEGATION_DID = 'd'
export const QR_CODE_DELEGATION_KEY = 'k'
export const QR_CODE_DELEGATION_SIGNATURE = 's'
export const QR_CODE_SENDER_AGENCY = 'sa'
export const QR_CODE_SENDER_AGENCY_DID = 'd'
export const QR_CODE_SENDER_AGENCY_KEY = 'v'
export const QR_CODE_SENDER_AGENCY_ENDPOINT = 'e'
export const QR_CODE_TARGET_NAME = 't'
export const QR_CODE_SENDER_PUBLIC_DID = 'publicDID'
export const QR_CODE_VERSION = 'version'
export const GENESIS_FILE_NAME = 'pool_transactions_genesis'

export const MESSAGE_TYPE = {
  AUTH: 'auth-req',
  CLAIM_OFFER: 'credOffer',
  CLAIM_REQUEST: 'credReq',
  PROOF_REQUEST: 'proofReq',
  PROOF: 'proof',
  CLAIM: 'cred',
  QUESTION: 'Question',
  WALLET_BACKUP_READY: 'WALLET_BACKUP_READY',
  WALLET_BACKUP_ACK: 'WALLET_BACKUP_ACK',
  ARIES: 'aries',
  INVITE_ACTION: 'inviteAction',
  PRESENTATION_PROPOSAL: 'presentationProposal',
  PROBLEM_REPORT: 'PROBLEM_REPORT',
  UPGRADE: 'upgrade',
}

export const ERROR_PENDING_INVITATION_RESPONSE_PARSE_CODE = 'RN-101'

export const ERROR_PENDING_INVITATION_RESPONSE_PARSE =
  'Error parsing error message Pending Invitation SMS'

export const ERROR_INVITATION_RESPONSE_FAILED =
  'Failed to establish connection. Please try again later.'
