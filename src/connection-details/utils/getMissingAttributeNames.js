// @flow
import type { MissingAttributes } from '../../proof-request/type-proof-request'

export function getMissingAttributeNames(
  missingAttributes: MissingAttributes | {}
) {
  return Object.keys(missingAttributes).join(', ')
}
