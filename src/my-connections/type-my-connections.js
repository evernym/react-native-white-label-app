// @flow
import type { ReactNavigation } from '../common/type-common'
import type { MessageDownloadStatus } from '../store/type-config-store'

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

export type MyConnectionsState = {
  appState: ?string,
}

// TODO: Remove this afterwards, the lint is failing for some reason.
export type HomeState = {
  appState: ?string,
}

export type MyConnectionsProps = {
  unSeenMessagesCount: number,
  environmentName: string,
  onNewConnectionSeen: (senderDid: string) => void,
  connections: Array<Item>,
  hasNoConnection: boolean,
  getUnacknowledgedMessages: () => void,
  messageDownloadStatus: MessageDownloadStatus,
  snackError: ?string,
} & ReactNavigation

// TODO: Remove this afterwards, the lint is failing for some reason.
export type HomeProps = {
  unSeenMessagesCount: number,
  environmentName: string,
  onNewConnectionSeen: (senderDid: string) => void,
  connections: Array<Item>,
  hasNoConnection: boolean,
} & ReactNavigation
