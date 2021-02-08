// @flow

import * as React from 'react'
import { Component } from 'react'
import { Animated, Dimensions } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'

import type { ReactNavigation } from '../../common/type-common'

import { Container } from '../index'
import { colors } from '../../common/styles'
import { withStatusBar } from '../status-bar/status-bar'
import { styles } from './bottom-up-slider-screen-styles'
import { BottomUpSliderScreenHeader } from './components/bottom-up-slider-screen-header'

const { height } = Dimensions.get('window')

export function withBottomUpSliderScreen(
  { routeName }: BottomUpSliderScreenHOC,
  WrappedComponent: React.ComponentType<any>
) {
  class BottomUpSliderScreen extends Component<{} & ReactNavigation, void> {
    _translateY = new Animated.Value(0)

    render() {
      const transform = this._getTransform(this._translateY)
      const opacity = this._getOpacity(this._translateY)

      return (
        <Animated.View
          style={[
            styles.container,
            styles.mainContainer,
            {
              opacity,
            },
          ]}
        >
          <Animated.View style={[styles.container, { transform }]}>
            <Container style={[styles.headerContainer]}>
              <PanGestureHandler
                onGestureEvent={this._onPanGestureEvent}
                onHandlerStateChange={this._onHandlerStateChange}
              >
                <Animated.View style={[styles.container]}>
                  <BottomUpSliderScreenHeader onCancel={this.onCancel} />
                </Animated.View>
              </PanGestureHandler>
            </Container>
            <Animated.View style={[styles.screenContainer]}>
              <WrappedComponent />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )
    }

    onCancel = () => {
      !this.isUnmounted &&
        !this.isCloseTriggered &&
        this.props.navigation.goBack(null)
      this.isCloseTriggered = true
    }

    _onPanGestureEvent = Animated.event(
      [
        {
          nativeEvent: {
            translationY: this._translateY,
          },
        },
      ],
      {
        useNativeDriver: true,
      }
    )

    _onHandlerStateChange = (event) => {
      const { state, velocityY, translationY } = event.nativeEvent
      if (state === State.END) {
        const minimumDistanceToClose = 150
        if (velocityY > 60 || translationY > minimumDistanceToClose) {
          this.onCancel()
          return
        }

        Animated.spring(this._translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start()
      }
    }

    _getTransform = (translateY) => [{ translateY }]

    _getOpacity = (translateY) =>
      translateY.interpolate({
        inputRange: [0, height],
        outputRange: [1, 0.2],
        extrapolate: 'clamp',
      })

    // this a common pattern when we want to be sure that we are not running
    // actions after a component is unmounted
    // in our case, user can close modal either by pressing "okay" or clicking outside
    // so we need to be sure that we are not running code after this component
    // is unmounted from react-native tree
    isUnmounted = false
    // this variable is just to ensure that on slow devices
    // if user clicks on gray area and component was already scheduled to close
    // by auto close, or by user clicking on okay button and then auto-close trigger
    // we want to make sure that close is triggered by either action
    // and we don't want to run close again in any case
    isCloseTriggered = false

    componentWillUnmount() {
      this.isUnmounted = true
    }
  }

  return {
    routeName,
    screen: withStatusBar({ color: colors.black })(BottomUpSliderScreen),
  }
}

type BottomUpSliderScreenHOC = {
  routeName: string,
}
