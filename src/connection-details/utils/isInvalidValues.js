// @flow
import type { MissingAttributes } from '../../proof-request/type-proof-request'
import type { GenericObject } from '../../common/type-common'

export function isInvalidValues(
  missingAttributes: MissingAttributes | {},
  userFilledValues: GenericObject
): boolean {
  return Object.keys(missingAttributes).some((attributeName) => {
    const userFilledValue = userFilledValues[attributeName]

    if (!userFilledValue) {
      return true
    }

    const adjustedUserFilledValue = userFilledValue.trim()

    if (!adjustedUserFilledValue) {
      return true
    }

    return false
  })
}
