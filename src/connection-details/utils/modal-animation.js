import { Animated, Platform } from 'react-native'
import { TransitionPresets } from '@react-navigation/stack'

const { add, multiply } = Animated

function modalForHorizontalPushLeft({
                                      current,
                                      next,
                                      inverted,
                                      layouts: { screen },
                                      insets,
                                    }) {
  const progress = add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      })
      : 0,
  )

  const translateX = multiply(
    progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [screen.width, 0, -screen.width],
      extrapolate: 'clamp',
    }),
    inverted,
  )

  return {
    cardStyle: {
      marginTop: insets.top + 10,
      transform: [
        {
          translateX,
        },
      ],
    },
  }
}

function viewForHorizontalPushLeft({
                                     current,
                                     inverted,
                                     next,
                                     layouts: { screen },
                                   }) {
  // TODO: push left animation behaves strange on Android. like renders twice
  const progress = Platform.OS === 'ios' ?
  add(
      current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      next
        ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
        : 0,
    ) :
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    })

  const translateX = multiply(
    progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [screen.width, 0, -screen.width],
      extrapolate: 'clamp',
    }),
    inverted,
  )

  return {
    cardStyle: {
      transform: [
        {
          translateX,
        },
      ],
    },
  }
}

export const ModalPushLeft = {
  ...TransitionPresets.SlideFromRightIOS,
  cardStyleInterpolator: modalForHorizontalPushLeft,
}

export const ViewPushLeft = {
  ...TransitionPresets.SlideFromRightIOS,
  cardStyleInterpolator: viewForHorizontalPushLeft,
}
