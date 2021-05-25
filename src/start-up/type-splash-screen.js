// @flow
import type { ReactNavigation } from '../common/type-common'
import { addPendingRedirection } from '../lock/lock-store'
export type SplashScreenProps = {
  addPendingRedirection: typeof addPendingRedirection,
} & ReactNavigation
