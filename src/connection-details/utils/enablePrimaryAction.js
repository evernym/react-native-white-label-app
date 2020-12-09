// @flow
import type { MissingAttributes } from '../../proof-request/type-proof-request'
import type { Attribute } from '../../push-notification/type-push-notification'
import type { CustomError } from '../../common/type-common'
import { missingData } from './isPropEmpty'

export function enablePrimaryAction(
  missingAttributes: MissingAttributes | {},
  allMissingAttributesFilled: boolean,
  error: ?CustomError,
  requestedAttributes: Attribute[]
) {
  // we need to decide on whether to enable Send/Generate-Proof button

  if (error) {
    return false
  }

  const missingCount = Object.keys(missingAttributes).length
  if (missingCount > 0) {
    if (allMissingAttributesFilled === false) {
      return false
    }
  }

  const isMissingData = requestedAttributes.some(missingData)
  if (isMissingData) {
    return false
  }

  return true
}
