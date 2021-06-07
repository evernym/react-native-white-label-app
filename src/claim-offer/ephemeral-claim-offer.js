import { toUtf8FromBase64 } from '../bridge/react-native-cxs/RNCxs'
import type { AdditionalDataPayload } from '../push-notification/type-push-notification'
import { schemaValidator } from '../services/schema-validator'
import { flattenAsync } from '../common/flatten-async'
import { flatJsonParse } from '../common/flat-json-parse'
import { convertClaimOfferPushPayloadToAppClaimOffer } from '../push-notification/push-notification-store'
import { convertAriesCredentialOfferToCxsClaimOffer } from '../bridge/react-native-cxs/vcx-transformers'
import { QR_CODE_TYPES } from '../components/qr-scanner/type-qr-scanner'

export async function validateEphemeralClaimOffer(
  qrCode: Object,
): Promise<[
    null | string,
    null | { type: string, credentialOffer: QrCodeEphemeralCredentialOffer }
]> {
  // check if json has correct data
  if (
    !schemaValidator.validate(
      ephemeralCredentialOfferSchema,
      qrCode,
    )
  ) {
    return ['ECO-002::credential offer format.', null]
  }

  // check whether data is valid base64 string
  const [decodedCredentialOfferError, decodedCredentialOffer] = await flattenAsync(
    toUtf8FromBase64,
  )(qrCode['offers~attach'][0].data.base64)
  if (decodedCredentialOfferError || decodedCredentialOffer === null) {
    return ['ECO-002::credential offer format.', null]
  }

  // check whether decoded data is valid json or not
  const [parseCredentialOfferError, parsedCredentialOffer] = flatJsonParse(
    decodedCredentialOffer,
  )
  if (parseCredentialOfferError || parsedCredentialOffer === null) {
    return ['ECO-002::credential offer format.', null]
  }

  // convert claim offer to application format
  const claimOfferPayload = convertClaimOfferPushPayloadToAppClaimOffer(
    {
      ...convertAriesCredentialOfferToCxsClaimOffer(qrCode),
      remoteName: qrCode.comment || qrCode['~alias']?.label || 'Unknown',
      ephemeralClaimOffer: JSON.stringify(qrCode),
    },
    {
      remotePairwiseDID: qrCode['~service'].recipientKeys[0],
    },
  )

  return [
    null,
    {
      type: QR_CODE_TYPES.EPHEMERAL_CREDENTIAL_OFFER,
      credentialOffer: {
        ephemeralCredentialOffer: qrCode,
        claimOfferPayload: claimOfferPayload,
      },
    },
  ]
}

export const ephemeralCredentialOfferSchema = {
  type: 'object',
  properties: {
    '@id': { type: 'string', minLength: 4, maxLength: 1024 },
    '@type': { type: 'string', minLength: 3, maxLength: 500 },
    'offers~attach': {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          '@id': { type: 'string', minLength: 4, maxLength: 1024 },
          'mime-type': {
            type: 'string',
            minLength: 3,
            maxLength: 100,
            enum: ['application/json'],
          },
          data: {
            type: 'object',
            properties: {
              base64: { type: 'string', minLength: 10 },
            },
            required: ['base64'],
          },
        },
        required: ['@id', 'data'],
      },
      minLength: 1,
    },
    comment: { type: ['null', 'string'] },
    '~service': {
      type: 'object',
      properties: {
        recipientKeys: {
          type: 'array',
          items: {
            type: 'string',
          },
          minLength: 1,
        },
        routingKeys: {
          type: ['null', 'array'],
          items: { type: 'string' },
        },
        serviceEndpoint: { type: 'string', minLength: 10 },
      },
      required: ['recipientKeys', 'serviceEndpoint'],
    },
    '~alias': {
      type: 'object',
      properties: {
        imageUrl: { type: ['null', 'string'] },
        label: { type: ['null', 'string'] },
      },
    },
    credential_preview: {
      type: 'object',
      properties: {
        '@id': { type: ['null', 'string'] },
        '@type': { type: ['null', 'string'] },
        attributes: {
          type: ['null', 'array'],
          items: {
            type: 'object',
            name: { type: ['null', 'string'] },
            'mime-type': { type: ['null', 'string'] },
            value: { type: ['null', 'string'] },
          },
        },
      },
      required: ['attributes'],
    },
  },
  required: ['offers~attach', '~service', '@id', '@type', 'credential_preview'],
}

export type EphemeralCredentialOffer = {
  '@id': string,
  '@type': string,
  comment: string,
  credential_preview: {
    '@type': string,
    attributes: Array<{
      name: string,
      'mime-type': string,
      value: any,
    }>,
  },
  'offers~attach': Array<{
    '@id': string,
    'mime-type': string,
    data: {
      base64: string,
    },
  }>,
  '~alias': ?{
    imageUrl?: string,
    label?: string,
  },
  '~service': {
    recipientKeys: Array<string>,
    routingKeys: ?Array<string>,
    serviceEndpoint: string,
  }
}

export type QrCodeEphemeralCredentialOffer = {
  ephemeralCredentialOffer: EphemeralCredentialOffer,
  claimOfferPayload: AdditionalDataPayload,
}
