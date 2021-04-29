import type { HandleInvitationsAction, InvitationPayload } from './type-invitation'
import { CONNECTION_INVITE_TYPES, HANDLE_INVITATION } from './type-invitation'
import { ensureVcxInitSuccess } from '../store/route-store'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import {
  convertClaimOfferPushPayloadToAppClaimOffer,
  navigateToRoutePN,
} from '../push-notification/push-notification-store'
import {
  claimOfferRoute,
  homeDrawerRoute,
  homeRoute,
  invitationRoute,
  proofProposalRoute,
  proofRequestRoute,
  pushNotificationPermissionRoute,
  qrCodeScannerTabRoute,
} from '../common'
import { deepLinkProcessed } from '../deep-link/deep-link-store'
import { TYPE } from '../common/type-common'
import { convertAriesCredentialOfferToCxsClaimOffer } from '../bridge/react-native-cxs/vcx-transformers'
import { getAllDid, getAllPublicDid, getClaimOffers, getProofRequests, getVerifiers } from '../store/store-selector'
import type { ClaimOfferPayload } from '../claim-offer/type-claim-offer'
import { CLAIM_OFFER_STATUS } from '../claim-offer/type-claim-offer'
import { claimOfferReceived } from '../claim-offer/claim-offer-store'
import type { ProofRequestPayload } from '../proof-request/type-proof-request'
import { PROOF_REQUEST_STATUS } from '../proof-request/type-proof-request'
import {
  presentationProposalSchema,
  validateOutofbandProofRequestQrCode,
} from '../proof-request/proof-request-qr-code-reader'
import { proofRequestReceived } from '../proof-request/proof-request-store'
import { schemaValidator } from '../services/schema-validator'
import type { VerifierData } from '../verifier/type-verifier'
import { proofProposalReceived } from '../verifier/verifier-store'
import type { OutOfBandNavigation } from '../qr-code/type-qr-code'
import { getPushNotificationAuthorizationStatus } from '../push-notification/components/push-notification-permission-screen'
import { Platform } from 'react-native'
import { usePushNotifications } from '../external-imports'
import {
  getExistingConnection,
  shouldSendRedirectMessage,
  getAttachedRequestId,
} from './invitation-helpers'
import { invitationReceived } from './invitation-store'
import { showSnackError } from '../store/config-store'
import { CONNECTION_ALREADY_EXIST } from '../connection-history/type-connection-history'
import { sendConnectionRedirect, sendConnectionReuse } from '../store/connections-store'
import Snackbar from 'react-native-snackbar'

function* checkExistingConnectionAndRedirect(invitation: InvitationPayload): Generator<*, *, *> {
  const { publicDID, DID } = invitation.senderDetail

  const allPublicDid = yield select(getAllPublicDid)
  const allDid = yield select(getAllDid)

  const existingConnection = getExistingConnection(
    allPublicDid,
    allDid,
    publicDID,
    DID,
  )

  if (existingConnection) {
    yield put(navigateToRoutePN(homeRoute, {
      screen: homeDrawerRoute,
      params: undefined,
    }))

    Snackbar.show({
      text: CONNECTION_ALREADY_EXIST,
      duration: Snackbar.LENGTH_LONG,
    })

    const sendRedirectMessage = shouldSendRedirectMessage(
      existingConnection,
      invitation,
      publicDID,
      DID
    )

    if (
      (invitation.type === CONNECTION_INVITE_TYPES.ARIES_V1_QR || invitation.type === undefined) &&
      sendRedirectMessage
    ) {
      yield put(sendConnectionRedirect(invitation, {
        senderDID: existingConnection.senderDID,
        identifier: existingConnection.identifier,
      }))
    } else if (
      invitation.type === CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND && sendRedirectMessage
    ) {
      yield put(sendConnectionReuse(invitation.originalObject, {
        senderDID: existingConnection.senderDID
      }))
    }
    return
  }

  yield put(invitationReceived({ payload: invitation }))

  const isAuthorized = yield call(getPushNotificationAuthorizationStatus)

  if (Platform.OS === 'ios' && usePushNotifications && !isAuthorized) {
    yield put(navigateToRoutePN(pushNotificationPermissionRoute, {
      senderDID: invitation.senderDID,
      navigatedFrom: homeRoute,
    }))
  } else {
    yield put(navigateToRoutePN(invitationRoute, {
      senderDID: invitation.senderDID,
      backRedirectRoute: homeRoute,
    }))
  }
}

function* handleOutOfBandNavigation({
                                      mainRoute,
                                      backRedirectRoute,
                                      uid,
                                      invitationPayload,
                                      senderName,
                                    }: OutOfBandNavigation): Generator<*, *, *> {
  const isAuthorized = yield call(getPushNotificationAuthorizationStatus)

  if (Platform.OS === 'ios' && usePushNotifications && !isAuthorized) {
    yield put(navigateToRoutePN(pushNotificationPermissionRoute, {
      senderDID: invitationPayload.senderDID,
      navigatedFrom: qrCodeScannerTabRoute,
      intendedRoute: mainRoute,
      intendedPayload: {
        backRedirectRoute,
        uid,
        invitationPayload,
        senderName,
        hidden: true
      },
    }))
  } else {
    yield put(navigateToRoutePN(mainRoute, {
      backRedirectRoute,
      uid,
      invitationPayload,
      senderName,
      hidden: true
    }))
  }
}

function* onAriesOutOfBandInviteRead(invitation: InvitationPayload): Generator<*, *, *> {
  const invite = invitation.originalObject
  if (!invitation) {
    yield put(navigateToRoutePN(homeRoute, {}))
    yield call(showSnackError, 'QR code contains invalid formatted Aries Out-of-Band invitation.')
    return
  }

  if (
    !invite.handshake_protocols?.length &&
    !invite['request~attach']?.length
  ) {
    // Invite: No `handshake_protocols` and `request~attach`
    // Action: show alert about invalid formatted invitation
    yield put(navigateToRoutePN(homeRoute, {}))
    yield call(showSnackError, 'QR code contains invalid formatted Aries Out-of-Band invitation.')
  } else if (
    invite.handshake_protocols?.length &&
    !invite['request~attach']?.length
  ) {
    // Invite: Has `handshake_protocols` but no `request~attach`
    // Action: Create a new connection or reuse existing.
    // UI: Show Connection invite
    yield call(checkExistingConnectionAndRedirect, invitation)
  } else if (invite['request~attach']?.length) {
    // Invite: Has `handshake_protocols` and has `request~attach`
    // Action:
    //  1. Create a new connection or reuse existing
    //  2. Rut protocol connected to attached action
    // UI: Show view related to attached action


    if (!invitation.attachedRequest || !invitation.attachedRequest[TYPE]) {
      yield put(navigateToRoutePN(homeRoute, {}))
      yield call(showSnackError, 'QR code contains invalid formatted Aries Out-of-Band invitation.')
      return
    }

    const uid = getAttachedRequestId(invitation.attachedRequest)
    const type_ = invitation.attachedRequest[TYPE]

    if (type_.endsWith('offer-credential')) {
      const claimOffer = convertAriesCredentialOfferToCxsClaimOffer(
        invitation.attachedRequest,
      )

      const claimOffers = yield select(getClaimOffers)
      const existingCredential: ClaimOfferPayload = claimOffers[uid]

      if (
        existingCredential &&
        existingCredential.status === CLAIM_OFFER_STATUS.ACCEPTED
      ) {
        yield put(navigateToRoutePN(homeRoute, {
          screen: homeDrawerRoute,
          params: undefined,
        }))

        // we already have accepted that offer
        yield call(showSnackError, 'The credential offer has already been accepted.')
        return
      }

      yield put(claimOfferReceived(
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
          },
        ),
        {
          uid,
          senderLogoUrl: invitation.senderLogoUrl,
          remotePairwiseDID: invitation.senderDID,
          hidden: true,
        },
      ))
      yield call(handleOutOfBandNavigation, {
        mainRoute: claimOfferRoute,
        backRedirectRoute: homeRoute,
        uid,
        invitationPayload: invitation,
        senderName: invitation.senderName,
      })
    } else if (type_.endsWith('request-presentation')) {
      const proofRequests = yield select(getProofRequests)
      const existingProofRequest: ProofRequestPayload = proofRequests[uid]

      if (
        existingProofRequest &&
        existingProofRequest.status === PROOF_REQUEST_STATUS.ACCEPTED
      ) {
        yield put(navigateToRoutePN(homeRoute, {
          screen: homeDrawerRoute,
          params: undefined,
        }))
        // we already have accepted that proof request
        yield call(showSnackError, 'The proof request has already been accepted.')
        return
      }

      const [
        outofbandProofError,
        outofbandProofRequest,
      ] = yield call(validateOutofbandProofRequestQrCode, invitation.attachedRequest)

      if (outofbandProofError || !outofbandProofRequest) {
        yield call(showSnackError, 'QR code contains invalid formatted Aries Out-of-Band invitation.')
        return
      }

      yield put(proofRequestReceived(outofbandProofRequest, {
        uid,
        senderLogoUrl: invitation.senderLogoUrl,
        remotePairwiseDID: invitation.senderDID,
        hidden: true,
      }))
      yield call(handleOutOfBandNavigation, {
        mainRoute: proofRequestRoute,
        backRedirectRoute: homeRoute,
        uid: uid,
        invitationPayload: invitation,
        senderName: invitation.senderName,
      })
    } else if (type_.endsWith('propose-presentation')) {
      if (!schemaValidator.validate(presentationProposalSchema, invitation.attachedRequest)) {
        yield call(showSnackError, 'Invalid formatted Presentation Proposal.')
        return
      }

      const verifiers = yield select(getVerifiers)
      const existingVerifier: VerifierData = verifiers[uid]

      if (existingVerifier) {
        yield put(navigateToRoutePN(homeRoute, {
          screen: homeDrawerRoute,
          params: undefined,
        }))
        // we already have accepted that presentation proposal
        yield call(showSnackError, 'The presentation proposal has already been accepted.')
        return
      }

      yield put(proofProposalReceived(
        invitation.attachedRequest,
        {
          uid,
          senderLogoUrl: invitation.senderLogoUrl,
          senderName: invitation.senderName,
          remotePairwiseDID: invitation.senderDID,
          hidden: true,
        },
      ))

      yield call(handleOutOfBandNavigation, {
        mainRoute: proofProposalRoute,
        backRedirectRoute: homeRoute,
        uid: uid,
        invitationPayload: invitation,
        senderName: invitation.senderName,
      })
    }
  } else {
    yield put(navigateToRoutePN(homeRoute, {
      screen: homeDrawerRoute,
      params: undefined,
    }))
    yield call(showSnackError, 'QR code contains invalid formatted Aries Out-of-Band invitation.')
  }
}

function* handleInvitationSaga(
  action: HandleInvitationsAction,
): Generator<*, *, *> {
  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    return
  }
  const invitation = action.invitation
  if (!invitation) {
    yield put(navigateToRoutePN(homeRoute, {
      screen: homeDrawerRoute,
      params: undefined,
    }))
  }

  // aries connection
  if (invitation.type === CONNECTION_INVITE_TYPES.ARIES_V1_QR) {
    yield call(checkExistingConnectionAndRedirect, invitation)
  } else if (invitation.type === CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND) {
    // aries out-of-band connection
    yield call(onAriesOutOfBandInviteRead, invitation)
  } else {
    // proprietary connection
    yield call(checkExistingConnectionAndRedirect, invitation)
  }

  if (action.token) {
    yield put(deepLinkProcessed(action.token))
  }
}

export function* watchHandleInvitation(): any {
  yield takeLatest(HANDLE_INVITATION, handleInvitationSaga)
}
