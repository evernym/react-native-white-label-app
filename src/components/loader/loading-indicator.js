// @flow
import React, { PureComponent } from 'react'
import { ActivityIndicator } from 'react-native'
import type { LoadingIndicatorProps } from './type-loader'
import { DARK } from './type-loader'
import { color } from '../../common/styles/constant'

export class LoadingIndicator extends PureComponent<
  LoadingIndicatorProps,
  void
> {
  static defaultProps = {
    type: DARK,
  }

  render() {
    const { type } = this.props
    const tintColor = type === DARK ? color.actions.sixth : color.actions.none

    return <ActivityIndicator color={tintColor} size="large" hidesWhenStopped />
  }
}
