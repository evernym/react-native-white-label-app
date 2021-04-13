// @flow
import React from 'react'
import 'react-native'
import { Text } from 'react-native'
import renderer from 'react-test-renderer'

import { AppStatusComponent } from '../app-status'

const getProps = () => {
  return {
    restoreStatus: 'restoreStatus',
    dispatch: jest.fn(),
  }
}

const setup = () => {
  const props = getProps()
  const component = renderer.create(<AppStatusComponent {...props} />)
  const instance = component.root.instance

  return { component, instance }
}

describe('<AppStatusComponent />', () => {
  it('AppStatusComponent with blur snapshot', () => {
    const { component, instance } = setup()
    instance.setState({ appState: 'background' })
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('AppStatusComponent without blur snapshot', () => {
    const { component, instance } = setup()
    instance.setState({ appState: 'active' })
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})
