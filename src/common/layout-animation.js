// @flow

import { LayoutAnimation } from 'react-native'
import { checkIfAnimationToUse } from '../bridge/react-native-cxs/RNCxs'

export function animateLayout() {
  if (!checkIfAnimationToUse()) {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        150,
        LayoutAnimation.Types.linear,
        LayoutAnimation.Properties.opacity
      )
    )
  }
}
