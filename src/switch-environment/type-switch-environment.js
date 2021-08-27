// @flow
import type { CustomError, ReactNavigation } from '../common/type-common'

export type SwitchEnvironmentProps = {
  changeEnvironment: (
    agencyUrl: string,
    agencyDID: string,
    agencyVerificationKey: string,
    poolConfig: string,
    paymentMethod: string,
    domainDID: string,
    verityFlowBaseUrl: string
  ) => void,
  agencyDID: string,
  agencyVerificationKey: string,
  agencyUrl: string,
  poolConfig: string,
  paymentMethod: string,
  domainDID: string,
  verityFlowBaseUrl: string,
  disableDevMode: () => void,
} & ReactNavigation

export type SwitchEnvironmentState = {
  agencyDID: string,
  agencyVerificationKey: string,
  agencyUrl: string,
  poolConfig: string,
  paymentMethod: string,
  domainDID: string,
  verityFlowBaseUrl: string,
}

export const SERVER_ENVIRONMENT = {
  DEMO: 'DEMO',
  SANDBOX: 'SANDBOX',
  STAGING: 'STAGING',
  DEVELOPMENT: 'DEVELOPMENT',
  QATEST1: 'QATEST1',
  QA: 'QA',
  DEVRC: 'DEVRC',
  DEVTEAM1: 'DEVTEAM1',
  DEVTEAM2: 'DEVTEAM2',
  DEVTEAM3: 'DEVTEAM3',
  PROD: 'PROD',
}

export type ServerEnvironment = $Keys<typeof SERVER_ENVIRONMENT>

export const SERVER_ENVIRONMENT_CHANGED = 'SERVER_ENVIRONMENT_CHANGED'

export type ServerEnvironmentChangedAction = {
  type: typeof SERVER_ENVIRONMENT_CHANGED,
  serverEnvironment: ServerEnvironment,
}

export const SWITCH_ENVIRONMENT = 'SWITCH_ENVIRONMENT'

export type ChangeEnvironment = {
  agencyUrl: string,
  poolConfig: string,
  agencyDID: string,
  agencyVerificationKey: string,
  paymentMethod: string,
  domainDID: string,
  verityFlowBaseUrl: string,
}

export type SwitchEnvironmentAction = {
  type: typeof SWITCH_ENVIRONMENT,
} & ChangeEnvironment

export const SWITCH_ERROR_ALERTS = 'SWITCH_ERROR_ALERTS'

export type SwitchErrorAlertsAction = {
  type: typeof SWITCH_ERROR_ALERTS,
}

export const SAVE_SWITCH_ENVIRONMENT_DETAIL_FAIL =
  'SAVE_SWITCH_ENVIRONMENT_DETAIL_FAIL'

export type SaveSwitchEnvironmentDetailFailAction = {
  type: typeof SAVE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  error: CustomError,
}

export const HYDRATE_SWITCH_ENVIRONMENT_DETAIL_FAIL =
  'HYDRATE_SWITCH_ENVIRONMENT_DETAIL_FAIL'

export type HydrateSwitchEnvironmentDetailFailAction = {
  type: typeof HYDRATE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  error: CustomError,
}

export const CHANGE_ENVIRONMENT_VIA_URL = 'CHANGE_ENVIRONMENT_VIA_URL'

export type ChangeEnvironmentUrlAction = {
  type: typeof CHANGE_ENVIRONMENT_VIA_URL,
  url: string,
}
