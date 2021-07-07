// @flow
import {
  SEND_CLAIM_REQUEST_SUCCESS,
  CLAIM_OFFER_RECEIVED,
  CLAIM_OFFER_ACCEPTED,
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  DENY_CLAIM_OFFER,
  DENY_CLAIM_OFFER_FAIL,
  DENY_CLAIM_OFFER_SUCCESS,
  OUTOFBAND_CLAIM_OFFER_ACCEPTED,
  DENY_OUTOFBAND_CLAIM_OFFER, DELETE_CLAIM_SUCCESS,
} from '../claim-offer/type-claim-offer'
import {
  CLAIM_STORAGE_SUCCESS,
} from '../claim/type-claim'
import {
  PROOF_REQUEST_RECEIVED,
  SEND_PROOF_SUCCESS,
  DENY_PROOF_REQUEST_SUCCESS,
  DENY_PROOF_REQUEST,
  DENY_PROOF_REQUEST_FAIL,
  ACCEPT_OUTOFBAND_PRESENTATION_REQUEST,
} from '../proof-request/type-proof-request'
import { historyEventOccurred } from './connection-history-store'
import {
  QUESTION_RECEIVED,
  UPDATE_QUESTION_ANSWER,
} from '../question/type-question'
import {
  INVITE_ACTION_RECEIVED,
  INVITE_ACTION_REJECTED,
  INVITE_ACTION_ACCEPTED,
} from '../invite-action/type-invite-action.js'
import { UPDATE_ATTRIBUTE_CLAIM, ERROR_SEND_PROOF } from '../proof/type-proof'
import { INVITATION_ACCEPTED } from '../invitation/type-invitation'
import {
  CONNECTION_FAIL,
  DELETE_CONNECTION_SUCCESS,
  CONNECTION_REQUEST_SENT,
  NEW_CONNECTION_SUCCESS,
} from '../store/type-connection-store'
import {
  OUTOFBAND_PROOF_PROPOSAL_ACCEPTED,
  PROOF_PROPOSAL_ACCEPTED,
  PROOF_PROPOSAL_RECEIVED,
  PROOF_REQUEST_SENT,
  PROOF_VERIFICATION_FAILED,
  PROOF_VERIFIED,
} from '../verifier/type-verifier'

const actionToRecord = [
  // removing invitation received from record array
  // because anyway we will not show this event in history view
  // also it uses secure set that is only accessible after vcx_init
  // and we don't want to trigger vxc_init just because invitation
  // is downloaded
  // INVITATION_RECEIVED,
  INVITATION_ACCEPTED,
  CONNECTION_REQUEST_SENT,
  NEW_CONNECTION_SUCCESS,
  PROOF_REQUEST_RECEIVED,
  CLAIM_OFFER_RECEIVED,
  SEND_CLAIM_REQUEST_SUCCESS,
  CLAIM_STORAGE_SUCCESS,
  SEND_PROOF_SUCCESS,
  QUESTION_RECEIVED,
  UPDATE_QUESTION_ANSWER,
  DENY_PROOF_REQUEST,
  DENY_PROOF_REQUEST_FAIL,
  DENY_PROOF_REQUEST_SUCCESS,
  CLAIM_OFFER_ACCEPTED,
  OUTOFBAND_CLAIM_OFFER_ACCEPTED,
  DENY_OUTOFBAND_CLAIM_OFFER,
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  UPDATE_ATTRIBUTE_CLAIM,
  ERROR_SEND_PROOF,
  DENY_CLAIM_OFFER,
  DENY_CLAIM_OFFER_FAIL,
  DENY_CLAIM_OFFER_SUCCESS,
  DELETE_CLAIM_SUCCESS,
  CONNECTION_FAIL,
  ACCEPT_OUTOFBAND_PRESENTATION_REQUEST,
  DELETE_CONNECTION_SUCCESS,
  INVITE_ACTION_RECEIVED,
  INVITE_ACTION_REJECTED,
  INVITE_ACTION_ACCEPTED,
  PROOF_PROPOSAL_RECEIVED,
  OUTOFBAND_PROOF_PROPOSAL_ACCEPTED,
  PROOF_PROPOSAL_ACCEPTED,
  PROOF_REQUEST_SENT,
  PROOF_VERIFIED,
  PROOF_VERIFICATION_FAILED,
]

// TODO:KS Fix any type using `redux` provided Generic Types
const history = (store: any) => (next: any) => (action: any) => {
  // pass on the action first to other middleware in line
  const nextState = next(action)

  // now go for our own history recorder
  if (actionToRecord.indexOf(action.type) > -1) {
    // we got an action that needs to be recorded
    // dispatch an action, that starts from beginning of middleware chain
    // we are dispatching a new action here
    store.dispatch(historyEventOccurred(action))
  }

  return nextState
}

export default history
