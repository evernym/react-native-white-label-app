// @flow
import { put, call, select } from 'redux-saga/effects'
import connectionHistoryReducer, {
  loadHistory,
  loadHistorySuccess,
  loadHistoryFail,
  loadHistorySaga,
  recordHistoryEvent,
  historyEventOccurred,
  historyEventOccurredSaga,
  convertInvitationToHistoryEvent,
  convertConnectionSuccessToHistoryEvent,
  convertClaimStorageSuccessToHistoryEvent,
  convertProofRequestToHistoryEvent,
  convertProofSendToHistoryEvent,
  convertSendClaimRequestSuccessToHistoryEvent,
  deleteHistoryEvent,
  convertInvitationAcceptedToHistoryEvent,
  retryInterruptedActionsSaga,
  convertClaimOfferAcceptedToHistoryEvent,
  convertClaimOfferToHistoryEvent,
  convertUpdateAttributeToHistoryEvent,
} from '../connection-history-store'
import { initialTestAction } from '../../common/type-common'
import {
  getTestInvitationPayload,
  claimOfferPayload,
  pendingClaimHistory,
  proofRequest,
  senderDid1,
  invitationReceivedEvent,
  sendClaimRequestSuccessEvent,
  claimReceivedSuccessEvent,
  proofRequestReceivedEvent,
  proofSharedEvent,
  proofRequestAutofill,
  proof,
  uid,
  invitationAcceptedEvent,
  event,
  claimOffer,
  selfAttestedAttributes,
} from '../../../__mocks__/static-data'
import {
  invitationAccepted,
  sendInvitationResponse,
} from '../../invitation/invitation-store'
import { acceptClaimOffer, claimOfferReceived, sendClaimRequestSuccess } from '../../claim-offer/claim-offer-store'
import { CLAIM_STORAGE_SUCCESS } from '../../claim/type-claim'
import { proofRequestReceived } from '../../proof-request/proof-request-store'
import {
  HISTORY_EVENT_STORAGE_KEY,
  ERROR_LOADING_HISTORY,
  ERROR_HISTORY_EVENT_OCCURRED,
} from '../type-connection-history'
import {
  getProofRequest,
  getProof,
  getClaimOffer,
  getPendingHistoryEvent,
  getHistoryEvent,
  getPendingHistory,
  getClaimReceivedHistory,
  getUniqueHistoryItem, getHistory,
} from '../../store/store-selector'
import { getHydrationItem } from '../../services/storage'
import {
  SEND_CLAIM_REQUEST_SUCCESS,
  CLAIM_OFFER_ACCEPTED,
} from './../../claim-offer/type-claim-offer'
import { RESET } from '../../common/type-common'
import { PROOF_REQUEST_RECEIVED } from '../../proof-request/type-proof-request'
import { CONNECTION_FAIL } from '../../store/type-connection-store'
import { defaultUUID as mockDefaultUUID } from '../../../__mocks__/static-data'
import { INVITATION_ACCEPTED } from '../../invitation/type-invitation'
import { expectSaga } from 'redux-saga-test-plan'
import { updateAttributeClaim } from '../../proof/proof-store'
import * as matchers from 'redux-saga-test-plan/matchers'

jest.mock('../../services/uuid', () => {
  return { uuid: () => mockDefaultUUID }
})

function getHistoryData() {
  // generate history data from static data that we have

  const invitationGenerator = getTestInvitationPayload()
  const invitationPayload = invitationGenerator.next().value
  let sender1History = []
  if (invitationPayload) {
    // add history for connection request
    sender1History.push(
      convertInvitationToHistoryEvent(invitationPayload.payload),
    )

    // add history for connection accepted
    const acceptInviteEvent = convertInvitationAcceptedToHistoryEvent(
      invitationAccepted(
        invitationPayload.payload.senderDID,
        invitationPayload.payload,
      ),
    )

    sender1History.push(acceptInviteEvent)

    // add history for connection success
    sender1History.push(
      convertConnectionSuccessToHistoryEvent(acceptInviteEvent),
    )
  }

  sender1History.push(
    convertSendClaimRequestSuccessToHistoryEvent(
      sendClaimRequestSuccess(uid, claimOfferPayload),
    ),
  )

  // add history for proof request
  sender1History.push(
    convertProofRequestToHistoryEvent(
      proofRequestReceived(proofRequest.payload, proofRequest.payloadInfo),
    ),
  )

  // add history for proof sent
  sender1History.push(
    convertProofSendToHistoryEvent(
      proofSharedEvent,
      proofRequestAutofill,
      proof,
    ),
  )

  return {
    connections: {
      [senderDid1]: { data: sender1History, newBadge: false },
    },
    connectionsUpdated: true,
  }
}

describe('Store: ConnectionHistory', () => {
  let initialState
  beforeEach(() => {
    initialState = connectionHistoryReducer(undefined, initialTestAction())
  })

  it('match loadHistory', () => {
    expect(
      connectionHistoryReducer(initialState, loadHistory()),
    ).toMatchSnapshot()
  })

  it('match loadHistorySuccess', () => {
    expect(
      connectionHistoryReducer(
        initialState,
        loadHistorySuccess(getHistoryData()),
      ),
    ).toMatchSnapshot()
  })

  it('match loadHistoryFail', () => {
    expect(
      connectionHistoryReducer(
        initialState,
        loadHistoryFail({
          code: 'TEST 101',
          message: 'Load History failed',
        }),
      ),
    ).toMatchSnapshot()
  })

  it('match record history event', () => {
    expect(
      connectionHistoryReducer(
        initialState,
        recordHistoryEvent(
          convertSendClaimRequestSuccessToHistoryEvent(
            sendClaimRequestSuccess(uid, claimOfferPayload),
            event,
          ),
        ),
      ),
    ).toMatchSnapshot()
  })

  it('historyEventOccurredSaga should raise success for correct invitation received ', () => {
    let historyEvent
    const gen = historyEventOccurredSaga(
      historyEventOccurred(invitationReceivedEvent),
    )
    historyEvent = convertInvitationToHistoryEvent(
      invitationReceivedEvent.data.payload,
    )

    expect(gen.next().value).toEqual(put(recordHistoryEvent(historyEvent)))
  })

  it('historyEventOccurredSaga should raise success for accept new connection ', () => {
    let historyEvent
    const gen = historyEventOccurredSaga(
      historyEventOccurred(invitationAcceptedEvent),
    )
    historyEvent = convertInvitationAcceptedToHistoryEvent(
      invitationAcceptedEvent,
    )

    expect(gen.next().value).toEqual(
      select(getUniqueHistoryItem, historyEvent.remoteDid, CONNECTION_FAIL),
    )

    expect(gen.next().value).toEqual(
      select(getUniqueHistoryItem, historyEvent.remoteDid, INVITATION_ACCEPTED),
    )
    expect(gen.next().value).toEqual(put(recordHistoryEvent(historyEvent)))
  })

  it('historyEventOccurredSaga should raise success for sending claim request ', () => {
    let historyEvent
    const gen = historyEventOccurredSaga(
      historyEventOccurred(sendClaimRequestSuccessEvent),
    )
    historyEvent = convertSendClaimRequestSuccessToHistoryEvent(
      sendClaimRequestSuccessEvent,
    )
    expect(gen.next().value).toEqual(
      select(
        getPendingHistory,
        historyEvent.originalPayload.uid,
        historyEvent.remoteDid,
        CLAIM_OFFER_ACCEPTED,
      ),
    )
    expect(gen.next().value).toEqual(
      select(
        getPendingHistory,
        historyEvent.originalPayload.uid,
        historyEvent.remoteDid,
        SEND_CLAIM_REQUEST_SUCCESS,
      ),
    )

    expect(gen.next().value).toEqual(put(recordHistoryEvent(historyEvent)))
  })

  it('historyEventOccurredSaga should raise success for claim received ', () => {
    let historyEvent
    const gen = historyEventOccurredSaga(
      historyEventOccurred(claimReceivedSuccessEvent),
    )

    expect(gen.next().value).toEqual(
      select(getClaimOffer, claimReceivedSuccessEvent.messageId),
    )

    historyEvent = convertClaimStorageSuccessToHistoryEvent(
      claimReceivedSuccessEvent,
      claimOfferPayload,
      event,
    )
    expect(gen.next(claimOfferPayload).value).toEqual(
      select(
        getClaimReceivedHistory,
        historyEvent.originalPayload.messageId,
        historyEvent.remoteDid,
        CLAIM_STORAGE_SUCCESS,
      ),
    )

    expect(gen.next().value).toEqual(
      select(getPendingHistoryEvent, claimOfferPayload),
    )
    expect(gen.next(pendingClaimHistory).value).toEqual(
      put(deleteHistoryEvent(pendingClaimHistory)),
    )
  })

  it('historyEventOccurredSaga should raise success for correct proof request received', () => {
    let historyEvent
    const gen = historyEventOccurredSaga(
      historyEventOccurred(proofRequestReceivedEvent),
    )
    historyEvent = convertProofRequestToHistoryEvent(proofRequestReceivedEvent)
    expect(gen.next().value).toEqual(
      select(
        getHistoryEvent,
        historyEvent.originalPayload.payloadInfo.uid,
        historyEvent.remoteDid,
        PROOF_REQUEST_RECEIVED,
      ),
    )
    expect(gen.next().value).toEqual(put(recordHistoryEvent(historyEvent)))
  })

  it('historyEventOccurredSaga should raise success for proof shared', () => {
    const gen = historyEventOccurredSaga(historyEventOccurred(proofSharedEvent))
    expect(gen.next().value).toEqual(
      select(getProofRequest, proofSharedEvent.uid),
    )
    expect(gen.next(proofRequestAutofill).value).toEqual(
      select(getProof, proofSharedEvent.uid),
    )
    convertProofSendToHistoryEvent(
      proofSharedEvent,
      proofRequestAutofill,
      proof,
      event,
    )
  })

  it('historyEventOccurredSaga should raise failure in case anything fails', () => {
    const gen = historyEventOccurredSaga(historyEventOccurred(proofSharedEvent))
    expect(gen.next().value).toEqual(
      select(getProofRequest, proofSharedEvent.uid),
    )
    const error = new Error()
    expect(gen.throw(error).value).toEqual(
      put(
        loadHistoryFail({
          ...ERROR_HISTORY_EVENT_OCCURRED,
          message: `${ERROR_HISTORY_EVENT_OCCURRED.message} ${error.message}`,
        }),
      ),
    )
  })

  it('convertInvitationToHistoryEvent should raise success', () => {
    expect(
      convertInvitationToHistoryEvent(invitationReceivedEvent.data.payload),
    ).toMatchSnapshot()
  })

  it('convertInvitationAcceptedToHistoryEvent should raise success', () => {
    expect(
      convertInvitationAcceptedToHistoryEvent(invitationAcceptedEvent),
    ).toMatchSnapshot()
  })

  it('convertSendClaimRequestSuccessToHistoryEvent should raise success', () => {
    expect(
      convertSendClaimRequestSuccessToHistoryEvent(sendClaimRequestSuccessEvent, event),
    ).toMatchSnapshot()
  })

  it('convertProofRequestToHistoryEvent should raise success', () => {
    expect(
      convertProofRequestToHistoryEvent(proofRequestReceivedEvent),
    ).toMatchSnapshot()
  })

  it('convertProofAutoFillToHistoryEvent should raise success', () => {
    expect(
      convertProofSendToHistoryEvent(
        proofSharedEvent,
        proofRequestAutofill,
        proof,
        event,
      ),
    ).toMatchSnapshot()
  })

  it('should raise failure in case data getHydrationItem fails', () => {
    const gen = loadHistorySaga()
    gen.next()
    expect(gen.next().value).toEqual(
      call(getHydrationItem, HISTORY_EVENT_STORAGE_KEY),
    )
    const error = new Error()
    expect(gen.throw(error).value).toEqual(
      put(
        loadHistoryFail({
          ...ERROR_LOADING_HISTORY,
          message: `${ERROR_LOADING_HISTORY.message} ${error.message}`,
        }),
      ),
    )
    expect(gen.next().done).toBe(true)
  })

  it('should populate missing data: Case 1: ConnectMe <= 1.3', () => {
    const data = {"connectionsUpdated":true,"connections":{"NHtA6d5xXHTyKYJtyTLt5R":{"data":[{"action":"CONNECTED","data":[{"label":"Established on","data":"2021-03-11T16:17:34+03:00"}],"id":"edc2a03f-5a1b-4e12-9d01-0a2864ddf372","name":"DEMO-Faber College","status":"CONNECTED","timestamp":"2021-03-11T16:17:34+03:00","type":"INVITATION","remoteDid":"NHtA6d5xXHTyKYJtyTLt5R","originalPayload":{"type":"NEW_CONNECTION_SUCCESS","connection":{"identifier":"TavkugqfyhKcQZjSQWyJ6d","logoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png","senderDID":"NHtA6d5xXHTyKYJtyTLt5R","senderEndpoint":"eas.evernym.com:80/agency/msg","senderName":"DEMO-Faber College","myPairwiseDid":"TavkugqfyhKcQZjSQWyJ6d","myPairwiseVerKey":"FVQM9PaCXa9Yb1xXGVm5XuQaRxVeBvxpNnSnWervHwF6","myPairwiseAgentDid":"HZZcoQ1SLisJiBm4ST8Jcw","myPairwiseAgentVerKey":"A2YGfQDn6C7dGUSbgvtcdpjpsawj4swEpkM72avzZ6CV","myPairwisePeerVerKey":"Cc44BiXnXvxu6WMWiN37DFqMfax5qVCW98M3cMGwEZKg","vcxSerializedConnection":"{\"data\":{\"agent_did\":\"HZZcoQ1SLisJiBm4ST8Jcw\",\"agent_vk\":\"A2YGfQDn6C7dGUSbgvtcdpjpsawj4swEpkM72avzZ6CV\",\"endpoint\":\"\",\"invite_detail\":{\"connReqId\":\"f8f514e9-cedd-45f9-9341-f5b81e887c1e\",\"senderAgencyDetail\":{\"DID\":\"5YKgVzinHVv5XfudLv5F4k\",\"endpoint\":\"eas.evernym.com:80/agency/msg\",\"verKey\":\"3UX8ZEkpg6ZGPiqdTWdPm5c63z5XotrD7vSKp8DLE9iu\"},\"senderDetail\":{\"DID\":\"NHtA6d5xXHTyKYJtyTLt5R\",\"agentKeyDlgProof\":{\"agentDID\":\"AmeuXWVrYdwyTGdykvAdt3\",\"agentDelegatedKey\":\"6Kr34x2PV366j8DdkVdWQLpZXrpi62pN8NeTxv5raS2K\",\"signature\":\"v/criNwnal1IBmLoKkkXjjqZqYZdU7EWSRPguhlX3VEGkTQ9HHdQrPgBf7yq1Z7sk3GuXN+0EROHLmKUl4ACDQ==\"},\"logoUrl\":\"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png\",\"name\":\"DEMO-Faber College\",\"publicDID\":\"R9kuPrDFDVKNRL1oFpRxg2\",\"verKey\":\"Cc44BiXnXvxu6WMWiN37DFqMfax5qVCW98M3cMGwEZKg\"},\"statusCode\":\"MS-102\",\"statusMsg\":\"message sent\",\"targetName\":\"DEMO-Faber College\",\"threadId\":null},\"invite_url\":null,\"public_did\":null,\"pw_did\":\"TavkugqfyhKcQZjSQWyJ6d\",\"pw_verkey\":\"FVQM9PaCXa9Yb1xXGVm5XuQaRxVeBvxpNnSnWervHwF6\",\"redirect_detail\":null,\"source_id\":\"f8f514e9-cedd-45f9-9341-f5b81e887c1e\",\"state\":4,\"their_public_did\":\"R9kuPrDFDVKNRL1oFpRxg2\",\"their_pw_did\":\"NHtA6d5xXHTyKYJtyTLt5R\",\"their_pw_verkey\":\"Cc44BiXnXvxu6WMWiN37DFqMfax5qVCW98M3cMGwEZKg\",\"uuid\":\"\",\"version\":\"1.0\"},\"version\":\"1.0\"}","publicDID":"R9kuPrDFDVKNRL1oFpRxg2"}}}],"newBadge":true}}}
    const result = {"connectionsUpdated":true,"connections":{"NHtA6d5xXHTyKYJtyTLt5R":{"data":[{"action":"CONNECTED","data":[{"label":"Established on","data":"2021-03-11T16:17:34+03:00"}],"id":"edc2a03f-5a1b-4e12-9d01-0a2864ddf372","name":"DEMO-Faber College","status":"CONNECTED","timestamp":"2021-03-11T16:17:34+03:00","type":"INVITATION","remoteDid":"NHtA6d5xXHTyKYJtyTLt5R","originalPayload":{"type":"NEW_CONNECTION_SUCCESS","connection":{"identifier":"TavkugqfyhKcQZjSQWyJ6d","logoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png","senderDID":"NHtA6d5xXHTyKYJtyTLt5R","senderEndpoint":"eas.evernym.com:80/agency/msg","senderName":"DEMO-Faber College","myPairwiseDid":"TavkugqfyhKcQZjSQWyJ6d","myPairwiseVerKey":"FVQM9PaCXa9Yb1xXGVm5XuQaRxVeBvxpNnSnWervHwF6","myPairwiseAgentDid":"HZZcoQ1SLisJiBm4ST8Jcw","myPairwiseAgentVerKey":"A2YGfQDn6C7dGUSbgvtcdpjpsawj4swEpkM72avzZ6CV","myPairwisePeerVerKey":"Cc44BiXnXvxu6WMWiN37DFqMfax5qVCW98M3cMGwEZKg","vcxSerializedConnection":"{\"data\":{\"agent_did\":\"HZZcoQ1SLisJiBm4ST8Jcw\",\"agent_vk\":\"A2YGfQDn6C7dGUSbgvtcdpjpsawj4swEpkM72avzZ6CV\",\"endpoint\":\"\",\"invite_detail\":{\"connReqId\":\"f8f514e9-cedd-45f9-9341-f5b81e887c1e\",\"senderAgencyDetail\":{\"DID\":\"5YKgVzinHVv5XfudLv5F4k\",\"endpoint\":\"eas.evernym.com:80/agency/msg\",\"verKey\":\"3UX8ZEkpg6ZGPiqdTWdPm5c63z5XotrD7vSKp8DLE9iu\"},\"senderDetail\":{\"DID\":\"NHtA6d5xXHTyKYJtyTLt5R\",\"agentKeyDlgProof\":{\"agentDID\":\"AmeuXWVrYdwyTGdykvAdt3\",\"agentDelegatedKey\":\"6Kr34x2PV366j8DdkVdWQLpZXrpi62pN8NeTxv5raS2K\",\"signature\":\"v/criNwnal1IBmLoKkkXjjqZqYZdU7EWSRPguhlX3VEGkTQ9HHdQrPgBf7yq1Z7sk3GuXN+0EROHLmKUl4ACDQ==\"},\"logoUrl\":\"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png\",\"name\":\"DEMO-Faber College\",\"publicDID\":\"R9kuPrDFDVKNRL1oFpRxg2\",\"verKey\":\"Cc44BiXnXvxu6WMWiN37DFqMfax5qVCW98M3cMGwEZKg\"},\"statusCode\":\"MS-102\",\"statusMsg\":\"message sent\",\"targetName\":\"DEMO-Faber College\",\"threadId\":null},\"invite_url\":null,\"public_did\":null,\"pw_did\":\"TavkugqfyhKcQZjSQWyJ6d\",\"pw_verkey\":\"FVQM9PaCXa9Yb1xXGVm5XuQaRxVeBvxpNnSnWervHwF6\",\"redirect_detail\":null,\"source_id\":\"f8f514e9-cedd-45f9-9341-f5b81e887c1e\",\"state\":4,\"their_public_did\":\"R9kuPrDFDVKNRL1oFpRxg2\",\"their_pw_did\":\"NHtA6d5xXHTyKYJtyTLt5R\",\"their_pw_verkey\":\"Cc44BiXnXvxu6WMWiN37DFqMfax5qVCW98M3cMGwEZKg\",\"uuid\":\"\",\"version\":\"1.0\"},\"version\":\"1.0\"}","publicDID":"R9kuPrDFDVKNRL1oFpRxg2"}}, "senderName":"DEMO-Faber College", "senderLogoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png"}],"newBadge":true}}}

    return expectSaga(loadHistorySaga)
      .put(loadHistory())
      .provide([
        [
          matchers.call.fn(
            getHydrationItem,
            HISTORY_EVENT_STORAGE_KEY,
          ),
          JSON.stringify(data)
        ],
      ])
      .put(loadHistorySuccess(result))
      .run()
  })

  it('should populate missing data: Case 2: ConnectMe = 1.4', () => {
    const data = {"connections":{"Mbhujqffvqm2QBBN8T5J11":{"data":[{"action":"CONNECTED","data":[{"label":"Established on","data":"2021-02-22T14:33:42+00:00"}],"id":"225f24c5-2d12-42ab-bc31-9d1d78e0698a","name":"DEMO-Faber College","status":"CONNECTED","timestamp":"2021-02-22T14:33:42+00:00","type":"INVITATION","remoteDid":"Mbhujqffvqm2QBBN8T5J11","originalPayload":{"type":"INVITATION_ACCEPTED","senderDID":"Mbhujqffvqm2QBBN8T5J11","payload":{"senderEndpoint":"eas.evernym.com:80/agency/msg","requestId":"770e38e4-993b-4ae6-a15a-c8fc63085b9b","senderAgentKeyDelegationProof":{"agentDID":"RdUygjgE8oPuLfKMM2ZXhy","agentDelegatedKey":"ERa9LXWdmRu9oRMsnDAPHTRGcxPGyRmK3HDujcjShTk7","signature":"6gp/T1gVeme3FB/HQNXUnJ2qfpipuJlsqXPWXEBiBOKA4L+8IK/TbPhs1AJAapv0MQJhvX5DvndvuLXvPz5iBw=="},"senderName":"DEMO-Faber College","senderDID":"Mbhujqffvqm2QBBN8T5J11","senderLogoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png","senderVerificationKey":"CE9zU1TAuzfgZi1HARmL8obtwxdRY65Wj2sXcE1g1hsT","targetName":"there","senderDetail":{"name":"DEMO-Faber College","agentKeyDlgProof":{"agentDID":"RdUygjgE8oPuLfKMM2ZXhy","agentDelegatedKey":"ERa9LXWdmRu9oRMsnDAPHTRGcxPGyRmK3HDujcjShTk7","signature":"6gp/T1gVeme3FB/HQNXUnJ2qfpipuJlsqXPWXEBiBOKA4L+8IK/TbPhs1AJAapv0MQJhvX5DvndvuLXvPz5iBw=="},"DID":"Mbhujqffvqm2QBBN8T5J11","logoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png","verKey":"CE9zU1TAuzfgZi1HARmL8obtwxdRY65Wj2sXcE1g1hsT","publicDID":"R9kuPrDFDVKNRL1oFpRxg2"},"senderAgencyDetail":{"DID":"5YKgVzinHVv5XfudLv5F4k","verKey":"3UX8ZEkpg6ZGPiqdTWdPm5c63z5XotrD7vSKp8DLE9iu","endpoint":"eas.evernym.com:80/agency/msg"}}}}],"newBadge":false}},"connectionsUpdated":true}
    const result = {"connections":{"Mbhujqffvqm2QBBN8T5J11":{"data":[{"action":"CONNECTED","data":[{"label":"Established on","data":"2021-02-22T14:33:42+00:00"}],"id":"225f24c5-2d12-42ab-bc31-9d1d78e0698a","name":"DEMO-Faber College","status":"CONNECTED","timestamp":"2021-02-22T14:33:42+00:00","type":"INVITATION","remoteDid":"Mbhujqffvqm2QBBN8T5J11","originalPayload":{"type":"INVITATION_ACCEPTED","senderDID":"Mbhujqffvqm2QBBN8T5J11","payload":{"senderEndpoint":"eas.evernym.com:80/agency/msg","requestId":"770e38e4-993b-4ae6-a15a-c8fc63085b9b","senderAgentKeyDelegationProof":{"agentDID":"RdUygjgE8oPuLfKMM2ZXhy","agentDelegatedKey":"ERa9LXWdmRu9oRMsnDAPHTRGcxPGyRmK3HDujcjShTk7","signature":"6gp/T1gVeme3FB/HQNXUnJ2qfpipuJlsqXPWXEBiBOKA4L+8IK/TbPhs1AJAapv0MQJhvX5DvndvuLXvPz5iBw=="},"senderName":"DEMO-Faber College","senderDID":"Mbhujqffvqm2QBBN8T5J11","senderLogoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png","senderVerificationKey":"CE9zU1TAuzfgZi1HARmL8obtwxdRY65Wj2sXcE1g1hsT","targetName":"there","senderDetail":{"name":"DEMO-Faber College","agentKeyDlgProof":{"agentDID":"RdUygjgE8oPuLfKMM2ZXhy","agentDelegatedKey":"ERa9LXWdmRu9oRMsnDAPHTRGcxPGyRmK3HDujcjShTk7","signature":"6gp/T1gVeme3FB/HQNXUnJ2qfpipuJlsqXPWXEBiBOKA4L+8IK/TbPhs1AJAapv0MQJhvX5DvndvuLXvPz5iBw=="},"DID":"Mbhujqffvqm2QBBN8T5J11","logoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png","verKey":"CE9zU1TAuzfgZi1HARmL8obtwxdRY65Wj2sXcE1g1hsT","publicDID":"R9kuPrDFDVKNRL1oFpRxg2"},"senderAgencyDetail":{"DID":"5YKgVzinHVv5XfudLv5F4k","verKey":"3UX8ZEkpg6ZGPiqdTWdPm5c63z5XotrD7vSKp8DLE9iu","endpoint":"eas.evernym.com:80/agency/msg"}}},"senderName":"DEMO-Faber College","senderLogoUrl":"https://s3.us-east-2.amazonaws.com/public-demo-artifacts/demo-icons/cbFaber.png"}],"newBadge":false}},"connectionsUpdated":true}

    return expectSaga(loadHistorySaga)
      .put(loadHistory())
      .provide([
        [
          matchers.call.fn(
            getHydrationItem,
            HISTORY_EVENT_STORAGE_KEY,
          ),
          JSON.stringify(data)
        ],
      ])
      .put(loadHistorySuccess(result))
      .run()
  })

  it('should reset history if RESET action is raised', () => {
    const afterOneHistoryEventState = connectionHistoryReducer(
      initialState,
      recordHistoryEvent(
        convertSendClaimRequestSuccessToHistoryEvent(
          sendClaimRequestSuccess(uid, claimOfferPayload),
          event,
        ),
      ),
    )
    expect(
      connectionHistoryReducer(afterOneHistoryEventState, {
        type: RESET,
      }),
    ).toMatchSnapshot()
  })
})

describe('Store: ConnectionHistory', () => {
  it('retryInterruptedActionsSaga when no interrupted actions', () => {
    const gen = retryInterruptedActionsSaga()

    expect(gen.next().value).toEqual(
      select(getHistory),
    )

    expect(gen.next().value).toEqual(undefined)
  })

  it('retryInterruptedActionsSaga for accepted connection invitation', () => {
    const invitationPayload = getTestInvitationPayload().next().value
    if (!invitationPayload) {
      return
    }

    const acceptInviteEvent = convertInvitationAcceptedToHistoryEvent(
      invitationAccepted(
        invitationPayload.payload.senderDID,
        invitationPayload.payload,
      ),
    )

    return expectSaga(retryInterruptedActionsSaga)
      .withState({
        history: {
          data: {
            connections: {
              [senderDid1]: { data: [acceptInviteEvent] },
            },
          },
        },
      })
      .select(getHistory)
      .put(sendInvitationResponse({ response: 'accepted', senderDID: invitationPayload.payload.senderDID }))
      .run()
  })

  it('retryInterruptedActionsSaga for accepted credential offer', () => {
    const acceptInviteEvent = convertClaimOfferAcceptedToHistoryEvent(
      acceptClaimOffer(
        claimOffer.payloadInfo.uid,
        claimOffer.payloadInfo.remotePairwiseDID,
      ),
      convertClaimOfferToHistoryEvent(
        claimOfferReceived(
          claimOffer.payload,
          claimOffer.payloadInfo,
        ),
      ),
    )

    return expectSaga(retryInterruptedActionsSaga)
      .withState({
        history: {
          data: {
            connections: {
              [claimOffer.payloadInfo.remotePairwiseDID]: { data: [acceptInviteEvent] },
            },
          },
        },
      })
      .select(getHistory)
      .put(acceptClaimOffer(claimOffer.payloadInfo.uid, claimOffer.payloadInfo.remotePairwiseDID))
      .run()
  })

  it('retryInterruptedActionsSaga for accepted proof request', () => {

    const acceptInviteEvent = convertUpdateAttributeToHistoryEvent(
      updateAttributeClaim(
        proofRequest.payloadInfo.uid,
        proofRequest.payloadInfo.remotePairwiseDID,
        {},
        selfAttestedAttributes,
      ),
      convertProofRequestToHistoryEvent(
        proofRequestReceived(proofRequest.payload, proofRequest.payloadInfo),
      ),
      {},
    )

    return expectSaga(retryInterruptedActionsSaga)
      .withState({
        history: {
          data: {
            connections: {
              [claimOffer.payloadInfo.remotePairwiseDID]: { data: [acceptInviteEvent] },
            },
          },
        },
      })
      .select(getHistory)
      .put(updateAttributeClaim(
        proofRequest.payloadInfo.uid,
        proofRequest.payloadInfo.remotePairwiseDID,
        {},
        selfAttestedAttributes,
      ))
      .run()
  })
})
