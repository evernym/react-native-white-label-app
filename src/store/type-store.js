// @flow

import type { LockStore } from '../lock/type-lock'
import type { SMSPendingInvitationStore } from '../sms-pending-invitation/type-sms-pending-invitation'
import type { ClaimOfferStore } from '../claim-offer/type-claim-offer'
import type { ProofRequestStore } from '../proof-request/type-proof-request'
import type { InvitationStore } from '../invitation/type-invitation'
import type { ConnectionStore } from './type-connection-store'
import type { ConfigStore } from './type-config-store'
import type { ClaimStore } from '../claim/type-claim'
import type { ProofStore } from '../proof/type-proof'
import type { UserStore } from './user/type-user-store'
import type { ConnectionHistoryStore } from '../connection-history/type-connection-history'
import type { DeepLinkStore } from '../deep-link/type-deep-link'
import type { WalletStore } from '../wallet/type-wallet'
import type { EulaStore } from '../eula/type-eula'
import type { BackupStore } from '../backup/type-backup'
import type { SendLogsStore } from '../send-logs/type-send-logs'
import type { RestoreStore } from '../restore/type-restore'
import type { LedgerStore } from '../ledger/type-ledger-store'
import type { OfflineStore } from '../offline/type-offline'
import type { OnfidoStore } from '../onfido/type-onfido'
import type { QuestionStore } from '../question/type-question'
import type { CloudRestoreStore } from '../cloud-restore/type-cloud-restore'
import type { PushNotificationStore } from '../push-notification/type-push-notification'
import type { TxnAuthorAgreementStore } from '../txn-author-agreement/type-txn-author-agreement'
import type { OpenIdConnectStore } from '../open-id-connect/open-id-connect-actions'
import type { InAppNotificationStore } from '../in-app-notification/in-app-notification-type'
import type { InviteActionStore } from '../invite-action/type-invite-action'
import type { ShowCredentialStore } from '../show-credential/type-show-credential'
import type { VerifierStore } from "../verifier/type-verifier";

export type RouteStore = {
  currentScreen: string,
  timeStamp: number,
}

export type Store = {
  config: ConfigStore,
  connections: ConnectionStore,
  deepLink: DeepLinkStore,
  pushNotification: PushNotificationStore,
  route: RouteStore,
  user: UserStore,
  lock: LockStore,
  smsPendingInvitation: SMSPendingInvitationStore,
  claimOffer: ClaimOfferStore,
  proofRequest: ProofRequestStore,
  invitation: InvitationStore,
  claim: ClaimStore,
  proof: ProofStore,
  history: ConnectionHistoryStore,
  wallet: WalletStore,
  eula: EulaStore,
  backup: BackupStore,
  sendlogs: SendLogsStore,
  restore: RestoreStore,
  ledger: LedgerStore,
  offline: OfflineStore,
  onfido: OnfidoStore,
  question: QuestionStore,
  txnAuthorAgreement: TxnAuthorAgreementStore,
  cloudRestore: CloudRestoreStore,
  openIdConnect: OpenIdConnectStore,
  inAppNotification: InAppNotificationStore,
  inviteAction: InviteActionStore,
  showCredential: ShowCredentialStore,
  verifier: VerifierStore,
}
