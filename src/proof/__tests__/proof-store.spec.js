// @flow

import { put, select, take } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import { initialTestAction } from '../../common/type-common'
import proofReducer, {
  proofSuccess,
  generateProofSaga,
  findMissingRequestedAttributes,
  proofFail,
  convertIndyPreparedProofToAttributes,
  getProof,
  proofRequestDataToStore,
  findCredentialsExcludedByAttributeRestrictions,
} from '../proof-store'
import {
  acceptProofRequest,
  missingAttributesFound,
  proofRequestAutoFill,
  sendProof,
  proofRequestShowStart,
} from '../../proof-request/proof-request-store'
import {
  proofRequest,
  proof,
  originalProofRequestData,
  originalProofRequestData10Attributes,
  originalProofRequestDataMissingAttribute,
  preparedProof,
  homeAddressPreparedProof,
  homeAddressPreparedProofMultipleCreds,
  preparedProofWithMissingAttribute,
  homeAddressPreparedProofWithMissingAttribute,
  selfAttestedAttributes,
  originalProofRequestDataWithSpaces,
  originalProofRequestDataWithAttributesAndPredicates,
  originalProofRequestDataWithPredicates,
  homeAddressAndAgePreparedProof,
  proofRequestWithPredicates,
  claimOfferPayload,
  claimUUID,
} from '../../../__mocks__/static-data'
import {
  getOriginalProofRequestData,
  getProofRequestPairwiseDid,
  getPoolConfig,
} from '../../store/store-selector'
import { UPDATE_ATTRIBUTE_CLAIM } from '../type-proof'
import { getMatchingCredentials } from '../../bridge/react-native-cxs/RNCxs'

describe('Proof Store', () => {
  const remoteDid = proofRequest.payloadInfo.remotePairwiseDID
  const uid = proofRequest.payloadInfo.uid

  let initialState
  let afterProofSuccess
  beforeEach(() => {
    initialState = proofReducer(undefined, initialTestAction())
    afterProofSuccess = proofReducer(initialState, proofSuccess(proof, uid))
  })

  it('should match snapshot for proof received action', () => {
    expect(afterProofSuccess).toMatchSnapshot()
  })

  it('fn:findMissingRequestedAttributes', () => {
    expect(
      findMissingRequestedAttributes(preparedProof, originalProofRequestData)
    ).toMatchSnapshot()

    // find one missing attribute
    expect(
      findMissingRequestedAttributes(
        {
          attrs: {
            attr1_uuid: preparedProof.attrs.attr1_uuid,
          },
        },
        originalProofRequestData
      )
    ).toMatchSnapshot()

    // should find two predicates
    expect(
      findMissingRequestedAttributes(
        {
          attrs: {},
        },
        originalProofRequestDataWithPredicates
      )
    ).toMatchSnapshot()

    // find two missing attribute and two predicates
    expect(
      findMissingRequestedAttributes(
        {
          attrs: {},
        },
        originalProofRequestDataWithAttributesAndPredicates
      )
    ).toMatchSnapshot()
  })

  it('should find missing attributes if any missing', () => {
    expect(
      findMissingRequestedAttributes(
        preparedProofWithMissingAttribute,
        originalProofRequestDataMissingAttribute
      )
    ).toMatchSnapshot()
  })

  it('should find one missing and one dissatisfied attribute', () => {
    const proof = {
      attrs: {},
    }

    const proofRequest = {
      ...originalProofRequestData,
      requested_attributes: {
        ...originalProofRequestData.requested_attributes,
        attr2_uuid: {
          name: 'Address 2',
          restrictions: { issuer_did: 'did' },
        },
      },
    }

    expect(
      findMissingRequestedAttributes(proof, proofRequest)
    ).toMatchSnapshot()
  })

  it('fn:convertPreparedProofToRequestedAttributes', () => {
    expect(
      convertIndyPreparedProofToAttributes(
        homeAddressPreparedProof,
        [],
        originalProofRequestData.requested_attributes
      )
    ).toMatchSnapshot()
    expect(
      convertIndyPreparedProofToAttributes(
        homeAddressPreparedProof,
        [],
        originalProofRequestData10Attributes.requested_attributes
      )
    ).toMatchSnapshot()

    expect(
      convertIndyPreparedProofToAttributes(
        homeAddressPreparedProof,
        [],
        originalProofRequestDataWithSpaces.requested_attributes
      )
    ).toMatchSnapshot()

    // with predicates
    expect(
      convertIndyPreparedProofToAttributes(
        homeAddressAndAgePreparedProof,
        [],
        originalProofRequestDataWithAttributesAndPredicates.requested_attributes,
        originalProofRequestDataWithAttributesAndPredicates.requested_predicates
      )
    ).toMatchSnapshot()
  })

  it('store update correctly if proof fails', () => {
    expect(
      proofReducer(
        initialState,
        proofFail(uid, {
          code: 'TEST-CODE',
          message: 'test error message',
        })
      )
    ).toMatchSnapshot()
  })

  it('saga:generateProofSaga, success', () => {
    const withProofRequestStore = {
      proofRequest: {
        [uid]: {
          ...proofRequest.payload,
          ...proofRequest.payloadInfo,
        },
      },
      claim: {
        claimMap: {
          'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73': {
            issueDate: 80,
          },
          'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d86': {
            issueDate: 30,
          },
          'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b': {
            issueDate: 60,
          },
          'claim::6a0f42b4-1210-4bdb-ad53-10ed7652767': {
            issueDate: 70,
          },
        },
      },
      claimOffer: {},
    }
    const requestedAttributes = convertIndyPreparedProofToAttributes(
      {
        ...homeAddressPreparedProof,
      },
      [],
      originalProofRequestData.requested_attributes,
      originalProofRequestData.requested_predicates
    )

    return expectSaga(generateProofSaga, getProof(uid))
      .withState({
        ...withProofRequestStore,
        connections: {
          data: {
            userDid1: {
              myPairwiseDid: 'myPairwiseDid1',
            },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
      })
      .provide([
        [
          matchers.call.fn(
            getMatchingCredentials,
            proofRequest.payload.proofHandle
          ),
          JSON.stringify(homeAddressAndAgePreparedProof),
        ],
      ])
      .put(proofRequestAutoFill(uid, requestedAttributes))
      .put(proofRequestDataToStore(uid, proofRequest.payload.proofHandle))

      .run()
  })

  it('saga:generateProofSaga, with predicates success', () => {
    const withProofRequestStore = {
      proofRequest: {
        [uid]: {
          ...proofRequestWithPredicates.payload,
          ...proofRequestWithPredicates.payloadInfo,
        },
      },
      claim: {
        claimMap: {
          'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73': {
            issueDate: 80,
          },
          'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d86': {
            issueDate: 30,
          },
          'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b': {
            issueDate: 60,
          },
          'claim::6a0f42b4-1210-4bdb-ad53-10ed7652767': {
            issueDate: 70,
          },
          'claim::6a0f42b4-1210-4bdb-ad53-10ed765276ca': {
            issueDate: 75,
          },
          'claim::110f42b4-1210-4bdb-ad53-10ed765276ca': {
            issueDate: 80,
          },
        },
      },
      claimOffer: {},
    }
    const requestedAttributes = convertIndyPreparedProofToAttributes(
      {
        ...homeAddressAndAgePreparedProof,
      },
      [],
      originalProofRequestDataWithAttributesAndPredicates.requested_attributes,
      originalProofRequestDataWithAttributesAndPredicates.requested_predicates
    )

    return expectSaga(generateProofSaga, getProof(uid))
      .withState({
        ...withProofRequestStore,
        connections: {
          data: {
            userDid1: {
              myPairwiseDid: 'myPairwiseDid1',
            },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
      })
      .provide([
        [
          matchers.call.fn(
            getMatchingCredentials,
            proofRequest.payload.proofHandle
          ),
          JSON.stringify(homeAddressAndAgePreparedProof),
        ],
      ])

      .put(proofRequestAutoFill(uid, requestedAttributes))
      .put(proofRequestDataToStore(uid, proofRequest.payload.proofHandle))

      .run()
  })

  it('saga:generateProofSaga, success, reversed order credentials', () => {
    const withProofRequestStore = {
      proofRequest: {
        [uid]: {
          ...proofRequest.payload,
          ...proofRequest.payloadInfo,
        },
      },
      claim: {
        claimMap: {
          'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73': {
            issueDate: 10,
          },
          'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d86': {
            issueDate: 80,
          },
          'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b': {
            issueDate: 60,
          },
          'claim::6a0f42b4-1210-4bdb-ad53-10ed7652767': {
            issueDate: 70,
          },
        },
      },
      claimOffer: {},
    }
    const copyHomeAddressPreparedProofMultipleCreds: typeof homeAddressPreparedProofMultipleCreds = JSON.parse(
      JSON.stringify(homeAddressPreparedProofMultipleCreds)
    )
    copyHomeAddressPreparedProofMultipleCreds.attrs.attr1_uuid.reverse()
    copyHomeAddressPreparedProofMultipleCreds.attrs.attr2_uuid.reverse()
    const requestedAttributes = convertIndyPreparedProofToAttributes(
      {
        ...copyHomeAddressPreparedProofMultipleCreds,
        self_attested_attrs: {},
      },
      [],
      originalProofRequestData.requested_attributes
    )

    return expectSaga(generateProofSaga, getProof(uid))
      .withState({
        ...withProofRequestStore,
        connections: {
          data: {
            userDid1: {
              myPairwiseDid: 'myPairwiseDid1',
            },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
      })
      .provide([
        [
          matchers.call.fn(
            getMatchingCredentials,
            proofRequest.payload.proofHandle
          ),
          JSON.stringify(homeAddressPreparedProofMultipleCreds),
        ],
      ])

      .put(proofRequestAutoFill(uid, requestedAttributes))
      .put(proofRequestDataToStore(uid, proofRequest.payload.proofHandle))

      .run()
  })

  // TODO:KS Fix these tests before July 25 and remove the exclusion from .flowconfig
  xit('generate proof saga should generate proof', () => {
    const gen = generateProofSaga(getProof(uid))
    expect(gen.next().value).toEqual(select(getOriginalProofRequestData, uid))

    expect(gen.next(originalProofRequestData).value).toEqual(
      select(getPoolConfig)
    )

    const preparedProofJson = JSON.stringify(homeAddressPreparedProof)
    const requestedClaimsJson = {
      self_attested_attributes: {},
      requested_attrs: findMissingRequestedAttributes(
        homeAddressPreparedProof,
        originalProofRequestData
      )[0],
      requested_predicates: {},
    }

    const requestedAttributes = convertIndyPreparedProofToAttributes(
      {
        ...homeAddressPreparedProof,
        self_attested_attrs: {},
      },
      [],
      originalProofRequestData.requested_attributes
    )

    expect(gen.next(preparedProofJson).value).toEqual(
      put(proofRequestAutoFill(uid, requestedAttributes))
    )

    expect(gen.next().value).toEqual(select(getProofRequestPairwiseDid, uid))

    expect(gen.next(remoteDid).value).toEqual(take(UPDATE_ATTRIBUTE_CLAIM))

    expect(
      gen.next({
        type: UPDATE_ATTRIBUTE_CLAIM,
        requestedAttrsJson: requestedClaimsJson.requested_attrs,
      }).value
    ).toEqual(put(sendProof(uid)))

    expect(gen.next(JSON.stringify(proof)).value).toEqual(
      put(proofSuccess(proof, uid))
    )

    expect(gen.next().value).toEqual(put(acceptProofRequest(uid)))

    expect(gen.next().done).toBe(true)
  })

  xit('generate proof saga should work fine with missing attributes', () => {
    const gen = generateProofSaga(getProof(uid))
    expect(gen.next().value).toEqual(select(getOriginalProofRequestData, uid))

    expect(gen.next(originalProofRequestDataMissingAttribute).value).toEqual(
      select(getPoolConfig)
    )

    const preparedProofJson = JSON.stringify(
      homeAddressPreparedProofWithMissingAttribute
    )
    const [missingAttributes] = findMissingRequestedAttributes(
      homeAddressPreparedProofWithMissingAttribute,
      originalProofRequestDataMissingAttribute
    )

    expect(gen.next(preparedProofJson).value).toEqual(
      put(missingAttributesFound(missingAttributes, uid))
    )

    // eslint-disable-next-line no-unused-vars
    const requestedAttributes = convertIndyPreparedProofToAttributes(
      {
        ...homeAddressPreparedProofWithMissingAttribute,
        self_attested_attrs: { ...selfAttestedAttributes },
      },
      [],
      originalProofRequestDataMissingAttribute.requested_attributes
    )

    expect(gen.next().value).toEqual(select(getProofRequestPairwiseDid, uid))

    expect(gen.next(remoteDid).value).toEqual(take(UPDATE_ATTRIBUTE_CLAIM))

    expect(
      gen.next({
        type: UPDATE_ATTRIBUTE_CLAIM,
        requestedAttrsJson: requestedAttributes,
      }).value
    ).toEqual(put(sendProof(uid)))

    expect(gen.next(JSON.stringify(proof)).value).toEqual(
      put(proofSuccess(proof, uid))
    )

    expect(gen.next().value).toEqual(put(acceptProofRequest(uid)))

    expect(gen.next().done).toBe(true)
  })

  it('should reset proof store, if RESET action is raised', () => {
    expect(proofReducer(afterProofSuccess, { type: 'RESET' })).toMatchSnapshot()
  })

  it('proof store should reset for a given proof request if PROOF_REQUEST_SHOW_START is raised', () => {
    const proofStateAfterFail = proofReducer(
      initialState,
      proofFail(uid, {
        code: 'TEST-CODE',
        message: 'test error message',
      })
    )
    expect(
      proofReducer(proofStateAfterFail, proofRequestShowStart(uid))
    ).toMatchSnapshot()
  })

  it('should find existing credentials which cannot be used for proving', () => {
    let storedCredentials = [claimOfferPayload]
    let attribute = { name: 'Address 1' }
    let usedCredentials = []

    expect(
      findCredentialsExcludedByAttributeRestrictions(
        storedCredentials,
        attribute,
        usedCredentials
      )
    ).toMatchSnapshot()
  })

  it('should find existing credentials which cannot be used for proving', () => {
    let storedCredentials = [claimOfferPayload]
    let attribute = { name: 'Address 1' }
    let usedCredentials = [claimOfferPayload.claimId]

    expect(
      findCredentialsExcludedByAttributeRestrictions(
        storedCredentials,
        attribute,
        usedCredentials
      )
    ).toMatchSnapshot()
  })

  it('should find existing credentials which cannot be used for proving', () => {
    let storedCredentials = [claimOfferPayload]
    let attribute = { name: 'No Address' }
    let usedCredentials = [claimUUID]

    expect(
      findCredentialsExcludedByAttributeRestrictions(
        storedCredentials,
        attribute,
        usedCredentials
      )
    ).toMatchSnapshot()
  })
})
