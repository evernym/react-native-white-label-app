// @flow
import type { Store } from './type-store'
import type {
  ClaimOfferPayload,
  SerializedClaimOffersPerDid,
} from '../claim-offer/type-claim-offer'
import {
  CLAIM_OFFER_STATUS,
  CLAIM_REQUEST_STATUS,
} from '../claim-offer/type-claim-offer'
import type { Connection } from './type-connection-store'
import type { ConnectionHistoryEvent } from '../connection-history/type-connection-history'
import { HISTORY_EVENT_TYPE } from '../connection-history/type-connection-history'
import { getConnections } from './connections-store'
import findKey from 'lodash.findkey'
import { addUidsWithStatusToConnections, isNewEvent } from './store-utils'
import type { ProofRequestPayload } from '../proof-request/type-proof-request'
import { PROOF_REQUEST_STATUS } from '../proof-request/type-proof-request'
import type { QuestionStoreMessage } from '../question/type-question'
import { QUESTION_STATUS } from '../question/type-question'
import { DEEP_LINK_STATUS } from '../deep-link/type-deep-link'
import { environments } from '../environment'

/*
 * Selectors related to Config Store
 * */
export const getIsGetMessagesFailed = (state: Store) =>
  state.config.isGetMessagesFailed

export const getIsVcxInitFailed = (state: Store) => state.config.isVcxInitFailed

export const getIsVcxPoolInitFailed = (state: Store) =>
  state.config.isVcxPoolInitFailed

export const getIsLoading = (state: Store) => state.config.isLoading

export const getConfig = (state: Store) => state.config

export const getAgencyUrl = (state: Store) => state.config.agencyUrl

export const getAgencyDID = (state: Store) => state.config.agencyDID

export const getAgencyVerificationKey = (state: Store) =>
  state.config.agencyVerificationKey

export const getPoolConfig = (state: Store) => state.config.poolConfig

export const getMessageDownloadStatus = (state: Store) =>
  state.config.messageDownloadStatus

export const getSnackError = (state: Store) => state.config.snackError

export const getEnvironmentName = (state: Store) =>
  findKey(
    environments,
    (environment) => environment.agencyUrl === state.config.agencyUrl
  )

export const getErrorAlertsSwitchValue = (state: Store) =>
  state.config.showErrorAlerts

export const getVcxInitializationState = (state: Store) =>
  state.config.vcxInitializationState

export const getVcxInitializationError = (state: Store) =>
  state.config.vcxInitializationError

export const getVcxPoolInitializationState = (state: Store) =>
  state.config.vcxPoolInitializationState

export const getVcxPoolInitializationError = (state: Store) =>
  state.config.vcxPoolInitializationError

export const getHydrationState = (state: Store) => state.config.isHydrated

export const getIsAlreadyInstalled = (state: Store) =>
  state.config.isAlreadyInstalled

export const getIsInitialized = (state: Store) =>
  state && state.config && state.config.isInitialized

export const getIsHydrated = (state: Store) =>
  state && state.config && state.config.isHydrated

/*
 * Selectors related to Connections Store
 * */
export const getAllConnection = (state: Store) => state.connections.data

export const getConnectionHydrationState = (state: Store) =>
  state.connections.hydrated

export const getAllOneTimeConnection = (state: Store) =>
  state.connections.oneTimeConnections

export const getAllConnections = (state: Store) => ({
  ...state.connections.data,
  ...state.connections.oneTimeConnections,
})

export const getConnectionTheme = (state: Store, logoUrl: string) =>
  state.connections.connectionThemes[logoUrl] ||
  state.connections.connectionThemes['default']

export const getConnectionsCount = (state: Store) =>
  Object.keys(state.connections.data || {}).length

export const getRemotePairwiseDidAndName = (state: Store, userDid: string) => {
  if (state.connections.data) {
    const connection = state.connections.data[userDid]
    if (connection) {
      return {
        remotePairwiseDID: connection.senderDID,
        remoteName: connection.senderName,
        ...connection,
      }
    }

    return {}
  }

  return {}
}

export const getThemes = (state: Store) => state.connections.connectionThemes

// data is returned in format {"publicDID": ConnectionData}
export const getAllPublicDid = (state: Store) => {
  const pairwiseConnections = state.connections.data || {}
  return Object.keys(pairwiseConnections).reduce((acc, senderDID) => {
    const connection = pairwiseConnections[senderDID]
    if (connection.publicDID) {
      return {
        ...acc,
        [connection.publicDID]: connection,
      }
    }

    return acc
  }, {})
}
// data is returned in format {"senderDID": ConnectionData}
export const getAllDid = (state: Store) => {
  const pairwiseConnections = state.connections.data || {}
  return Object.keys(pairwiseConnections).reduce((acc, senderDID) => {
    const connection = pairwiseConnections[senderDID]
    return {
      ...acc,
      [connection.senderDID]: connection,
    }
  }, {})
}
export const getConnectionByProp = (
  state: Store,
  property: string,
  valueToMatch: any
): Array<Connection> => {
  const connections = getAllConnection(state)
  const oneTimeConnections = getAllOneTimeConnection(state)
  const allConnections = {
    ...connections,
    ...oneTimeConnections,
  }

  if (allConnections) {
    // Had to use `any` type here even though we know `Array<Connection>`
    // will be returned, as of now Flow returns mixed type for
    // all Object.{map,keys,values} operations and we can't do
    // anything unless we specify $Exact type, which we can't define
    // in this case, because for $Exact type, we should know each
    // key in advance which is not the case here because we don't know DIDs
    // with which we will make connections
    const savedConnections: Array<any> = Object.values(allConnections)
    return savedConnections.filter(
      (connection) => connection[property] === valueToMatch
    )
  }

  return []
}
export const getConnectionExists = (state: Store, did: string) => {
  return did in getAllDid(state) || did in getAllPublicDid(state)
}

export const getNewMessagesCount = (state: Store) => {
  const receivedConnections: Connection[] = (getConnections(
    state.connections.data
  ): any)

  const customFlat = (array: Array<Array<Object>>) => [].concat(...array)

  const placeholderArray = receivedConnections.map((connection) => {
    return state.history.data?.connections?.[connection.senderDID]?.data || []
  })

  const flattenPlaceholderArray = customFlat(placeholderArray)

  let numberOfNewMessages = 0
  flattenPlaceholderArray.map((message) => {
    if (isNewEvent(message.status, message.showBadge)) {
      numberOfNewMessages++
    }
  })

  return numberOfNewMessages
}

export const getConnection = (
  state: Store,
  senderDID: string
): Array<Connection> => {
  const connections = getAllConnections(state)
  let foundConnections: Array<Connection> = []

  if (connections) {
    // Had to use `any` type here even though we know `Array<Connection>`
    // will be returned, as of now Flow returns mixed type for
    // all Object.{map,keys,values} operations and we can't do
    // anything unless we specify $Exact type, which we can't define
    // in this case, because for $Exact type, we should know each
    // key in advance which is not the case here because we don't know DIDs
    // with which we will make connections
    const savedConnections: Array<any> = Object.values(connections)
    foundConnections = savedConnections.filter(
      (connection: Connection) => connection.senderDID === senderDID
    )
  }

  if (foundConnections && foundConnections.length) {
    return foundConnections
  }

  return []
}

export const getConnectionLogoUrl = (
  state: Store,
  remotePairwiseDid: string
): string => {
  const connections = getConnection(state, remotePairwiseDid)
  return connections.length > 0 ? connections[0].logoUrl : ''
}

export const getConnectionByUserDid = (state: Store, userDID: string) => {
  const connections = getAllConnections(state) || {}
  return connections[userDID]
}

export const getAllConnectionsPairwiseDid = (state: Store) => {
  const connections = getAllConnection(state)
  const oneTimeConnections = getAllOneTimeConnection(state)
  const allConnections = {
    ...connections,
    ...oneTimeConnections,
  }

  let myPairwiseDIDs = []

  if (allConnections) {
    Object.keys(allConnections).forEach((userDID) => {
      if (allConnections[userDID] && allConnections[userDID].myPairwiseDid) {
        myPairwiseDIDs.push(userDID)
      }
    })
  }

  return myPairwiseDIDs
}

export const getUserPairwiseDid = (state: Store, senderDID: string) => {
  const connections = getConnection(state, senderDID)
  if (connections.length > 0) {
    return connections[0].identifier
  }

  return null
}

export const getIsConnectionsLocked = (state: Store) => state.connections.locked

/*
 * Selectors related to Deep Link Store
 * */
export const getDeepLinkTokens = (state: Store) => state.deepLink?.tokens

export const getUnhandledDeepLink = (state: Store) => {
  for (let token of Object.keys(state.deepLink?.tokens)) {
    const link = state.deepLink?.tokens[token]
    if (link && link.status === DEEP_LINK_STATUS.NONE) {
      return link
    }
  }
  return null
}

export const getIsDeepLinkLoading = (state: Store) => state.deepLink.isLoading

export const getDeepError = (state: Store) => state.deepLink.error

/*
 * Selectors related to Push Notification Store
 * */
export const getPushToken = (state: Store) => state.pushNotification.pushToken

export const getPendingFetchAdditionalDataKey = (state: Store) =>
  state.pushNotification.pendingFetchAdditionalDataKey

export const getIsPushNotificationsAllowed = (state: Store) =>
  state.pushNotification.isAllowed

export const getPushNotification = (state: Store) =>
  state.pushNotification.notification

export const getPushNotificationError = (state: Store) =>
  state.pushNotification.error

export const getNavigateToRoute = (state: Store) =>
  state.pushNotification.navigateRoute

/*
 * Selectors related to Route Store
 * */
export const getCurrentScreen = (state: Store) => state.route.currentScreen

export const getCurrentScreenTimestamp = (state: Store) => state.route.timeStamp

/*
 * Selectors related to User Store
 * */
export const getUserOneTimeInfo = (state: Store) => state.user.userOneTimeInfo

export const getUserAvatarName = (state: Store): ?string =>
  state.user.avatarName

export const getUserError = (state: Store) => state.user.error

export const getUserIsFetching = (state: Store) => state.user.isFetching

/*
 * Selectors related to Lock Store
 * */
export const getLockStore = (state: Store) => state.lock

export const getIsAppLocked = (state: Store) => state.lock.isAppLocked

export const getPendingRedirection = (state: Store) =>
  state.lock.pendingRedirection

export const getPendingRedirectionParams = (state: Store) =>
  state.lock.pendingRedirectionParams

export const getCheckPinStatus = (state: Store) => state.lock.checkPinStatus

export const getIsLockEnabled = (state: Store) => state.lock.isLockEnabled

export const getIsTouchIdEnabled = (state: Store) => state.lock.isTouchIdEnabled

export const getShowDevMode = (state: Store) => state.lock.showDevMode

export const getIsInRecovery = (state: Store) =>
  state.lock && state.lock.inRecovery

export const getIsBiometricsAvailable = (state: Store) =>
  state.lock.biometricsAvaliable

export const getNumberOfFailedPinAttempts = (state: Store) =>
  state.lock.numberOfFailedPinAttempts

export const getRecordedTimeOfPinFailedAttempt = (state: Store) =>
  state.lock.recordedTimeOfPinFailedAttempt

export const getIsShouldLockApp = (state: Store) => state.lock.shouldLockApp

export const getNumberOfAttemptsMessage = (state: Store) =>
  state.lock.numberOfAttemptsMessage

export const getLockdownTimeMessage = (state: Store) =>
  state.lock.lockdownTimeMessage

export const getLastUnlockSuccessTime = (state: Store) =>
  state.lock.lastUnlockSuccessTime

/*
 * Selectors related to Claim Offer Store
 * */
export const getClaimOffer = (state: Store, claimOfferId: string) =>
  state.claimOffer[claimOfferId]

export const getClaimOffers = (state: Store) => state.claimOffer

export const getReceivedCredentials = (state: Store) => {
  const {
    vcxSerializedClaimOffers: serializedOffers,
    ...offers
  } = state.claimOffer
  const credentials: Array<ClaimOfferPayload> = []
  Object.keys(offers).forEach((uid) => {
    const offer: ClaimOfferPayload = offers[uid]
    if (
      [CLAIM_REQUEST_STATUS.CLAIM_REQUEST_SUCCESS].includes(offer.claimRequestStatus)
    ) {
      credentials.push(offer)
    }
  })
  return credentials
}

export const getSerializedClaimOffer = (
  state: Store,
  userDID: string,
  messageId: string
) => {
  const userClaimOffers = state.claimOffer.vcxSerializedClaimOffers[userDID]
  if (!userClaimOffers) {
    // we did not find any claim offers with user pairwise did (userDID)
    return null
  }

  return userClaimOffers[messageId]
}

export const getSerializedClaimOffers = (state: Store, userDID: string) => {
  const serializedClaimOffers: SerializedClaimOffersPerDid =
    state.claimOffer.vcxSerializedClaimOffers[userDID]

  if (serializedClaimOffers) {
    return serializedClaimOffers
  }

  return {}
}

/*
 * Selectors related to Proof Request Store
 * */
export const getProofRequest = (state: Store, proofRequestId: string) =>
  state.proofRequest[proofRequestId]

export const getSelectedCredentials = (state: Store, uid: string) =>
  state.proofRequest[uid].data.requestedAttributes

export const getOriginalProofRequestData = (
  state: Store,
  proofRequestId: string
) => state.proofRequest[proofRequestId].originalProofRequestData

export const getProofRequestPairwiseDid = (
  state: Store,
  proofRequestId: string
) => state.proofRequest[proofRequestId].remotePairwiseDID

export const getProofRequests = (state: Store) => state.proofRequest

/*
 * Selectors related to Invitation Store
 * */
export const getInvitationPayload = (
  state: Store,
  invitationSenderDID: string
) => state.invitation[invitationSenderDID].payload

export const getAllInvitations = (state: Store) => state.invitation

/*
 * Selectors related to Claim Store
 * */
export const getClaimMap = (state: Store) => state.claim.claimMap

export const getClaimForOffer = (state: Store, offer: ClaimOfferPayload) => {
  for (const claimUuid of Object.keys(state.claim.claimMap)) {
    let claim = state.claim.claimMap[claimUuid]
    if (
      claim.senderDID === offer.remotePairwiseDID &&
      claim.name === offer.data.name &&
      claim.issueDate === offer.issueDate
    ) {
      return {
        claimUuid,
        claim,
      }
    }
  }
  return {}
}

/*
 * Selectors related to Proof Store
 * */
export const getProofData = (state: Store, proofRequestId: string) =>
  state.proof[proofRequestId] ? state.proof[proofRequestId].proofData : {}

export const getProof = (state: Store, proofRequestId: string) =>
  state.proof[proofRequestId]

/*
 * Selectors related to Connection History Store
 * */
export const getConnectionHistory = (state: Store) => state.history

//TODO - delete this selector and handle it in the reducer (no need to filter twice)
export const getPendingHistoryEvent = (
  state: Store,
  claim: ClaimOfferPayload
) => {
  const historyItems =
    state.history && state.history.data && state.history.data.connections
      ? state.history.data.connections[claim.remotePairwiseDID].data
      : []
  return historyItems.filter((item) => {
    return item.action === 'PENDING' && item.originalPayload.uid === claim.uid
  })[0]
}

export const getHistoryEvent = (
  state: Store,
  uid: string,
  remoteDid: string,
  type: string
) => {
  const historyItems =
    state.history &&
    state.history.data &&
    state.history.data.connections &&
    state.history.data.connections[remoteDid]
      ? state.history.data.connections[remoteDid].data
      : []
  return historyItems.filter((item) => {
    return (
      item.originalPayload &&
      item.originalPayload.type === type &&
      item.originalPayload.payloadInfo &&
      item.originalPayload.payloadInfo.uid === uid
    )
  })[0]
}

export const getPendingHistory = (
  state: Store,
  uid: string,
  remoteDid: string,
  type: string
) => {
  const historyItems =
    state.history && state.history.data && state.history.data.connections
      ? state.history.data.connections[remoteDid].data
      : []
  return historyItems.filter((item) => {
    return (
      item.originalPayload &&
      item.originalPayload.type === type &&
      item.originalPayload.uid === uid
    )
  })[0]
}

export const getUniqueHistoryItem = (
  state: Store,
  remoteDid: string,
  type: string
) => {
  const historyItems =
    state &&
    state.history &&
    state.history.data &&
    state.history.data.connections &&
    state.history.data.connections[remoteDid]
      ? state.history.data.connections[remoteDid].data
      : []
  return historyItems.filter((item) => item.action === type)[0]
}

export const getLastConnectionEvent = (
  historyItems: [ConnectionHistoryEvent]
) => {
  return historyItems.reduce(
    (result, item) =>
      item.type === HISTORY_EVENT_TYPE.INVITATION ? item : result,
    undefined
  )
}

export const getClaimReceivedHistory = (
  state: Store,
  uid: string,
  remoteDid: string,
  type: string
) => {
  const historyItems =
    state.history && state.history.data && state.history.data.connections
      ? state.history.data.connections[remoteDid].data
      : []
  return historyItems.filter((item) => {
    return (
      item.originalPayload &&
      item.originalPayload.type === type &&
      item.originalPayload.messageId === uid
    )
  })[0]
}

export const getHistory = (state: Store) => state.history.data

//  getUnseenMessages should take a connection, and parse though claim store and proof requests for unseen messages and return a json object like bellow.
export const getUnseenMessages = (state: Store) => {
  const { claimOffer, proofRequest, question } = state
  let obj = {}

  addUidsWithStatusToConnections(
    claimOffer,
    CLAIM_OFFER_STATUS.RECEIVED,
    obj,
    (claimOfferMessage: ClaimOfferPayload) =>
      claimOfferMessage.remotePairwiseDID
  )
  addUidsWithStatusToConnections(
    proofRequest,
    PROOF_REQUEST_STATUS.RECEIVED,
    obj,
    (proofRequestMessage: ProofRequestPayload) =>
      proofRequestMessage.remotePairwiseDID
  )
  addUidsWithStatusToConnections(
    question.data,
    QUESTION_STATUS.RECEIVED,
    obj,
    (questionMessage: QuestionStoreMessage) => questionMessage.payload.from_did
  )
  return obj
}

/*
 * Selectors related to Wallet Store
 * */
export const getWalletBalance = (state: Store) =>
  state.wallet.walletBalance.data

export const getWalletAddresses = (state: Store) =>
  state.wallet.walletAddresses.data

export const getTokenAmount = (state: Store) => state.wallet.payment.tokenAmount

export const getWalletHistory = (state: Store) => state.wallet.walletHistory

export const getWalletBackup = (state: Store) => state.wallet.backup

/*
 * Selectors related to Eula Store
 * */
export const getIsEulaAccepted = (state: Store) => state.eula.isEulaAccept

/*
 * Selectors related to Backup Store
 * */
export const getBackupPassphrase = (state: Store) => state.backup.passphrase

export const getBackupStatus = (state: Store) => state.backup.status

export const getBackupWalletHandle = (state: Store) => state.backup.walletHandle

export const getCloudBackupStatus = (state: Store) =>
  state.backup.cloudBackupStatus

export const getCloudBackupPending = (state: Store) =>
  state.backup.cloudBackupPending

export const getAutoCloudBackupEnabled = (state: Store) =>
  state.backup.autoCloudBackupEnabled

export const getHasVerifiedRecoveryPhrase = (state: Store) =>
  state.backup.hasVerifiedRecoveryPhrase

export const getBackupWalletPath = (state: Store) =>
  state.backup.backupWalletPath

export const getSalt = (state: Store) => state.backup.passphrase.salt

export const getPrepareBackupStatus = (state: Store) =>
  state.backup.prepareBackupStatus

/*
 * Selectors related to Send Logs Store
 * */
export const getLogEncryptionStatus = (state: Store) =>
  state.sendlogs.encryptLogStatus

/*
 * Selectors related to Restore Store
 * */
export const getRestoreStatus = (state: Store) => state.restore.status

export const getRestoreFileName = (state: Store) =>
  state.restore.restoreFile.fileName

export const getRestorePassphrase = (state: Store) => state.restore.passphrase

export const getRestoreError = (state: Store) => state.restore.error

/*
 * Selectors related to Ledger Store
 * */
export const getFees = (state: Store) => state.ledger.fees

/*
 * Selectors related to Offline Store
 * */
export const getOfflineStatus = (state: Store) => state.offline.offline

/*
 * Selectors related to Question Store
 * */
export const getQuestion = (state: Store) => state.question.data

export const getQuestionStorageStatus = (state: Store) =>
  state.question.storageStatus

/*
 * Selectors related to TxnAuthorAgreement Store
 * */
export const getTaaAcceptedVersion = (state: Store) =>
  state.txnAuthorAgreement.taaAcceptedVersion

export const getAllTxnAuthorAgreement = (state: Store) =>
  state.txnAuthorAgreement

export const getAlreadySignedAgreement = (state: Store) =>
  state.txnAuthorAgreement.haveAlreadySignedAgreement

export const getThereIsANewAgreement = (state: Store) =>
  state.txnAuthorAgreement.thereIsANewAgreement

/*
 * Selectors related to Cloud Restore Store
 * */
export const getCloudRestoreMessage = (state: Store) =>
  state.cloudRestore.message

export const getCloudRestoreError = (state: Store) => state.cloudRestore.error

/*
 * Selectors related to OpenId Connect Store
 * */
export const getOpenIdConnectData = (state: Store) => state.openIdConnect.data

export const getOpenIdConnectVersion = (state: Store) =>
  state.openIdConnect.version

/*
 * Selectors related to Show Credential Store
 * */
export const getShowCredentialData = (state: Store) => state.showCredential.data

export const getShowCredentialConnectionIdentifier = (state: Store) =>
  state.showCredential.connectionIdentifier

export const getShowCredentialUuid = (state: Store) =>
  state.showCredential.credentialUuid

export const getShowCredentialError = (state: Store) =>
  state.showCredential.error

export const getIsCredentialSent = (state: Store) => state.showCredential.isSent

/*
 * Selectors related to Verifier Store
 * */
export const getVerifiers = (state: Store) => state.verifier

export const getVerifier = (state: Store, uid: string) => state.verifier[uid]

export const getVerifierPresentationProposal = (state: Store, uid: string) =>
  state.verifier[uid]?.presentationProposal

export const getVerifierProofRequest = (state: Store, uid: string) =>
  state.verifier[uid]?.proofRequest

export const getVerifierRequestedProof = (state: Store, uid: string) =>
  state.verifier[uid]?.requestedProof

export const getVerifierSenderLogo = (state: Store, uid: string) =>
  state.verifier[uid]?.senderLogoUrl

export const getVerifierSenderName = (state: Store, uid: string) =>
  state.verifier[uid]?.senderName

/*
 * Connection Pairwise Agent
 * */
export const getConnectionPairwiseAgentInfo = (state: Store) =>
  state.connections.pairwiseAgent

export const getSmsPendingInvitation = (state: Store, smsToken: string) =>
  state.smsPendingInvitation[smsToken]

export const getSmsPendingInvitationPayload = (
  state: Store,
  smsToken: string
) => state.smsPendingInvitation[smsToken]?.payload

export const getSmsPendingInvitationError = (state: Store, smsToken: string) =>
  state.smsPendingInvitation[smsToken]?.error

export const getSmsPendingInvitationStatus = (state: Store, smsToken: string) =>
  state.smsPendingInvitation[smsToken]?.status

export const getDeepLinks = (state: Store) => state.deepLink.tokens

export const getDeepLinkStatus = (state: Store, smsToken: string) =>
  state.deepLink.tokens[smsToken]?.status
