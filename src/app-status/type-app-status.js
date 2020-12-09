// @flow

import type { ReduxConnect } from '../common/type-common'

export type AppStatusState = {
  appState: ?string,
}

export type AppStatusProps = {
  ...ConnectProps,
} & ReduxConnect

export type ConnectProps = {|
  restoreStatus: string,
|}
