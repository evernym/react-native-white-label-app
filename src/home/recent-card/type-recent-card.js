// @flow
import type { ConnectionHistoryEvent } from '../../connection-history/type-connection-history'
import {
  acceptClaimOffer,
  denyClaimOffer,
} from '../../claim-offer/claim-offer-store'
import { reTrySendProof } from '../../proof/proof-store'
import { deleteHistoryEvent } from '../../connection-history/connection-history-store'
import { denyProofRequest } from '../../proof-request/proof-request-store'
import { sendInvitationResponse } from '../../invitation/invitation-store'
import { deleteConnectionAction } from '../../store/connections-store'

export type RecentCardProps = {
  timestamp: string,
  statusMessage: string,
  issuerName: string,
  logoUrl: string,
  status: string,
  item: ConnectionHistoryEvent,
  acceptClaimOffer: typeof acceptClaimOffer,
  reTrySendProof: typeof reTrySendProof,
  deleteHistoryEvent: typeof deleteHistoryEvent,
  denyProofRequest: typeof denyProofRequest,
  denyClaimOffer: typeof denyClaimOffer,
  sendInvitationResponse: typeof sendInvitationResponse,
  deleteConnectionAction: typeof deleteConnectionAction,
}
