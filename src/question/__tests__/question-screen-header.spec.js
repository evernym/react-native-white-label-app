// @flow

import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'

import {
  QuestionScreenHeader,
  ViewCloser,
} from '../components/question-screen-header'
import { Container } from '../../components'

describe('<QuestionScreenHeader />', () => {
  function getProps() {
    return {
      onCancel: jest.fn(),
    }
  }

  it('should match snapshot', () => {
    const props = getProps()
    const tree = renderer.create(<QuestionScreenHeader {...props} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('click on header should trigger onCancel on header', () => {
    const props = getProps()
    const component = renderer.create(<QuestionScreenHeader {...props} />)
    const componentViewCloser = component.root.findAllByType(ViewCloser)
    componentViewCloser.map(viewCloser => {
      const container = viewCloser.findByType(Container)
      container.props.onPress()
    })
    expect(props.onCancel).toHaveBeenCalledTimes(componentViewCloser.length)
  })
})
