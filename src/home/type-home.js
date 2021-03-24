// @flow
import type { ReactNavigation } from '../common/type-common'
import type { MessageDownloadStatus } from '../store/type-config-store'
import {HISTORY_EVENT_STATUS} from "../connection-history/type-connection-history";
import {PAID_CREDENTIAL_REQUEST_FAIL, SEND_CLAIM_REQUEST_FAIL} from "../claim-offer/type-claim-offer";
import {ERROR_SEND_PROOF, UPDATE_ATTRIBUTE_CLAIM} from "../proof/type-proof";

export type HomeProps = {
  sendConnectionReuse: Function,
  sendConnectionRedirect: Function,
  environmentName: string,
  newBannerConnections: Array<Object>,
  recentConnections: Array<Object>,
  hasNoConnection: boolean,
  mappedDidToLogoAndName: Object,
  getUnacknowledgedMessages: () => void,
  messageDownloadStatus: MessageDownloadStatus,
  snackError: ?string,
} & ReactNavigation

export const recentEventToShow = {
  [HISTORY_EVENT_STATUS.NEW_CONNECTION_SUCCESS]: true,
  [HISTORY_EVENT_STATUS.INVITATION_ACCEPTED]: true,
  [HISTORY_EVENT_STATUS.CONNECTION_FAIL]: true,
  [HISTORY_EVENT_STATUS.DELETE_CONNECTION_SUCCESS]: true,
  [HISTORY_EVENT_STATUS.CLAIM_STORAGE_SUCCESS]: true,
  [HISTORY_EVENT_STATUS.SEND_PROOF_SUCCESS]: true,
  [HISTORY_EVENT_STATUS.UPDATE_QUESTION_ANSWER]: true,
  [HISTORY_EVENT_STATUS.DENY_PROOF_REQUEST_SUCCESS]: true,
  [HISTORY_EVENT_STATUS.DENY_CLAIM_OFFER_SUCCESS]: true,
  [HISTORY_EVENT_STATUS.DENY_PROOF_REQUEST]: true,
  [HISTORY_EVENT_STATUS.DENY_CLAIM_OFFER]: true,
  [HISTORY_EVENT_STATUS.DENY_PROOF_REQUEST_FAIL]: true,
  [HISTORY_EVENT_STATUS.DENY_CLAIM_OFFER_FAIL]: true,
  [HISTORY_EVENT_STATUS.SEND_CLAIM_REQUEST_SUCCESS]: true,
  [HISTORY_EVENT_STATUS.CLAIM_OFFER_ACCEPTED]: true,
  [SEND_CLAIM_REQUEST_FAIL]: true,
  [PAID_CREDENTIAL_REQUEST_FAIL]: true,
  [HISTORY_EVENT_STATUS.PROOF_REQUEST_ACCEPTED]: true,
  [UPDATE_ATTRIBUTE_CLAIM]: true,
  [ERROR_SEND_PROOF]: true,
  [HISTORY_EVENT_STATUS.DELETE_CLAIM_SUCCESS]: true,
}
