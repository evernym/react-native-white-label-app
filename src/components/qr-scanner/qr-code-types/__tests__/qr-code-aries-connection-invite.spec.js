// @flow

import URLParse from 'url-parse'

import {
  mockAriesV1InvitationUrl,
  mockAriesV1QrCodeNoRecipientKeys,
  mockAriesV1QrCodeNoRoutingKeys,
  mockAriesV1QrCodeNullRoutingKeys,
  mockAriesV1QrCodeNoLabel,
  mockAriesV1QrCodeNullLabel,
  mockAriesV1QrCode,
} from '../../../../../__mocks__/data/mock-qr-data'
import * as vcx from '../../../../bridge/react-native-cxs/RNCxs'
import {isEncodedAriesConnectionInvitation} from "../../../../invitation/kinds/aries-connection-invitation";

describe('qr-code-aries::connection-invite', () => {
  const parsedUrl = URLParse(mockAriesV1InvitationUrl, {}, true)

  it('should return AriesConnectionInvite if routingKeys is not present', async () => {
    const spy = addSpy(mockAriesV1QrCodeNoRoutingKeys)

    const inviteResponse = await isEncodedAriesConnectionInvitation(parsedUrl)
    expect(inviteResponse).not.toBe(false)
    expect(inviteResponse).toMatchSnapshot()

    restore(spy)
  })

  it('should return AriesConnectionInvite if routingKeys is null', async () => {
    const spy = addSpy(mockAriesV1QrCodeNullRoutingKeys)

    const inviteResponse = await isEncodedAriesConnectionInvitation(parsedUrl)
    expect(inviteResponse).not.toBe(false)
    expect(inviteResponse).toMatchSnapshot()

    restore(spy)
  })

  it('should return AriesConnectionInvite if label is not present', async () => {
    const spy = addSpy(mockAriesV1QrCodeNoLabel)

    const inviteResponse = await isEncodedAriesConnectionInvitation(parsedUrl)
    expect(inviteResponse).not.toBe(false)
    expect(inviteResponse).toMatchSnapshot()

    restore(spy)
  })

  it('should return AriesConnectionInvite if label is null', async () => {
    const spy = addSpy(mockAriesV1QrCodeNullLabel)

    const inviteResponse = await isEncodedAriesConnectionInvitation(parsedUrl)
    expect(inviteResponse).not.toBe(false)
    expect(inviteResponse).toMatchSnapshot()

    restore(spy)
  })

  it('should return false if c_i param is not available', async () => {
    const inviteResponse = await isEncodedAriesConnectionInvitation(
      URLParse('http://localhost:80?c=ifahsjkfsd')
    )
    expect(inviteResponse).toBe(false)
  })

  it('should return false if one of required param is not passed', async () => {
    const spy = addSpy(mockAriesV1QrCodeNoRecipientKeys)

    const inviteResponse = await isEncodedAriesConnectionInvitation(parsedUrl)
    expect(inviteResponse).toBe(false)

    restore(spy)
  })

  it('should return false, if one of required param is null', async () => {
    const spy = addSpy({
      ...mockAriesV1QrCode,
      serviceEndpoint: null,
    })

    const inviteResponse = await isEncodedAriesConnectionInvitation(parsedUrl)
    expect(inviteResponse).toBe(false)

    restore(spy)
  })

  function addSpy(mockAriesV1Invitation: Object) {
    const toUtf8Spy = jest.spyOn(vcx, 'toUtf8FromBase64')
    toUtf8Spy.mockImplementation(() =>
      Promise.resolve(JSON.stringify(mockAriesV1Invitation))
    )

    return toUtf8Spy
  }

  function restore(spy: *) {
    spy.mockReset()
    spy.mockRestore()
  }
})
