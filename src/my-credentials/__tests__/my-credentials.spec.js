// @flow

import 'react-native'
import React from 'react'
import { Platform } from 'react-native'
import { getStore, getNavigation } from '../../../__mocks__/static-data'
import renderer, { act } from 'react-test-renderer'
import { MyCredentials } from '../my-credentials'
import { Provider } from 'react-redux'
import { MockedNavigator } from '../../../__mocks__/mock-navigator'
import { SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_MENU } from '../../components/header/type-header'
import { defaultEnvironment } from '../../environment'

describe('my credentials screen', () => {
  jest.useFakeTimers()

  const store = getStore()

  function getProps() {
    return {
      navigation: getNavigation(),
      claimMap: {
        uuid_1: {
          claimOfferUuid: 'offer_uuid_1',
          senderDID: 'senderDID_1',
          myPairwiseDID: 'myPairwiseDID_1',
          logoUrl: 'https://logourl.com/logo.png',
          issueDate: 1,
        },
      },
      offers: {
        offer_uuid_1: {
          remotePairwiseDID: 'senderDID_1',
          status: 'RECEIVED',
          claimRequestStatus: 'CLAIM_REQUEST_SUCCESS',
          data: {
            name: 'credential_name',
            version: '3.0',
            revealedAttributes: [
              {
                label: 'attribute_1',
              },
              {
                label: 'attribute_2',
              },
              {
                label: 'attribute_3',
              },
            ],
            claimDefinitionSchemaSequenceNumber: 1,
          },
          issuer: {
            name: 'issuer_name',
            did: 'uuid_1',
          },
        },
      },
      environmentName: defaultEnvironment,
      route: {},
      showUnreadMessagesBadge: {SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_MENU}
    }
  }

  function setup() {
    const props = getProps()
    return { props }
  }

  function getMockedNavigator(props) {
    const component = () => (
      <Provider store={store}>
        <MyCredentials {...props} />
      </Provider>
    )

    return <MockedNavigator component={component} />
  }

  function render(props) {
    const wrapper = renderer.create(getMockedNavigator(props))
    act(() => jest.runAllTimers())
    const componentInstance = wrapper.root.findByType(MyCredentials).instance
    return { wrapper, componentInstance }
  }

  xit('should render properly and snapshot should match ios platform', () => {
    // TODO:KS Need to fix date issue on CI server. Meanwhile commenting this test
    const { props } = setup()
    const { wrapper } = render(props)
    const tree = wrapper.toJSON()
    expect(tree).toMatchSnapshot()
  })

  xit('should render properly and snapshot should match for android platform', () => {
    // skipping this test, somehow react-navigation v5 is not working correctly with jest on Android
    const existingOS = Platform.OS
    Platform.OS = 'android'
    const { props } = setup()
    const { wrapper } = render(props)
    const tree = wrapper.toJSON()
    expect(tree).toMatchSnapshot()
    // revert environment to what it was before
    Platform.OS = existingOS
  })
})
