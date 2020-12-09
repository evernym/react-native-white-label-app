// @flow
import * as React from 'react'
import { PureComponent } from 'react'
import { StatusBar, Platform } from 'react-native'
import hoistNonReactStatic from 'hoist-non-react-statics'
import memoize from 'lodash.memoize'
import Color from 'color'

import type { StatusBarStyle } from '../../common/type-common'

import { white } from '../../common/styles'
import { barStyleDark, barStyleLight } from '../../common/styles/constant'

const defaultStatusBarConfig = {
  color: white,
}

/**
 * This HOC is written as High order function because
 * we want to maintain forward compatibility with react hooks
 * and cause minimum API change once we migrate to hooks
 */

// NOTE: Don't use this HOC if wrapped component is exposing `refs`
export function withStatusBar(
  statusBarConfig?: StatusBarConfig = defaultStatusBarConfig
) {
  // Element type "any" is defined here
  // because this is a legit use case where we can pass any type of
  // React Element to wrap it inside withStatusBar
  return function(WrappedComponent: any) {
    // "any" is a legit type here as well, with same explanation as above
    class WithStatusBar extends PureComponent<any, void> {
      // Once we have migrated to 0.59, then we would rewrite this HOC with hooks
      // that should remove class property, and different lifecycle events

      focusListener = null

      componentDidMount() {
        if (this.props.navigation && this.props.navigation.addListener) {
          this.focusListener = this.props.navigation.addListener(
            'willFocus',
            this.onFocus
          )
        }
      }

      componentWillUnmount() {
        if (
          this.focusListener &&
          this.focusListener.remove &&
          typeof this.focusListener.remove === 'function'
        ) {
          this.focusListener.remove()
        }
      }

      onFocus = () => {
        const statusBarBackgroundColor = statusBarConfig.color
        const statusBarStyle: StatusBarStyle = memoizeStatusBarStyle(
          statusBarConfig.color
        )

        StatusBar.setBarStyle(statusBarStyle, true)
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor(statusBarBackgroundColor)
        }
      }

      render() {
        return <WrappedComponent {...this.props} />
      }
    }

    WithStatusBar.displayName = `WithStatusBar(${getDisplayName(
      WrappedComponent
    )})`
    hoistNonReactStatic(WithStatusBar, WrappedComponent)

    // As of now, this component does not handle forwarding refs
    // once we upgrade to React 16.3 or higher, than we can use React.forwardRef

    return WithStatusBar
  }
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

type StatusBarConfig = {
  useTheme?: boolean,
  color: string,
}

function getStatusBarStyle(backgroundColor: string): StatusBarStyle {
  if (Color(backgroundColor).isLight()) {
    return barStyleDark
  } else {
    return barStyleLight
  }
}

export const memoizeStatusBarStyle = memoize(getStatusBarStyle)
