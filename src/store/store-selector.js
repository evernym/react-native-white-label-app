// @flow
import type { Store } from './type-store'
import type { ClaimOfferStore } from '../claim-offer/type-claim-offer'
import type {
  ProofRequestStore,
  ProofRequestPayload,
} from '../proof-request/type-proof-request'
import type {
  ClaimOfferPayload,
  SerializedClaimOffersPerDid,
} from '../claim-offer/type-claim-offer'
import type { Connection } from './type-connection-store'
import {
  HISTORY_EVENT_STATUS,
  HISTORY_EVENT_TYPE,
} from '../connection-history/type-connection-history'
import type {
  QuestionStoreData,
  QuestionStoreMessage,
} from '../question/type-question'
import type { ConnectionStore } from './type-connection-store'
import RNFetchBlob from 'rn-fetch-blob'
import { Platform } from 'react-native'
import { colors, whiteSmoke } from '../common/styles/constant'
import memoize from 'lodash.memoize'
import { CLAIM_OFFER_STATUS } from './../claim-offer/type-claim-offer'
import { PROOF_REQUEST_STATUS } from './../proof-request/type-proof-request'
import { QUESTION_STATUS } from '../question/type-question'
import { getConnections } from './connections-store'
import type { ConnectionHistoryEvent } from '../connection-history/type-connection-history'

export const getConfig = (state: Store) => state.config

export const getAgencyUrl = (state: Store) => state.config.agencyUrl

export const getAgencyDID = (state: Store) => state.config.agencyDID

export const getPoolConfig = (state: Store) => state.config.poolConfig

export const getPaymentMethod = (state: Store) => state.config.paymentMethod

export const getAgencyVerificationKey = (state: Store) =>
  state.config.agencyVerificationKey

export const getPushToken = (state: Store) => state.pushNotification.pushToken

export const getAllInvitations = (state: Store) => state.invitation

export const getAllConnection = (state: Store) => state.connections.data

export const getAllOneTimeConnection = (state: Store) =>
  state.connections.oneTimeConnections

export const getConnectionTheme = (state: Store, logoUrl: string) =>
  state.connections.connectionThemes[logoUrl] ||
  state.connections.connectionThemes['default']

export const getConnectionColorTheme = (state: Store, remoteDid: string) => {
  const [connection] = getConnection(state, remoteDid)
  return connection ? connection.colorTheme : colors.cmGreen2
}

export const getErrorAlertsSwitchValue = (state: Store) =>
  state.config.showErrorAlerts

export const getInvitationPayload = (
  state: Store,
  invitationSenderDID: string
) => state.invitation[invitationSenderDID].payload

export const getConnectionLogoUrl = (
  state: Store,
  remotePairwiseDid: string
): string => {
  const connections = getConnection(state, remotePairwiseDid)
  return connections.length > 0 ? connections[0].logoUrl : ''
}

export const getConnection = (
  state: Store,
  senderDID: string
): Array<Connection> => {
  const connections = getAllConnection(state)
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

  // else try to find one-time connection
  const oneTimeConnections = getAllOneTimeConnection(state)
  if (oneTimeConnections) {
    // Had to use `any` type here even though we know `Array<Connection>`
    // will be returned, as of now Flow returns mixed type for
    // all Object.{map,keys,values} operations and we can't do
    // anything unless we specify $Exact type, which we can't define
    // in this case, because for $Exact type, we should know each
    // key in advance which is not the case here because we don't know DIDs
    // with which we will make connections
    const savedConnections: Array<any> = Object.values(oneTimeConnections)
    return savedConnections.filter(
      (connection: Connection) => connection.senderDID === senderDID
    )
  }

  return []
}

export const getConnectionsCount = (state: Store) =>
  Object.keys(state.connections.data || {}).length

export const isDuplicateConnection = (state: Store, senderDID: string) => {
  const [connection] = getConnection(state, senderDID)
  return connection && (connection.isFetching || connection.isCompleted)
}

export const getHydrationState = (state: Store) => state.config.isHydrated

export const getInitializedState = (state: Store) => state.config.isInitialized

export const getClaimOffer = (state: Store, claimOfferId: string) =>
  state.claimOffer[claimOfferId]

export const isConnectionCompleted = (connection: Connection) =>
  !connection.isFetching

export const isIssuanceCompleted = (offer: ClaimOfferPayload) =>
  offer.status !== CLAIM_OFFER_STATUS.ACCEPTED

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

export const getProofRequest = (state: Store, proofRequestId: string) =>
  state.proofRequest[proofRequestId]

export const getProofRequesterName = (state: Store, proofRequestId: string) => {
  if (
    state.proofRequest[proofRequestId] &&
    state.proofRequest[proofRequestId].requester &&
    state.proofRequest[proofRequestId].requester.name
  ) {
    return state.proofRequest[proofRequestId].requester.name
  }

  return 'requester'
}

export const getOriginalProofRequestData = (
  state: Store,
  proofRequestId: string
) => state.proofRequest[proofRequestId].originalProofRequestData

export const getProofRequestPairwiseDid = (
  state: Store,
  proofRequestId: string
) => state.proofRequest[proofRequestId].remotePairwiseDID

export const getProof = (state: Store, proofRequestId: string) =>
  state.proof[proofRequestId]
export const getProofRequests = (state: Store) => state.proofRequest

export const getUserPairwiseDid = (state: Store, senderDID: string) => {
  const connections = getConnection(state, senderDID)
  if (connections.length > 0) {
    return connections[0].identifier
  }

  return null
}

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

export const getUserOneTimeInfo = (state: Store) => state.user.userOneTimeInfo

export const getClaimMap = (state: Store) => state.claim.claimMap

export const getClaimForOffer = (state: Store, offer: ClaimOfferPayload) =>
  Object.values(state.claim.claimMap).find(
    (claim: any) =>
      claim.senderDID === offer.remotePairwiseDID &&
      claim.name === offer.data.name &&
      claim.issueDate === offer.issueDate
  )

export const getCurrentScreen = (state: Store) => state.route.currentScreen

export const getNotificationOpenOptions = (state: Store) =>
  state.pushNotification.notificationOpenOptions

export const getWalletBalance = (state: Store) =>
  state.wallet.walletBalance.data

export const getWalletAddresses = (state: Store) =>
  state.wallet.walletAddresses.data

export const getTokenAmount = (state: Store) => state.wallet.payment.tokenAmount

export const getWalletHistory = (state: Store) => state.wallet.walletHistory

export const getStatusBarTheme = (state: Store) => {
  const statusBarTheme =
    state.connections !== undefined &&
    state.connections.statusBarTheme != undefined
      ? state.connections.statusBarTheme
      : whiteSmoke
  return statusBarTheme
}

export const getUserAvatarSource = (name: ?string) => {
  if (name) {
    const uri =
      Platform.OS === 'ios'
        ? `${RNFetchBlob.fs.dirs.DocumentDir}/${name}`
        : `file://${RNFetchBlob.fs.dirs.DocumentDir}/${name}`
    return {
      uri,
    }
  }

  return undefined
}

export const getUserAvatarName = (state: Store): ?string =>
  state.user.avatarName

export const getThemes = (state: Store) => state.connections.connectionThemes

export const getVcxInitializationState = (state: Store) =>
  state.config.vcxInitializationState

export const getVcxPoolInitializationState = (state: Store) =>
  state.config.vcxPoolInitializationState

export const getIsLockEnabledState = (state: Store) => state.lock.isLockEnabled
export const getIsAppLocked = (state: Store) => state.lock.isAppLocked

export const getIsAlreadyInstalledState = (state: Store) =>
  state.config.isAlreadyInstalled

export const getClaimOffers = (state: Store) => state.claimOffer

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

export const getAllConnectionsPairwiseDid = (state: Store) => {
  const connections = getAllConnection(state)

  let myPairwiseDIDs = []

  if (connections) {
    Object.keys(connections).forEach((userDID) => {
      if (connections[userDID] && connections[userDID].myPairwiseDid) {
        myPairwiseDIDs.push(userDID)
      }
    })
  }
  return myPairwiseDIDs
}

export const getConnectionByUserDid = (state: Store, userDID: string) => {
  const connections = getAllConnection(state)

  if (connections) {
    const connection = connections[userDID]
    if (connection) {
      return connection
    }
  }

  const oneTimeConnections = getAllOneTimeConnection(state)

  if (oneTimeConnections) {
    const connection = oneTimeConnections[userDID]
    if (connection) {
      return connection
    }
  }

  return null
}

export const getOfflineStatus = (state: Store) => state.offline.offline

export const getInvitations = (state: Store) => state.invitation

export const getDeepLinkTokens = (state: Store) => state.deepLink.tokens

export const getBackupPassphrase = (state: Store) => state.backup.passphrase

export const getBackupStatus = (state: Store) => state.backup.status

export const getBackupWalletHandle = (state: Store) => state.backup.walletHandle

export const getCloudBackupStatus = (state: Store) =>
  state.backup.cloudBackupStatus

export const getCloudBackupPending = (state: Store) =>
  state.backup.cloudBackupPending

export const getLastCloudBackup = (state: Store) =>
  state.backup.lastSuccessfulCloudBackup

export const getAutoCloudBackupEnabled = (state: Store) =>
  state.backup.autoCloudBackupEnabled

export const getHasVerifiedRecoveryPhrase = (state: Store) =>
  state.backup.hasVerifiedRecoveryPhrase

export const getLastBackup = (state: Store) => state.backup.lastSuccessfulBackup

export const getBackupWalletPath = (state: Store) =>
  state.backup.backupWalletPath

export const getEncryptedFileLocation = (state: Store) =>
  state.backup.encryptedFileLocation

export const getLogEncryptionStatus = (state: Store) =>
  state.sendlogs.encryptLogStatus

export const getBackupShowBanner = (state: Store) => state.backup.showBanner

export const getTaaAcceptedVersion = (state: Store) =>
  state.txnAuthorAgreement.taaAcceptedVersion

const addUidsWithStatusToConnections = (
  events: ProofRequestStore | ClaimOfferStore | QuestionStoreData,
  filterStatus,
  obj,
  getRemotePairwiseDid: (any) => string
) => {
  ;(Object.keys(events): Array<string>).map((uid) => {
    if (events[uid].status === filterStatus) {
      const remoteDid: string = getRemotePairwiseDid(events[uid])
      obj[remoteDid] = obj[remoteDid] || []
      obj[remoteDid].push(uid)
    }
  })
}

//  getUnseenMessages should take a connection, and parse though claim store and proof requests for unseen messages and return a json object like bellow.
export const getUnseenMessages = memoize(
  (state: Store) => {
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
      (questionMessage: QuestionStoreMessage) =>
        questionMessage.payload.from_did
    )
    return obj
  },
  ({ claimOffer, proofRequest, question }) => ({
    ...claimOffer,
    ...proofRequest,
    ...question.data,
  })
)

export const getLastSuccessfulBackupTimeStamp = (state: Store) =>
  state.backup.lastSuccessfulBackup

export const getRestoreStatus = (state: Store) => state.restore.status

export const getRestoreFileSize = (state: Store) =>
  state.restore.restoreFile.fileSize

export const getRouteCurrentScreen = (state: Store) => state.route.currentScreen

export const getRestoreFilePath = (state: Store) =>
  state.restore.restoreFile.uri

export const getRestoreFileName = (state: Store) =>
  state.restore.restoreFile.fileName

export const getSalt = (state: Store) => state.backup.passphrase.salt

export const getHistory = (state: Store) => state.history.data

export const getPendingFetchAdditionalDataKey = (state: Store) =>
  state.pushNotification.pendingFetchAdditionalDataKey

export const getPushNotifactionNotification = (state: Store) =>
  state.pushNotification.notification

export const getPushNotificationPermissionState = (state: Store) =>
  state.pushNotification.isAllowed

export const getProofData = (state: Store, proofRequestId: string) =>
  state.proof[proofRequestId] ? state.proof[proofRequestId].proofData : {}

export const getPrepareBackupStatus = (state: Store) =>
  state.backup.prepareBackupStatus

export const getConnectionExists = (state: Store, did: string) => {
  return (
    did in getAllDid(state.connections) ||
    did in getAllPublicDid(state.connections)
  )
}

// get data from connections store for public DIDs
// data is returned in format {"publicDID": ConnectionData}
export const getAllPublicDid = (connections: ConnectionStore) => {
  const pairwiseConnections = connections.data || {}
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

// get data from connections store for all DIDs
// data is returned in format {"senderDID": ConnectionData}
export const getAllDid = (connections: ConnectionStore) => {
  const pairwiseConnections = connections.data || {}
  return Object.keys(pairwiseConnections).reduce((acc, senderDID) => {
    const connection = pairwiseConnections[senderDID]
    return {
      ...acc,
      [connection.senderDID]: connection,
    }
  }, {})
}

export const getAllTxnAuthorAgreement = (state: Store) =>
  state.txnAuthorAgreement

export const getAlreadySignedAgreement = (state: Store) =>
  state.txnAuthorAgreement.haveAlreadySignedAgreement

export const getThereIsANewAgreement = (state: Store) =>
  state.txnAuthorAgreement.thereIsANewAgreement
export const getConnectionByProp = (
  state: Store,
  property: string,
  valueToMatch: any
): Array<Connection> => {
  const connections = getAllConnection(state)
  if (connections) {
    // Had to use `any` type here even though we know `Array<Connection>`
    // will be returned, as of now Flow returns mixed type for
    // all Object.{map,keys,values} operations and we can't do
    // anything unless we specify $Exact type, which we can't define
    // in this case, because for $Exact type, we should know each
    // key in advance which is not the case here because we don't know DIDs
    // with which we will make connections
    const savedConnections: Array<any> = Object.values(connections)
    return savedConnections.filter(
      (connection) => connection[property] === valueToMatch
    )
  }

  return []
}

export const getDIDFromFullyQualifiedDID = (did: string) =>
  did.split(':').slice(-1)[0]

export const getPushNotificationStore = (state: Store) => state.pushNotification

export const isNewConnection = (status: string, show?: boolean) => {
  if (
    (status === HISTORY_EVENT_STATUS.CLAIM_OFFER_RECEIVED ||
      status === HISTORY_EVENT_STATUS.PROOF_REQUEST_RECEIVED ||
      status === HISTORY_EVENT_STATUS.QUESTION_RECEIVED) &&
    show
  ) {
    return true
  } else return false
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
    if (isNewConnection(message.status, message.showBadge)) {
      numberOfNewMessages++
    }
  })

  return numberOfNewMessages
}
