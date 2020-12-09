// @flow
import type { MissingAttributes } from '../../proof-request/type-proof-request'

export function generateStateForMissingAttributes(
  missingAttributes: MissingAttributes | {}
) {
  return Object.keys(missingAttributes).reduce(
    (acc, attributeName) => ({
      ...acc,
      [attributeName]: '',
    }),
    {}
  )
}
