// @flow

import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'

import { credentialDetailsScreen } from '../credential-details'
import { getStore, getNavigation } from '../../../__mocks__/static-data'

describe('<CredentialDetails />', () => {
  const CredentialDetails = credentialDetailsScreen.screen
  const store = getStore()
  function getProps() {
    return {
      navigation: getNavigation(),
      route: {
        params: {
          credentialName: 'credential_1',
          issuerName: 'issuer_1',
          date: 123456789,
          attributes: [
            {
              label: 'attr_1',
              data: 'data_1',
            },
            {
              label: 'attr_2',
              data: 'data_2',
            },
            {
              label: 'attr_3',
              data: 'data_3',
            },
          ],
          logoUrl: 'https://robothash.com/logo.png',
          claimUuid: 'claim_uuid_1',
          remoteDid: 'remote_did_1',
          uid: 'uid_1',
        },
      },
    }
  }

  xit('should CredentialDetails render properly', () => {
    const component = renderer.create(
      <Provider store={store}>
        <CredentialDetails {...getProps()} />
      </Provider>
    )
    expect(component).toMatchSnapshot()
  })
})
