// @flow
import type { MissingAttributes } from '../../proof-request/type-proof-request'

export function hasMissingAttributes(
  missingAttributes: MissingAttributes | {}
) {
  return Object.keys(missingAttributes).length > 0
}
