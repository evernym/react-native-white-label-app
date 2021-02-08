// @flow
import type { ReactNavigation } from '../common/type-common'

export type Item = {
  index: Number,
  date: string,
  status: string,
  questionTitle: string,
  type: string,
  newBadge: boolean,
  senderDID: string,
  senderName: string,
  logoUrl: string,
  credentialName: string,
}

export type MyConnectionsProps = {
  onNewConnectionSeen: (senderDid: string) => void,
  getUnacknowledgedMessages: () => void,
} & ReactNavigation
