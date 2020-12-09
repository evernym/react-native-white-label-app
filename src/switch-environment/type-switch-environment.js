// @flow
import type { ReactNavigation } from '../common/type-common'

export type SwitchEnvironmentProps = {
  changeEnvironment: (
    agencyUrl: string,
    agencyDID: string,
    agencyVerificationKey: string,
    poolConfig: string,
    paymentMethod: string
  ) => void,
  agencyDID: string,
  agencyVerificationKey: string,
  agencyUrl: string,
  poolConfig: string,
  paymentMethod: string,
  disableDevMode: () => void,
} & ReactNavigation

export type SwitchEnvironmentState = {
  agencyDID: string,
  agencyVerificationKey: string,
  agencyUrl: string,
  poolConfig: string,
  paymentMethod: string,
}
