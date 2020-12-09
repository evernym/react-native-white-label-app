// @flow

import {
  convertVcxLedgerFeesToLedgerFees,
  LEDGER_FEE_TRANSFER_CODE,
} from '../sovrin-token-converter'

describe('fn:SovrinTokenConverter', () => {
  it('convertVcxLedgerFeesToLedgerFees, return correct fees', () => {
    const correctLedgerFees = {
      [LEDGER_FEE_TRANSFER_CODE]: '100',
    }
    expect(
      convertVcxLedgerFeesToLedgerFees(JSON.stringify(correctLedgerFees))
    ).toEqual({
      transfer: '0.000001',
    })
  })

  it('convertVcxLedgerFeesToLedgerFees, 0 fees for incorrect ledger fees', () => {
    const incorrectLedgerFees = {
      [LEDGER_FEE_TRANSFER_CODE]: '0',
    }
    expect(
      convertVcxLedgerFeesToLedgerFees(JSON.stringify(incorrectLedgerFees))
    ).toEqual({
      transfer: '0',
    })
    const noLedgerFeesForTransfer = {
      [LEDGER_FEE_TRANSFER_CODE]: '0',
    }
    expect(
      convertVcxLedgerFeesToLedgerFees(JSON.stringify(noLedgerFeesForTransfer))
    ).toEqual({
      transfer: '0',
    })
    const noLedgerFeesAsNumberForTransfer = {
      [LEDGER_FEE_TRANSFER_CODE]: '1a',
    }
    expect(
      convertVcxLedgerFeesToLedgerFees(
        JSON.stringify(noLedgerFeesAsNumberForTransfer)
      )
    ).toEqual({
      transfer: '0',
    })
  })
})
