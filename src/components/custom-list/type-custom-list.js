// @flow

import type { ImageSource, AttributeNames } from '../../common/type-common'
import type { ClaimMap } from '../../claim/type-claim'

export type Item = {
  label?: string,
  data?: string,
  values?: AttributeNames,
  claimUuid?: string,
  logoUrl?: string,
  key?: string,
  p_type?: string,
  p_value?: number,
  type?: string,
}

export type CustomListProps = {
  items: Array<Item>,
  type?: string,
  claimMap?: ?ClaimMap,
  avatarSource?: ?ImageSource,
  isMissingFieldsShowing?: boolean,
}
