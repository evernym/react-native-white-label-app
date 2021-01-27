// @flow
export type CredentialListItemProps = {
  onPress: Function,
  credentialName: string,
  issuerName?: string,
  date?: number,
  image?: ?string,
  attributesCount: number,
}
