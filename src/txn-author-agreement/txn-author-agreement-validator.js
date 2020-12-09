// @flow
import { schemaValidator } from '../services/schema-validator'
import type { TAAResponse, TAAPayload } from './type-txn-author-agreement'

// at_submission: "The agreement was reviewed by the user and accepted at the time of submission of this transaction."
// for_session: "The agreement was reviewed by the user and accepted at some point in the user’s session prior to submission."
// on_file: "An authorized person accepted the agreement, and such acceptance is on file with the user’s organization."
// product_eula: "The agreement was included in the software product’s terms and conditions as part of a license to the end user."
// service_agreement: "The agreement was included in the terms and conditions the user accepted as part of contracting a service."
// wallet_agreement: "The agreement was reviewed by the user and this affirmation was persisted in the user’s wallet for use during submission."
const taaResponseSchema = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    version: { type: 'string' },
    aml: {
      type: 'object',
      properties: {
        wallet_agreement: { type: 'string' },
      },
      required: ['wallet_agreement'],
    },
  },
  required: ['text', 'version', 'aml'],
}

export function isValidTAAResponse(taaResponse: string): TAAResponse | boolean {
  let taaResponseData: TAAResponse
  try {
    taaResponseData = (JSON.parse(taaResponse): TAAResponse)
  } catch (e) {
    // qr code is not a valid json, we still return false
    return false
  }

  // check if qr code schema is valid
  if (!schemaValidator.validate(taaResponseSchema, taaResponseData)) {
    return false
  }

  // since all checks are passed
  return taaResponseData
}

export function convertVcxTAAToCxsClaimTAA(vcxTAA: TAAResponse): TAAPayload {
  return {
    version: vcxTAA.version,
    text: vcxTAA.text,
    aml: vcxTAA.aml,
  }
}
