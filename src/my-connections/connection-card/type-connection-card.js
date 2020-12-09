// @flow
import type { ConnectionHistoryEvent } from '../../connection-history/type-connection-history'

export type ConnectionCardProps = {
  onPress: Function,
  image: string,
  status: string,
  senderName: string,
  date: string,
  type: string,
  credentialName: string,
  question: string,
  onNewConnectionSeen: Function,
  senderDID: string,
  events: ConnectionHistoryEvent[],
}
