// @flow

import type { CustomError } from '../common/type-common'

import { RESET_TEMP_PROOF_DATA, ERROR_SEND_PROOF } from './type-proof'

export const resetTempProofData = (uid: string) => ({
  type: RESET_TEMP_PROOF_DATA,
  uid,
})

export const errorSendProofFail = (uid: string, error: CustomError) => ({
  type: ERROR_SEND_PROOF,
  uid,
  error,
})
