// @flow
import urlParse from 'url-parse'

import type {
  SMSPendingInvitationPayload,
  InvitationUrl,
} from './type-sms-pending-invitation'

import { schemaValidator } from '../services/schema-validator'

export function isValidSMSInvitation(
  invitationData: Object
): SMSPendingInvitationPayload | false {
  if (!schemaValidator.validate(smsInvitationSchema, invitationData)) {
    return false
  }

  return invitationData
}

export function isValidInvitationUrl(
  passedUrlString: string
): InvitationUrl | boolean {
  if (passedUrlString.length > validInvitationUrlLength) {
    return false
  }

  const { protocol } = urlParse(passedUrlString, {}, true)

  if (validInvitationUrlScheme.indexOf(protocol) < 0) {
    return false
  }

  return {
    url: passedUrlString,
  }
}

// only trust if scheme is https, http is not allowed
export const validInvitationUrlScheme = ['https:', 'http:']

// maximum length allowed for whole url-qr-code
export const validInvitationUrlLength = 2048

const smsInvitationSchema = {
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
