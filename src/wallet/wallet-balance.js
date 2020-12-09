// @flow

import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { View } from 'react-native'
import type { WalletBalanceProps } from './type-wallet'
import type { Store } from '../store/type-store'
import { getWalletBalance } from '../store/store-selector'
import { refreshWalletBalance } from './wallet-store'

export class WalletBalance extends PureComponent<WalletBalanceProps, void> {
  componentDidMount() {
    this.props.refreshWalletBalance()
  }

  render() {
    const { walletBalance, render }: WalletBalanceProps = this.props
    return <View>{render(walletBalance)}</View>
  }
}

const mapStateToProps = (state: Store) => {
  return {
    walletBalance: getWalletBalance(state),
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ refreshWalletBalance }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(WalletBalance)
