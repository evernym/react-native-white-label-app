// @flow
import 'react-native'
import { Platform } from 'react-native'
import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { Provider } from 'react-redux'
import { Apptentive } from 'apptentive-react-native'

import { Settings } from '../settings'
import { getStore, getNavigation } from '../../../__mocks__/static-data'
import {
  settingsRoute,
  lockTouchIdSetupRoute,
  genRecoveryPhraseRoute,
  aboutAppRoute,
  onfidoRoute,
  lockAuthorizationHomeRoute,
} from '../../common'
import * as feedback from '../../feedback'
import { MockedNavigator } from '../../../__mocks__/mock-navigator'

describe('user settings screen', () => {
  jest.useFakeTimers()

  const store = getStore()

  function getProps() {
    return {
      walletBackup: {
        encryptionKey: 'walletEncryptionKey',
        status: 'IDLE',
      },
      timeStamp: new Date().getTime(),
      currentScreen: settingsRoute,
      navigation: getNavigation(),
      selectUserAvatar: jest.fn(),
      touchIdActive: false,
      jest,
      hasVerifiedRecoveryPhrase: false,
      autoCloudBackupEnabled: false,
      navigationOptions: jest.fn(),
      walletBalance: '190009',
      lastSuccessfulBackup: store.getState().backup.lastSuccessfulBackup,
      lastSuccessfulCloudBackup: store.getState().backup
        .lastSuccessfulCloudBackup,
      isCloudBackupEnabled: false,
      generateRecoveryPhrase: jest.fn(),
      setAutoCloudBackupEnabled: jest.fn(),
      connectionHistoryBackedUp: jest.fn(),
      cloudBackupFailure: jest.fn(),
      addPendingRedirection: jest.fn(),
      hasViewedWalletError: false,
      cloudBackupStart: jest.fn(),
      viewedWalletError: jest.fn(),
      route: {},
    }
  }

  function setup() {
    const props = getProps()
    return { props }
  }

  function getMockedNavigator(props) {
    const component = () => (
      <Provider store={store}>
        <Settings {...props} />
      </Provider>
    )

    return <MockedNavigator component={component} />
  }

  function render(props) {
    const wrapper = renderer.create(getMockedNavigator(props))
    act(() => jest.runAllTimers())
    const componentInstance = wrapper.root.findByType(Settings).instance
    return { wrapper, componentInstance }
  }

  it('should render properly and snapshot should match ios platform', () => {
    const { props } = setup()
    const { wrapper } = render(props)
    const tree = wrapper.toJSON()
    expect(tree).toMatchSnapshot()
  })

  xit('should render properly and snapshot should match for android platform', () => {
    // skipping this test, somehow react-navigation v5 is not working correctly with jest on Android
    const existingOS = Platform.OS
    Platform.OS = 'android'

    const { props } = setup()
    const { wrapper } = render(props)
    const tree = wrapper.toJSON()
    expect(tree).toMatchSnapshot()

    // revert environment to what it was before
    Platform.OS = existingOS
  })

  it('should not call navigation.push if settings screen is not focussed', () => {
    const { props } = setup()
    const isFocused = jest.fn().mockReturnValue(false)
    const { wrapper } = render({
      ...props,
      navigation: { ...props.navigation, isFocused },
    })
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangePinClick()
    expect(props.navigation.push).not.toBeCalled()
  })

  it('should navigate to lockEnterPin screen', () => {
    const { props } = setup()
    const { navigation } = props
    const { wrapper } = render(props)
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangePinClick()
    expect(navigation.navigate).toHaveBeenCalledWith(
      lockAuthorizationHomeRoute,
      {
        onSuccess: componentInstance.onAuthSuccess,
      }
    )
  })

  it('should not navigate to lockTouchIdSetup if settings screen is not focussed', () => {
    const { props } = setup()
    const isFocused = jest.fn().mockReturnValue(false)
    let { navigation } = props
    const { wrapper } = render({
      ...props,
      navigation: { ...props.navigation, isFocused },
    })
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangeTouchId(true)
    componentInstance.onChangeTouchId(false)
    expect(navigation.push).not.toBeCalled()
  })

  it('should navigate to lockTouchIdSetup screen', () => {
    const { props } = setup()
    const { navigation } = props
    const { wrapper } = render(props)
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangeTouchId(true)
    expect(navigation.push).toHaveBeenCalledWith(lockTouchIdSetupRoute, {
      fromSettings: true,
    })
  })

  it('should navigate to genRecoveryPhrase screen', () => {
    const { props } = setup()
    let { navigation } = props
    const { wrapper } = render(props)
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onBackup()
    expect(navigation.navigate).toHaveBeenCalledWith(genRecoveryPhraseRoute, {
      initialRoute: 'someRouteName',
    })
  })

  it('should not navigate to aboutApp', () => {
    const { props } = setup()
    const isFocused = jest.fn().mockReturnValue(false)
    let { navigation } = props
    const { wrapper } = render({
      ...props,
      navigation: { ...navigation, isFocused },
    })
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.openAboutApp()
    expect(navigation.navigate).not.toBeCalled()
  })

  it('should navigate to aboutApp screen', () => {
    const { props } = setup()
    const { navigation } = props
    const { wrapper } = render(props)
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.openAboutApp()
    expect(navigation.navigate).toHaveBeenCalledWith(aboutAppRoute, {})
  })

  xit('should navigate to onfido screen', () => {
    // skip this test, somehow react-navigation v5 is not working correctly with jest on Android
    // have NativeModules.I18nManager.localeIdentifier(android) set to 'en_US'
    // in setup.js which is valid location and onfido should navigate
    Platform.OS = 'android'
    const { props } = setup()
    const { navigation } = props
    const { wrapper } = render(props)
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.openOnfido()
    expect(navigation.navigate).toHaveBeenCalledWith(onfidoRoute, {})
    Platform.OS = 'ios'
  })

  // it('should not navigate to onfido screen', () => {
  //   // have NativeModules.SettingsManager.settings.AppleLocale(ios) set to 'en_XX'
  //   // in setup.js which is NOT a valid location and onfido should NOT navigate
  //   Platform.OS = 'ios'
  //   spyOn(RNLocalize, 'getLocales').and.returnValue([{ countryCode: 'IN' }])
  //   const { props } = setup()
  //   const { navigation } = props
  //   const { wrapper } = render(props)
  //   const componentInstance = wrapper.root.findByType(Settings).instance
  //   componentInstance.openOnfido()
  //   expect(navigation.navigate).not.toBeCalled()
  // })

  it('should invoke Apptentive message center', async () => {
    const { componentInstance } = render()
    const setupApptentiveSpy = jest.spyOn(feedback, 'setupApptentive')
    setupApptentiveSpy.mockImplementation(() => Promise.resolve(''))
    const presentMessageCenterSpy = jest.spyOn(
      Apptentive,
      'presentMessageCenter'
    )
    if (componentInstance) {
      await componentInstance.openFeedback()
    }
    expect(presentMessageCenterSpy).toHaveBeenCalled()
    presentMessageCenterSpy.mockRestore()
    setupApptentiveSpy.mockRestore()
  })

  it('should hide wallet backup modal', () => {
    const { componentInstance } = render()
    componentInstance &&
      componentInstance.setState({ walletBackupModalVisible: true })
    componentInstance && componentInstance.hideWalletPopupModal()
    expect(
      componentInstance && componentInstance.state.walletBackupModalVisible
    ).toBe(false)
    act(() => jest.runOnlyPendingTimers())
  })

  it('should enable TouchIdSwitch', () => {
    const { props } = setup()
    const { wrapper, componentInstance } = render(props)

    wrapper.update(
      getMockedNavigator({ ...props, currentScreen: lockTouchIdSetupRoute })
    )
    expect(
      componentInstance && componentInstance.state.disableTouchIdSwitch
    ).toBe(true)

    wrapper.update(
      getMockedNavigator({
        ...props,
        currentScreen: settingsRoute,
      })
    )
    wrapper.update(
      getMockedNavigator({
        ...props,
        timeStamp: new Date().getTime(),
      })
    )
    expect(
      componentInstance && componentInstance.state.disableTouchIdSwitch
    ).toBe(false)
  })

  it('should show wallet backup modal', () => {
    const { props } = setup()
    const { wrapper, componentInstance } = render(props)

    const walletBackup = { ...props.walletBackup, status: 'SUCCESS' }
    wrapper.update(getMockedNavigator({ ...props, walletBackup }))
    expect(
      componentInstance && componentInstance.state.walletBackupModalVisible
    ).toBe(true)
  })
})
