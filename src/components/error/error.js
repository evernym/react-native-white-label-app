// @flow

import React from 'react'
import { StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'

import { CustomView } from '../layout/custom-view'
import CustomText from '../text'

export function Error(props: {
  afterErrorShown?: () => void,
  errorText: string,
  textStyles?: Array<Object | number>,
  errorIconStyles?: Array<Object | number>,
  containerStyles?: Array<Object | number>,
}) {
  const { textStyles = [], errorIconStyles = [], containerStyles = [] } = props
  return (
    <CustomView
      bg={false}
      center
      style={[styles.errorContainer, ...containerStyles]}
    >
      <CustomView bg={false}>
        <LottieView
          source={require('../../images/red-cross-lottie.json')}
          autoPlay
          loop={false}
          style={[styles.feedbackIcon, ...errorIconStyles]}
          onAnimationFinish={props.afterErrorShown}
          speed={1.5}
        />
      </CustomView>
      <CustomText
        bg={false}
        size="h4"
        bold={false}
        center
        multiline
        {...props}
        style={[styles.errorText, ...textStyles]}
      >
        {props.errorText}
      </CustomText>
    </CustomView>
  )
}

const styles = StyleSheet.create({
  errorContainer: {},
  errorText: {
    marginTop: '5%',
  },
  feedbackIcon: {
    width: 50,
    height: 50,
  },
})
