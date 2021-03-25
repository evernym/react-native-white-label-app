// @flow
import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'

import {
  homeRoute,
  waitForInvitationRoute,
  invitationRoute,
  pushNotificationPermissionRoute,
} from '../../common/'
import { SplashScreenView } from '../splash-screen'
import {
  getNavigation,
  getStore,
  getSmsPendingInvitationOfToken,
  senderDid1,
} from '../../../__mocks__/static-data'
import { DEEP_LINK_STATUS } from '../../deep-link/type-deep-link'
import { Platform } from 'react-native'

describe('<SplashScreen />', () => {
  function getProps(overrideProps = {}) {
    const getLock = () => {
      const { lock } = getStore().getState()
      return lock
    }
    // TODO: We have to fix the problem in getStore function, we should be just able to pass an object and
    // TODO: it should deep extend default store state. We can't do these many calls for getStore and getState
    // TODO: for any property that we want to override
    const initStore: any = {
      ...getStore().getState(),
      lock: { ...getLock(), isAppLocked: true },
    }
    const store = getStore(initStore)
    const {
      deepLink,
      config,
      lock,
      smsPendingInvitation,
      eula,
      history,
      claimOffer,
      proofRequest,
    } = store.getState()
    const props = {
      historyData: history.data,
      navigation: getNavigation(),
      route: {},
      deepLink,
      isInitialized: config.isInitialized,
      lock,
      eula,
      smsPendingInvitation,
      addPendingRedirection: jest.fn(),
      getSmsPendingInvitation: jest.fn(),
      safeToDownloadSmsInvitation: jest.fn(),
      deepLinkProcessed: jest.fn(),
      invitationReceived: jest.fn(),
      allPublicDid: {},
      allDid: {},
      claimOffers: claimOffer,
      proofRequests: proofRequest,
      claimOfferReceived: jest.fn(),
      proofRequestReceived: jest.fn(),
      ...overrideProps,
    }

    return { store, props }
  }

  function setup() {
    const { store, props } = getProps()
    const component = renderer.create(<SplashScreenView {...props} />)
    const instance = component.root.instance

    return { store, props, component, instance }
  }

  it('should match snapshot', () => {
    const { component } = setup()
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should add home route to pending redirection if deepLink is empty', () => {
    const { component, props } = setup()
    const { deepLink, addPendingRedirection } = props
    component.update(
      <SplashScreenView
        {...props}
        deepLink={{ ...deepLink, isLoading: false }}
      />
    )
    expect(addPendingRedirection).toHaveBeenCalledWith([
      { routeName: homeRoute },
    ])
  })

  it('should go To homeRoute if deepLink is empty and app was unlocked', () => {
    const { component, props } = setup()
    const { deepLink, navigation, lock } = props
    component.update(
      <SplashScreenView
        {...props}
        lock={{ ...lock, isAppLocked: false }}
        deepLink={{ ...deepLink, isLoading: false }}
      />
    )
    expect(navigation.navigate).toHaveBeenCalledWith(homeRoute, undefined)
  })

  it(`should goto 'waitForInvitation' screen and fetch invitation if a deepLink was found and app was unlocked`, () => {
    const { component, props } = setup()
    const { deepLink, getSmsPendingInvitation, lock, navigation } = props
    const updatedDeepLink = {
      ...deepLink,
      isLoading: false,
      tokens: {
        token1: {
          status: DEEP_LINK_STATUS.NONE,
          token: 'token1',
          error: null,
        },
      },
    }
    component.update(
      <SplashScreenView
        {...props}
        deepLink={updatedDeepLink}
        lock={{ ...lock, isAppLocked: false }}
      />
    )
    expect(getSmsPendingInvitation).toHaveBeenCalledWith('token1')
    expect(navigation.navigate).toHaveBeenCalledWith(waitForInvitationRoute, undefined)
  })

  it(`should go to 'waitForInvitation' screen and fetch invitation if the same deepLink was used twice`, () => {
    const { component, props } = setup()
    const { deepLink, getSmsPendingInvitation, lock, navigation } = props
    const updatedDeepLink = {
      ...deepLink,
      isLoading: false,
      tokens: {
        token1: {
          status: DEEP_LINK_STATUS.NONE,
          token: 'token1',
          error: null,
        },
      },
    }
    const finishedDeepLink = {
      ...updatedDeepLink,
      tokens: {
        token1: {
          status: DEEP_LINK_STATUS.PROCESSED,
        },
      },
    }

    component.update(
      <SplashScreenView
        {...props}
        deepLink={finishedDeepLink}
        lock={{ ...lock, isAppLocked: false }}
      />
    )
    component.update(
      <SplashScreenView
        {...props}
        deepLink={updatedDeepLink}
        lock={{ ...lock, isAppLocked: false }}
      />
    )

    expect(getSmsPendingInvitation).toHaveBeenCalledWith('token1')
    expect(navigation.navigate).toHaveBeenCalledWith(waitForInvitationRoute, undefined)
  })

  // FIXME: restore tests bellow
  xit(`should show invitation if invitation is fetched and app is unlocked`, () => {

    const { component, props } = setup()
    const { deepLink, deepLinkProcessed, lock, navigation } = props
    const updatedDeepLink = {
      ...deepLink,
      isLoading: false,
      tokens: {
        '3651947c': {
          status: DEEP_LINK_STATUS.NONE,
          token: '3651947c',
          error: null,
        },
      },
    }
    const smsPendingInvitation = getSmsPendingInvitationOfToken('3651947c')
    component.update(
      <SplashScreenView
        {...props}
        deepLink={updatedDeepLink}
        lock={{ ...lock, isAppLocked: false }}
        smsPendingInvitation={smsPendingInvitation}
      />
    )
    expect(deepLinkProcessed).toHaveBeenCalledWith('3651947c')

    if (Platform.OS === 'ios') {
      expect(navigation.push).toHaveBeenCalledWith(pushNotificationPermissionRoute, {
        senderDID: senderDid1,
        "token": "3651947c",
      })
    } else {
      expect(navigation.push).toHaveBeenCalledWith(invitationRoute, {
        senderDID: senderDid1,
        token: '3651947c',
      })
    }
  })

  xit(`should add invitation route to pending redirection if invitation is fetched and app is locked`, () => {
    const { component, props } = setup()
    const { deepLink, deepLinkProcessed, addPendingRedirection, lock } = props

    const updatedDeepLink = {
      ...deepLink,
      isLoading: false,
      tokens: {
        '3651947c': {
          status: DEEP_LINK_STATUS.NONE,
          token: '3651947c',
          error: null,
        },
      },
    }
    const smsPendingInvitation = getSmsPendingInvitationOfToken('3651947c')
    component.update(
      <SplashScreenView
        {...props}
        deepLink={updatedDeepLink}
        lock={{ ...lock, isAppLocked: true }}
        smsPendingInvitation={smsPendingInvitation}
      />
    )
    expect(deepLinkProcessed).toHaveBeenCalledWith('3651947c')
    expect(addPendingRedirection).toHaveBeenCalledWith([
      { routeName: waitForInvitationRoute },
    ])
  })
})
