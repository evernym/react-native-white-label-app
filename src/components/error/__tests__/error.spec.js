// @flow

import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { Error } from '../error'

describe('<Error />', () => {
  it('should render errorText', () => {
    const component = renderer.create(<Error errorText="Some error" />)
    expect(component).toMatchSnapshot()
  })
})
