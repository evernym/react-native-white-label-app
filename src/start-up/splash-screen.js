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
} from '../common/route-constants'
import { Container, Loader } from '../components'
import { TOKEN_EXPIRED_CODE } from '../api/api-constants'
import { addPendingRedirection } from '../lock/lock-store'
import {
  getSmsPendingInvitation,
  safeToDownloadSmsInvitation,
  convertSmsPayloadToInvitation,
  convertAriesPayloadToInvitation,
  convertAriesOutOfBandPayloadToInvitation,
} from '../sms-pending-invitation/sms-pending-invitation-store'
import type { SplashScreenProps } from './type-splash-screen'
import type { Store } from '../store/type-store'
import { SMSPendingInvitationStatus } from '../sms-pending-invitation/type-sms-pending-invitation'
import type {
  AriesConnectionInvitePayload,
  AriesOutOfBandInvite,
  InvitationPayload,
} from '../invitation/type-invitation'
import type {
  SMSPendingInvitationPayload,
  SMSPendingInvitations,
} from '../sms-pending-invitation/type-sms-pending-invitation'
import { deepLinkProcessed } from '../deep-link/deep-link-store'
import { DEEP_LINK_STATUS } from '../deep-link/type-deep-link'
import { getAllDid, getAllPublicDid } from '../store/store-selector'
import {
  isValidAriesOutOfBandInviteData,
  isValidAriesV1InviteData,
} from '../invitation/invitation'
import { CONNECTION_INVITE_TYPES } from '../invitation/type-invitation'
import { getPushNotificationAuthorizationStatus } from '../push-notification/components/push-notification-permission-screen'
import { TOKEN_EXPIRED, TOKEN_UNRESOLVED } from '../expired-token/type-expired-token'


const isReceived = ({ payload, status }) => {
  return (
    status === SMSPendingInvitationStatus.RECEIVED &&
    payload &&
    ((payload.senderDetail && payload.senderDetail.DID) ||
      isValidAriesV1InviteData(payload, JSON.stringify(payload)) ||
      isValidAriesOutOfBandInviteData(payload))
  )
}

type SplashScreenState = {
  isAuthorized: boolean,
}

export class SplashScreenView extends PureComponent<
  SplashScreenProps,
  SplashScreenState
> {
  state = {
    isAuthorized: false,
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

  handleSmsPendingInvitations = (prevProps: SplashScreenProps) => {
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

      const pendingRedirectionList = unseenSmsPendingInvitations.map(
        ({
           payload,
           invitationToken,
         }: {
          +payload: ?(
            | SMSPendingInvitationPayload
            | AriesConnectionInvitePayload
            | AriesOutOfBandInvite
            ),
          invitationToken: string,
        }) => {
          if (payload) {
            const ariesV1Invite = isValidAriesV1InviteData(payload, '')
            const ariesV1OutOfBandInvite = isValidAriesOutOfBandInviteData(
              payload
            )

            let qrCodeInvitationPayload: InvitationPayload | null

            if (ariesV1Invite) {
              qrCodeInvitationPayload = convertAriesPayloadToInvitation(
                ariesV1Invite
              )
            } else if (ariesV1OutOfBandInvite) {
              qrCodeInvitationPayload = convertAriesOutOfBandPayloadToInvitation(
                ariesV1OutOfBandInvite
              )
            } else {
              qrCodeInvitationPayload = convertSmsPayloadToInvitation(
                ((payload: any): SMSPendingInvitationPayload)
              )
            }

            if (!qrCodeInvitationPayload) {
              Alert.alert(
                'Unsupported or invalid invitation format',
                'Failed to establish connection.'
              )
              return
            }

            this.props.deepLinkProcessed(invitationToken)

            const publicDID = qrCodeInvitationPayload.senderDetail.publicDID
            const senderDID = qrCodeInvitationPayload.senderDID

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
            const existingConnection =
              (publicDID ? this.props.getAllPublicDid[publicDID] : undefined) ||
              this.props.getAllDid[senderDID]

            const navigationFn =
              this.props.navigation.push || this.props.navigation.navigate
            let routeName = invitationRoute
            let params = {
              senderDID,
              token: invitationToken,
              notificationOpenOptions: null,
            }
            if (existingConnection && publicDID) {
              routeName = homeRoute // --> This needs to be homeRoute, because that is the name of the DrawerNavigator
              // for Out-of-Band invitation we should send reuse message even if we scanned the same invitation
              // else send redirect only if we scanned invitation we same publicDID but different senderDID
              const sendRedirectMessage =
                existingConnection.isCompleted &&
                qrCodeInvitationPayload.type ===
                CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND
                  ? true
                  : publicDID
                  ? existingConnection.publicDID === publicDID &&
                  existingConnection.senderDID !== senderDID
                  : false

              const {
                senderName,
                identifier,
                logoUrl: image,
                senderDID: existingConnectionSenderDID,
              } = existingConnection
              params = {
                // if we already have a connection, then we need to use
                // existing connection senderDID and not the senderDID
                // that comes from payload, because only in new invitation
                // only publicDID would be common, and senderDID could be different
                // so if we take senderDID from new invitation, then we can't
                // redirect user to connection history screen
                senderDID: existingConnectionSenderDID,
                senderName,
                image,
                identifier,
                backRedirectRoute: homeRoute,
                showExistingConnectionSnack: true,
                qrCodeInvitationPayload,
                // do not send redirect message if we scanned the same invitation twice
                sendRedirectMessage: sendRedirectMessage,
                notificationOpenOptions: null,
              }
            }

            if (this.props.lock.isAppLocked === false) {
              if (routeName === homeRoute) {
                this.props.navigation.navigate(homeRoute, {
                  screen: homeDrawerRoute,
                  params: params,
                })
              } else if (Platform.OS === 'ios') {
                if (this.state.isAuthorized) {
                  this.props.navigation.push &&
                  this.props.navigation.push(routeName, params)
                } else {
                  navigationFn(pushNotificationPermissionRoute, {
                    senderDID,
                  })
                }
              } else {
                this.props.navigation.push &&
                this.props.navigation.push(routeName, params)
              }
            }

            if (routeName === homeRoute) {
              return {
                routeName,
                params: {
                  screen: homeDrawerRoute,
                  params: params,
                },
              }
            } else if (Platform.OS === 'ios' && !this.state.isAuthorized) {
              return {
                routeName: pushNotificationPermissionRoute,
                params,
              }
            } else {
              return {
                routeName,
                params,
              }
            }
          }
        }
      )

      pendingRedirectionList.length !== 0 &&
      this.props.lock.isAppLocked === true &&
      this.props.addPendingRedirection(pendingRedirectionList)

      // * all error token links should be processed
    }
  }

  getAuthorizationStatus = async () => {
    const authorizationStatus = await messaging().hasPermission()

    return !!authorizationStatus
  }

  componentDidUpdate(prevProps: SplashScreenProps) {
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
    this.handleSmsPendingInvitations(prevProps)
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
  getAllDid: getAllDid(connections),
  getAllPublicDid: getAllPublicDid(connections),
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      getSmsPendingInvitation,
      addPendingRedirection,
      safeToDownloadSmsInvitation,
      deepLinkProcessed,
    },
    dispatch
  )

export const splashScreenScreen = {
  routeName: splashScreenRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(SplashScreenView),
}
