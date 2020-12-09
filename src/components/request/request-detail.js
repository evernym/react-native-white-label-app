// @flow
import React, { PureComponent } from 'react'

import type { RequestDetailProps } from './type-request'

import { Container } from '../layout/container'
import { RequestDetailText } from './request-detail-text'
import RequestDetailAvatars from './request-detail-avatars'

export default class RequestDetail extends PureComponent<
  RequestDetailProps,
  void
> {
  render() {
    const { testID } = this.props
    return (
      <Container useNativeDriver hCenter>
        <Container bottom>
          <RequestDetailText
            title={this.props.title}
            message={this.props.message}
            testID={testID}
          />
        </Container>
        <Container>
          <RequestDetailAvatars
            senderName={this.props.senderName}
            senderLogoUrl={this.props.senderLogoUrl}
          />
        </Container>
      </Container>
    )
  }
}
