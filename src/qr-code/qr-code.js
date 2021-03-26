// @flow
import React, { Component } from 'react'
import { Alert, AppState, Platform } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { convertAriesCredentialOfferToCxsClaimOffer } from '../bridge/react-native-cxs/vcx-transformers'
import { convertClaimOfferPushPayloadToAppClaimOffer } from '../push-notification/push-notification-store'

import { Container, QRScanner } from '../components'
import { color, colors } from '../common/styles/constant'
import {
  getAttachedRequest,
  invitationReceived,
} from '../invitation/invitation-store'
import {
  claimOfferRoute,
  homeDrawerRoute,
  homeRoute,
  invitationRoute,
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
  OutOfBandNavigation,
  QRCodeScannerScreenProps,
  QRCodeScannerScreenState,
} from './type-qr-code'
import type {
  AriesPresentationRequest,
  ProofRequestPayload,
  QrCodeEphemeralProofRequest,
} from '../proof-request/type-proof-request'
import { PROOF_REQUEST_STATUS } from '../proof-request/type-proof-request'
import type {
  ClaimOfferPayload,
  CredentialOffer,
} from '../claim-offer/type-claim-offer'
import { CLAIM_OFFER_STATUS } from '../claim-offer/type-claim-offer'
import { changeEnvironmentUrl } from '../store/config-store'
import {
  getAllDid,
  getAllPublicDid,
  getClaimOffers,
  getProofRequests,
} from '../store/store-selector'
import { withStatusBar } from '../components/status-bar/status-bar'
import {
  OPEN_ID_CONNECT_STATE,
  openIdConnectUpdateStatus,
} from '../open-id-connect/open-id-connect-actions'
import { ID, TYPE } from '../common/type-common'
import { proofRequestReceived } from '../proof-request/proof-request-store'
import { claimOfferReceived } from '../claim-offer/claim-offer-store'
import { validateOutofbandProofRequestQrCode } from '../proof-request/proof-request-qr-code-reader'
import { getPushNotificationAuthorizationStatus } from '../push-notification/components/push-notification-permission-screen'
import Snackbar from 'react-native-snackbar'
import { convertShortProprietaryInvitationToAppInvitation } from '../invitation/kinds/proprietary-connection-invitation'
import { convertAriesOutOfBandInvitationToAppInvitation } from '../invitation/kinds/aries-out-of-band-invitation'
import { convertAriesInvitationToAppInvitation } from '../invitation/kinds/aries-connection-invitation'
import {
  getExistingConnection,
  prepareParamsForExistingConnectionRedirect,
} from '../invitation/invitation-helpers'
import {usePushNotifications} from "../external-exports";

export class QRCodeScannerScreen extends Component<
  QRCodeScannerScreenProps,
  QRCodeScannerScreenState
> {
  state = {
    appState: AppState.currentState,
    isCameraEnabled: true,
  }

  permissionCheckIntervalId: ?IntervalID = undefined

  onShortProprietaryInvitationRead = async (
    qrCode: ShortProprietaryConnectionInvitation
  ) => {
    if (this.props.currentScreen === qrCodeScannerTabRoute) {
      const invitation = {
        payload: convertShortProprietaryInvitationToAppInvitation(qrCode),
      }
      await this.checkExistingConnectionAndRedirect(invitation)
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
      await this.checkExistingConnectionAndRedirect({ payload })
    }
  }

  checkExistingConnectionAndRedirect = async (invitation: {
    payload: InvitationPayload,
  }) => {
    // Apparently navigation.push can be null, and hence we are protecting
    // against null fn call, so if push is not available, navigate is
    // guaranteed to be available
    const navigationFn =
      this.props.navigation.push || this.props.navigation.navigate

    // check if connection already exists
    // if connection exist, then redirect to the home view
    // and show Snack bar stating that connection already exist
    // otherwise redirect to invitation screen
    const { publicDID, DID } = invitation.payload.senderDetail

    const existingConnection = getExistingConnection(
      this.props.allPublicDid,
      this.props.allDid,
      publicDID,
      DID
    )

    if (existingConnection) {
      navigationFn(homeRoute, {
        screen: homeDrawerRoute,
        params: prepareParamsForExistingConnectionRedirect(
          existingConnection,
          invitation.payload
        ),
      })
      return
    }

    this.props.invitationReceived(invitation)

    const isAuthorized = await getPushNotificationAuthorizationStatus()

    if (Platform.OS === 'ios'&& usePushNotifications && !isAuthorized) {
      navigationFn(pushNotificationPermissionRoute, {
        senderDID: invitation.payload.senderDID,
        navigatedFrom: qrCodeScannerTabRoute,
      })
    } else
      navigationFn(invitationRoute, {
        senderDID: invitation.payload.senderDID,
        backRedirectRoute: this.props.route.params?.backRedirectRoute,
      })
  }

  onClose = () => {
    this.props.navigation.goBack(null)
  }

  componentDidMount() {
    // we don't use detox anymore
    // if (detox === 'yes') {
    //   setTimeout(async () => {
    //     try {
    //       // get invitation from server running inside detox test
    //       const invitation = await (await fetch('http://localhost:1337')).json()
    //       if (invitation['payload']) {
    //         this.onAriesConnectionInviteRead(invitation) // for VAS
    //       } else {
    //         this.onRead(invitation) // for VUI
    //       }
    //     } catch (e) {
    //       // Alert.alert(JSON.stringify(e)) // android scanning throws empty error {} here!
    //     }
    //   })
    // }

    AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange)
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
        {this.state.isCameraEnabled && this.props.navigation.isFocused() ? (
          <QRScanner
            onShortProprietaryInvitationRead={
              this.onShortProprietaryInvitationRead
            }
            onProprietaryInvitationRead={this.onProprietaryInvitationRead}
            onOIDCAuthenticationRequest={this.onOIDCAuthenticationRequest}
            onAriesConnectionInviteRead={this.onAriesConnectionInviteRead}
            onAriesOutOfBandInviteRead={this.onAriesOutOfBandInviteRead}
            onEphemeralProofRequest={this.onEphemeralProofRequest}
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
    await this.checkExistingConnectionAndRedirect({ payload: invitation })
  }

  handleOutOfBandNavigation = async ({
    mainRoute,
    backRedirectRoute,
    uid,
    invitationPayload,
    attachedRequest,
    senderName,
  }: OutOfBandNavigation) => {
    const { navigation } = this.props
    const isAuthorized = await getPushNotificationAuthorizationStatus()
    const navigationFn = navigation.push || navigation.navigate

    if (Platform.OS === 'ios' && usePushNotifications && !isAuthorized) {
      navigationFn(pushNotificationPermissionRoute, {
        senderDID: invitationPayload.senderDID,
        navigatedFrom: qrCodeScannerTabRoute,
        intendedRoute: mainRoute,
        intendedPayload: {
          backRedirectRoute,
          uid,
          invitationPayload,
          attachedRequest,
          senderName,
        },
      })
    } else {
      navigationFn(mainRoute, {
        backRedirectRoute,
        uid,
        invitationPayload,
        attachedRequest,
        senderName,
      })
    }
  }

  onAriesOutOfBandInviteRead = async (invite: AriesOutOfBandInvite) => {
    const invitation = convertAriesOutOfBandInvitationToAppInvitation(invite)
    if (!invitation) {
      this.props.navigation.goBack(null)
      Alert.alert(
        'Invalid Out-of-Band Invitation',
        'QR code contains invalid formatted Aries Out-of-Band invitation.'
      )
      return
    }

    if (
      !invite.handshake_protocols?.length &&
      !invite['request~attach']?.length
    ) {
      // Invite: No `handshake_protocols` and `request~attach`
      // Action: show alert about invalid formatted invitation
      this.props.navigation.goBack(null)
      Alert.alert(
        'Invalid Out-of-Band Invitation',
        'QR code contains invalid formatted Aries Out-of-Band invitation.'
      )
      return
    } else if (
      invite.handshake_protocols?.length &&
      !invite['request~attach']?.length
    ) {
      // Invite: Has `handshake_protocols` but no `request~attach`
      // Action: Create a new connection or reuse existing.
      // UI: Show Connection invite
      await this.checkExistingConnectionAndRedirect({ payload: invitation })
    } else if (invite['request~attach']?.length) {
      // Invite: Has `handshake_protocols` and has `request~attach`
      // Action:
      //  1. Create a new connection or reuse existing
      //  2. Rut protocol connected to attached action
      // UI: Show view related to attached action

      const req = await getAttachedRequest(invite)
      if (!req || !req[TYPE]) {
        this.props.navigation.goBack(null)
        Alert.alert(
          'Invalid Out-of-Band Invitation',
          'QR code contains invalid formatted Aries Out-of-Band invitation.'
        )
        return
      }

      if (req[TYPE].endsWith('offer-credential')) {
        const credentialOffer = (req: CredentialOffer)
        const claimOffer = convertAriesCredentialOfferToCxsClaimOffer(
          credentialOffer
        )
        const uid = credentialOffer[ID]

        const existingCredential: ClaimOfferPayload = this.props.claimOffers[
          uid
        ]

        if (
          existingCredential &&
          existingCredential.status === CLAIM_OFFER_STATUS.ACCEPTED
        ) {
          this.props.navigation.navigate(homeRoute, {
            screen: homeDrawerRoute,
            params: undefined,
          })
          // we already have accepted that offer
          Snackbar.show({
            text: 'The credential offer has already been accepted.',
            backgroundColor: colors.red,
            duration: Snackbar.LENGTH_LONG,
          })
          return
        }

        this.props.claimOfferReceived(
          convertClaimOfferPushPayloadToAppClaimOffer(
            {
              ...claimOffer,
              remoteName: invitation.senderName,
              issuer_did: invitation.senderDID,
              from_did: invitation.senderDID,
              to_did: '',
            },
            {
              remotePairwiseDID: invitation.senderDID,
            }
          ),
          {
            uid,
            senderLogoUrl: invitation.senderLogoUrl,
            remotePairwiseDID: invitation.senderDID,
            hidden: true,
          }
        )
        await this.handleOutOfBandNavigation({
          mainRoute: claimOfferRoute,
          backRedirectRoute: this.props.route.params?.backRedirectRoute,
          uid: credentialOffer[ID],
          invitationPayload: invitation,
          attachedRequest: req,
          senderName: invitation.senderName,
        })
      } else if (req[TYPE].endsWith('request-presentation')) {
        const presentationRequest = (req: AriesPresentationRequest)
        const uid = presentationRequest[ID]

        const existingProofRequest: ProofRequestPayload = this.props
          .proofRequests[uid]

        if (
          existingProofRequest &&
          existingProofRequest.status === PROOF_REQUEST_STATUS.ACCEPTED
        ) {
          this.props.navigation.navigate(homeRoute, {
            screen: homeDrawerRoute,
            params: undefined,
          })
          // we already have accepted that proof request
          Snackbar.show({
            text: 'The proof request has already been accepted.',
            backgroundColor: colors.red,
            duration: Snackbar.LENGTH_LONG,
          })
          return
        }

        const [
          outofbandProofError,
          outofbandProofRequest,
        ] = await validateOutofbandProofRequestQrCode(presentationRequest)

        if (outofbandProofError || !outofbandProofRequest) {
          Alert.alert('Invalid invitation', outofbandProofError)
          return
        }

        this.props.proofRequestReceived(outofbandProofRequest, {
          uid,
          senderLogoUrl: invitation.senderLogoUrl,
          remotePairwiseDID: invitation.senderDID,
          hidden: true,
        })

        await this.handleOutOfBandNavigation({
          mainRoute: proofRequestRoute,
          backRedirectRoute: this.props.route.params?.backRedirectRoute,
          uid: uid,
          invitationPayload: invitation,
          attachedRequest: req,
          senderName: invitation.senderName,
        })
      }
    } else {
      // Implement this case
      this.props.navigation.goBack(null)
      Alert.alert(
        'Invalid Out-of-Band Invitation',
        'QR code contains invalid formatted Aries Out-of-Band invitation.'
      )
    }
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
}

const mapStateToProps = (state: Store) => ({
  currentScreen: state.route.currentScreen,
  allDid: getAllDid(state.connections),
  allPublicDid: getAllPublicDid(state.connections),
  historyData: state.history && state.history.data,
  claimOffers: getClaimOffers(state),
  proofRequests: getProofRequests(state),
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      invitationReceived,
      changeEnvironmentUrl,
      openIdConnectUpdateStatus,
      claimOfferReceived,
      proofRequestReceived,
    },
    dispatch
  )

export const qrCodeScannerScreen = {
  routeName: qrCodeScannerTabRoute,
  screen: withStatusBar({ color: color.bg.sixth.color })(
    connect(mapStateToProps, mapDispatchToProps)(QRCodeScannerScreen)
  ),
}
