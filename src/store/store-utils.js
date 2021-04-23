/*
* Helpers
* */
import RNFetchBlob from 'rn-fetch-blob'
import { Platform } from 'react-native'

import { Connection } from './type-connection-store'
import { ProofRequestStore } from '../proof-request/type-proof-request'
import { CLAIM_OFFER_STATUS, ClaimOfferPayload, ClaimOfferStore } from '../claim-offer/type-claim-offer'
import { QuestionStoreData } from '../question/type-question'
import { HISTORY_EVENT_STATUS } from '../connection-history/type-connection-history'


export const isConnectionCompleted = (connection: Connection) => !connection.isFetching

export const isIssuanceCompleted = (offer: ClaimOfferPayload) => offer.status !== CLAIM_OFFER_STATUS.ACCEPTED

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

export const addUidsWithStatusToConnections = (
  events: ProofRequestStore | ClaimOfferStore | QuestionStoreData,
  filterStatus,
  obj,
  getRemotePairwiseDid: (any) => string,
) => {
  ;(Object.keys(events): Array<string>).map((uid) => {
    if (events[uid].status === filterStatus) {
      const remoteDid: string = getRemotePairwiseDid(events[uid])
      obj[remoteDid] = obj[remoteDid] || []
      obj[remoteDid].push(uid)
    }
  })
}

export const getDIDFromFullyQualifiedDID = (did: string) =>
  did.split(':').slice(-1)[0]

export const isNewEvent = (status: string, show?: boolean) => {
  if (
    (status === HISTORY_EVENT_STATUS.CLAIM_OFFER_RECEIVED ||
      status === HISTORY_EVENT_STATUS.PROOF_REQUEST_RECEIVED ||
      status === HISTORY_EVENT_STATUS.QUESTION_RECEIVED ||
      status === HISTORY_EVENT_STATUS.INVITE_ACTION_RECEIVED) &&
    show
  ) {
    return true
  } else return false
}
