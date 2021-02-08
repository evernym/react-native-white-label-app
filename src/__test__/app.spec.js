// @flow
import 'react-native'
import React from 'react'
import { BackHandler, ToastAndroid, Platform } from 'react-native'
import renderer from 'react-test-renderer'
import { MSDKMeApp } from './../app'
import delay from '@redux-saga/delay-p'
import { NativeModules } from 'react-native'
import {
  aboutAppRoute,
  lockPinSetupHomeRoute,
  lockAuthorizationHomeRoute,
  homeRoute,
} from '../common'

describe.skip('<App/>', () => {
  describe('in ios environment.', () => {
    let tree = null

    beforeAll(() => {
      tree = renderer.create(<MSDKMeApp />)
    })

    it('should render properly and snapshot should match', () => {
      expect(tree && tree.toJSON()).toMatchSnapshot()
    })

    it(`should not call BackHandler addEventListner`, () => {
      expect(BackHandler.addEventListener).not.toHaveBeenCalled()
    })
  })

  describe('in android environment.', () => {
    let tree = null

    beforeAll(() => {
      Platform.OS = 'android'
    })

    afterAll(() => {
      Platform.OS = 'ios'
    })

    beforeEach(() => {
      tree = renderer.create(<MSDKMeApp />)
    })

    it(`should have been called BackHandler addEventListener`, () => {
      expect(BackHandler.addEventListener).toHaveBeenCalled()
    })

    it(`should call BackHandler.removeEventListener before unmount`, () => {
      let instance = tree && tree.root && tree.root.instance
      instance && instance.componentWillUnmount()
      expect(BackHandler.removeEventListener).toHaveBeenCalled()
    })

    it(`should return false if backbutton was clicked in one of backButtonDisableRoutes`, () => {
      let instance = tree && tree.root && tree.root.instance
      if (instance) {
        instance.currentRouteKey = 'key'
        instance.currentRoute = aboutAppRoute
      }
      expect(instance && instance.handleBackButtonClick()).toBe(false)
    })

    // lockPinSetupHomeRoute
    it(`should redirect to settingsTab screen if user has pressed back button from lockPinSetup screen if user has already setup `, () => {
      let instance = tree && tree.root && tree.root.instance
      const dispatch = jest.fn()
      if (instance) {
        instance.currentRouteParams = { existingPin: true }
        instance.navigatorRef = { current: { dispatch } }
        instance.currentRouteKey = 'key'
        instance.currentRoute = lockPinSetupHomeRoute
      }
      expect(instance && instance.handleBackButtonClick()).toBe(true)
      expect(dispatch).toMatchSnapshot()
      dispatch.mockReset()
      dispatch.mockRestore()
    })

    it(`should redirect to lockSelectionRoute screen if user has no existing pin ands pressed back button from lockPinSetup screen `, () => {
      let instance = tree && tree.root && tree.root.instance
      const dispatch = jest.fn()
      if (instance) {
        instance.currentRouteParams = { existingPin: false }
        instance.navigatorRef = { current: { dispatch } }
        instance.currentRouteKey = 'key'
        instance.currentRoute = lockPinSetupHomeRoute
      }
      expect(instance && instance.handleBackButtonClick()).toBe(true)
      expect(dispatch).toMatchSnapshot()
      dispatch.mockReset()
      dispatch.mockRestore()
    })

    it(`should call onAvoid method if user has pressed back button in lockAuthorization screen`, () => {
      let instance = tree && tree.root && tree.root.instance
      const onAvoid = jest.fn()
      if (instance) {
        instance.currentRouteParams = { onAvoid }
        instance.currentRouteKey = 'key'
        instance.currentRoute = lockAuthorizationHomeRoute
      }
      expect(instance && instance.handleBackButtonClick()).toBe(false)
      expect(onAvoid).toHaveBeenCalled()
      onAvoid.mockReset()
      onAvoid.mockRestore()
    })

    it(`should call onBackPressExit method if user has pressed back button in home screen`, () => {
      let instance = tree && tree.root && tree.root.instance

      if (instance) {
        instance.currentRouteKey = 'key'
        instance.currentRoute = homeRoute
      }
      expect(instance && instance.exitTimeout).toBe(0)
      expect(instance && instance.handleBackButtonClick()).toBe(true)
      expect(instance && instance.exitTimeout).not.toBe(0)
    })

    it(`should dispatch navigation action`, () => {
      let instance = tree && tree.root && tree.root.instance
      const dispatch = jest.fn()
      if (instance) {
        instance.navigatorRef = { current: { dispatch } }
      }
      instance && instance.navigateToRoute('routeName', { existingPin: true })
      expect(dispatch).toMatchSnapshot()
      dispatch.mockReset()
      dispatch.mockRestore()
    })

    it('user should exit from app if back button pressed twice with less than 2000 milliseconds gap', async () => {
      let instance = tree && tree.root && tree.root.instance
      const spy = jest.spyOn(ToastAndroid, 'show')
      const { RNIndy } = NativeModules
      instance && instance.onBackPressExit()
      expect(spy).toHaveBeenCalled()
      await delay(1000)
      instance && instance.onBackPressExit()
      expect(RNIndy.exitAppAndroid).toHaveBeenCalled()
      RNIndy.exitAppAndroid.mockClear()
      spy.mockReset()
      spy.mockRestore()
    })
  })
})
