// @flow
import 'react-native'
import React from 'react'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'
import { RestorePassphrase } from '../restore-passphrase'
import { getNavigation, getStore } from '../../../__mocks__/static-data'

jest.mock('react-native-keyboard-aware-scroll-view')

describe('Restore Passphrase screen', () => {
  function getProps() {
    return {
      navigation: getNavigation(),
      submitPassphrase: jest.fn(),
      restore: mockStoreData.getState().restore,
      route: {},
    }
  }

  function setup() {
    const props = getProps()
    return { props }
  }

  const mockStoreData = getStore()

  it('should render properly and match the snapshot', () => {
    const { props } = setup()
    const tree = renderer
      .create(
        <Provider store={mockStoreData}>
          <RestorePassphrase {...props} />
        </Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
