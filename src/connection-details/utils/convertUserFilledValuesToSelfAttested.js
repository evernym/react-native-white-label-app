// @flow
import type {
  MissingAttributes,
  SelfAttestedAttributes,
} from '../../proof-request/type-proof-request'
import type { GenericStringObject } from '../../common/type-common'

export function convertUserFilledValuesToSelfAttested(
  userFilledValues: GenericStringObject,
  missingAttributes: MissingAttributes | {}
): SelfAttestedAttributes {
  return Object.keys(missingAttributes).reduce((acc, name) => {
    return {
      ...acc,
      [name]: {
        name,
        data: userFilledValues[name],
        key: missingAttributes[name].key,
      },
    }
  }, {})
}
