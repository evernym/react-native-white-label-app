import {
  QR_CODE_DELEGATION_DID,
  QR_CODE_DELEGATION_KEY,
  QR_CODE_DELEGATION_SIGNATURE,
  QR_CODE_LOGO_URL,
  QR_CODE_REQUEST_ID,
  QR_CODE_SENDER_AGENCY,
  QR_CODE_SENDER_AGENCY_DID,
  QR_CODE_SENDER_AGENCY_ENDPOINT,
  QR_CODE_SENDER_AGENCY_KEY,
  QR_CODE_SENDER_DETAIL,
  QR_CODE_SENDER_DID,
  QR_CODE_SENDER_KEY_DELEGATION,
  QR_CODE_SENDER_NAME,
  QR_CODE_SENDER_PUBLIC_DID,
  QR_CODE_SENDER_VERIFICATION_KEY,
  QR_CODE_TARGET_NAME,
  QR_CODE_VERSION
} from "../../api/api-constants";
import {schemaValidator} from "../../services/schema-validator";
import type {InvitationPayload, ShortProprietaryConnectionInvitation, ProprietaryConnectionInvitation} from "../type-invitation";

export function isShortProprietaryInvitation(
  data: Object
): ShortProprietaryConnectionInvitation | false {
  // check if qr code schema is valid
  if (!schemaValidator.validate(proprietaryShortInviteSchema, data)) {
    return false
  }

  // since all checks are passed
  // qr code data is valid, send the parsed data back
  return data
}

export function isProprietaryInvitation(
  data: Object
): ProprietaryConnectionInvitation | false {
  // check if qr code schema is valid
  if (!schemaValidator.validate(proprietaryInvitationSchema, data)) {
    return false
  }

  // since all checks are passed
  // qr code data is valid, send the parsed data back
  return data
}

export function convertShortProprietaryInvitationToAppInvitation(qrCode: ShortProprietaryConnectionInvitation) {
  const qrSenderDetail = qrCode[QR_CODE_SENDER_DETAIL]
  const qrSenderAgency = qrCode[QR_CODE_SENDER_AGENCY]
  const senderDetail = {
    name: qrSenderDetail[QR_CODE_SENDER_NAME],
    agentKeyDlgProof: {
      agentDID:
        qrSenderDetail[QR_CODE_SENDER_KEY_DELEGATION][QR_CODE_DELEGATION_DID],
      agentDelegatedKey:
        qrSenderDetail[QR_CODE_SENDER_KEY_DELEGATION][QR_CODE_DELEGATION_KEY],
      signature:
        qrSenderDetail[QR_CODE_SENDER_KEY_DELEGATION][
          QR_CODE_DELEGATION_SIGNATURE
          ],
    },
    DID: qrSenderDetail[QR_CODE_SENDER_DID],
    logoUrl: qrSenderDetail[QR_CODE_LOGO_URL],
    verKey: qrSenderDetail[QR_CODE_SENDER_VERIFICATION_KEY],
    publicDID: qrSenderDetail[QR_CODE_SENDER_PUBLIC_DID],
  }

  const senderAgencyDetail = {
    DID: qrSenderAgency[QR_CODE_SENDER_AGENCY_DID],
    verKey: qrSenderAgency[QR_CODE_SENDER_AGENCY_KEY],
    endpoint: qrSenderAgency[QR_CODE_SENDER_AGENCY_ENDPOINT],
  }

  return {
    senderEndpoint: senderAgencyDetail.endpoint,
    requestId: qrCode[QR_CODE_REQUEST_ID],
    senderAgentKeyDelegationProof: senderDetail.agentKeyDlgProof,
    senderName: senderDetail.name,
    senderDID: senderDetail.DID,
    senderLogoUrl: senderDetail.logoUrl,
    senderVerificationKey: senderDetail.verKey,
    targetName: qrCode[QR_CODE_TARGET_NAME],
    senderDetail,
    senderAgencyDetail,
    version: qrCode[QR_CODE_VERSION],
  }
}

export const convertProprietaryInvitationToAppInvitation = (
  pendingInvitation: ProprietaryConnectionInvitation
): InvitationPayload => ({
  senderEndpoint: pendingInvitation.senderAgencyDetail.endpoint,
  requestId: pendingInvitation.connReqId,
  senderAgentKeyDelegationProof:
  pendingInvitation.senderDetail.agentKeyDlgProof,
  senderName: pendingInvitation.senderDetail.name,
  senderDID: pendingInvitation.senderDetail.DID,
  senderLogoUrl: pendingInvitation.senderDetail.logoUrl,
  senderVerificationKey: pendingInvitation.senderDetail.verKey,
  targetName: pendingInvitation.targetName,
  senderAgencyDetail: pendingInvitation.senderAgencyDetail,
  senderDetail: pendingInvitation.senderDetail,
  version: pendingInvitation.version,
})

export const proprietaryShortInviteSchema = {
  type: 'object',
  properties: {
    [QR_CODE_REQUEST_ID]: {type: 'string'},
    [QR_CODE_SENDER_DETAIL]: {
      type: 'object',
      properties: {
        [QR_CODE_SENDER_DID]: {type: 'string'},
        [QR_CODE_SENDER_NAME]: {type: 'string'},
        [QR_CODE_LOGO_URL]: {type: 'string'},
        [QR_CODE_SENDER_VERIFICATION_KEY]: {type: 'string'},
        [QR_CODE_SENDER_KEY_DELEGATION]: {
          type: 'object',
          properties: {
            [QR_CODE_DELEGATION_DID]: {type: 'string'},
            [QR_CODE_DELEGATION_KEY]: {type: 'string'},
            [QR_CODE_DELEGATION_SIGNATURE]: {type: 'string'},
          },
          required: [
            QR_CODE_DELEGATION_DID,
            QR_CODE_DELEGATION_KEY,
            QR_CODE_DELEGATION_SIGNATURE,
          ],
        },
      },
      required: [
        QR_CODE_SENDER_DID,
        QR_CODE_SENDER_NAME,
        QR_CODE_LOGO_URL,
        QR_CODE_SENDER_VERIFICATION_KEY,
        QR_CODE_SENDER_KEY_DELEGATION,
      ],
    },
    [QR_CODE_SENDER_AGENCY]: {
      type: 'object',
      properties: {
        [QR_CODE_SENDER_AGENCY_DID]: {type: 'string'},
        [QR_CODE_SENDER_AGENCY_KEY]: {type: 'string'},
        [QR_CODE_SENDER_AGENCY_ENDPOINT]: {type: 'string'},
      },
      required: [
        QR_CODE_SENDER_AGENCY_DID,
        QR_CODE_SENDER_AGENCY_KEY,
        QR_CODE_SENDER_AGENCY_ENDPOINT,
      ],
    },
    [QR_CODE_TARGET_NAME]: {type: 'string'},
  },
  required: [
    QR_CODE_REQUEST_ID,
    QR_CODE_SENDER_DETAIL,
    QR_CODE_SENDER_AGENCY,
    QR_CODE_TARGET_NAME,
  ],
}

export const proprietaryInvitationSchema = {
  type: 'object',
  properties: {
    connReqId: { type: 'string' },
    statusCode: { type: 'string' },
    senderDetail: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        agentKeyDlgProof: {
          type: 'object',
          properties: {
            agentDID: { type: 'string' },
            agentDelegatedKey: { type: 'string' },
            signature: { type: 'string' },
          },
          required: ['agentDID', 'agentDelegatedKey', 'signature'],
        },
        DID: { type: 'string' },
        logoUrl: { type: 'string' },
        verKey: { type: 'string' },
        publicDID: { type: 'string' },
      },
      required: ['name', 'agentKeyDlgProof', 'DID', 'logoUrl', 'verKey'],
    },
    senderAgencyDetail: {
      type: 'object',
      properties: {
        DID: { type: 'string' },
        verKey: { type: 'string' },
        endpoint: { type: 'string' },
      },
      required: [],
    },
    targetName: { type: 'string' },
    version: { type: 'string' },
  },
  required: ['senderDetail', 'senderAgencyDetail', 'targetName'],
}
