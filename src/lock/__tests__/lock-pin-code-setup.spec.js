// @flow
import React from 'react'
import 'react-native'
import renderer, { act } from 'react-test-renderer'
import { Provider } from 'react-redux'
import { LockPinSetup } from '../lock-pin-code-setup'
import { getNavigation } from '../../../__mocks__/static-data'
import { createStore } from 'redux'
import { PinCodeBox } from '../../components'
import { MockedNavigator } from '../../../__mocks__/mock-navigator'

describe('<LockPinCodeSetup />', () => {
  const getProps = () => ({
    setPinAction: jest.fn(),
    enableTouchIdAction: jest.fn(),
    navigation: getNavigation(),
    route: {},
    lockEnable: jest.fn(),
  })

  let component
  let props

  const mockStore = createStore(() => ({}), {})

  beforeEach(() => {
    props = getProps()

    const intermediateComponent = () => (
      <Provider store={mockStore}>
        <LockPinSetup {...props} />
      </Provider>
    )
    component = renderer.create(
      <MockedNavigator component={intermediateComponent} />
    )
  })

  it('should render pin code box', () => {
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should show re enter pass code after first entry', () => {
    let tree = component.toJSON()
    const pinCodeBox = component.root.findByType(PinCodeBox)
    //manually trigger onComplete method by passing "pass code"
    act(() => pinCodeBox.instance.props.onPinComplete('123456'))
    tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should set pinSetupState and pinReEnterSuccessPin for after pin is success for redirection', () => {
    const pinCodeBox = component.root.findByType(PinCodeBox)
    //manually trigger onComplete method by passing "pass code" for first time
    act(() => pinCodeBox.instance.props.onPinComplete('123456'))
    //manually trigger onComplete method by passing "same pass code" for second time
    act(() => pinCodeBox.instance.props.onPinComplete('123456'))
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should show "pass code mismatch ..." message and reset to initial state after passcode mismatch', () => {
    jest.useFakeTimers()
    const pinCodeBox = component.root.findByType(PinCodeBox)
    //manually trigger onComplete method by passing "pass code" for first time
    act(() => pinCodeBox.instance.props.onPinComplete('123456'))
    //manually trigger onComplete method by passing "some another pass code" for second time
    act(() => pinCodeBox.instance.props.onPinComplete('000000'))

    const firstSnap = component.toJSON()
    expect(firstSnap).toMatchSnapshot()
    act(() => jest.runAllTimers())

    expect(component.toJSON()).toMatchSnapshot()
  })
})
