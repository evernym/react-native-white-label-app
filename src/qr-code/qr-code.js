// @flow
import React, { Component } from 'react'
import { Alert, AppState, Platform, PermissionsAndroid } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { Container, QRScanner } from '../components'
import { color } from '../common/styles/constant'
import { handleInvitation } from '../invitation/invitation-store'
import {
  claimOfferRoute,
  openIdConnectRoute,
  proofRequestRoute,
  pushNotificationPermissionRoute,
  qrCodeScannerTabRoute,
} from '../common/'

import type { OIDCAuthenticationRequest } from '../components/qr-scanner/type-qr-scanner'
import type { Store } from '../store/type-store'
import type {
  AriesConnectionInvite,
  AriesOutOfBandInvite,
  InvitationPayload,
  ShortProprietaryConnectionInvitation,
} from '../invitation/type-invitation'
import type {
  QRCodeScannerScreenProps,
  QRCodeScannerScreenState,
} from './type-qr-code'
import type { QrCodeEphemeralProofRequest } from '../proof-request/type-proof-request'
import { withStatusBar } from '../components/status-bar/status-bar'
import {
  OPEN_ID_CONNECT_STATE,
  openIdConnectUpdateStatus,
} from '../open-id-connect/open-id-connect-actions'
import { convertShortProprietaryInvitationToAppInvitation } from '../invitation/kinds/proprietary-connection-invitation'
import { convertAriesOutOfBandInvitationToAppInvitation } from '../invitation/kinds/aries-out-of-band-invitation'
import { convertAriesInvitationToAppInvitation } from '../invitation/kinds/aries-connection-invitation'
import { proofRequestReceived } from '../proof-request/proof-request-store'

import { SCAN_QR_CLOSE_X_BUTTON } from '../feedback/log-to-apptentive'
import type { QrCodeEphemeralCredentialOffer } from '../claim-offer/ephemeral-claim-offer'
import { claimOfferReceived } from '../claim-offer/claim-offer-store'
import { getPushNotificationAuthorizationStatus } from '../push-notification/components/push-notification-permission-screen'
import { usePushNotifications } from '../external-imports'

export class QRCodeScannerScreen extends Component<
  QRCodeScannerScreenProps,
  QRCodeScannerScreenState
> {
  state = {
    appState: AppState.currentState,
    isCameraEnabled: true,
    permission: false,
  }

  subscription = null;
  permissionCheckIntervalId: ?IntervalID = undefined

  onShortProprietaryInvitationRead = async (
    qrCode: ShortProprietaryConnectionInvitation
  ) => {
    if (this.props.currentScreen === qrCodeScannerTabRoute) {
      this.props.handleInvitation(
        convertShortProprietaryInvitationToAppInvitation(qrCode)
      )
    }
  }

  // Please do not remove below commented lines
  // We will want to have environment switcher from QR code
  // sometime in future

  // onAllowSwitchEnvironment = (url: EnvironmentSwitchUrlQrCode) => {
  //   this.props.changeEnvironmentUrl(url.url)
  //   this.props.navigation.goBack(null)
  // }

  // onEnvironmentSwitchUrl = (url: EnvironmentSwitchUrlQrCode) => {
  //   if (this.props.currentScreen === qrCodeScannerTabRoute) {
  //     Alert.alert(MESSAGE_RESET_CONNECT_ME, MESSAGE_RESET_DETAILS(url.name), [
  //       { text: 'Cancel' },
  //       {
  //         text: 'Switch',
  //         onPress: () => this.onAllowSwitchEnvironment(url),
  //       },
  //     ])
  //   }
  // }

  onProprietaryInvitationRead = async (payload: InvitationPayload) => {
    if (this.props.currentScreen === qrCodeScannerTabRoute) {
      this.props.handleInvitation(payload)
    }
  }

  onClose = () => {
    this.props.navigation.goBack(null)
    this.props.scanQrClose()
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA).then(
        (permission) => {
          if (permission === 'never_ask_again' || permission === 'denied') {
            this.props.navigation.goBack()
            Alert.alert(
              'Camera Permission Needed',
              'Please go into your device settings and enable camera permissions for Connect.Me to use the camera feature.',
              [
                {
                  text: 'OK',
                },
              ]
            )
            this.setState({ permission: false })
          }
          this.setState({ permission: true })
        }
      )
    }

    this.subscription = AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount() {
    this.subscription.remove()
  }

  _handleAppStateChange = (nextAppState) => {
    if (
      this.state.appState &&
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      this.setState({ isCameraEnabled: true })
    } else if (
      this.state.appState &&
      nextAppState.match(/inactive|background/) &&
      this.state.appState === 'active'
    ) {
      this.setState({ isCameraEnabled: false })
    }
    this.setState({ appState: nextAppState })
  }

  render() {
    return (
      <Container dark collapsable={true}>
        {this.state.isCameraEnabled &&
        this.props.navigation.isFocused() &&
        (this.state.permission || Platform.OS === 'ios') ? (
          <QRScanner
            onShortProprietaryInvitationRead={
              this.onShortProprietaryInvitationRead
            }
            onProprietaryInvitationRead={this.onProprietaryInvitationRead}
            onOIDCAuthenticationRequest={this.onOIDCAuthenticationRequest}
            onAriesConnectionInviteRead={this.onAriesConnectionInviteRead}
            onAriesOutOfBandInviteRead={this.onAriesOutOfBandInviteRead}
            onEphemeralProofRequest={this.onEphemeralProofRequest}
            onEphemeralCredentialOffer={this.onEphemeralCredentialOffer}
            onClose={this.onClose}
          />
        ) : null}
      </Container>
    )
  }

  onOIDCAuthenticationRequest = (
    oidcAuthenticationRequest: OIDCAuthenticationRequest
  ) => {
    this.props.openIdConnectUpdateStatus(
      oidcAuthenticationRequest,
      OPEN_ID_CONNECT_STATE.REQUEST_RECEIVED
    )
    this.props.navigation.navigate(openIdConnectRoute, {
      oidcAuthenticationRequest,
    })
  }

  onAriesConnectionInviteRead = async (
    ariesConnectionInvite: AriesConnectionInvite
  ) => {
    const invitation = convertAriesInvitationToAppInvitation(
      ariesConnectionInvite
    )
    this.props.handleInvitation(invitation)
  }

  onAriesOutOfBandInviteRead = async (invite: AriesOutOfBandInvite) => {
    const invitation = await convertAriesOutOfBandInvitationToAppInvitation(
      invite
    )
    this.props.handleInvitation(invitation)
  }

  onEphemeralProofRequest = (
    ephemeralProofRequest: QrCodeEphemeralProofRequest
  ) => {
    const uid = ephemeralProofRequest.ephemeralProofRequest['@id']
    this.props.proofRequestReceived(ephemeralProofRequest.proofRequestPayload, {
      uid,
      remotePairwiseDID:
        ephemeralProofRequest.ephemeralProofRequest['~service']
          .recipientKeys[0],
      senderLogoUrl: null,
      hidden: true,
    })
    this.props.navigation.navigate(proofRequestRoute, {
      uid,
      backRedirectRoute: this.props.route.params?.backRedirectRoute,
    })
  }

  handleiOSNavigation = async ({
                                       mainRoute,
                                       backRedirectRoute,
                                       uid,
                                       senderDID,
                                     }: any) => {
    const { navigation } = this.props
    const isAuthorized = await getPushNotificationAuthorizationStatus()
    const navigationFn = navigation.push || navigation.navigate
    const intendedPayload = {
      backRedirectRoute,
      uid,
      hidden: true,
    }

    if (Platform.OS === 'ios' && usePushNotifications && !isAuthorized) {
      navigationFn(pushNotificationPermissionRoute, {
        senderDID,
        navigatedFrom: qrCodeScannerTabRoute,
        intendedRoute: mainRoute,
        intendedPayload,
      })
    } else {
      navigationFn(mainRoute, intendedPayload)
    }
  }


  onEphemeralCredentialOffer = async (
    ephemeralCredentialOffer: QrCodeEphemeralCredentialOffer
  ) => {
    const uid = ephemeralCredentialOffer.ephemeralCredentialOffer['@id']
    const remotePairwiseDID = ephemeralCredentialOffer.ephemeralCredentialOffer['~service']
      .recipientKeys[0]

    this.props.claimOfferReceived(ephemeralCredentialOffer.claimOfferPayload, {
      uid,
      remotePairwiseDID,
      senderLogoUrl: null,
      hidden: true,
    })

    await this.handleiOSNavigation({
      mainRoute: claimOfferRoute,
      backRedirectRoute: this.props.route.params?.backRedirectRoute,
      uid,
      senderDID: remotePairwiseDID,
    })
  }
}

const mapStateToProps = (state: Store) => ({
  currentScreen: state.route.currentScreen,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      openIdConnectUpdateStatus,
      handleInvitation,
      proofRequestReceived,
      claimOfferReceived,
      scanQrClose: () => SCAN_QR_CLOSE_X_BUTTON,
    },
    dispatch
  )

export const qrCodeScannerScreen = {
  routeName: qrCodeScannerTabRoute,
  screen: withStatusBar({ color: color.bg.sixth.color })(
    connect(mapStateToProps, mapDispatchToProps)(QRCodeScannerScreen)
  ),
}
