// @flow

// $FlowFixMe
import React from 'react'

// declare module 'react-native-gesture-handler' {
//   declare interface StateI {
//     END: 'END';
//     BEGAN: 'BEGAN';
//   }
//   declare var State: StateI
//   declare module.exports: any
// }
declare module 'react-native-gesture-handler' {
  declare interface StateI {
    END: 'END';
    BEGAN: 'BEGAN';
  }
  declare var State: StateI
  declare module.exports: any
}

declare module 'react-native-gesture-handler/Swipeable' {
  declare type AnimatedValue = Object

  declare export default class Swipeable extends React.Component<SwipeableProperties> {
    close: () => void;
    openLeft: () => void;
    openRight: () => void;
  }

  declare type SwipeableProperties = {
    friction?: number,
    leftThreshold?: number,
    rightThreshold?: number,
    overshootLeft?: boolean,
    overshootRight?: boolean,
    overshootFriction?: number,
    onSwipeableLeftOpen?: () => void,
    onSwipeableRightOpen?: () => void,
    onSwipeableOpen?: () => void,
    onSwipeableClose?: () => void,
    onSwipeableLeftWillOpen?: () => void,
    onSwipeableRightWillOpen?: () => void,
    onSwipeableWillOpen?: () => void,
    onSwipeableWillClose?: () => void,
    renderLeftActions?: (
      progressAnimatedValue: AnimatedValue,
      dragAnimatedValue: AnimatedValue
    ) => React$Node,
    renderRightActions?: (
      progressAnimatedValue: AnimatedValue,
      dragAnimatedValue: AnimatedValue
    ) => React$Node | React$ElementType,
    useNativeAnimations?: boolean,
  }
}
