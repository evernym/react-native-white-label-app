// @flow

import type {
  AdditionalProofDataPayload,
  AriesPresentationRequest,
  QrCodeEphemeralProofRequest,
} from './type-proof-request'

import { flattenAsync } from '../common/flatten-async'
import { toUtf8FromBase64 } from '../bridge/react-native-cxs/RNCxs'
import { schemaValidator } from '../services/schema-validator'
import { QR_CODE_TYPES } from '../components/qr-scanner/type-qr-scanner'
import { convertProofRequestPushPayloadToAppProofRequest } from '../push-notification/push-notification-store'
import { flatJsonParse } from '../common/flat-json-parse'

export async function validateEphemeralProofQrCode(
  qrCode: string
): Promise<
  [
    null | string,
    null | { type: string, proofRequest: QrCodeEphemeralProofRequest }
  ]
> {
  // MSDK supports three types of data for ephemeral proof request
  // 1. Url that returns an ephemeral proof request
  // 2. base64 encoded ephemeral proof request
  // 3. json formatted ephemeral proof request

  // Url downloading is already handled by qr-scanner
  // which if url is passed in qr code, then qr-scanner downloads the data
  // and passes into this function
  // if qr code is not url, then qr code is simply passed to this function
  // So, we need to check if qr code is either base64 encoded, or json formatted

  // check if response is properly encode in base64
  const [, decodedResponse] = await flattenAsync(toUtf8FromBase64)(qrCode)
  // we are ignoring error in decoding
  // because we might get json data right from start, and hence decode might fail
  // if decode fails, then we just try json parsing

  // we need to keep track of original message as well, that we can pass to vcx
  let originalMessage = qrCode

  // check whether the response is valid json
  // first try parsing decodedResponse
  let [responseJsonError, ephemeralProofRequest] = flatJsonParse(
    decodedResponse || qrCode
  )
  if (!responseJsonError && decodedResponse) {
    // if decoded response parse successfully, then we take original message as decodedResponse
    originalMessage = decodedResponse
  }
  if (responseJsonError || ephemeralProofRequest === null) {
    // if parsing decoded response fails, then we try parsing qrCode
    ;[responseJsonError, ephemeralProofRequest] = flatJsonParse(qrCode)
    // if parsing only qrCode also results in error, then return error
    if (responseJsonError || ephemeralProofRequest === null) {
      return ['EPR-001:: Invalid format.', null]
    }
  }

  // check if json has correct data
  if (
    !schemaValidator.validate(
      ephemeralProofRequestSchema,
      ephemeralProofRequest
    )
  ) {
    return ['EPR-002::Invalid data.', null]
  }

  // Now, we know that format of ephemeral proof request is valid

  // we still need to get data from base64
  const [decodeProofRequestError, decodedProofRequest] = await flattenAsync(
    toUtf8FromBase64
  )(ephemeralProofRequest['request_presentations~attach'][0].data.base64)
  if (decodeProofRequestError || decodedProofRequest === null) {
    return ['EPR-003::Invalid proof request.', null]
  }

  // check whether decoded data is valid json or not
  const [parseProofRequestError, parsedProofRequest] = flatJsonParse(
    decodedProofRequest
  )
  if (parseProofRequestError || parsedProofRequest === null) {
    return ['EPR-004::Invalid proof request format.', null]
  }

  // check if parsed json is valid
  if (!schemaValidator.validate(proofRequestDataSchema, parsedProofRequest)) {
    return ['EPR-005::Invalid proof request data.', null]
  }

  return [
    null,
    {
      type: QR_CODE_TYPES.EPHEMERAL_PROOF_REQUEST_V1,
      proofRequest: {
        originalMessage,
        ephemeralProofRequest,
        proofRequestPayload: convertProofRequestPushPayloadToAppProofRequest({
          proof_request_data: {
            ...parsedProofRequest,
          },
          '@topic': { mid: 0, tid: 0 },
          '@type': { name: 'proof_request', version: '0.1' },
          remoteName: ephemeralProofRequest.comment || 'Unknown',
          proofHandle: 0,
          ephemeralProofRequest: originalMessage,
        }),
      },
    },
  ]
}

export async function validateOutofbandProofRequestQrCode(
  presentationRequest: AriesPresentationRequest
): Promise<[null | string, null | AdditionalProofDataPayload]> {
  // we still need to get data from base64
  const [decodeProofRequestError, decodedProofRequest] = await flattenAsync(
    toUtf8FromBase64
  )(presentationRequest['request_presentations~attach'][0].data.base64)
  if (decodeProofRequestError || decodedProofRequest === null) {
    return ['OOBPR-003::Invalid proof request.', null]
  }

  // check whether decoded data is valid json or not
  const [parseProofRequestError, parsedProofRequest] = flatJsonParse(
    decodedProofRequest
  )
  if (parseProofRequestError || parsedProofRequest === null) {
    return ['OOBPR-004::Invalid proof request format.', null]
  }

  // check if parsed json is valid

  if (!schemaValidator.validate(proofRequestDataSchema, parsedProofRequest)) {
    return ['OOBPR-005::Invalid proof request data.', null]
  }

  return [
    null,
    convertProofRequestPushPayloadToAppProofRequest({
      proof_request_data: {
        ...parsedProofRequest,
      },
      '@topic': { mid: 0, tid: 0 },
      '@type': { name: 'proof_request', version: '0.1' },
      remoteName: presentationRequest.comment || 'Unknown',
      proofHandle: 0,
      outofbandProofRequest: JSON.stringify(presentationRequest),
    }),
  ]
}

const ephemeralProofRequestSchema = {
  type: 'object',
  properties: {
    '@id': { type: 'string', minLength: 4, maxLength: 1024 },
    '@type': { type: 'string', minLength: 3, maxLength: 500 },
    'request_presentations~attach': {
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
  },
  required: ['request_presentations~attach', '~service', '@id', '@type'],
}

const proofRequestDataSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 300 },
    version: { type: 'string', minLength: 1, maxLength: 200 },
    requested_attributes: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          properties: {
            name: { type: ['null', 'string'] },
            names: { type: ['null', 'array'] },
            restrictions: { type: ['array', 'object'] },
          },
        },
      },
    },
  },
  required: ['name', 'version', 'requested_attributes'],
}
