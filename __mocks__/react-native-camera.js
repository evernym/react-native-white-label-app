// @flow
import React, { PureComponent } from 'react'

export class RNCamera extends PureComponent<any, any> {
  static Constants = {
    Aspect: {},
    BarCodeType: {},
    Type: { back: 'back', front: 'front' },
    CaptureMode: {},
    CaptureTarget: {},
    CaptureQuality: {},
    Orientation: {},
    FlashMode: {},
    TorchMode: {},
  }

  render() {
    return this.props.children
  }
}

export default RNCamera
