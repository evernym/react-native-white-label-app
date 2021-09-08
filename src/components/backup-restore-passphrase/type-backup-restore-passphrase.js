// @flow

export type BackupRestorePassphraseProps = {
  testID: string,
  filename?: string,
  placeholder: string,
  errorState?: boolean,
  isCloudRestoreAttempt?: boolean,
  onSubmit: (passphrase: string) => any,
  changeEnvironment: (
    agencyUrl: string,
    agencyDID: string,
    agencyVerificationKey: string,
    poolConfig: string,
    paymentMethod: string,
    domainDID: string,
    verityFlowBaseUrl: string,
    identityCardCredDefId: string,
    drivingLicenseCredDefId: string,
    passportCredDefId: string
  ) => void,
  navigation?: any,
}
