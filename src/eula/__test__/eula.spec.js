// @flow
import 'react-native'
import React from 'react'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'
import { EulaScreen } from '../eula'
import { getNavigation, getStore } from '../../../__mocks__/static-data'

describe('Eula screen', () => {
  const navigation = getNavigation()
  const store = getStore()

  it('should render properly and snapshot should match', () => {
    const eula = {
      isEulaAccept: false,
    }
    const dispatch = jest.fn()
    const tree = renderer
      .create(
        <Provider store={store}>
          <EulaScreen
            eula={eula}
            navigation={navigation}
            route={navigation.route}
            dispatch={dispatch}
            pendingRedirection={[]}
          />
        </Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
