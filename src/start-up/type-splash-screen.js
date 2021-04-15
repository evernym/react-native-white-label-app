// @flow

import type {GenericObject, ReactNavigation} from '../common/type-common'
import type { DeepLinkStore } from '../deep-link/type-deep-link'
import type { ConnectionHistoryData } from '../connection-history/type-connection-history'
import type { SMSPendingInvitationStore } from '../sms-pending-invitation/type-sms-pending-invitation'
import type { LockStore, PendingRedirection } from '../lock/type-lock'
import type { EulaStore } from '../eula/type-eula'
import type { Connection } from '../store/type-connection-store'
import {invitationReceived} from "../invitation/invitation-store";
import {claimOfferReceived} from "../claim-offer/claim-offer-store";
import {proofRequestReceived} from "../proof-request/proof-request-store";
import type {ClaimOfferStore} from "../claim-offer/type-claim-offer";
import type {ProofRequestStore} from "../proof-request/type-proof-request";
import { proofProposalReceived } from '../verifier/verifier-store'
import type { VerifierStore } from '../verifier/type-verifier'

export type SplashScreenProps = {
  historyData: ConnectionHistoryData,
  eula: EulaStore,
  isInitialized: boolean,
  deepLink: DeepLinkStore,
  smsPendingInvitation: SMSPendingInvitationStore,
  lock: LockStore,
  allDid: { [publicDID: string]: Connection },
  allPublicDid: { [publicDID: string]: Connection },
  claimOffers: ClaimOfferStore,
  proofRequests: ProofRequestStore,
  verifier: VerifierStore,
  getSmsPendingInvitation: (token: string) => void,
  addPendingRedirection: (
    pendingRedirection: Array<?PendingRedirection>
  ) => void,
  safeToDownloadSmsInvitation: () => void,
  deepLinkProcessed: (data: string) => void,
  invitationReceived: typeof invitationReceived,
  claimOfferReceived: typeof claimOfferReceived,
  proofRequestReceived: typeof proofRequestReceived,
  proofProposalReceived: typeof proofProposalReceived,
} & ReactNavigation

export type RedirectionData = {
  routeName: string,
  params?: GenericObject,
}
