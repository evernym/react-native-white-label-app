// @flow
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import type { Store } from '../store/type-store'
import type { ResponseTypes } from '../components/request/type-request'
import type {
  InvitationProps,
  InvitationNavigation,
} from './type-invitation'

import { Container } from '../components'
import { homeDrawerRoute, homeRoute, invitationRoute } from '../common'
import { ResponseType } from '../components/request/type-request'
import { sendInvitationResponse, invitationRejected } from './invitation-store'
import { smsPendingInvitationSeen } from '../sms-pending-invitation/sms-pending-invitation-store'
import { SMSPendingInvitationStatus } from '../sms-pending-invitation/type-sms-pending-invitation'
import { Request } from '../components/request/request'
import { Platform } from 'react-native'
import { allowPushNotifications } from '../push-notification/push-notification-store'
import { usePushNotifications } from '../external-imports'

export class Invitation extends Component<InvitationProps, void> {
  render() {
    const { invitation } = this.props

    const {
      isValid,
      senderName,
      title,
      message,
      senderLogoUrl,
    } = isValidInvitation(this.props.invitation)

    if (!isValid) {
      return <Container />
    }

    return (
      <Container>
        <Request
          title={title}
          message={message}
          senderLogoUrl={senderLogoUrl}
          onAction={this.onAction}
          testID={'invitation'}
          invitationError={invitation ? invitation.error : undefined}
          senderName={senderName}
        />
      </Container>
    )
  }

  componentDidMount() {
    if (this.props.isSmsInvitationNotSeen) {
      this.props.smsPendingInvitationSeen(this.props.smsToken)
    }
  }

  hideModal = () => {
    const backRedirectRoute = this.props.route.params?.backRedirectRoute
    if (backRedirectRoute) {
      this.props.navigation.navigate(backRedirectRoute)
    } else {
      this.props.navigation.navigate(homeRoute, {
        screen: homeDrawerRoute,
        params: undefined,
      })
    }
  }

  onAction = (response: ResponseTypes) => {
    const { invitation } = this.props
    if (invitation) {
      const { payload } = invitation
      if (payload) {
        if (response === ResponseType.accepted) {
          if (Platform.OS === 'android' && usePushNotifications) {
            // for android, we don't need to show push permission screen
            // so we can safely register push notification on Android
            // For ios, we are already showing permission screen
            // and if user click on allow permission, then our saga would request
            // permission and update the FCM token
            this.props.allowPushNotifications()
          }
          this.props.sendInvitationResponse({
            response,
            senderDID: payload.senderDID,
          })
          this.props.navigation.navigate(homeRoute, {
            screen: homeDrawerRoute,
            params: undefined,
          })
        } else if (response === ResponseType.rejected) {
          this.props.invitationRejected(payload.senderDID)
          this.hideModal()
        }
      } else {
        this.hideModal()
      }
    }
  }
}

function isValidInvitation(
  invitation: $PropertyType<InvitationProps, 'invitation'>
) {
  let senderName = 'Anonymous'
  let title = 'Hi'
  let message = 'Anonymous wants to connect with you.'

  if (invitation && invitation.payload) {
    const { payload } = invitation
    senderName = payload.senderName || senderName
    message = `${senderName} wants to connect with you.`
    return {
      isValid: true,
      senderName,
      title,
      message,
      senderLogoUrl: payload.senderLogoUrl,
    }
  }

  return {
    isValid: false,
    senderName,
    title,
    message,
    senderLogoUrl: undefined,
  }
}

const mapStateToProps = (
  state: Store,
  { route: { params } }: InvitationNavigation
) => {
  const senderDID = params ? params.senderDID : ''
  const smsToken = params ? params.token : null
  const isSmsInvitationNotSeen =
    smsToken &&
    state.smsPendingInvitation[smsToken] &&
    state.smsPendingInvitation[smsToken].status !==
      SMSPendingInvitationStatus.SEEN

  return {
    invitation: state.invitation[senderDID],
    smsToken,
    isSmsInvitationNotSeen,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      sendInvitationResponse,
      invitationRejected,
      smsPendingInvitationSeen,
      allowPushNotifications,
    },
    dispatch
  )

export const invitationScreen = {
  routeName: invitationRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(Invitation),
}
