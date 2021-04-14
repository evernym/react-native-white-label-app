// @flow
import { INVITATION_REJECTED } from '../invitation/type-invitation'
import { NEW_CONNECTION_SUCCESS } from '../store/type-connection-store'
import { DENY_CLAIM_OFFER_SUCCESS, CLAIM_REQUEST_SUCCESS } from '../claim-offer/type-claim-offer'
import { SEND_PROOF_SUCCESS, DENY_PROOF_REQUEST_SUCCESS } from '../proof-request/type-proof-request'

import { EVENTS, logsToApptentive } from './log-to-apptentive'

const actionToRecord = [
  NEW_CONNECTION_SUCCESS,
  INVITATION_REJECTED,
  CLAIM_REQUEST_SUCCESS,
  DENY_CLAIM_OFFER_SUCCESS,
  SEND_PROOF_SUCCESS,
  DENY_PROOF_REQUEST_SUCCESS,
]

const logToApptentiveMiddleware = (store: any) => (next: any) => (action: any) => {
  const nextState = next(action)

  if (actionToRecord.indexOf(action.type) > -1) {
    switch (action.type) {
      case NEW_CONNECTION_SUCCESS:
        logsToApptentive(EVENTS.ACCEPT_CONNECTION)
        return nextState
      case INVITATION_REJECTED:
        logsToApptentive(EVENTS.DENY_CONNECTION)
        return nextState
      case CLAIM_REQUEST_SUCCESS:
        logsToApptentive(EVENTS.ACCEPT_CREDENTIAL)
        return nextState
      case DENY_CLAIM_OFFER_SUCCESS:
        logsToApptentive(EVENTS.DENY_CREDENTIAL)
        return nextState
      case SEND_PROOF_SUCCESS:
        logsToApptentive(EVENTS.SHARE_PROOF)
        return nextState
      case DENY_PROOF_REQUEST_SUCCESS:
        logsToApptentive(EVENTS.DENY_PROOF)
        return nextState
    }
  }

  return nextState
}

export default logToApptentiveMiddleware
