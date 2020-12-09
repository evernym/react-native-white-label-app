// @flow

import React from 'react'
import { StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'

import { CustomView } from '../../layout/custom-view'
import { BottomUpSliderText } from './bottom-up-slider-screen-text'

export function BottomUpSliderError(props: {
  afterErrorShown?: () => void,
  errorText: string,
  textStyles?: Array<Object | number>,
  errorIconStyles?: Array<Object | number>,
  containerStyles?: Array<Object | number>,
}) {
  const { textStyles = [], errorIconStyles = [], containerStyles = [] } = props
  return (
    <CustomView
      bg="tertiary"
      center
      style={[styles.errorContainer, ...containerStyles]}
    >
      <CustomView>
        <LottieView
          source={require('../../../images/red-cross-lottie.json')}
          autoPlay
          loop={false}
          style={[styles.feedbackIcon, ...errorIconStyles]}
          onAnimationFinish={props.afterErrorShown}
        />
      </CustomView>
      <BottomUpSliderText size="h4" bold={false} center style={[...textStyles]}>
        {props.errorText}
      </BottomUpSliderText>
    </CustomView>
  )
}

const styles = StyleSheet.create({
  errorContainer: {},
  feedbackIcon: {
    width: 50,
    height: 50,
  },
})
