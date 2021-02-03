// @flow
import React from 'react'
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  SafeAreaView,
  Platform,
} from 'react-native'
import style from './layout-style'
import debounce from 'lodash.debounce'
import type { GenericObject } from '../../common/type-common'

// TODO:KS Change generic object to actual props
// CustomView is used for different types of background for our app
// default styles for a view such a padding, shadow or transparent background
export const CustomView = (props: GenericObject) => {
  const {
    clearBg,
    horizontalSpace,
    verticalSpace,
    doubleVerticalSpace,
    pad,
    primary,
    secondary,
    tertiary,
    quaternary,
    fifth,
    senary,
    dark,
    row,
    left,
    right,
    center,
    hCenter,
    vCenter,
    bottom,
    onPress,
    onLongPress,
    spaceBetween,
    shadow,
    imageShadow,
    absolute,
    spaceAround,
    small,
    safeArea,
    debounceAction = true,
    shadowNoOffset,
    // eventually, we will retire props such as primary, secondary, etc.
    // and use bg for setting our backgrounds
    bg,
  } = props
  const passedStyles = props.style || []
  const absoluteStyles = absolute
    ? // $FlowFixMe flow does not support below syntax for dynamic property access
      [style.absolute, style[`absolute${absolute}`]]
    : []
  // TODO:KS We can keep same name as style and use it directly with props
  const styles = StyleSheet.flatten([
    clearBg ? style.transparentBg : null,
    horizontalSpace ? style.horizontalSpaced : null,
    verticalSpace ? style.verticalSpaced : null,
    doubleVerticalSpace ? style.doubleVerticalSpaced : null,
    pad ? [style.horizontalSpaced, style.verticalSpaced] : null,
    primary ? style.primaryBg : null,
    secondary ? style.secondaryBg : null,
    tertiary ? style.tertiaryBg : null,
    quaternary ? style.quaternaryBg : null,
    fifth ? style.fifthBg : null,
    senary ? style.senaryBg : null,
    dark ? style.darkBg : null,
    // the reason for doing `${bg}Bg` is that if user passes bg="primary"
    // then our styles are named as `primaryBg` so we add `Bg` to bg value
    // and then we get our style
    // $FlowFixMe flow does not support below syntax for dynamic property access
    bg ? style[`${bg}Bg`] || {} : null,
    row ? style.row : null,
    left ? style.left : null,
    right ? style.right : null,
    center ? style.center : null,
    hCenter ? style.hCenter : null,
    vCenter ? style.vCenter : null,
    row && bottom ? style.rowBottom : null,
    bottom && !row ? style.columnBottom : null,
    spaceBetween ? style.spaceBetween : null,
    shadow ? style.shadow : null,
    imageShadow ? style.imageShadow : null,
    spaceAround ? style.spaceAround : null,
    shadowNoOffset ? style.shadowNoOffset : null,
    ...[absoluteStyles],
    ...[passedStyles],
  ])
  let filteredProps = { ...props }
  delete filteredProps.onLongPress
  delete filteredProps.onPress
  delete filteredProps.left
  delete filteredProps.right
  delete filteredProps.bottom
  if (typeof props.testID === 'undefined') {
    delete filteredProps.testID
  } else {
    filteredProps.accessible = true
    filteredProps.accessibilityLabel = filteredProps.testID
  }
  const customView = safeArea ? (
    <SafeAreaView {...filteredProps} style={styles}>
      {filteredProps.children}
    </SafeAreaView>
  ) : (
    <View {...filteredProps} style={styles}>
      {filteredProps.children}
    </View>
  )

  if (onPress || onLongPress) {
    let touchProps = {}
    if (typeof props.testID !== 'undefined') {
      touchProps.testID = `${props.testID}-touchable`
      touchProps.accessible = Platform.OS === 'ios' ? false : true
      touchProps.accessibilityLabel = `${props.testID}-touchable`
    }
    if (typeof onPress !== 'undefined') {
      if (debounceAction) {
        touchProps.onPress = debounce(
          (event) => {
            onPress(event)
          },
          900,
          { leading: true, trailing: false }
        )
      } else {
        touchProps.onPress = onPress
      }
    }
    if (typeof onLongPress !== 'undefined') {
      touchProps.onLongPress = onLongPress
    }
    let hitSlopWidth = small ? 30 : 20
    return (
      <TouchableWithoutFeedback
        {...touchProps}
        hitSlop={{
          top: hitSlopWidth,
          right: hitSlopWidth,
          bottom: hitSlopWidth,
          left: hitSlopWidth,
        }}
      >
        {customView}
      </TouchableWithoutFeedback>
    )
  }

  return customView
}
