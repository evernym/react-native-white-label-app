// @flow
import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { SplashScreenView } from '../splash-screen'
import { getNavigation, getStore } from '../../../__mocks__/static-data'
import { Provider } from 'react-redux'

describe('<SplashScreen />', () => {
  function getProps(overrideProps = {}) {
    const getLock = () => {
      const { lock } = getStore().getState()
      return lock
    }
    const initStore: any = {
      ...getStore().getState(),
      lock: { ...getLock(), isAppLocked: true },
    }
    const store = getStore(initStore)
    const props = {
      navigation: getNavigation(),
      route: {},
      addPendingRedirection: jest.fn(),
      ...overrideProps,
    }

    return { store, props }
  }

  function setup() {
    const { store, props } = getProps()
    const component = renderer.create(
      <Provider store={store}>
        <SplashScreenView {...props} />
      </Provider>
    )
    const instance = component.root.instance

    return { store, props, component, instance }
  }

  it('should match snapshot', () => {
    const { component } = setup()
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // FIXME: restore tests bellow
  // xit(`should show invitation if invitation is fetched and app is unlocked`, () => {
  //
  //   const { component, props } = setup()
  //   const { deepLink, deepLinkProcessed, lock, navigation } = props
  //   const updatedDeepLink = {
  //     ...deepLink,
  //     isLoading: false,
  //     tokens: {
  //       '3651947c': {
  //         status: DEEP_LINK_STATUS.NONE,
  //         token: '3651947c',
  //         error: null,
  //       },
  //     },
  //   }
  //   const smsPendingInvitation = getSmsPendingInvitationOfToken('3651947c')
  //   component.update(
  //     <SplashScreenView
  //       {...props}
  //       deepLink={updatedDeepLink}
  //       lock={{ ...lock, isAppLocked: false }}
  //       smsPendingInvitation={smsPendingInvitation}
  //     />,
  //   )
  //   expect(deepLinkProcessed).toHaveBeenCalledWith('3651947c')
  //
  //   if (Platform.OS === 'ios') {
  //     expect(navigation.push).toHaveBeenCalledWith(pushNotificationPermissionRoute, {
  //       senderDID: senderDid1,
  //       'token': '3651947c',
  //     })
  //   } else {
  //     expect(navigation.push).toHaveBeenCalledWith(invitationRoute, {
  //       senderDID: senderDid1,
  //       token: '3651947c',
  //     })
  //   }
  // })
  //
  // xit(`should add invitation route to pending redirection if invitation is fetched and app is locked`, () => {
  //   const { component, props } = setup()
  //   const { deepLink, deepLinkProcessed, addPendingRedirection, lock } = props
  //
  //   const updatedDeepLink = {
  //     ...deepLink,
  //     isLoading: false,
  //     tokens: {
  //       '3651947c': {
  //         status: DEEP_LINK_STATUS.NONE,
  //         token: '3651947c',
  //         error: null,
  //       },
  //     },
  //   }
  //   const smsPendingInvitation = getSmsPendingInvitationOfToken('3651947c')
  //   component.update(
  //     <SplashScreenView
  //       {...props}
  //       deepLink={updatedDeepLink}
  //       lock={{ ...lock, isAppLocked: true }}
  //       smsPendingInvitation={smsPendingInvitation}
  //     />,
  //   )
  //   expect(deepLinkProcessed).toHaveBeenCalledWith('3651947c')
  //   expect(addPendingRedirection).toHaveBeenCalledWith([
  //     { routeName: waitForInvitationRoute },
  //   ])
  // })
})
