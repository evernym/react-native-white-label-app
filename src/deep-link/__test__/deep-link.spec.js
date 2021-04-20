// @flow
import React from 'react'
import renderer from 'react-test-renderer'
import { DeepLink } from '../index'
import { Provider } from 'react-redux'
import { getStore } from '../../../__mocks__/static-data'

describe('<DeepLink />', () => {
  function getProps() {
    return {
      deepLinkError: jest.fn(),
      deepLinkEmpty: jest.fn(),
      deepLinkData: jest.fn(),
      tokens: {},
      isAppLocked: false,
      addPendingRedirection: jest.fn(),
      navigateToRoute: jest.fn(),
    }
  }

  function setup() {
    const props = getProps()
    const store = getStore()

    const component = renderer.create(
      <Provider store={store}>
        <DeepLink {...props} />
      </Provider>,
    )
    const instance = component.root.instance

    return { props, component, instance }
  }

  xit('should raise error if bundle throws error', () => {
    const { instance, props } = setup()
    const bundle = {
      error: 'Some deep link error',
      params: null,
    }

    instance.onDeepLinkData(bundle)
    expect(props.deepLinkError).toHaveBeenCalledWith(bundle.error)
    // this below line ensures that we are not calling deepLinkData
    // with some hard coded token and prevents us to accidentally
    // committing changes that will break functionality
    expect(props.deepLinkData).not.toHaveBeenCalled()
  })
},
)
