// @flow

import React from 'react'
import 'react-native'
import renderer, { act } from 'react-test-renderer'
import merge from 'lodash.merge'

import { OpenIdConnectScreen } from '../open-id-connect-screen'
import { mockConnection1 } from '../../../__mocks__/static-data'
import { mockOpenIdConnectRequest1 } from '../../../__mocks__/data/open-id-connect-mock-data'
import { OPEN_ID_CONNECT_STATE } from '../open-id-connect-actions'
import { MockedNavigator } from '../../../__mocks__/mock-navigator'

describe('<OpenIdConnectScreen />', () => {
  it('should match in progress state', async () => {
    // create deep copy of open id request
    const mockOpenIdConnectRequest = merge({}, mockOpenIdConnectRequest1)
    // set state to progress
    mockOpenIdConnectRequest.state = OPEN_ID_CONNECT_STATE.YES_SEND_IN_PROGRESS

    const { component } = await setup(mockOpenIdConnectRequest)
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should match in success state', async () => {
    // create deep copy of open id request
    const mockOpenIdConnectRequest = merge({}, mockOpenIdConnectRequest1)
    // set state to success
    mockOpenIdConnectRequest.state = OPEN_ID_CONNECT_STATE.YES_SEND_SUCCESS

    const { component } = await setup(mockOpenIdConnectRequest)
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should match in fail state', async () => {
    // create deep copy of open id request
    const mockOpenIdConnectRequest = merge({}, mockOpenIdConnectRequest1)
    // set state to fail
    mockOpenIdConnectRequest.state = OPEN_ID_CONNECT_STATE.YES_SEND_FAIL

    const { component } = await setup(mockOpenIdConnectRequest)
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should match in received state', async () => {
    const { component } = await setup()
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should match in signature verification failed', async () => {
    // create deep copy of open id request
    const mockOpenIdConnectRequestNoSignature = merge(
      {},
      mockOpenIdConnectRequest1
    )
    // remove signature so that signature verification fails
    mockOpenIdConnectRequestNoSignature.oidcAuthenticationRequest.jwtAuthenticationRequest.encodedSignature = null

    const { component } = await setup(mockOpenIdConnectRequestNoSignature)
    expect(component.toJSON()).toMatchSnapshot()
  })

  function getProps(extraProps: ?Object = {}) {
    return {
      request: merge({}, mockOpenIdConnectRequest1, extraProps),
      connection: mockConnection1,
      dispatch: jest.fn(),
      route: {
        params: {
          oidcAuthenticationRequest:
            mockOpenIdConnectRequest1.oidcAuthenticationRequest,
        },
      },
    }
  }

  async function setup(extraProps: ?Object = {}) {
    const props = getProps(extraProps)
    const intermediateComponent = () => <OpenIdConnectScreen {...props} />
    const component = renderer.create(
      <MockedNavigator component={intermediateComponent} />
    )
    // $FlowFixMe not sure why we are getting this error for async function
    await act(async () => {})

    return { component, props }
  }
})
