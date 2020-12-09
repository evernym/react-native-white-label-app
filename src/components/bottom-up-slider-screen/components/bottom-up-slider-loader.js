// @flow

import React from 'react'
import { StyleSheet } from 'react-native'

import { CustomView } from '../../layout/custom-view'
import Loader from '../../loader/loader'
import type { Styles } from '../../../common/type-common'

export function BottomUpSliderLoader({
  message = 'Sending...',
  style,
}: {
  message?: string,
  style?: Styles,
}) {
  return (
    <CustomView bg="tertiary" center style={[styles.loaderContainer, style]}>
      <Loader type="dark" showMessage={true} message={message} />
    </CustomView>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    minHeight: '20%',
  },
})
