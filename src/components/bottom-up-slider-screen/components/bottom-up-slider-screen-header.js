// @flow
import React from 'react'

import { Container, CustomView } from '../../index'
import { styles } from '../bottom-up-slider-screen-styles'

export class BottomUpSliderScreenHeader extends React.Component<
  BottomUpSliderScreenHeaderProps,
  void
> {
  render() {
    return (
      <Container row style={[styles.headerContainer]}>
        <ViewCloser {...this.props} />
        {!this.props.hideHandlebar && <HeaderHandlebar />}
        <ViewCloser {...this.props} />
      </Container>
    )
  }
}

// this component is used to close screen, when user taps on header
const ViewCloser = (props: BottomUpSliderScreenHeaderProps) => (
  <Container onPress={props.onCancel} />
)

const HeaderHandlebar = () => (
  <CustomView style={[styles.headerHandleContainer]}>
    <CustomView style={[styles.headerHandlebar]} />
  </CustomView>
)

type BottomUpSliderScreenHeaderProps = {
  onCancel: () => void,
  hideHandlebar?: boolean,
}
