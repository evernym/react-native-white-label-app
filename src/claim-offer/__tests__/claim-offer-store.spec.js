// @flow
import claimOfferStore, {
  claimOfferReceived,
  claimOfferShown,
  claimOfferIgnored,
  claimOfferRejected,
  sendClaimRequest,
  claimRequestSuccess,
  claimRequestFail,
  acceptClaimOffer,
  convertClaimRequestToEdgeClaimRequest,
  addSerializedClaimOffer,
  hydrateClaimOffers,
  saveClaimOffersSaga,
  removePersistedSerializedClaimOffersSaga,
  hydrateClaimOffersSaga,
  saveSerializedClaimOffer,
  claimOfferAccepted,
  claimOfferShowStart,
  resetClaimRequestStatus,
} from '../claim-offer-store'
import {
  CLAIM_OFFERS,
  SAVE_CLAIM_OFFERS_SUCCESS,
  SAVE_CLAIM_OFFERS_FAIL,
  ERROR_SAVE_CLAIM_OFFERS,
  REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS,
} from '../type-claim-offer'
import { getConnectionHistory } from '../../store/store-selector'
import {
  serializeClaimOffer,
  getHandleBySerializedConnection,
  getClaimHandleBySerializedClaimOffer,
  getClaimOfferState,
  sendClaimRequest as sendClaimRequestApi,
} from '../../bridge/react-native-cxs/RNCxs'
import { CLAIM_STORAGE_SUCCESS } from '../../claim/type-claim'
import {
  claimOffer,
  claimOfferId as uid,
  claimOfferIssueDate as issueDate,
  pairwiseConnection,
  claimOfferPayload,
  serializedClaimOffers,
  serializedClaimOffer,
  vcxSerializedConnection,
  connectionHistory,
} from '../../../__mocks__/static-data'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import {
  secureSet,
  secureDelete,
  getHydrationItem,
} from '../../services/storage'
import {
  VCX_INIT_POOL_SUCCESS,
  VCX_INIT_SUCCESS,
} from '../../store/type-config-store'

describe('claim offer store', () => {
  const initialAction = { type: 'INITIAL_TEST_ACTION' }
  let initialState = {
    vcxSerializedClaimOffers: {},
  }
  let newState = {
    vcxSerializedClaimOffers: {},
  }
  const claimOfferVcxInitialState = 1

  beforeEach(() => {
    initialState = claimOfferStore(undefined, initialAction)
  })

  it('should correctly calculate initial state', () => {
    expect(initialState).toMatchSnapshot()
  })

  it('claim offer is received', () => {
    newState = claimOfferStore(
      initialState,
      claimOfferReceived(claimOffer.payload, claimOffer.payloadInfo)
    )
    expect(newState).toMatchSnapshot()
  })

  it('claim offer is shown', () => {
    newState = claimOfferStore(newState, claimOfferShown(uid))
    expect(newState).toMatchSnapshot()
  })

  it('claim offer is ignored', () => {
    newState = claimOfferStore(newState, claimOfferIgnored(uid))
    expect(newState).toMatchSnapshot()
  })

  it('claim offer is rejected', () => {
    newState = claimOfferStore(newState, claimOfferRejected(uid))
    expect(newState).toMatchSnapshot()
  })

  it('claim offer is accepted', () => {
    newState = claimOfferStore(
      newState,
      acceptClaimOffer(uid, claimOffer.payload.issuer.did)
    )
    expect(newState).toMatchSnapshot()
  })

  it('claim request is sent', () => {
    newState = claimOfferStore(
      newState,
      sendClaimRequest(uid, claimOfferPayload)
    )
    expect(newState).toMatchSnapshot()
  })

  it('claim request is success', () => {
    newState = claimOfferStore(newState, claimRequestSuccess(uid, issueDate))
    expect(newState).toMatchSnapshot()
  })

  it('claim request is fail', () => {
    newState = claimOfferStore(
      newState,
      claimRequestFail(uid, {
        code: 'TEST-100',
        message: 'Claim request failed',
      })
    )
    expect(newState).toMatchSnapshot()
  })

  it('action: ADD_SERIALIZED_CLAIM_OFFER', () => {
    newState = claimOfferStore(
      newState,
      addSerializedClaimOffer(
        serializedClaimOffer,
        pairwiseConnection.identifier,
        uid,
        claimOfferVcxInitialState
      )
    )
    expect(newState).toMatchSnapshot()
  })

  it('action: CLAIM_OFFER_SHOW_START', () => {
    expect(
      claimOfferStore(newState, claimOfferShowStart(uid))
    ).toMatchSnapshot()
  })

  it('action: RESET_CLAIM_REQUEST_STATUS', () => {
    const stateAfterClaimRequestFail = claimOfferStore(
      newState,
      claimRequestFail(uid, {
        code: 'TEST-100',
        message: 'Claim request failed',
      })
    )
    expect(
      claimOfferStore(stateAfterClaimRequestFail, resetClaimRequestStatus(uid))
    ).toMatchSnapshot()
  })

  it('should reset claim offer store, if RESET action is raised', () => {
    expect(claimOfferStore(newState, { type: 'RESET' })).toMatchSnapshot()
  })

  it('action: HYDRATE_CLAIM_OFFERS_SUCCESS', () => {
    newState = claimOfferStore(
      newState,
      hydrateClaimOffers(JSON.parse(serializedClaimOffers))
    )
    expect(newState).toMatchSnapshot()
  })

  it('saga: saveSerializedClaimOfferSaga, success', () => {
    return expectSaga(
      saveClaimOffersSaga,
      addSerializedClaimOffer(
        serializedClaimOffer,
        pairwiseConnection.identifier,
        uid,
        claimOfferVcxInitialState
      )
    )
      .withState({ claimOffer: { vcxSerializedClaimOffers: {} } })
      .call(secureSet, CLAIM_OFFERS, '{"vcxSerializedClaimOffers":{}}')
      .put({ type: SAVE_CLAIM_OFFERS_SUCCESS })
      .run()
  })

  it('saga: saveSerializedClaimOfferSaga, fail', () => {
    const errorMessage = 'test error'
    const failSaveSerializedClaimOffers = new Error(errorMessage)

    return expectSaga(
      saveClaimOffersSaga,
      addSerializedClaimOffer(
        serializedClaimOffer,
        pairwiseConnection.identifier,
        uid,
        claimOfferVcxInitialState
      )
    )
      .withState({ claimOffer: { vcxSerializedClaimOffers: {} } })
      .provide([
        [
          matchers.call.fn(secureSet, CLAIM_OFFERS, '{}'),
          throwError(failSaveSerializedClaimOffers),
        ],
      ])
      .put({
        type: SAVE_CLAIM_OFFERS_FAIL,
        error: ERROR_SAVE_CLAIM_OFFERS(errorMessage),
      })
      .run()
  })

  it('saga: removePersistedSerializedClaimOffersSaga, success', () => {
    return expectSaga(removePersistedSerializedClaimOffersSaga)
      .call(secureDelete, CLAIM_OFFERS)
      .put({
        type: REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS,
      })
      .run()
  })

  it('saga: hydrateClaimOffersSaga, success', () => {
    const history = {
      data: {
        connections: {
          pairwiseIdentifier1: {
            data: connectionHistory['September 2017'].data,
          },
        },
      },
    }

    return expectSaga(hydrateClaimOffersSaga)
      .provide([
        [
          matchers.call.fn(getHydrationItem, CLAIM_OFFERS),
          serializedClaimOffers,
        ],
        [matchers.select.selector(getConnectionHistory), history],
      ])
      .put(hydrateClaimOffers(JSON.parse(serializedClaimOffers)))
      .run()
  })

  it('saga: claimOfferAccepted, success', () => {
    const claimOfferPayload = {
      ...claimOffer.payload,
      ...claimOffer.payloadInfo,
    }
    const userDID = pairwiseConnection.identifier
    const claimOfferSerialized = {
      messageId: uid,
      serialized: serializedClaimOffer,
      state: 1,
    }
    const stateWithClaimOfferAndSerialized = {
      claimOffer: {
        [uid]: claimOfferPayload,
        vcxSerializedClaimOffers: {
          [userDID]: {
            [uid]: claimOfferSerialized,
          },
        },
      },
      connections: {
        data: {
          [userDID]: {
            ...pairwiseConnection,
            senderDID: claimOfferPayload.remotePairwiseDID,
            vcxSerializedConnection: vcxSerializedConnection,
          },
        },
      },
      config: {
        vcxInitializationState: VCX_INIT_SUCCESS,
        vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
      },
    }
    const claimHandle = 1
    const connectionHandle = 1
    const paymentHandle = 0

    return expectSaga(
      claimOfferAccepted,
      acceptClaimOffer(uid, claimOfferPayload.issuer.did)
    )
      .withState(stateWithClaimOfferAndSerialized)
      .provide([
        [
          matchers.call.fn(
            getHandleBySerializedConnection,
            vcxSerializedConnection
          ),
          connectionHandle,
        ],
        [
          matchers.call.fn(
            getClaimHandleBySerializedClaimOffer,
            claimOfferSerialized
          ),
          claimHandle,
        ],
        [
          matchers.call.fn(
            sendClaimRequestApi,
            claimHandle,
            connectionHandle,
            paymentHandle
          ),
          true,
        ],
      ])
      .dispatch({ type: CLAIM_STORAGE_SUCCESS, messageId: uid })
      .call(sendClaimRequestApi, claimHandle, connectionHandle, paymentHandle)
      .call(
        saveSerializedClaimOffer,
        claimHandle,
        pairwiseConnection.identifier,
        uid
      )
      .put(sendClaimRequest(uid, claimOfferPayload))
      .run()
  })

  it('saga: saveSerializedClaimOffer', () => {
    const claimHandle = 1
    return expectSaga(
      saveSerializedClaimOffer,
      claimHandle,
      pairwiseConnection.identifier,
      uid
    )
      .provide([
        [
          matchers.call.fn(serializeClaimOffer, claimHandle),
          serializedClaimOffer,
        ],
        [
          matchers.call.fn(getClaimOfferState, claimHandle),
          claimOfferVcxInitialState,
        ],
      ])
      .put(
        addSerializedClaimOffer(
          serializedClaimOffer,
          pairwiseConnection.identifier,
          uid,
          claimOfferVcxInitialState
        )
      )
      .call(serializeClaimOffer, claimHandle)
      .call(getClaimOfferState, claimHandle)
      .run()
  })
})

describe('convertClaimRequestToEdgeClaimRequest', () => {
  it('should convert correctly', () => {
    const edgeClaimRequest = convertClaimRequestToEdgeClaimRequest({
      blinded_ms: {
        prover_did: 'userPairwiseDid',
        u: 'u',
        ur: 'ur',
      },
      schema_seq_no: 12,
      issuer_did: 'issuer_did',
      remoteDid: 'remoteDid',
      userPairwiseDid: 'userPairwiseDid',
    })
    expect(edgeClaimRequest).toMatchSnapshot()
  })
})
