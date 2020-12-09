// @flow

import React from 'react'
import { StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'

import { CustomView } from '../../layout/custom-view'
import { BottomUpSliderText } from './bottom-up-slider-screen-text'
import type { Styles } from '../../../common/type-common'

export function BottomUpSliderSuccess(props: {
  afterSuccessShown: () => void,
  successText: string,
  textStyles?: Array<Object | number>,
  successIconStyles?: Array<Object | number>,
  style?: Styles,
}) {
  const { textStyles = [], successIconStyles = [], style = [] } = props
  return (
    <CustomView bg="tertiary" center style={[styles.successContainer, style]}>
      <CustomView>
        <LottieView
          source={require('../../../images/green-tick-lottie.json')}
          autoPlay
          loop={false}
          style={[styles.feedbackIcon, ...successIconStyles]}
          onAnimationFinish={props.afterSuccessShown}
        />
      </CustomView>
      <BottomUpSliderText
        size="h4"
        bold={false}
        center
        style={[styles.successText, ...textStyles]}
      >
        {props.successText}
      </BottomUpSliderText>
    </CustomView>
  )
}

const styles = StyleSheet.create({
  successContainer: {
    minHeight: '20%',
  },
  successText: {
    marginTop: '5%',
  },
  feedbackIcon: {
    width: 50,
    height: 50,
  },
})
