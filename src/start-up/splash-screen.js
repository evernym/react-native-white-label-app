// @flow
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Alert, Platform } from 'react-native'
import { bindActionCreators } from 'redux'
import messaging from '@react-native-firebase/messaging'
import SplashScreen from 'react-native-splash-screen'
import {
  homeRoute,
  splashScreenRoute,
  expiredTokenRoute,
  lockSelectionRoute,
  lockEnterPinRoute,
  lockEnterFingerprintRoute,
  invitationRoute,
  waitForInvitationRoute,
  homeDrawerRoute,
  startUpRoute,
  pushNotificationPermissionRoute,
  claimOfferRoute,
  proofRequestRoute,
} from '../common/route-constants'
import { Container, Loader } from '../components'
import { TOKEN_EXPIRED_CODE } from '../api/api-constants'
import { addPendingRedirection } from '../lock/lock-store'
import {
  getSmsPendingInvitation,
  safeToDownloadSmsInvitation,
} from '../sms-pending-invitation/sms-pending-invitation-store'
import type {RedirectionData, SplashScreenProps} from './type-splash-screen'
import type { Store } from '../store/type-store'
import { SMSPendingInvitationStatus } from '../sms-pending-invitation/type-sms-pending-invitation'
import type {
  AriesOutOfBandInvite,
  InvitationPayload,
} from '../invitation/type-invitation'
import type {
  SMSPendingInvitations,
} from '../sms-pending-invitation/type-sms-pending-invitation'
import { deepLinkProcessed } from '../deep-link/deep-link-store'
import { DEEP_LINK_STATUS } from '../deep-link/type-deep-link'
import { getAllDid, getAllPublicDid } from '../store/store-selector'
import { getPushNotificationAuthorizationStatus } from '../push-notification/components/push-notification-permission-screen'
import { TOKEN_EXPIRED, TOKEN_UNRESOLVED } from '../expired-token/type-expired-token'
import {
  convertProprietaryInvitationToAppInvitation, convertShortProprietaryInvitationToAppInvitation,
  isProprietaryInvitation, isShortProprietaryInvitation
} from "../invitation/kinds/proprietary-connection-invitation";
import {
  convertAriesInvitationToAppInvitation,
  isAriesInvitation
} from "../invitation/kinds/aries-connection-invitation";
import {
  convertAriesOutOfBandInvitationToAppInvitation,
  isAriesOutOfBandInvitation
} from "../invitation/kinds/aries-out-of-band-invitation";
import {getExistingConnection, prepareParamsForExistingConnectionRedirect} from "../invitation/invitation-helpers";
import {getAttachedRequest, invitationReceived} from "../invitation/invitation-store";
import {ID, TYPE} from "../common/type-common";
import type {ClaimOfferPayload, CredentialOffer} from "../claim-offer/type-claim-offer";
import {convertAriesCredentialOfferToCxsClaimOffer} from "../bridge/react-native-cxs/vcx-transformers";
import {CLAIM_OFFER_STATUS} from "../claim-offer/type-claim-offer";
import {convertClaimOfferPushPayloadToAppClaimOffer} from "../push-notification/push-notification-store";
import type {AriesPresentationRequest, ProofRequestPayload} from "../proof-request/type-proof-request";
import {PROOF_REQUEST_STATUS} from "../proof-request/type-proof-request";
import {validateOutofbandProofRequestQrCode} from "../proof-request/proof-request-qr-code-reader";
import {claimOfferReceived} from "../claim-offer/claim-offer-store";
import {proofRequestReceived} from "../proof-request/proof-request-store";
import {usePushNotifications} from "../external-imports";

const isReceived = ({ payload, status }) => {
  return (
    status === SMSPendingInvitationStatus.RECEIVED &&
    payload &&
    ((payload.senderDetail && payload.senderDetail.DID) ||
      isAriesInvitation(payload, JSON.stringify(payload)) ||
      isAriesOutOfBandInvitation(payload))
  )
}

type SplashScreenState = {
  isAuthorized: boolean,
  handledLinks: any,
}

export class SplashScreenView extends PureComponent<
  SplashScreenProps,
  SplashScreenState
  > {
  state = {
    isAuthorized: false,
    handledLinks: [],
  }

  ifDeepLinkFoundGoToWaitForInvitationScreenNFetchInvitation = (
    prevProps: SplashScreenProps
  ) => {
    const nextDeepLinkTokens = this.props.deepLink.tokens
    if (
      this.props.deepLink.isLoading === false &&
      JSON.stringify(nextDeepLinkTokens) !==
      JSON.stringify(prevProps.deepLink.tokens)
    ) {
      Object.keys(nextDeepLinkTokens).map((smsToken) => {
        if (
          nextDeepLinkTokens[smsToken].status !== DEEP_LINK_STATUS.PROCESSED
        ) {
          this.props.getSmsPendingInvitation(smsToken)

          this.redirect(this.props, waitForInvitationRoute)
        }
      })
    }
  }

  redirect = (props: SplashScreenProps, route: string, params?: any) => {
    if (props.lock.isAppLocked === false) {
      props.navigation.navigate(route, params)
    } else {
      props.addPendingRedirection([{ routeName: route, params  }])
    }
  }

  getUnHandledSmsPendingInvitations = () => {
    const smsPendingInvitations = Object.keys(
      this.props.smsPendingInvitation
    ).map((invitationToken) => {
      return {
        ...this.props.smsPendingInvitation[invitationToken],
        invitationToken,
      }
    })
    const unHandledSmsPendingInvitations: SMSPendingInvitations = smsPendingInvitations.filter(
      ({ invitationToken }) =>
        invitationToken &&
        this.props.deepLink.tokens[invitationToken].status !==
        DEEP_LINK_STATUS.PROCESSED
    )
    return unHandledSmsPendingInvitations
  }

  handleExpiredTokens = (
    unHandledSmsPendingInvitations: SMSPendingInvitations
  ) => {
    const isAnyOneOfSmsPendingInvitationHasError: boolean = unHandledSmsPendingInvitations.some(
      ({ error }) => error
    )
    const isAnyOneOfSmsPendingInvitationWasExpired: boolean = unHandledSmsPendingInvitations.some(
      ({ error }) => error && error.code && error.code === TOKEN_EXPIRED_CODE
    )
    if (isAnyOneOfSmsPendingInvitationWasExpired) {
      this.redirect(this.props, expiredTokenRoute, {reason: TOKEN_EXPIRED})
    } else if (isAnyOneOfSmsPendingInvitationHasError) {
      // * This condition is needed to avoid un wanted redirection to home screen if unHandledSmsPendingInvitations are empty
      // * or if we are in middle of other invitation fetching process
      this.redirect(this.props, expiredTokenRoute, {reason: TOKEN_UNRESOLVED})
    }
    unHandledSmsPendingInvitations.map(({ error, invitationToken }) => {
      error ? this.props.deepLinkProcessed(invitationToken) : null
    })
  }

  handleSmsPendingInvitations = async (prevProps: SplashScreenProps) => {
    // Check if the pending sms invitations have changed, or if there is unhandled sms invitations to proceed
    if (
      JSON.stringify(prevProps.smsPendingInvitation) !==
      JSON.stringify(this.props.smsPendingInvitation) ||
      typeof this.getUnHandledSmsPendingInvitations() !== 'undefined'
    ) {
      const unHandledSmsPendingInvitations = this.getUnHandledSmsPendingInvitations()
      this.handleExpiredTokens(unHandledSmsPendingInvitations)
      const unseenSmsPendingInvitations = unHandledSmsPendingInvitations.filter(
        isReceived
      )

      const navigationFn = this.props.navigation.push || this.props.navigation.navigate

      const isAuthorized = await getPushNotificationAuthorizationStatus()
      this.setState({ isAuthorized })
      let pendingRedirectionList: any = []
      for (let { payload, invitationToken } of unseenSmsPendingInvitations) {
        const handledLinks = this.state && this.state.handledLinks ? this.state.handledLinks : []
        if (handledLinks.includes(invitationToken)) {
          continue
        }
        this.setState({ handledLinks: [...handledLinks, invitationToken] })

        if (payload) {
          let invitation: InvitationPayload | null = null
          let redirectData: RedirectionData | null = null

          const ariesV1Invite = isAriesInvitation(payload, JSON.stringify(payload))
          if (ariesV1Invite) {
            invitation = convertAriesInvitationToAppInvitation(ariesV1Invite)
            redirectData = this.checkExistingConnectionAndPrepareRedirectData(
              invitation,
              invitationToken
            )
          }

          const ariesV1OutOfBandInvite = isAriesOutOfBandInvitation(payload)
          if (ariesV1OutOfBandInvite) {
            invitation = convertAriesOutOfBandInvitationToAppInvitation(ariesV1OutOfBandInvite)
            redirectData = await this.handleAriesOutOfBandInvitationAndPrepareRedirectData(
              invitation,
              invitationToken
            )
          }

          const proprietaryInvitation = isProprietaryInvitation(payload)
          if (proprietaryInvitation) {
            invitation = convertProprietaryInvitationToAppInvitation(proprietaryInvitation)
            redirectData = this.checkExistingConnectionAndPrepareRedirectData(
              invitation,
              invitationToken
            )
          }

          const shortProprietaryInvitation = isShortProprietaryInvitation(payload)
          if (shortProprietaryInvitation) {
            invitation = convertShortProprietaryInvitationToAppInvitation(shortProprietaryInvitation)
            redirectData = this.checkExistingConnectionAndPrepareRedirectData(
              invitation,
              invitationToken
            )
          }
          if (!invitation || !redirectData) {
            Alert.alert(
              'Unsupported or invalid invitation format',
              'Cannot fetch invitation for the provided link.'
            )
            return
          }

          this.props.deepLinkProcessed(invitationToken)

          if (this.props.lock.isAppLocked === false) {
            return navigationFn(redirectData.routeName, redirectData.params)
          } else {
            pendingRedirectionList.push(redirectData)
          }
        }
      }

      pendingRedirectionList.length !== 0 &&
      this.props.lock.isAppLocked === true &&
      this.props.addPendingRedirection(pendingRedirectionList)

      // * all error token links should be processed
    }
  }

  checkExistingConnectionAndPrepareRedirectData = (
    invitation: InvitationPayload,
    invitationToken: string
  ) : RedirectionData => {
    const publicDID = invitation.senderDetail.publicDID
    const senderDID = invitation.senderDID

    let routeName = invitationRoute
    let params = { senderDID, token: invitationToken }

    // check if connection already exists
    // if connection exist, then redirect to the home view
    // and show Snack bar stating that connection already exist
    // otherwise redirect to invitation screen
    const existingConnection = getExistingConnection(
      this.props.allPublicDid,
      this.props.allDid,
      publicDID,
      senderDID
    )

    if (existingConnection) {
      routeName = homeRoute // --> This needs to be homeRoute, because that is the name of the DrawerNavigator
      params = prepareParamsForExistingConnectionRedirect(existingConnection, invitation)
    } else {
      this.props.invitationReceived({payload: invitation})
    }

    return this.prepareRedirectionParams(routeName, params)
  }

  prepareRedirectionParams = (routeName: string, params: any) => {
    let options = {
      routeName,
      params,
    }
    if (routeName === homeRoute) {
      options = {
        routeName : homeRoute,
        params: {
          screen: homeDrawerRoute,
          params: params,
        },
      }
    } else if (Platform.OS === 'ios'&& usePushNotifications && !this.state.isAuthorized) {
      options = {
        routeName: pushNotificationPermissionRoute,
        params,
      }
    }
    return options
  }

  prepareOoBRedirectionParams = (routeName: string, params: any) => {
    if (Platform.OS === 'ios'&& usePushNotifications && !this.state.isAuthorized) {
      return {
        routeName: pushNotificationPermissionRoute,
        params: {
          senderDID: params.invitationPayload.senderDID,
          navigatedFrom: homeRoute,
          intendedRoute: routeName,
          intendedPayload: params,
        }
      }
    } else {
      return {
        routeName,
        params,
      }
    }
  }

  handleAriesOutOfBandInvitationAndPrepareRedirectData = async (
    invitation: InvitationPayload,
    invitationToken: string
  ) => {
    const senderDID = invitation.senderDID
    const invite: AriesOutOfBandInvite = ((invitation.originalObject: any): AriesOutOfBandInvite)

    let options = {
      routeName: homeRoute,
      params: {
        screen: homeDrawerRoute,
        params: {
          senderDID: senderDID
        },
      }
    }

    // TODO: think of refactoring and reusing qr-code here
    if (
      !invite.handshake_protocols?.length &&
      !invite['request~attach']?.length
    ) {
      // Invite: No `handshake_protocols` and `request~attach`
      // Action: show alert about invalid formatted invitation
      Alert.alert(
        'Invalid Out-of-Band Invitation',
        'QR code contains invalid formatted Aries Out-of-Band invitation.'
      )
      return options
    } else if (
      invite.handshake_protocols?.length &&
      !invite['request~attach']?.length
    ) {
      // Invite: Has `handshake_protocols` but no `request~attach`
      // Action: Create a new connection or reuse existing.
      // UI: Show Connection invite
      return this.checkExistingConnectionAndPrepareRedirectData(
        invitation,
        invitationToken
      )
    } else if (
      invite['request~attach']?.length
    ) {
      // Invite: Has `handshake_protocols` and has `request~attach`
      // Action:
      //  1. Create a new connection or reuse existing
      //  2. Rut protocol connected to attached action
      // UI: Show view related to attached action

      const req = await getAttachedRequest(invite)
      if (!req || !req[TYPE]) {
        Alert.alert(
          'Invalid Out-of-Band Invitation',
          'QR code contains invalid formatted Aries Out-of-Band invitation.'
        )
        return options
      }

      if (req[TYPE].endsWith('offer-credential')) {
        const credentialOffer = (req: CredentialOffer)
        const claimOffer = convertAriesCredentialOfferToCxsClaimOffer(credentialOffer)
        const uid = credentialOffer[ID]

        const existingCredential: ClaimOfferPayload = this.props.claimOffers[uid]

        if (
          existingCredential &&
          existingCredential.status === CLAIM_OFFER_STATUS.ACCEPTED
        ) {
          // we already have accepted that offer
          Alert.alert(
            'Out-of-Band Invitation processed',
            'The credential offer has already been accepted.'
          )
          return options
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

        return this.prepareOoBRedirectionParams(
          claimOfferRoute,
          {
            uid: credentialOffer[ID],
            invitationPayload: invitation,
            attachedRequest: req,
            senderName: invitation.senderName,
            backRedirectRoute: homeRoute,
          })
      } else if (req[TYPE].endsWith('request-presentation')) {
        const presentationRequest = (req: AriesPresentationRequest)
        const uid = presentationRequest[ID]

        const existingProofRequest: ProofRequestPayload = this.props.proofRequests[uid]

        if (
          existingProofRequest &&
          existingProofRequest.status === PROOF_REQUEST_STATUS.ACCEPTED
        ) {
          Alert.alert(
            'Out-of-Band Invitation processed',
            'The proof request has already been accepted.'
          )
          return options
        }

        const [
          outofbandProofError,
          outofbandProofRequest,
        ] = await validateOutofbandProofRequestQrCode(presentationRequest)

        if (outofbandProofError || !outofbandProofRequest) {
          Alert.alert('Invalid invitation', outofbandProofError)
          return options
        }

        this.props.proofRequestReceived(outofbandProofRequest, {
          uid,
          senderLogoUrl: invitation.senderLogoUrl,
          remotePairwiseDID: invitation.senderDID,
          hidden: true,
        })

        return this.prepareOoBRedirectionParams(
          proofRequestRoute,
          {
            uid,
            invitationPayload: invitation,
            attachedRequest: req,
            senderName: invitation.senderName,
            backRedirectRoute: homeRoute,
          })
      }
    } else {
      // Implement this case
      Alert.alert(
        'Invalid Out-of-Band Invitation',
        'QR code contains invalid formatted Aries Out-of-Band invitation.'
      )
      return options
    }
    return null
  }

  getAuthorizationStatus = async () => {
    const authorizationStatus = await messaging().hasPermission()

    return !!authorizationStatus
  }

  componentDidUpdate = async (prevProps: SplashScreenProps) => {
    if (this.props.isInitialized !== prevProps.isInitialized) {
      // hydrated is changed, and if it is changed to true,
      // that means this is the only time we would get inside this if condition
      this.initializationCheck()
    }

    // check if deepLink is changed, then that means we either got token
    // or we got error or nothing happened with deep link
    const nextDeepLinkTokens = this.props.deepLink.tokens
    if (
      prevProps.deepLink.isLoading !== this.props.deepLink.isLoading &&
      this.props.deepLink.isLoading === false &&
      Object.keys(nextDeepLinkTokens).length === 0
    ) {
      // we did not get any token and deepLink data loading is done
      this.redirect(this.props, homeRoute)
    }
    this.ifDeepLinkFoundGoToWaitForInvitationScreenNFetchInvitation(prevProps)
    await this.handleSmsPendingInvitations(prevProps)
  }

  async componentDidMount() {
    const isAuthorized = await getPushNotificationAuthorizationStatus()
    this.setState({ isAuthorized })
    // if the SplashScreen component has been mounted for 2 seconds, hide it to render the Loading component
    global.setTimeout(() => {
      SplashScreen.hide()
    }, 2000)
    // It might be the case the hydration finishes
    // even before component is mounted,
    // so we need to check for pin code here as well

    this.initializationCheck()
  }

  initializationCheck() {
    if (this.props.isInitialized) {
      SplashScreen.hide()
      // now we can safely check value of isAlreadyInstalled
      // check for need for set up
      if (
        !this.props.lock.isLockEnabled ||
        this.props.lock.isLockEnabled === 'false'
      ) {
        this.props.navigation.navigate(startUpRoute)
        return
      }
      // enabled lock but have not accepted EULA
      if (!this.props.eula.isEulaAccept) {
        // short term this will navigate to lock selection
        // this.props.navigation.navigate(eulaRoute)
        this.props.navigation.navigate(lockSelectionRoute)
        return
      }
      // not the first time user is opening app
      const initialRoute = this.props.lock.isTouchIdEnabled
        ? lockEnterFingerprintRoute
        : lockEnterPinRoute

      this.props.navigation.navigate(initialRoute)
    }
  }

  // conditional render is to eliminate InteractionManager.allowInteractions issues
  render() {
    return this.props.isInitialized ? null : (
      <Container center>
        <Loader />
      </Container>
    )
  }
}

const mapStateToProps = ({
                           config,
                           deepLink,
                           lock,
                           smsPendingInvitation,
                           eula,
                           connections,
                           claimOffer,
                           proofRequest,
                         }: Store) => ({
  isInitialized: config.isInitialized,
  // DeepLink should be it's own component that will handle only deep link logic
  // in that way, we will be able to restrict re-render and re-run of code
  deepLink,
  // only need 3 props
  lock,
  smsPendingInvitation,
  // only need isEulaAccept
  eula,
  allDid: getAllDid(connections),
  allPublicDid: getAllPublicDid(connections),
  claimOffers: claimOffer,
  proofRequests: proofRequest,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      getSmsPendingInvitation,
      addPendingRedirection,
      safeToDownloadSmsInvitation,
      deepLinkProcessed,
      invitationReceived,
      claimOfferReceived,
      proofRequestReceived,
    },
    dispatch
  )

export const splashScreenScreen = {
  routeName: splashScreenRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(SplashScreenView),
}
