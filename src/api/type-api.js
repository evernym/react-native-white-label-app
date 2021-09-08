// @flow
export type ApiData = {
  method: string,
  mode: string,
  headers: { [string]: string },
  body?: string,
  keepalive?: string,
}

export type BackendError = {
  statusCode: string,
  statusMsg: string,
}

export type GetInvitationLinkApiData = {
  agencyUrl: string,
  smsToken: string,
}

export type EnvironmentDetailUrlDownloaded = {
  agencyDID: string,
  agencyUrl: string,
  agencyVerificationKey: string,
  poolConfig: string,
  paymentMethod: string,
  domainDID: string,
  verityFlowBaseUrl: string,
  identityCardCredDefId: string,
  drivingLicenseCredDefId: string,
  passportCredDefId: string,
}
