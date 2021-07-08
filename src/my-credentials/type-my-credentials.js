// @flow
import type { ReactNavigation } from '../common/type-common'
import type { ClaimOfferPayload } from '../claim-offer/type-claim-offer'
import type { Attribute } from '../push-notification/type-push-notification'
import { deleteClaim } from '../claim-offer/claim-offer-store'

export type MyCredentialsProps = {
  offers: ClaimOffers,
  environmentName: string,
  deleteClaim: typeof deleteClaim,
  credentialsColors: any,
} & ReactNavigation

export type CredentialsCardsProps = {
  credentials: Array<CredentialItem>,
} & ReactNavigation

export type CredentialCardProps = {
  item: CredentialItem,
  isExpanded: boolean,
  isHidden: boolean,
  setActiveStack?: (stackName: string | null) => void,
  elevation?: number,
  enabled?: boolean,
  isNeedMargin?: boolean,
}

export type CredentialItem = {
  claimOfferUuid: string,
  credentialName: string,
  issuerName: string,
  date?: number,
  attributes: Array<Attribute>,
  logoUrl?: ?string,
  remoteDid: string,
  colorTheme?: string,
  claimDefinitionId?: ?string,
}

export type ClaimOffers = {
  +[string]: ClaimOfferPayload,
}

export type CardStackProps = {
  credentials: Array<CredentialItem>,
  isExpanded: boolean,
  isHidden: boolean,
  setActiveStack: (stackName: string | null) => void,
  enabledCardGesture?: boolean,
}

export const MESSAGE_DELETE_CLAIM_TITLE = 'Delete credential?'
export const MESSAGE_DELETE_CLAIM_DESCRIPTION = 'This cannot be undone.'
