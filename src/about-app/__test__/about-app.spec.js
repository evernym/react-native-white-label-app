// @flow

import 'react-native'
import React from 'react'
import renderer from 'react-test-renderer'
import { AboutApp } from '../about-app'
import { getNavigation, getStore } from '../../../__mocks__/static-data'

import type {} from '../type-about-app'
import { Provider } from 'react-redux'
import { MockedNavigator } from '../../../__mocks__/mock-navigator'

describe('user about app screen', () => {
  const props = {
    navigation: getNavigation(),
    environmentName: 'DEMO',
    route: { params: {} },
  }
  const store = getStore()

  it('should render properly and snapshot should match', () => {
    const component = () => (
      <Provider store={store}>
        <AboutApp {...props} />
      </Provider>
    )
    const tree = renderer.create(<MockedNavigator component={component} />)
    expect(tree).toMatchSnapshot()
  })
})
