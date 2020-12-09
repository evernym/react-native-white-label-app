// @flow
import React, { PureComponent } from 'react'
import { View } from 'react-native'

// We don't need to type check external library
// and we don't need types for mock test stub
class MockView extends PureComponent<any, void> {
  render() {
    return <View {...this.props}>{this.props.children}</View>
  }
}

export default MockView
