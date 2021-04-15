// @flow
import React from 'react'
import 'react-native'
import { Alert, Platform } from 'react-native'
import renderer from 'react-test-renderer'

import { qrCodeScannerTabRoute } from '../../common/'
import { QRCodeScannerScreen } from '../qr-code'
import {
  getNavigation,
  qrData,
  validQrCodeEnvironmentSwitchUrl,
} from '../../../__mocks__/static-data'
import { convertShortProprietaryInvitationToAppInvitation } from '../../invitation/kinds/proprietary-connection-invitation'

describe('<QRScannerScreen />', () => {
  function getProps() {
    return {
      historyData: {},
      navigation: getNavigation(),
      route: {},
      invitationReceived: jest.fn(),
      currentScreen: qrCodeScannerTabRoute,
      changeEnvironmentUrl: jest.fn(),
      enableCamera: jest.fn(),
      isCameraEnabled: true,
      allPublicDid: {},
      allDid: {},
      claimOffers: {},
      proofRequests: {},
      verifiers: {},
      openIdConnectUpdateStatus: jest.fn(),
      claimOfferReceived: jest.fn(),
      proofRequestReceived: jest.fn(),
      proofProposalReceived: jest.fn(),
      getPushNotificationAuthorizationStatus: jest.fn(),
    }
  }

  function setup() {
    const props = getProps()
    const component = renderer.create(<QRCodeScannerScreen {...props} />)
    const instance: QRCodeScannerScreen = component.getInstance()

    return { props, component, instance }
  }

  it('should match snapshot for ios platform', () => {
    const existingOS = Platform.OS
    Platform.OS = 'ios'

    const { instance, component } = setup()
    instance.setState({ isCameraEnabled: true })
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()

    Platform.OS = existingOS
  })

  it('should match snapshot for android platform', () => {
    const existingOS = Platform.OS
    Platform.OS = 'android'

    const { instance, component } = setup()
    instance.setState({ isCameraEnabled: true })
    instance.setState({ permission: true })
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()

    Platform.OS = existingOS
  })

  it('match snapshot when camera is not authorized for ios platform', () => {
    const existingOS = Platform.OS
    Platform.OS = 'ios'

    const { component } = setup()
    expect(component.toJSON()).toMatchSnapshot()

    Platform.OS = existingOS
  })

  it('match snapshot when camera is not authorized for android platform', () => {
    const existingOS = Platform.OS
    Platform.OS = 'android'

    const { component, instance } = setup()
    instance.setState({ permission: true })
    expect(component.toJSON()).toMatchSnapshot()

    Platform.OS = existingOS
  })

  it('should convert qr code to invitation', () => {
    expect(
      convertShortProprietaryInvitationToAppInvitation(qrData)
    ).toMatchSnapshot()
  })

  it('should redirect user to invitation screen on success read', () => {
    const {
      instance,
      props: { invitationReceived },
    } = setup()

    instance.onShortProprietaryInvitationRead(qrData)
    expect(invitationReceived).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: convertShortProprietaryInvitationToAppInvitation(qrData),
      })
    )
  })

  it('should navigate back to home if qr code scanner is closed', () => {
    const { instance, props } = setup()
    instance.onClose()
    expect(props.navigation.goBack).toHaveBeenCalledWith(null)
  })

  // skipping this test because as of now this code is commented and not used
  xit(`show alert if environment switch url is scanned,
      trigger action when Switch is clicked,
      and redirect to home tab`, () => {
    const {
      props: {
        changeEnvironmentUrl,
        navigation: { goBack },
      },
    } = setup()
    const alertSpy = jest.spyOn(Alert, 'alert')

    //instance.onEnvironmentSwitchUrl(environmentSwitchQrCodeData)
    expect(alertSpy).toHaveBeenCalled()

    const switchButton = alertSpy.mock.calls[0][2][1]
    // click switch button
    switchButton.onPress()

    expect(changeEnvironmentUrl).toHaveBeenCalledWith(
      validQrCodeEnvironmentSwitchUrl
    )

    expect(goBack).toHaveBeenCalledWith(null)

    alertSpy.mockReset()
    alertSpy.mockRestore()
  })
})
