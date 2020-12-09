//  @flow

import React from 'react'
import renderer from 'react-test-renderer'
import { getNavigation } from '../../../__mocks__/static-data'
import WalletTabs from '../wallet-tabs'

describe('<WalletTabs />', () => {
  let navigation = {
    ...getNavigation(),
  }
  let route = {}
  function setup() {
    const component = renderer.create(
      <WalletTabs navigation={navigation} route={route} />
    )
    const instance = component.getInstance()

    return { component, instance }
  }
  it('should render properly and match the snapshot', () => {
    const { component } = setup()
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})
