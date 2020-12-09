// @flow

import React from 'react'
import { View, Text } from 'react-native'
import renderer from 'react-test-renderer'
import { withStatusBar } from '../status-bar'

describe('withStatusBar() HOC', () => {
  it('should render another component correctly if wrapped with this HOC', () => {
    function TestComponent() {
      return (
        <View>
          <Text>Some Text</Text>
        </View>
      )
    }

    const WrappedTestComponent = withStatusBar()(TestComponent)
    const component = renderer.create(<WrappedTestComponent />)
    expect(component.toJSON()).toMatchSnapshot()

    class TestComponent2 extends React.Component<void, void> {
      render() {
        return <Text>Som component text to test</Text>
      }
    }

    const WrappedTestComponent2 = withStatusBar()(TestComponent2)
    const classComponent = renderer.create(<WrappedTestComponent2 />)
    expect(classComponent.toJSON()).toMatchSnapshot()
  })

  it('should correctly get statics if wrapped by this HOC', () => {
    class TestComponent extends React.Component<void, void> {
      static NAME = 'SOME STATIC PROP VALUE'

      render() {
        return <Text>Som component text to test</Text>
      }
    }

    const WrappedTestComponent = withStatusBar()(TestComponent)
    // $FlowFixMe need to update typedef with HOC
    const staticProp = WrappedTestComponent.NAME
    expect(staticProp).toMatchSnapshot()
  })
})
