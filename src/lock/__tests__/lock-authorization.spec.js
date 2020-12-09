// @flow
import React from 'react'
import { create, act } from 'react-test-renderer'
import { Provider } from 'react-redux'
import { LockAuthorization } from '../lock-authorization'
import { getNavigation, getStore } from '../../../__mocks__/static-data'
import { LockEnter } from '../lock-enter'

jest.useFakeTimers()

describe('<LockAuthorization />', () => {
  it('should match snapshot', () => {
    const { component } = setup()
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('go back and call success onSuccess', () => {
    const { props, lockEnterInstance } = setup()

    lockEnterInstance && lockEnterInstance.props.onSuccess()
    expect(props.route.params.onSuccess).toHaveBeenCalled()
  })

  function setup() {
    const props = getProps()
    const store = getStore()
    let component
    act(() => {
      component = create(
        <Provider store={store}>
          <LockAuthorization {...props} />
        </Provider>
      )
    })

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    if (!component) {
      throw new Error('component not found')
    }

    const lockEnterInstance = component.root.findByType(LockEnter).instance

    return { props, component, lockEnterInstance }
  }

  function getProps() {
    return {
      navigation: getNavigation(),
      route: {
        params: { onSuccess: jest.fn(), onAvoid: jest.fn() },
      },
    }
  }
})
