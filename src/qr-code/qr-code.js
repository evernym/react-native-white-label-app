// @flow
import React, { Component } from 'react'
import { Alert, AppState, Platform } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { convertAriesCredentialOfferToCxsClaimOffer } from '../bridge/react-native-cxs/vcx-transformers'
import { convertClaimOfferPushPayloadToAppClaimOffer } from '../push-notification/push-notification-store'

import { Container, QRScanner } from '../components'
import { color, colors } from '../common/styles/constant'
import { invitationReceived } from '../invitation/invitation-store'
import {
  QR_CODE_SENDER_DID,
  QR_CODE_SENDER_VERIFICATION_KEY,
  QR_CODE_LOGO_URL,
  QR_CODE_REQUEST_ID,
  QR_CODE_SENDER_NAME,
  QR_CODE_TARGET_NAME,
  QR_CODE_SENDER_DETAIL,
  QR_CODE_SENDER_KEY_DELEGATION,
  QR_CODE_DELEGATION_DID,
  QR_CODE_DELEGATION_KEY,
  QR_CODE_DELEGATION_SIGNATURE,
  QR_CODE_SENDER_AGENCY,
  QR_CODE_SENDER_AGENCY_DID,
  QR_CODE_SENDER_AGENCY_KEY,
  QR_CODE_SENDER_AGENCY_ENDPOINT,
  QR_CODE_SENDER_PUBLIC_DID,
  QR_CODE_VERSION,
} from '../api/api-constants'
import {
  claimOfferRoute,
  invitationRoute,
  qrCodeScannerTabRoute,
  homeRoute,
  homeDrawerRoute,
  openIdConnectRoute,
  proofRequestRoute,
  pushNotificationPermissionRoute,
} from '../common/'

import type {
  QrCodeShortInvite,
  OIDCAuthenticationRequest,
} from '../components/qr-scanner/type-qr-scanner'
import type { Store } from '../store/type-store'
import type {
  InvitationPayload,
  AriesConnectionInvite,
  AriesOutOfBandInvite,
} from '../invitation/type-invitation'
import type {
  QRCodeScannerScreenState,
  QRCodeScannerScreenProps,
  OutOfBandNavigation,
} from './type-qr-code'
import type {
  AriesPresentationRequest,
  ProofRequestPayload,
  QrCodeEphemeralProofRequest,
} from '../proof-request/type-proof-request'
import type {
  ClaimOfferPayload,
  CredentialOffer,
} from '../claim-offer/type-claim-offer'
import { changeEnvironmentUrl } from '../store/config-store'
import {
  getAllDid,
  getAllPublicDid,
  getClaimOffers,
  getProofRequests,
} from '../store/store-selector'
import { withStatusBar } from '../components/status-bar/status-bar'
import {
  openIdConnectUpdateStatus,
  OPEN_ID_CONNECT_STATE,
} from '../open-id-connect/open-id-connect-actions'
import { ID, TYPE } from '../common/type-common'
import { CLAIM_OFFER_STATUS } from '../claim-offer/type-claim-offer'
import { proofRequestReceived } from '../proof-request/proof-request-store'
import isUrl from 'validator/lib/isURL'
import { convertAriesOutOfBandPayloadToInvitation } from '../sms-pending-invitation/sms-pending-invitation-store'
import { getAttachedRequest } from '../invitation/invitation-store'
import { claimOfferReceived } from '../claim-offer/claim-offer-store'
import { validateOutofbandProofRequestQrCode } from '../proof-request/proof-request-qr-code-reader'
import { CONNECTION_INVITE_TYPES } from '../invitation/type-invitation'
import { getPushNotificationAuthorizationStatus } from '../push-notification/components/push-notification-permission-screen'
import Snackbar from 'react-native-snackbar'
import { PROOF_REQUEST_STATUS } from '../proof-request/type-proof-request'

export function convertQrCodeToInvitation(qrCode: QrCodeShortInvite) {
  const qrSenderDetail = qrCode[QR_CODE_SENDER_DETAIL]
  const qrSenderAgency = qrCode[QR_CODE_SENDER_AGENCY]
  const senderDetail = {
    name: qrSenderDetail[QR_CODE_SENDER_NAME],
    agentKeyDlgProof: {
      agentDID:
        qrSenderDetail[QR_CODE_SENDER_KEY_DELEGATION][QR_CODE_DELEGATION_DID],
      agentDelegatedKey:
        qrSenderDetail[QR_CODE_SENDER_KEY_DELEGATION][QR_CODE_DELEGATION_KEY],
      signature:
        qrSenderDetail[QR_CODE_SENDER_KEY_DELEGATION][
          QR_CODE_DELEGATION_SIGNATURE
        ],
    },
    DID: qrSenderDetail[QR_CODE_SENDER_DID],
    logoUrl: qrSenderDetail[QR_CODE_LOGO_URL],
    verKey: qrSenderDetail[QR_CODE_SENDER_VERIFICATION_KEY],
    publicDID: qrSenderDetail[QR_CODE_SENDER_PUBLIC_DID],
  }

  const senderAgencyDetail = {
    DID: qrSenderAgency[QR_CODE_SENDER_AGENCY_DID],
    verKey: qrSenderAgency[QR_CODE_SENDER_AGENCY_KEY],
    endpoint: qrSenderAgency[QR_CODE_SENDER_AGENCY_ENDPOINT],
  }

  return {
    senderEndpoint: senderAgencyDetail.endpoint,
    requestId: qrCode[QR_CODE_REQUEST_ID],
    senderAgentKeyDelegationProof: senderDetail.agentKeyDlgProof,
    senderName: senderDetail.name,
    senderDID: senderDetail.DID,
    senderLogoUrl: senderDetail.logoUrl,
    senderVerificationKey: senderDetail.verKey,
    targetName: qrCode[QR_CODE_TARGET_NAME],
    senderDetail,
    senderAgencyDetail,
    version: qrCode[QR_CODE_VERSION],
  }
}

export class QRCodeScannerScreen extends Component<
  QRCodeScannerScreenProps,
  QRCodeScannerScreenState
> {
  state = {
    appState: AppState.currentState,
    isCameraEnabled: true,
  }

  permissionCheckIntervalId: ?IntervalID = undefined
  checkPermission = false

  onRead = (qrCode: QrCodeShortInvite) => {
    if (this.props.currentScreen === qrCodeScannerTabRoute) {
      const invitation = {
        payload: convertQrCodeToInvitation(qrCode),
      }
      this.checkExistingConnectionAndRedirect(invitation)
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

  onInvitationUrl = (payload: InvitationPayload) => {
    if (this.props.currentScreen === qrCodeScannerTabRoute) {
      this.checkExistingConnectionAndRedirect({ payload })
    }
  }

  checkExistingConnectionAndRedirect = async (invitation: {
    payload: InvitationPayload,
  }) => {
    const { navigation } = this.props
    // check if connection already exists
    // possible cases:
    // 1. we scanned the same QR containing invitation without a public DID -
    // check senderDID over all stored connections
    // 2. we scanned a different QR containing invitation with public DID -
    // check publicDID iver all stored connections with set publicDID
    //
    // if connection exist, then redirect to the home view
    // and show Snack bar stating that connection already exist
    // otherwise redirect to invitation screen
    const { publicDID, DID } = invitation.payload.senderDetail

    const existingConnection =
      (publicDID ? this.props.getAllPublicDid[publicDID] : undefined) ||
      this.props.getAllDid[DID]

    if (existingConnection) {
      const {
        senderDID,
        senderName,
        identifier,
        logoUrl: image,
      } = existingConnection

      // for Out-of-Band invitation we should send reuse message even if we scanned the same invitation
      // else send redirect only if we scanned invitation we same publicDID but different senderDID
      const sendRedirectMessage =
        existingConnection.isCompleted &&
        invitation.payload.type === CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND
          ? true
          : publicDID
          ? existingConnection.publicDID === publicDID &&
            existingConnection.senderDID !== DID
          : false

      const params = {
        senderDID,
        senderName,
        image,
        identifier,
        backRedirectRoute: homeRoute,
        showExistingConnectionSnack: true,
        qrCodeInvitationPayload: invitation.payload,
        // do not send redirect message if we scanned the same invitation twice
        sendRedirectMessage: sendRedirectMessage,
      }
      navigation.navigate(homeRoute, {
        screen: homeDrawerRoute,
        params: params,
      })

      return
    }

    this.props.invitationReceived(invitation)
    // Apparently navigation.push can be null, and hence we are protecting
    // against null fn call, so if push is not available, navigate is
    // guaranteed to be available
    const navigationFn = navigation.push || navigation.navigate
    if (Platform.OS === 'ios') {
      const isAuthorized = await getPushNotificationAuthorizationStatus()

      if (isAuthorized) {
        navigationFn(invitationRoute, {
          senderDID: invitation.payload.senderDID,
        })
      } else {
        navigationFn(pushNotificationPermissionRoute, {
          senderDID: invitation.payload.senderDID,
          navigatedFrom: qrCodeScannerTabRoute,
        })
      }
    } else
      navigationFn(invitationRoute, {
        senderDID: invitation.payload.senderDID,
      })
  }

  onClose = () => {
    this.props.navigation.goBack(null)
  }

  componentDidMount() {
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
      <Container
        dark
        collapsable={true} >
        {this.state.isCameraEnabled && this.props.navigation.isFocused() ? (
          <QRScanner
            onRead={this.onRead}
            onClose={this.onClose}
            onInvitationUrl={this.onInvitationUrl}
            onOIDCAuthenticationRequest={this.onOIDCAuthenticationRequest}
            onAriesConnectionInviteRead={this.onAriesConnectionInviteRead}
            onAriesOutOfBandInviteRead={this.onAriesOutOfBandInviteRead}
            onEphemeralProofRequest={this.onEphemeralProofRequest}
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

  onAriesConnectionInviteRead = (
    ariesConnectionInvite: AriesConnectionInvite
  ) => {
    const { payload, original } = ariesConnectionInvite

    const senderAgentKeyDelegationProof = {
      agentDID: payload.recipientKeys[0],
      agentDelegatedKey: payload.recipientKeys[0],
      signature: '<no-signature-supplied>',
    }

    const invitation = {
      senderEndpoint: payload.serviceEndpoint,
      requestId: payload[ID],
      senderAgentKeyDelegationProof,
      senderName: payload.label || 'Unknown',
      senderDID: payload.recipientKeys[0],
      senderLogoUrl:
        payload.profileUrl && isUrl(payload.profileUrl)
          ? payload.profileUrl
          : null,
      senderVerificationKey: payload.recipientKeys[0],
      targetName: payload.label || 'Unknown',
      senderDetail: {
        name: payload.label || 'Unknown',
        agentKeyDlgProof: senderAgentKeyDelegationProof,
        DID: payload.recipientKeys[0],
        logoUrl:
          payload.profileUrl && isUrl(payload.profileUrl)
            ? payload.profileUrl
            : null,
        verKey: payload.recipientKeys[0],
        publicDID: payload.recipientKeys[0],
      },
      senderAgencyDetail: {
        DID: payload.recipientKeys[0],
        verKey: payload.recipientKeys[1],
        endpoint: payload.serviceEndpoint,
      },
      version: '1.0',
      type: CONNECTION_INVITE_TYPES.ARIES_V1_QR,
      original,
    }

    this.checkExistingConnectionAndRedirect({ payload: invitation })
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

    if (Platform.OS === 'ios') {
      if (isAuthorized) {
        navigationFn(mainRoute, {
          backRedirectRoute,
          uid,
          invitationPayload,
          attachedRequest,
          senderName,
        })
      } else {
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
      }
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
    const invitation = convertAriesOutOfBandPayloadToInvitation(invite)
    if (!invitation) {
      this.props.navigation.goBack(null)
      Alert.alert(
        'Invalid invitation',
        'QR code contains invalid formatted invitation.'
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
        'Invalid invitation',
        'QR code contains invalid formatted invitation.'
      )
      return
    } else if (
      invite.handshake_protocols?.length &&
      !invite['request~attach']?.length
    ) {
      // Invite: Has `handshake_protocols` but no `request~attach`
      // Action: Create a new connection or reuse existing.
      // UI: Show Connection invite
      this.checkExistingConnectionAndRedirect({ payload: invitation })
    } else if (
      // invite.handshake_protocols?.length &&
      invite['request~attach']?.length
    ) {
      // Invite: Has `handshake_protocols` and has `request~attach`
      // Action:
      //  1. Create a new connection or reuse existing
      //  2. Rut protocol connected to attached action
      // UI: Show view related to attached action

      const req = await getAttachedRequest(invite)
      if (!req || !req[TYPE]) {
        this.props.navigation.goBack(null)
        Alert.alert(
          'Unsupported request',
          'QR code contains unsupported message.'
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
          // we already have accepted that offer
          Snackbar.show({
            text: "The credential offer has already been accepted.",
            backgroundColor: colors.red,
            duration: Snackbar.LENGTH_LONG,
          })

          this.props.navigation.navigate(homeRoute, {
            screen: homeDrawerRoute,
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
        this.handleOutOfBandNavigation({
          mainRoute: claimOfferRoute,
          backRedirectRoute: homeRoute,
          uid: credentialOffer[ID],
          invitationPayload: invitation,
          attachedRequest: req,
          senderName: invitation.senderName,
        })
      } else if (req[TYPE].endsWith('request-presentation')) {
        const presentationRequest = (req: AriesPresentationRequest)
        const uid = presentationRequest[ID]

        const existingProofRequest: ProofRequestPayload = this.props.proofRequests[
          uid
          ]

        if (
          existingProofRequest &&
          existingProofRequest.status === PROOF_REQUEST_STATUS.ACCEPTED
        ) {
          // we already have accepted that proof request
          Snackbar.show({
            text: "The proof request has already been accepted.",
            backgroundColor: colors.red,
            duration: Snackbar.LENGTH_LONG,
          })

          this.props.navigation.navigate(homeRoute, {
            screen: homeDrawerRoute,
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

        this.handleOutOfBandNavigation({
          mainRoute: proofRequestRoute,
          backRedirectRoute: homeRoute,
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
        'Unsupported request',
        'QR code contains unsupported message.'
      )
      return
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
    })
    this.props.navigation.navigate(proofRequestRoute, {
      uid,
    })
  }
}

const mapStateToProps = (state: Store) => ({
  currentScreen: state.route.currentScreen,
  getAllDid: getAllDid(state.connections),
  getAllPublicDid: getAllPublicDid(state.connections),
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
