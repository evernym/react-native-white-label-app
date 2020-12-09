// @flow

import { Component } from 'react'
import { connect } from 'react-redux'
import { BigNumber } from 'bignumber.js'

import type { Store } from '../../../store/type-store'
import type {
  LedgerFeesProps,
  LedgerFeesStateEnum,
  LedgerFeesData,
} from './ledger-fees-type'

import { getLedgerFees } from '../../type-ledger-store'
import { refreshWalletBalance } from '../../../wallet/wallet-store'
import { STORE_STATUS } from '../../../wallet/type-wallet'

class LedgerFeesComponent extends Component<LedgerFeesProps, void> {
  render() {
    const { ledgerFees, transferAmount, walletBalance } = this.props
    const { state, data } = getLedgerFeeState(
      ledgerFees,
      walletBalance,
      transferAmount
    )

    if (this.props.render) {
      return this.props.render(state, data, this.retry)
    }

    if (this.props.renderPhases) {
      return this.props.renderPhases[state](data, this.retry)
    }

    return null
  }

  componentDidUpdate(prevProps) {
    const { ledgerFees, transferAmount, walletBalance } = this.props

    if (
      prevProps.ledgerFees !== ledgerFees ||
      prevProps.walletBalance !== walletBalance ||
      transferAmount !== prevProps.transferAmount
    ) {
      // whenever state of ledgerFees or walletBalance changes
      // or transfer amount changes
      // we need to update state and should notify consumer of this component
      this.updateConsumer()
    }
  }

  componentDidMount() {
    // our component always starts in progress state
    // so we update consumer of this component to be in progress state
    this.props.onStateChange('IN_PROGRESS')
  }

  UNSAFE_componentWillMount() {
    // We agree that we should not use UNSAFE_componentWillMount lifecycle
    // events of react component, but there are good reasons for using
    // this event here.
    // When we render this component, we render UI on the basis of ledger fees
    // and wallet balance from redux store. But, data in redux store could be
    // stale data, and it might not have been refreshed or even hydrated
    // Example of these cases are if, user goes to paid cred screen directly
    // and wallet balance is only refreshed if user goes to settings screen
    // or to token screen. So, we can see that how user can get stale data
    // if we load this component in any of screen that does not involve wallet
    // balance UI flow.
    // Now, we know that data can be stale while we run `render` method of this
    // component. But this still does not explain why we are using UNSAFE_*
    // lifecycle event.
    // If data is stale, then inside render method we could show wrong fees
    // to user and it will be incorrect and has unintended effect of user
    // raising bug about incorrect balance deduction.
    // So, now we know that we could show wrong fees and some possible bugs.
    // Let us discuss the some possible ways we can fix this issue
    // 1. We can ensure that ledgerFees and walletBalance are updated
    //    before we render this component
    // 2. We can start fetching ledgerFees and walletBalance in
    //    componentDidMount() { this.props.getLedgerFees() }
    // 3. We can initialize a state variable and use it in render method
    //    to decide if we have updated ledgerFees at least once or not. e.g.
    //    constructor() { this.state = { refreshStarted: false } }
    //    render() { if (this.state.refreshStarted) {  } else { } }
    //    componentDidMount() { this.getLedgerFees(); this.setState({re:true})}
    // All of above approaches has one or other issue.
    // 1. It is difficult to ensure, because developers won't remember this
    //    critical piece before using this component. User of this component
    //    has too much responsibility. So, we can't use 1st approach
    // 2. componentDidMount is run after render method. So app user might still
    //    see a flash of UI change which is bad UX. So, we can't use 2nd either
    // 3. This approach comes pretty close to meeting all of our requirements
    //    of refreshing data and also showing correct UI with correct UX. But,
    //    the problem with this approach is that this component is based on
    //    render props implementation. So, if we set state, then component will
    //    re-render on state change, so our component will re-render 3 times
    //    one initial render
    //    second, getLedgerFees changes redux store, which triggers re-render
    //    third, state change to specify that we have requested refresh
    //    So, although 3rd approach meets our requirement but does it at a cost
    // Now, we come to the point on why we are using UNSAFE_* method
    // UNSAFE_componentWillMount, is called before render method AND any
    // state change or prop change does not trigger re-render due to the way
    // UNSAFE_componentWillMount behaves. Now, we can see how this solves all
    // our problems that we were describing. We can ask ourselves that if this
    // lifecycle event is so great, why is this UNSAFE, and why people don't
    // use it often? The reason is that since React re-wrote their algorithm
    // to use Fiber, componentWillMount can be called multiple times.
    // And if we are triggering side effects or subscribing to something
    // we might end up subscribing and sending API calls multiple times
    // that is why this event is marked as UNSAFE.
    // Now, we come to the question that how are we going to ensure that we are
    // not hit by UNSAFE issues. In our componentWillMount, we are asking for
    // refreshing balance and ledger fees. So, our ledger store is already
    // taking care of this, imagine that any logic or component
    // can ask to refresh ledger fees, so this is not a problem that we need to
    // handle from a component, this problem lies with our redux-saga
    // Fortunately, in redux-saga we have `takeLeading` that fixes this problem
    // elegantly. If we use `takeLeading`, then even if we ask for
    // refresh 10 times, redux-saga will ensure that till ir finishes refresh
    // no other request are not entertained. So, we are safe by redux-saga
    // and hence we can use this lifecycle method safely for us.
    this.props.dispatch(getLedgerFees())
    this.props.dispatch(refreshWalletBalance())
  }

  updateConsumer() {
    const { ledgerFees, transferAmount, walletBalance } = this.props
    const { state, data } = getLedgerFeeState(
      ledgerFees,
      walletBalance,
      transferAmount
    )
    this.props.onStateChange(state, data)
  }

  retry = () => {
    this.props.dispatch(getLedgerFees())
  }
}

const zeroAmount = new BigNumber('0')
function getLedgerFeeState(
  ledgerFees: $PropertyType<LedgerFeesProps, 'ledgerFees'>,
  walletBalance: $PropertyType<LedgerFeesProps, 'walletBalance'>,
  toTransfer: $PropertyType<LedgerFeesProps, 'transferAmount'>
): { state: LedgerFeesStateEnum, data?: LedgerFeesData } {
  const {
    data: { transfer },
    status: feesStatus,
  } = ledgerFees
  const { data: balance, status: balanceStatus } = walletBalance

  switch (true) {
    case [feesStatus, balanceStatus].includes(STORE_STATUS.IDLE):
    case [feesStatus, balanceStatus].includes(STORE_STATUS.IN_PROGRESS):
      return { state: 'IN_PROGRESS' }

    case feesStatus === STORE_STATUS.SUCCESS &&
      balanceStatus === STORE_STATUS.SUCCESS: {
      const feesAmount = new BigNumber(transfer)
      if (feesAmount.isLessThanOrEqualTo(zeroAmount)) {
        return { state: 'ZERO_FEES' }
      }

      const walletBalanceAmount = new BigNumber(balance)
      const transferAmount = new BigNumber(toTransfer)
      const totalAmountNeeded = transferAmount.plus(feesAmount)
      const feesData = {
        fees: formatToken(feesAmount),
        total: formatToken(totalAmountNeeded),
        currentTokenBalance: formatToken(walletBalanceAmount),
      }

      if (walletBalanceAmount.isLessThan(totalAmountNeeded)) {
        // if wallet does not enough balance to pay for transfer amount and fees
        // then we need to tell user that this transaction cannot be done
        return { state: 'TRANSFER_NOT_POSSIBLE_WITH_FEES', data: feesData }
      }

      if (walletBalanceAmount.isEqualTo(totalAmountNeeded)) {
        return { state: 'TRANSFER_EQUAL_TO_BALANCE', data: feesData }
      }

      return { state: 'TRANSFER_POSSIBLE_WITH_FEES', data: feesData }
    }

    case [feesStatus, balanceStatus].includes(STORE_STATUS.ERROR):

    default:
      return { state: 'ERROR' }
  }
}

function formatToken(amount: BigNumber): string {
  return amount.toFixed(8)
}

const mapStateToProps = (state: Store) => ({
  ledgerFees: state.ledger.fees,
  walletBalance: state.wallet.walletBalance,
})

export const LedgerFees = connect(mapStateToProps)(LedgerFeesComponent)
