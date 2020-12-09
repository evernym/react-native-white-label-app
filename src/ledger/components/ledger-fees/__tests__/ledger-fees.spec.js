// @flow

import React from 'react'
import { View, Text } from 'react-native'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'

import { LedgerFees } from '../ledger-fees'
import {
  getStore,
  walletBalance as mockWalletBalance,
} from '../../../../../__mocks__/static-data'
import { ledgerStoreWithTransferFees as mockLedgerWithFees } from '../../../../../__mocks__/data/ledger-store-mock-data'
import { STORE_STATUS } from '../../../../wallet/type-wallet'
import { getLedgerFees } from '../../../type-ledger-store'
import { refreshWalletBalance } from '../../../../wallet/wallet-store'

describe('<LedgerFees />', () => {
  it('should refresh wallet balance and ledger fees', () => {
    const { store } = setup()
    expect(store.dispatch).toHaveBeenCalledWith(getLedgerFees())
    expect(store.dispatch).toHaveBeenCalledWith(refreshWalletBalance())
  })

  it('should render IN_PROGRESS on initial mount', () => {
    const { props } = setup()
    expect(props.onStateChange).toHaveBeenCalledWith('IN_PROGRESS')
  })

  it('should render IN_PROGRESS component if balance is in progress', () => {
    const { wrapper } = setup({ balance: { status: STORE_STATUS.IN_PROGRESS } })
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('should render IN_PROGRESS component if fees is in progress', () => {
    const { wrapper } = setup({ fees: { status: STORE_STATUS.IN_PROGRESS } })
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('should render IN_PROGRESS component if both balance and fees are in progress', () => {
    const { wrapper } = setup({
      balance: { status: STORE_STATUS.IN_PROGRESS },
      fees: { status: STORE_STATUS.IN_PROGRESS },
    })
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('should render ZERO component if fees is zero', () => {
    const { wrapper } = setup({
      fees: { data: { transfer: '0' } },
    })
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('should call TRANSFER_POSSIBLE_WITH_FEES with correct fees data', () => {
    const { wrapper } = setup()
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('should call TRANSFER_NOT_POSSIBLE_WITH_FEES with correct fees data', () => {
    const { wrapper } = setup({
      fees: { data: { transfer: '10000' } },
    })
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  // TODO:KS Add tests which check functionality for render method as well

  function getText(text: string) {
    return (
      <View>
        <Text>{text}</Text>
      </View>
    )
  }

  function getProps() {
    return {
      transferAmount: '0.001',
      renderPhases: {
        IN_PROGRESS: jest.fn(() => getText('In progress...')),
        ERROR: jest.fn(() => getText('error')),
        ZERO_FEES: jest.fn(() => getText('zero fees')),
        TRANSFER_EQUAL_TO_BALANCE: jest.fn(() =>
          getText('TRANSFER_EQUAL_TO_BALANCE')
        ),
        TRANSFER_POSSIBLE_WITH_FEES: jest.fn(() =>
          getText('TRANSFER_POSSIBLE_WITH_FEES')
        ),
        TRANSFER_NOT_POSSIBLE_WITH_FEES: jest.fn(() =>
          getText('TRANSFER_NOT_POSSIBLE_WITH_FEES')
        ),
      },
      onStateChange: jest.fn(),
    }
  }

  function setup(extraProps?: { balance?: Object, fees?: Object } = {}) {
    const store = getStore({
      wallet: {
        walletBalance: {
          ...mockWalletBalance,
          ...(extraProps.balance || {}),
        },
      },
      ledger: {
        fees: {
          ...mockLedgerWithFees.fees,
          ...(extraProps.fees || {}),
        },
      },
    })

    const props = getProps()
    const wrapper = renderer.create(
      <Provider store={store}>
        <LedgerFees {...props} />
      </Provider>
    )

    return { props, wrapper, store }
  }
})
