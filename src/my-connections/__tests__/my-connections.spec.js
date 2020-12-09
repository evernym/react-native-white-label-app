// @flow
import React from 'react'
import 'react-native'
import renderer, { act } from 'react-test-renderer'
import { Provider } from 'react-redux'

import { MyConnectionsScreen } from '../my-connections'
import {
  SERVER_ENVIRONMENT,
  GET_MESSAGES_SUCCESS,
} from '../../store/type-config-store'

import { getNavigation, getStore } from '../../../__mocks__/static-data'
import { MockedNavigator } from '../../../__mocks__/mock-navigator'

describe('<MyConnectionsScreen />', () => {
  const store = getStore()

  jest.useFakeTimers()
  // TODO:KS These tests are not useful at all
  // this functionality has been removed a long time ago
  // and since these tests are just snapshot tests
  // we did not remove tests and updated snapshots
  // we should remove these tests and write tests
  // that tests functionality of home screen
  it('should render MyConnections and redirect user to claim offer modal', () => {
    const myConnectionsProps = getProps()
    const { wrapper } = setup(myConnectionsProps)
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('should render MyConnections and show introductory text', () => {
    const myConnectionsProps = getProps()
    myConnectionsProps.connections = []
    myConnectionsProps.hasNoConnection = true
    const { wrapper } = setup(myConnectionsProps)
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  function setup(passedProps) {
    const props = passedProps || getProps()
    const component = () => (
      <Provider store={store}>
        <MyConnectionsScreen {...props} />
      </Provider>
    )
    const wrapper = renderer.create(<MockedNavigator component={component} />)
    act(() => jest.runAllTimers())
    return { wrapper }
  }

  function getProps() {
    return {
      navigation: getNavigation(),
      unSeenMessagesCount: 0,
      environmentName: SERVER_ENVIRONMENT.PROD,
      onNewConnectionSeen: jest.fn(),
      getUnacknowledgedMessages: jest.fn(),
      messageDownloadStatus: GET_MESSAGES_SUCCESS,
      snackError: null,
      connections: [
        {
          logoUrl: '',
          status: '',
          senderName: '',
          credentialName: '',
          date: '',
          index: new Number(1),
          newBadge: true,
          questionTitle: '',
          senderDID: '',
          type: '',
        },
      ],
      hasNoConnection: false,
    }
  }
})
