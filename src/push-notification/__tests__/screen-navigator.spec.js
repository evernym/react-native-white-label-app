// @flow
import 'react-native'
import React from 'react'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'
import { ScreenNavigator } from '../../navigation/screen-navigator'
import {
  convertClaimOfferPushPayloadToAppClaimOffer,
  convertProofRequestPushPayloadToAppProofRequest,
} from '../push-notification-store'
import {
  claimOfferPushNotification,
  proofRequestPushPayloadAdditionalData,
  getStore,
} from '../../../__mocks__/static-data'

describe('<ScreenNavigator />', () => {
  let store = {}

  const storeToProps = {
    pushNotification: {
      notification: claimOfferPushNotification,
      navigateRoute: null,
    },
  }

  beforeAll(() => {
    store = getStore(storeToProps)
  })

  function props() {
    return {
      ...storeToProps,
      updatePayloadToRelevantStoreAndRedirect: jest.fn(),
      clearNavigateToRoutePN: jest.fn(),
      navigateToRoute: jest.fn(),
    }
  }

  it('should render PushNotification Navigator components properly', () => {
    const wrapper = renderer
      .create(
        <Provider store={store}>
          <ScreenNavigator {...props()} />
        </Provider>
      )
      .toJSON()
    expect(wrapper).toMatchSnapshot()
  })
})

describe('convertProofRequestPushPayloadToAppProofRequest', () => {
  it('should convert push payload to proof request format correctly', () => {
    expect(
      convertProofRequestPushPayloadToAppProofRequest(
        proofRequestPushPayloadAdditionalData
      )
    ).toMatchSnapshot()
  })
})

describe('convertClaimOfferPushPayloadToAppClaimOffer', () => {
  it('should convert push payload to claim offer format correctly', () => {
    const claimOfferPushPayload = {
      msg_type: 'CLAIM_OFFER',
      version: '0.1',
      to_did: 'BnRXf8yDMUwGyZVDkSENeq',
      from_did: 'GxtnGN6ypZYgEqcftSQFnC',
      iid: 'cCanHnpFAD',
      mid: '',
      claim: {
        name: ['Alice'],
        date_of_birth: ['2000-05-17'],
        height: ['175'],
      },
      schema_seq_no: 12,
      issuer_did: 'V4SGRU86Z58d6TV7PBUe6f',
      nonce: '351590',
      claim_name: 'Profile detail',
      issuer_name: 'Test Enterprise',
      optional_data: { terms_of_service: '<Large block of text>', price: 6 },
      remoteName: 'Test remote name',
    }

    expect(
      convertClaimOfferPushPayloadToAppClaimOffer(claimOfferPushPayload, {
        remotePairwiseDID: 'V4SGRU86Z58d6TV7PBUe6f',
      })
    ).toMatchSnapshot()
  })
})
