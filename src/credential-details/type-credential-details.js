//@flow
import type { ReactNavigation } from '../common/type-common'
import type { Attribute } from '../push-notification/type-push-notification'
import { deleteClaim } from '../claim-offer/claim-offer-store'

export type CredentialDetailsProps = {
  credentialName: string,
  claimUuid: string,
  issuerName: string,
  date: number,
  attributes: Array<Attribute>,
  logoUrl: string,
  remoteDid: string,
  uid: string,
  deleteClaim: typeof deleteClaim,
} & ReactNavigation
