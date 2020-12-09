// @flow

import React from 'react'
import { StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'

import { CustomView } from '../layout/custom-view'
import CustomText from '../text'
import type { Styles } from '../../common/type-common'

export function Success(props: {
  afterSuccessShown: () => void,
  successText: string,
  textStyles?: Array<Object | number>,
  successIconStyles?: Array<Object | number>,
  containerStyle?: Styles,
}) {
  const { textStyles = [], successIconStyles = [], containerStyle = [] } = props
  return (
    <CustomView
      bg="tertiary"
      center
      style={[styles.successContainer, containerStyle]}
    >
      <CustomView>
        <LottieView
          source={require('../../images/green-tick-lottie.json')}
          autoPlay
          loop={false}
          style={[styles.feedbackIcon, ...successIconStyles]}
          onAnimationFinish={props.afterSuccessShown}
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
        style={[styles.successText, ...textStyles]}
      >
        {props.successText}
      </CustomText>
    </CustomView>
  )
}

const styles = StyleSheet.create({
  successContainer: {},
  successText: {
    marginTop: '5%',
  },
  feedbackIcon: {
    width: 50,
    height: 50,
  },
})
