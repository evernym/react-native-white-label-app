// @flow
import type { ReactNavigation } from '../common/type-common'
import { addPendingRedirection, unlockApp } from '../lock/lock-store'

export type SplashScreenProps = {
  addPendingRedirection: typeof addPendingRedirection,
  unlockApp: () => void,
} & ReactNavigation
