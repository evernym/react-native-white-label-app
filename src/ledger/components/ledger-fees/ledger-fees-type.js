// @flow

import * as React from 'react'
import type { LedgerFees } from '../../type-ledger-store'
import type { ReduxConnect } from '../../../common/type-common'
import type { WalletBalance } from '../../../wallet/type-wallet'

type ReactComponent = React.Node
type NoOp = () => void

export type LedgerFeesProps = {
  transferAmount: string,
  ledgerFees: LedgerFees,
  walletBalance: WalletBalance,
  renderPhases?: LedgerFeesRenderPhases,
  render?: (
    state: LedgerFeesStateEnum,
    data?: LedgerFeesData,
    retry: NoOp
  ) => ReactComponent,
  onStateChange: (state: LedgerFeesStateEnum, data?: LedgerFeesData) => void,
} & ReduxConnect

export type LedgerFeesRenderPhases = {
  IN_PROGRESS: (data?: any, retry: NoOp) => ReactComponent,
  ERROR: (data?: any, retry: NoOp) => ReactComponent,
  ZERO_FEES: (data?: LedgerFeesData, retry: NoOp) => ReactComponent,
  TRANSFER_EQUAL_TO_BALANCE: (
    data?: LedgerFeesData,
    retry: NoOp
  ) => ReactComponent,
  TRANSFER_POSSIBLE_WITH_FEES: (
    data?: LedgerFeesData,
    retry: NoOp
  ) => ReactComponent,
  TRANSFER_NOT_POSSIBLE_WITH_FEES: (
    data?: LedgerFeesData,
    retry: NoOp
  ) => ReactComponent,
}

export type LedgerFeesStateEnum =
  | 'IN_PROGRESS'
  | 'ERROR'
  | 'ZERO_FEES'
  | 'TRANSFER_EQUAL_TO_BALANCE'
  | 'TRANSFER_POSSIBLE_WITH_FEES'
  | 'TRANSFER_NOT_POSSIBLE_WITH_FEES'

export type LedgerFeesData = {
  fees: string,
  total: string,
  currentTokenBalance: string,
}
