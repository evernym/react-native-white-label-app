//@flow
import type { ReactNavigation } from '../common/type-common'
import type { Attribute } from '../push-notification/type-push-notification'

export type CredentialDetailsProps = {
  credentialName: string,
  claimUuid: string,
  issuerName: string,
  date: number,
  attributes: Array<Attribute>,
  logoUrl: string,
  remoteDid: string,
  uid: string,
} & ReactNavigation
