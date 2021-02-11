// @flow
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import isUrl from 'validator/lib/isURL'

import type { GenericObject } from '../common/type-common'
import { ID, TYPE } from '../common/type-common'
import type { Store } from '../store/type-store'
import type { ResponseTypes } from '../components/request/type-request'
import type {
  AriesConnectionInvite,
  AriesOutOfBandInvite,
  InvitationProps,
  InvitationNavigation,
} from './type-invitation'

import { CONNECTION_INVITE_TYPES } from './type-invitation'
import { schemaValidator } from '../services/schema-validator'
import { Container } from '../components'
import { homeDrawerRoute, homeRoute, invitationRoute } from '../common'
import { ResponseType } from '../components/request/type-request'
import { sendInvitationResponse, invitationRejected } from './invitation-store'
import { smsPendingInvitationSeen } from '../sms-pending-invitation/sms-pending-invitation-store'
import { SMSPendingInvitationStatus } from '../sms-pending-invitation/type-sms-pending-invitation'
import { Request } from '../components/request/request'
import { Platform } from 'react-native'
import { allowPushNotifications } from '../push-notification/push-notification-store'

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
          if (Platform.OS === 'android') {
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

export function isValidAriesV1InviteData(
  payload: any,
  original: string
): false | AriesConnectionInvite {
  if (!schemaValidator.validate(ariesConnectionInviteQrSchema, payload)) {
    return false
  }

  if (!isUrl(payload.serviceEndpoint)) {
    return false
  }

  return {
    original,
    payload,
    type: CONNECTION_INVITE_TYPES.ARIES_V1_QR,
    version: '1.0',
  }
}

const ariesConnectionInviteQrSchema = {
  type: 'object',
  properties: {
    [ID]: { type: 'string' },
    [TYPE]: { type: 'string' },
    label: { type: ['null', 'string'] },
    recipientKeys: {
      type: 'array',
      items: [{ type: 'string' }],
      minItems: 1,
    },
    routingKeys: {
      type: ['null', 'array'],
      items: [{ type: 'string' }],
      minItems: 0,
    },
    serviceEndpoint: { type: 'string' },
    profileUrl: { type: ['null', 'string'] },
  },
  required: [ID, TYPE, 'recipientKeys', 'serviceEndpoint'],
}

export function isValidAriesOutOfBandInviteData(
  invite: GenericObject
): false | AriesOutOfBandInvite {
  if (!schemaValidator.validate(ariesOutOfBandInviteSchema, invite)) {
    return false
  }

  if (
    !invite.service.every(
      (serviceEntry) =>
        typeof serviceEntry === 'string' ||
        (typeof serviceEntry === 'object' &&
          isUrl(serviceEntry.serviceEndpoint))
    )
  ) {
    return false
  }

  return ((invite: any): AriesOutOfBandInvite)
}

const ariesOutOfBandInviteSchema = {
  type: 'object',
  properties: {
    [ID]: { type: 'string' },
    [TYPE]: { type: 'string' },
    label: { type: ['null', 'string'] },
    goal_code: { type: ['null', 'string'] },
    goal: { type: ['null', 'string'] },
    handshake_protocols: {
      type: 'array',
      items: [{ type: 'string' }],
    },
    'request~attach': {
      type: ['null', 'array'],
      items: [
        {
          type: 'object',
          properties: {
            [ID]: { type: 'string' },
            'mime-type': { type: 'string' },
            data: {
              type: 'object',
              anyOf: [
                { properties: { json: { type: 'string' } } },
                { properties: { base64: { type: 'string' } } },
              ],
              minProperties: 1,
            },
          },
          required: [ID, 'mime-type', 'data'],
        },
      ],
    },
    service: {
      type: 'array',
      items: {
        anyOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              recipientKeys: {
                type: 'array',
                items: [{ type: 'string' }],
                minItems: 1,
              },
              routingKeys: {
                type: ['null', 'array'],
                items: [{ type: 'string' }],
                minItems: 0,
              },
              serviceEndpoint: { type: 'string' },
            },
            required: ['id', 'type', 'recipientKeys', 'serviceEndpoint'],
          },
        ],
      },
      minItems: 1,
    },
    public_did: { type: ['null', 'string'] },
  },
  anyOf: [
    {
      required: ['handshake_protocols'],
    },
    {
      required: ['request~attach'],
    },
  ],
  required: [ID, TYPE, 'service'],
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
