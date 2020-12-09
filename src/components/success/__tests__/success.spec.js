// @flow

import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { Success } from '../success'

describe('<Success />', () => {
  it('should render successText', () => {
    const component = renderer.create(
      <Success
        successText="Some success message"
        afterSuccessShown={jest.fn()}
      />
    )
    expect(component).toMatchSnapshot()
  })
})
