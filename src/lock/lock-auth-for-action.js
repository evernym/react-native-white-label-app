// @flow
import type { LockStore } from './type-lock'
import moment from 'moment'
import { lockAuthorizationHomeRoute, lockEnterFingerprintRoute } from '../common'
import type { NavigationLeafRoute, NavigationScreenProp } from '@react-navigation/native'

type Params = {
  lock: LockStore,
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  onSuccess: () => void
}

export const freshnessThreshold = 30

export function authForAction(params: Params) {
  const timeSinceLastSuccess =
    moment.duration(
      moment().diff(moment(params.lock.lastUnlockSuccessTime)),
    ).asSeconds()

  const authorizationRoute = params.lock.isTouchIdEnabled
    ? lockEnterFingerprintRoute
    : lockAuthorizationHomeRoute

  if (timeSinceLastSuccess > freshnessThreshold) {
    params.navigation.navigate(authorizationRoute, {
      onSuccess: params.onSuccess,
    })
  } else {
    params.onSuccess()
  }
}
