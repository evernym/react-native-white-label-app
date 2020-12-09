// @flow

import React from 'react'
import type { ImageURISource } from 'react-native/Libraries/Image/ImageSource'
import { Image, StyleSheet } from 'react-native'

import { CustomView, Container } from '../../layout/'
import { BottomUpSliderText } from './bottom-up-slider-screen-text'

export function BottomUpSliderContentHeader(props: {
  source: number | ImageURISource,
  senderName: string,
}) {
  return (
    <CustomView row style={[styles.contentHeaderContainer]} center>
      <CustomView>
        <Image
          style={[styles.headerLogo]}
          source={props.source}
          resizeMode="cover"
        />
      </CustomView>
      <Container style={[styles.headerName]}>
        <BottomUpSliderText size="h5" numberOfLines={2}>
          {props.senderName}
        </BottomUpSliderText>
      </Container>
    </CustomView>
  )
}

const HEADER_LOGO_DIMENSION = 32
const headerSpacing = '5%'

const styles = StyleSheet.create({
  contentHeaderContainer: {
    minHeight: 64,
    maxHeight: 90,
  },
  headerLogo: {
    width: HEADER_LOGO_DIMENSION,
    height: HEADER_LOGO_DIMENSION,
    borderRadius: HEADER_LOGO_DIMENSION / 2,
    borderWidth: 1,
  },
  headerName: {
    marginLeft: headerSpacing,
  },
})
