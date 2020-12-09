// @flow

import { BigNumber } from 'bignumber.js'

import type { LedgerFeesData } from '../ledger/type-ledger-store'

// 1 sovrin token = 100M sovrin atoms
const sovrinAtomsToSovrinTokensConversionFactor = 100000000

// this determines what is the length after decimal separator
export const conversionFactorLength =
  `${sovrinAtomsToSovrinTokensConversionFactor}`.length - 1

export function convertSovrinAtomsToSovrinTokens(
  sovrinAtoms: string | number
): string {
  const atoms = new BigNumber(sovrinAtoms)
  return atoms
    .dividedBy(sovrinAtomsToSovrinTokensConversionFactor)
    .toFixed()
    .toString()
}

export function convertSovrinTokensToSovrinAtoms(sovrinTokens: string): string {
  const tokens = new BigNumber(sovrinTokens)

  return tokens
    .multipliedBy(sovrinAtomsToSovrinTokensConversionFactor)
    .toFixed()
    .toString()
}

export const LEDGER_FEE_TRANSFER_CODE = 'ALL_XFER_PUBLIC'
const noTransferFees = {
  transfer: '0',
}

export function convertVcxLedgerFeesToLedgerFees(
  feesJson: string
): LedgerFeesData {
  const fees = JSON.parse(feesJson)
  const transferFees: ?string = fees[LEDGER_FEE_TRANSFER_CODE]

  if (!transferFees) {
    return noTransferFees
  }

  const transferFeesAtoms = new BigNumber(transferFees)
  if (transferFeesAtoms.isNaN()) {
    return noTransferFees
  }

  // if there is value, then, that value is in sov-atoms
  // so we need to convert that to sovrin tokens
  return {
    transfer: convertSovrinAtomsToSovrinTokens(transferFeesAtoms),
  }
}
