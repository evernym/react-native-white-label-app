// @flow
import type { GenericObject } from '../../common/type-common'
import type { Attribute } from '../../push-notification/type-push-notification'

export const isPropEmpty = (prop: string) => (
  data: GenericObject | Array<Attribute>
) => {
  if (Array.isArray(data)) {
    return data.some(missingData)
  }
  return !(data[prop] || data[prop] === '')
}

export const missingData = isPropEmpty('values')
