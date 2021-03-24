import type {Url} from "url-parse";
import type {AriesConnectionInvite, InvitationPayload} from "../type-invitation";
import {CONNECTION_INVITE_TYPES} from "../type-invitation";
import {getBase64DecodedInvitation, getConnectionLogoUrl} from "../invitation-helpers";
import isUrl from "validator/lib/isURL";
import {ID, TYPE} from "../../common/type-common";
import {schemaValidator} from "../../services/schema-validator";

export function isAriesInvitation(
  payload: any,
  original: string
): false | AriesConnectionInvite {
  if (!schemaValidator.validate(ariesConnectionInviteQrSchema, payload)) {
    return false
  }

  if (!isUrl(payload.serviceEndpoint)) {
    return false
  }

  return {
    original,
    payload,
    type: CONNECTION_INVITE_TYPES.ARIES_V1_QR,
    version: '1.0',
  }
}

export async function isEncodedAriesConnectionInvitation(
  { query }: Url
): Promise<AriesConnectionInvite | false> {
  const body = query.c_i || query.d_m
  let qrData = await getBase64DecodedInvitation(body)
  if (!qrData) {
    return false
  }

  return isAriesInvitation(qrData, JSON.stringify(qrData))
}

export function convertAriesInvitationToAppInvitation(
  ariesConnectionInvite: AriesConnectionInvite
): InvitationPayload {
  const {payload, original} = ariesConnectionInvite

  const senderAgentKeyDelegationProof = {
    agentDID: payload.recipientKeys[0],
    agentDelegatedKey: payload.recipientKeys[0],
    signature: '<no-signature-supplied>',
  }

  const senderLogoUrl = getConnectionLogoUrl(payload)

  return {
    senderEndpoint: payload.serviceEndpoint,
    requestId: payload[ID],
    senderAgentKeyDelegationProof,
    senderName: payload.label || 'Unknown',
    senderDID: payload.recipientKeys[0],
    senderLogoUrl: senderLogoUrl,
    senderVerificationKey: payload.recipientKeys[0],
    targetName: payload.label || 'Unknown',
    senderDetail: {
      name: payload.label || 'Unknown',
      agentKeyDlgProof: senderAgentKeyDelegationProof,
      DID: payload.recipientKeys[0],
      logoUrl: senderLogoUrl,
      verKey: payload.recipientKeys[0],
      publicDID: payload.recipientKeys[0],
    },
    senderAgencyDetail: {
      DID: payload.recipientKeys[0],
      verKey: payload.recipientKeys[1],
      endpoint: payload.serviceEndpoint,
    },
    version: '1.0',
    original,
    type: CONNECTION_INVITE_TYPES.ARIES_V1_QR,
  }
}

export const ariesConnectionInviteQrSchema = {
  type: 'object',
  properties: {
    [ID]: {type: 'string'},
    [TYPE]: {type: 'string'},
    label: {type: ['null', 'string']},
    recipientKeys: {
      type: 'array',
      items: [{type: 'string'}],
      minItems: 1,
    },
    routingKeys: {
      type: ['null', 'array'],
      items: [{type: 'string'}],
      minItems: 0,
    },
    serviceEndpoint: {type: 'string'},
    profileUrl: {type: ['null', 'string']},
    imageUrl: {type: ['null', 'string']},
  },
  required: [ID, TYPE, 'recipientKeys', 'serviceEndpoint'],
}
