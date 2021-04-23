// @flow

import 'react-native'

import * as vcx from '../../bridge/react-native-cxs/RNCxs'
import { validateEphemeralProofQrCode } from '../proof-request-qr-code-reader'
import { mockEphemeralProofRequestQrCode } from '../../../__mocks__/data/mock-qr-data'
import { originalProofRequestData } from '../../../__mocks__/static-data'

describe('ephemeral-proof-request-qr-code-reader', () => {
  it('should return error code EPR-002', async () => {
    const decodeSpy = jest.spyOn(vcx, 'toUtf8FromBase64')
    decodeSpy.mockImplementation(() =>
      Promise.resolve(
        JSON.stringify({ ...mockEphemeralProofRequestQrCode, '@id': 1 })
      )
    )

    const [error] = await validateEphemeralProofQrCode(
      '{"key":"this json should not be used, and decode response should be used"}'
    )

    expect(error).toBe('EPR-002::Invalid data.')

    decodeSpy.mockReset()
    decodeSpy.mockRestore()
  })

  it('should return error code EPR-003', async () => {
    const decodeSpy = jest.spyOn(vcx, 'toUtf8FromBase64')
    decodeSpy
      .mockImplementationOnce(() => Promise.reject('invalid base64 qr code'))
      .mockImplementationOnce(() =>
        Promise.reject('some error for decoding proof request data')
      )

    const [error] = await validateEphemeralProofQrCode(
      JSON.stringify(mockEphemeralProofRequestQrCode)
    )

    expect(error).toBe('EPR-002::Invalid data.')

    decodeSpy.mockReset()
    decodeSpy.mockRestore()
  })

  it('should return error code EPR-004', async () => {
    const decodeSpy = jest.spyOn(vcx, 'toUtf8FromBase64')
    decodeSpy
      .mockImplementationOnce(() => Promise.reject('invalid base64 qr code'))
      .mockImplementationOnce(() =>
        Promise.resolve('invalid data which is not json format')
      )

    const [error] = await validateEphemeralProofQrCode(
      mockEphemeralProofRequestQrCode
    )

    expect(error).toBe('EPR-003::Invalid proof request.')

    decodeSpy.mockReset()
    decodeSpy.mockRestore()
  })

  it('should return error code EPR-005', async () => {
    const decodeSpy = jest.spyOn(vcx, 'toUtf8FromBase64')
    decodeSpy
      .mockImplementationOnce(() => Promise.reject('invalid base64 qr code'))
      .mockImplementationOnce(() =>
        Promise.resolve(
         {
            ...originalProofRequestData,
            requested_attributes: {
              name: {
                name: 'address',
                restrictions: 'some restrictions',
              },
            },
          }
        )
      )

    const [error] = await validateEphemeralProofQrCode(
      mockEphemeralProofRequestQrCode
    )

    expect(error).toBe('EPR-003::Invalid proof request.')

    decodeSpy.mockReset()
    decodeSpy.mockRestore()
  })

  it('should match valid ephemeral proof request qr code', async () => {
    const decodeSpy = jest.spyOn(vcx, 'toUtf8FromBase64')
    decodeSpy
      .mockImplementationOnce(() => Promise.reject('invalid base64 qr code'))
      .mockImplementationOnce(() =>
        Promise.resolve(
          JSON.stringify({
            ...originalProofRequestData,
          })
        )
      )

    const [, ephemeralProofRequest] = await validateEphemeralProofQrCode(
      JSON.stringify(mockEphemeralProofRequestQrCode)
    )

    expect(ephemeralProofRequest).toMatchSnapshot()

    decodeSpy.mockReset()
    decodeSpy.mockRestore()
  })

  it('should match valid ephemeral proof request with null comment, and null routingKeys', async () => {
    const decodeSpy = jest.spyOn(vcx, 'toUtf8FromBase64')
    decodeSpy
      .mockImplementationOnce(() => Promise.reject('invalid base64 qr code'))
      .mockImplementationOnce(() =>
        Promise.resolve(
          JSON.stringify({
            ...originalProofRequestData,
          })
        )
      )

    const [, ephemeralProofRequest] = await validateEphemeralProofQrCode(
      JSON.stringify({
        ...mockEphemeralProofRequestQrCode,
        comment: null,
        '~service': {
          ...mockEphemeralProofRequestQrCode['~service'],
          routingKeys: null,
        },
      })
    )

    expect(ephemeralProofRequest).toMatchSnapshot()

    decodeSpy.mockReset()
    decodeSpy.mockRestore()
  })
})
