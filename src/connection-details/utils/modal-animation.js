import { Animated } from 'react-native'
import { TransitionPresets } from '@react-navigation/stack'

export const ModalLeftToRight = {
  ...TransitionPresets.ModalPresentationIOS,
  gestureDirection: 'horizontal',
  cardStyleInterpolator: forHorizontalLeftToRight,
}

const { multiply } = Animated

export function forHorizontalLeftToRight({
                                           current,
                                           inverted,
                                           layouts: { screen },
                                           insets,
                                         }) {
  const translateFocused = multiply(
    current.progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [-screen.width, 0, screen.width],
    }),
    inverted,
  )

  return {
    cardStyle: {
      overflow: 'hidden',
      marginTop: insets.top + 10,
      transform: [
        { translateX: translateFocused },
      ],
    },
  }
}
