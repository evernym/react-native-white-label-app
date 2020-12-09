// @flow
import {
  customLogger,
  PiiHiddenActionTransformer,
  PiiHiddenTransformer,
} from '../custom-logger'
import {
  getStore,
  walletBalance,
  walletAddresses,
  walletHistory,
} from '../../../__mocks__/static-data'
import { generateRecoveryPhraseSuccess } from '../../backup/backup-store'
import { mapClaimToSender } from '../../claim/claim-store'
import {
  walletBalanceRefreshed,
  tokenSentSuccess,
  walletAddressesRefreshed,
  walletHistoryRefreshed,
} from '../../wallet/wallet-store'

describe('Custom Logger', () => {
  it('Custom Logger should log to file', () => {
    customLogger.log('test log statement', ' asdfasdf ')
  })
})

describe('fn:PiiHiddenTransformer', () => {
  // Just having this single test for this transformer is enough
  // because we are testing whole redux store at once
  // and our mock data has all props for each and every module
  // and hence every path gets tested in single snapshot
  it('should hide all PII information with ****', () => {
    const mockStoreData = getStore().getState()
    expect(PiiHiddenTransformer(mockStoreData)).toMatchSnapshot()
  })
})

describe('fn:PiiHiddenActionTransformer', () => {
  it('should hide data Passphrase from action logging', () => {
    const action = generateRecoveryPhraseSuccess(
      getStore().getState().backup.passphrase
    )
    expect(PiiHiddenActionTransformer(action)).toMatchSnapshot()
  })

  it('should hide senderDID and pairwiseDID in MAP_CLAIM_TO_SENDER', () => {
    const action = mapClaimToSender(
      'claimUUID',
      'senderDID',
      'userDID',
      'logoUrl',
      123456789,
      'Test Claim',
      'Sender'
    )
    expect(PiiHiddenActionTransformer(action)).toMatchSnapshot()
  })

  it('should hide PII in WALLET_BALANCE_REFRESHED', () => {
    const action = walletBalanceRefreshed(walletBalance.data)
    expect(PiiHiddenActionTransformer(action)).toMatchSnapshot()
  })

  it('should hide PII in TOKEN_SENT_SUCCESS', () => {
    const action = tokenSentSuccess('123')
    expect(PiiHiddenActionTransformer(action)).toMatchSnapshot()
  })

  it('should hide PII in WALLET_ADDRESSES_REFRESHED', () => {
    const action = walletAddressesRefreshed(walletAddresses.data)
    expect(PiiHiddenActionTransformer(action)).toMatchSnapshot()
  })

  it('should hide PII in WALLET_HISTORY_REFRESHED', () => {
    const action = walletHistoryRefreshed(walletHistory.transactions)
    expect(PiiHiddenActionTransformer(action)).toMatchSnapshot()
  })
})
