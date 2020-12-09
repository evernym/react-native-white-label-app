This component is created using render props concept. [See more details about render props](https://reactjs.org/docs/render-props.html). This component is created to share ledger fees related logic and not the UI. We can still create some UI components that can be exposed from same folder, but we think that this folder should only share logic for different states and rendering UI that belongs to those states. UI for different states should be passed by the consumer of this component.

### Usage:

```js
<LedgerFees
  renderPhases={{
    IN_PROGRESS: () => <Loader message="Fetching transaction fees..." />,
    ERROR: () => <Error message="" />,
    ZERO_FEES: (data?: LedgerFeesData, retry: () => void) => <ZeroFees />,
    TRANSFER_EQUAL_TO_BALANCE: (data?: LedgerFeesData, retry: () => void) => <TransferPossibleButNoBalanceLeft />,
    TRANSFER_POSSIBLE_WITH_FEES: (data?: LedgerFeesData, retry: () => void) => <TransferPossible />,
    TRANSFER_NOT_POSSIBLE_WITH_FEES: (data?: LedgerFeesData, retry: () => void) => <TransferNotPossible />,
  }}
  onStateChange={(state: LedgerFeesStatus, data?: LedgerFeesData) => console.log({state, data})}
  transferAmount={"0.0001"}
  render={(state: LedgerFeesStatus, data?: LedgerFeesData, retry: () => void) => <CommonComponentForAllStates />}
/>

// Types for data passed in renderPhase props
type LedgerFeesData = {
  fees: string,
  total: string,
  currentTokenBalance: string
}
// All of data that is passed in above type is number formatted
// if we need to make any calculations using above data
// then we need to use BigNumber constructor and pass above strings
// and then we can go ahead and perform those operations

// type for state that we pass in onStateChange fn passed by consumer
type LedgerFeesStatus = 'IN_PROGRESS' 
                        | 'ERROR'
                        | 'ZERO_FEES'
                        | 'TRANSFER_EQUAL_TO_BALANCE'
                        | 'TRANSFER_POSSIBLE_WITH_FEES'
                        | 'TRANSFER_NOT_POSSIBLE_WITH_FEES'
// Above is an Enum type that gets passed to fn passed by consumer
// it would one of the value, so that consumer can perform it's own operation
// on the basis of ledger fees state change
```
*Note*: For avoiding re-rendering, props that are passed in this component should not be created as new object on every render. In above example we are just creating new renderPhase object on every render. So, LedgerFees component will re-render on every re-render of parent component when it shouldn't because essentially components for each state are going to be the same. Same goes with `onStateChange` prop as well, this prop should also be a reference and not an arrow function inside render method to avoid unnecessary re-render.
