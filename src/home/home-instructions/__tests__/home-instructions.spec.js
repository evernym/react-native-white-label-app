// @flow

import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { HomeInstructions } from '../home-instructions'

describe('<HomeInstructions />', () => {
  function getProps(usingProductionNetwork: boolean) {
    return {
      headline: 'Headline',
      title: 'Title',
      prodNetworkText: 'Production network message',
      devNetworkText: 'Dev network message',
      usingProductionNetwork: usingProductionNetwork,
    }
  }

  it('should match snapshot', () => {
    const component = renderer.create(<HomeInstructions {...getProps(true)} />)
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should match snapshot for test network', () => {
    const component = renderer.create(<HomeInstructions {...getProps(false)} />)
    expect(component.toJSON()).toMatchSnapshot()
  })
})
