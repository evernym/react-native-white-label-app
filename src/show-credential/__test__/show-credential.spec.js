// @flow

import React from 'react'
import { Provider } from 'react-redux'
import 'react-native'
import renderer from 'react-test-renderer'

import {
  getNavigation,
  defaultUUID,
  getStore,
} from '../../../__mocks__/static-data'
import { ShowCredential } from '../show-credential'
import merge from 'lodash.merge'

const getProps = () => {
  return {
    navigation: {
      ...getNavigation(),
    },
    route: {
      params: {
        claimOfferUuid: defaultUUID,
        credentialName: 'Test Credential',
        attributes: [
          { label: 'name' },
        ],
      },
    },
  }
}

const getState = (showCredentialState) => {
  const currentState = getStore().getState()
  return {
    ...getStore(),
    getState() {
      return merge(
        {},
        {
          ...currentState,
          showCredential: showCredentialState
        }
      )
    },
  }
}

const setup = (currentStore) => {
  const props = getProps()
  const component = renderer.create(
    <Provider store={currentStore}>
      <ShowCredential {...props}/>
    </Provider>
  )
  const instance = component.getInstance()

  return { props, component, instance }
}

describe('<ShowCredential />', () => {
  it('should match loading snapshot', () => {
    const store = getState({
      data: null,
      error: null,
      isDone: false,
    })
    const { component } = setup(store)
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should match ready snapshot', () => {
    const store = getState({
      data: 'link',
      error: null,
      isDone: false,
    })

    const { component } = setup(store)
    expect(component.toJSON()).toMatchSnapshot()
  })
})
