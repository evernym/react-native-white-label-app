import { HISTORY_EVENT_STATUS } from '../connection-history/type-connection-history'
import { PAID_CREDENTIAL_REQUEST_FAIL, SEND_CLAIM_REQUEST_FAIL } from '../claim-offer/type-claim-offer'
import { ERROR_SEND_PROOF, UPDATE_ATTRIBUTE_CLAIM } from '../proof/type-proof'
import {
  claimOfferRoute,
  inviteActionRoute,
  physicalIdModalReportRoute,
  proofRequestRoute,
  questionRoute
} from '../common'
import {MESSAGE_RECEIVED} from '../invitation/type-invitation';
import {RECEIVED_MESSAGE} from '../physical-id/physical-id-type';

export const getEventMessage = (item: Object) => {
  const status = item.action
  const action = item.name
  const issuerName = item.senderName

  if (status === HISTORY_EVENT_STATUS.NEW_CONNECTION_SUCCESS)
    return `You connected with "${issuerName}".`
  else if (status === HISTORY_EVENT_STATUS.INVITATION_ACCEPTED) {
    return `Making secure connection...`
  } else if (status === HISTORY_EVENT_STATUS.CONNECTION_FAIL)
    return `Failed to make secure connection`
  else if (status === HISTORY_EVENT_STATUS.DELETE_CONNECTION_SUCCESS)
    return `You deleted your connection with "${issuerName}"`
  else if (status === HISTORY_EVENT_STATUS.CLAIM_STORAGE_SUCCESS)
    return `You have been issued a "${action}".`
  else if (status === HISTORY_EVENT_STATUS.SEND_PROOF_SUCCESS)
    return `You shared "${action}".`
  else if (status === HISTORY_EVENT_STATUS.UPDATE_QUESTION_ANSWER)
    return `${action}.`
  else if (
    status === HISTORY_EVENT_STATUS.DENY_PROOF_REQUEST_SUCCESS ||
    status === HISTORY_EVENT_STATUS.DENY_CLAIM_OFFER_SUCCESS
  )
    return `You rejected "${action}".`
  else if (
    status === HISTORY_EVENT_STATUS.DENY_PROOF_REQUEST ||
    status === HISTORY_EVENT_STATUS.DENY_CLAIM_OFFER
  )
    return `Rejecting "${action}"`
  else if (
    status === HISTORY_EVENT_STATUS.DENY_PROOF_REQUEST_FAIL ||
    status === HISTORY_EVENT_STATUS.DENY_CLAIM_OFFER_FAIL
  )
    return `Failed to reject "${action}"`
  else if (
    status === HISTORY_EVENT_STATUS.SEND_CLAIM_REQUEST_SUCCESS ||
    status === HISTORY_EVENT_STATUS.CLAIM_OFFER_ACCEPTED
  )
    return `"${action}" will be issued to you shortly.`
  else if (
    status === SEND_CLAIM_REQUEST_FAIL ||
    status === PAID_CREDENTIAL_REQUEST_FAIL
  )
    return `Failed to accept "${action}"`
  else if (status === HISTORY_EVENT_STATUS.PROOF_REQUEST_ACCEPTED)
    return `Sending...`
  else if (status === UPDATE_ATTRIBUTE_CLAIM) return `Sending...`
  else if (status === ERROR_SEND_PROOF)
    return `Failed to send "${action}"`
  else if (status === HISTORY_EVENT_STATUS.DELETE_CLAIM_SUCCESS)
    return `You deleted the credential "${action}"`
  else if (status === HISTORY_EVENT_STATUS.INVITE_ACTION_REJECTED)
    return 'You rejected action'
  else if (status === HISTORY_EVENT_STATUS.INVITE_ACTION_ACCEPTED)
    return 'You accepted action'
  else if (
    status === HISTORY_EVENT_STATUS.PROOF_PROPOSAL_ACCEPTED ||
    status === HISTORY_EVENT_STATUS.PROOF_REQUEST_SENT
  )
    return `Requesting "${action}" proof from "${issuerName}".`
  else if (status === HISTORY_EVENT_STATUS.PROOF_VERIFIED) {
    return `"${action}" proof verification passed`
  } else if (status === HISTORY_EVENT_STATUS.PROOF_VERIFICATION_FAILED) {
    return `"${action}" proof verification failed`
  } else if (status === HISTORY_EVENT_STATUS.PHYSICAL_ID_DOCUMENT_SUBMITTED) {
    return `You submitted ID documents`
  } else if (status === HISTORY_EVENT_STATUS.PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED) {
    return `Failed to issue ID documents`
  } else {
    return null
  }
}

export const getEventRedirectionRoute = (item: Object) => {
  switch (item.status) {
    case HISTORY_EVENT_STATUS.CLAIM_OFFER_RECEIVED:
      return claimOfferRoute
    case HISTORY_EVENT_STATUS.PROOF_REQUEST_RECEIVED:
      return proofRequestRoute
    case HISTORY_EVENT_STATUS.QUESTION_RECEIVED:
      return questionRoute
    case HISTORY_EVENT_STATUS.INVITE_ACTION_RECEIVED:
      return inviteActionRoute
    case HISTORY_EVENT_STATUS.PHYSICAL_ID_DOCUMENT_ISSUANCE_FAILED:
      return physicalIdModalReportRoute
  }
}
