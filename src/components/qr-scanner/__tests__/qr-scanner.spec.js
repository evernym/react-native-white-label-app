// @flow
import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { SCAN_STATUS } from '../type-qr-scanner'
import QRScanner from '../qr-scanner'
import {
  qrData,
  validQrCodeEnvironmentSwitchUrl,
  validInvitationUrlQrCode,
  smsDownloadedPayload,
} from '../../../../__mocks__/static-data'
import { mockAriesV1QrCode } from '../../../../__mocks__/data/mock-qr-data'
import * as fetch from '../../../common/flat-fetch'
import { convertSmsPayloadToInvitation } from '../../../sms-pending-invitation/sms-pending-invitation-store'
import { CONNECTION_INVITE_TYPES } from '../../../invitation/type-invitation'
import * as vcx from '../../../bridge/react-native-cxs/RNCxs'

describe('<QRScanner />', () => {
  const getProps = () => ({
    onClose: jest.fn(),
    onRead: jest.fn(),
    onEnvironmentSwitchUrl: jest.fn(),
    onInvitationUrl: jest.fn(),
    onOIDCAuthenticationRequest: jest.fn(),
    onAriesConnectionInviteRead: jest.fn(),
    onAriesOutOfBandInviteRead: jest.fn(),
    onEphemeralProofRequest: jest.fn(),
  })

  function setup() {
    const props = getProps()
    const wrapper = renderer.create(<QRScanner {...props} />)
    const instance = wrapper.getInstance()
    return {
      ...props,
      instance,
      wrapper,
    }
  }

  it('should match snapshot', () => {
    const { wrapper } = setup()
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('should call onRead once QR code read is successful', async () => {
    jest.useFakeTimers()
    const { onRead, instance } = setup()

    const qrReadEvent = {
      data: JSON.stringify(qrData),
    }

    await instance.onRead(qrReadEvent)
    expect(onRead).toHaveBeenCalledWith(expect.objectContaining(qrData))
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SCANNING)
  })

  it('should set state to fail if QR code is not correct', async () => {
    jest.useFakeTimers()

    const { instance } = setup()

    await instance.onRead({ data: '' })
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.FAIL)

    jest.runAllTimers()

    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SCANNING)
  })

  // this functionality is commented as of now
  xit('should call onEnvironmentSwitchUrl if it reads correct environment switcher url', async () => {
    jest.useFakeTimers()
    const { onEnvironmentSwitchUrl, instance } = setup()

    await instance.onRead({ data: validQrCodeEnvironmentSwitchUrl })
    expect(onEnvironmentSwitchUrl).toHaveBeenCalledWith({
      name: 'dev',
      url: validQrCodeEnvironmentSwitchUrl,
    })
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SUCCESS)
  })

  it('should send a request to download invitation if url is scanned', async () => {
    jest.useFakeTimers()
    const invitationDetailRequestSpy = jest.spyOn(fetch, 'flatFetch')

    invitationDetailRequestSpy.mockImplementation(() =>
      Promise.resolve([null, JSON.stringify(smsDownloadedPayload)])
    )

    const { onInvitationUrl, instance } = setup()

    const pendingQrProcessing = instance.onRead({
      data: validInvitationUrlQrCode,
    })
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.DOWNLOADING)
    // process API call
    await pendingQrProcessing

    expect(onInvitationUrl).toHaveBeenCalledWith(
      convertSmsPayloadToInvitation(smsDownloadedPayload)
    )
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SCANNING)

    invitationDetailRequestSpy.mockReset()
    invitationDetailRequestSpy.mockRestore()

    jest.runAllTimers()

    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SCANNING)
  })

  it('should call onAriesConnectionInviteRead, if we get aries QR code', async () => {
    jest.useFakeTimers()
    const { onAriesConnectionInviteRead, instance } = setup()

    const qrReadEvent = {
      data: JSON.stringify(mockAriesV1QrCode),
    }

    await instance.onRead(qrReadEvent)
    expect(onAriesConnectionInviteRead).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: mockAriesV1QrCode,
        type: CONNECTION_INVITE_TYPES.ARIES_V1_QR,
        version: '1.0',
      })
    )
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SCANNING)
  })

  it('should call onAriesConnectionInviteRead, if we pass a url that gives aries v1 qr code', async () => {
    jest.useFakeTimers()

    const toUtf8Spy = jest.spyOn(vcx, 'toUtf8FromBase64')
    toUtf8Spy.mockImplementation(() =>
      Promise.resolve(JSON.stringify(mockAriesV1QrCode))
    )

    const { onAriesConnectionInviteRead, instance } = setup()

    const pendingQrProcessing = instance.onRead({
      data: `${validInvitationUrlQrCode}?c_i=${JSON.stringify(
        mockAriesV1QrCode
      )}`,
    })
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.DOWNLOADING)
    // process API call
    await pendingQrProcessing

    expect(onAriesConnectionInviteRead).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: mockAriesV1QrCode,
        type: CONNECTION_INVITE_TYPES.ARIES_V1_QR,
        version: '1.0',
      })
    )
    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SCANNING)

    toUtf8Spy.mockReset()
    toUtf8Spy.mockRestore()

    jest.runAllTimers()

    expect(instance.state.scanStatus).toBe(SCAN_STATUS.SCANNING)
  })
})
