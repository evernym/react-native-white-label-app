// @flow

import type { Store } from '../store/type-store'

export const selectPushPermissionAndToken = ({
  pushNotification: { isAllowed, pushToken },
}: Store) => ({ isAllowed, pushToken })
