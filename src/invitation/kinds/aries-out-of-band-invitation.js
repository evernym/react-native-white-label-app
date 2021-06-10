import type {Url} from "url-parse";
import type {AriesOutOfBandInvite, AriesServiceEntry, InvitationPayload} from "../type-invitation";
import {CONNECTION_INVITE_TYPES} from "../type-invitation";
import { getAttachedRequest, getBase64DecodedInvitation, getConnectionLogoUrl } from '../invitation-helpers'
import isUrl from "validator/lib/isURL";
import type {GenericObject} from "../../common/type-common";
import {ID, TYPE} from "../../common/type-common";
import {schemaValidator} from "../../services/schema-validator";

export function isAriesOutOfBandInvitation(
  invite: GenericObject
): false | AriesOutOfBandInvite {
  if (!schemaValidator.validate(ariesOutOfBandInviteSchema, invite)) {
    return false
  }

  if (
    !invite.service.every(
      (serviceEntry) =>
        typeof serviceEntry === 'string' ||
        (typeof serviceEntry === 'object' &&
          isUrl(serviceEntry.serviceEndpoint))
    )
  ) {
    return false
  }

  return ((invite: any): AriesOutOfBandInvite)
}

export async function isEncodedAriesOutOfBandInvitation(
  { query }: Url
): Promise<AriesOutOfBandInvite | false> {
  const body = query.oob || query.c_i || query.d_m
  let qrData = await getBase64DecodedInvitation(body)
  if (!qrData) {
    return false
  }
  return isAriesOutOfBandInvitation(qrData)
}

export async function convertAriesOutOfBandInvitationToAppInvitation(
  invite: AriesOutOfBandInvite
): InvitationPayload | null {
  const payload = invite

  const serviceEntry = payload.service
    ? ((payload.service.find(
      (serviceEntry) => typeof serviceEntry === 'object'
    ): any): AriesServiceEntry)
    : null

  if (!serviceEntry) {
    return null
  }

  const publicDID = invite.public_did || serviceEntry.recipientKeys[0]

  const senderAgentKeyDelegationProof = {
    agentDID: serviceEntry.recipientKeys[0],
    agentDelegatedKey: serviceEntry.recipientKeys[0],
    signature: '<no-signature-supplied>',
  }

  const senderLogoUrl = getConnectionLogoUrl(payload)

  const attachedRequest = await getAttachedRequest(invite)

  return {
    senderEndpoint: serviceEntry.serviceEndpoint,
    requestId: payload[ID],
    senderAgentKeyDelegationProof,
    senderName: payload.label || 'Unnamed Connection',
    senderDID: publicDID,
    senderLogoUrl: senderLogoUrl,
    senderVerificationKey: serviceEntry.recipientKeys[0],
    targetName: payload.label || 'Unnamed Connection',
    senderDetail: {
      name: payload.label || 'Unnamed Connection',
      agentKeyDlgProof: senderAgentKeyDelegationProof,
      DID: publicDID,
      logoUrl: senderLogoUrl,
      verKey: serviceEntry.recipientKeys[0],
      publicDID: publicDID,
    },
    senderAgencyDetail: {
      DID: '',
      verKey: '',
      endpoint: serviceEntry.serviceEndpoint,
    },
    type: CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND,
    version: '1.0',
    original: JSON.stringify(invite),
    originalObject: invite,
    attachedRequest,
  }
}

export const ariesOutOfBandInviteSchema = {
  type: 'object',
  properties: {
    [ID]: {type: 'string'},
    [TYPE]: {type: 'string'},
    label: {type: ['null', 'string']},
    goal_code: {type: ['null', 'string']},
    goal: {type: ['null', 'string']},
    handshake_protocols: {
      type: 'array',
      items: [{type: 'string'}],
    },
    'request~attach': {
      type: ['null', 'array'],
      items: [
        {
          type: 'object',
          properties: {
            [ID]: {type: 'string'},
            'mime-type': {type: 'string'},
            data: {
              type: 'object',
              anyOf: [
                {properties: {json: {type: 'string'}}},
                {properties: {base64: {type: 'string'}}},
              ],
              minProperties: 1,
            },
          },
          required: [ID, 'mime-type', 'data'],
        },
      ],
    },
    service: {
      type: 'array',
      items: {
        anyOf: [
          {type: 'string'},
          {
            type: 'object',
            properties: {
              id: {type: 'string'},
              type: {type: 'string'},
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
            },
            required: ['id', 'type', 'recipientKeys', 'serviceEndpoint'],
          },
        ],
      },
      minItems: 1,
    },
    public_did: {type: ['null', 'string']},
  },
  anyOf: [
    {
      required: ['handshake_protocols'],
    },
    {
      required: ['request~attach'],
    },
  ],
  required: [ID, TYPE, 'service'],
}
