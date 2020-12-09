// @flow

import { isValidUrlQrCode } from '../qr-code-types/qr-url'

describe('fn:isValidUrlQrCode', () => {
  it('should return true, if protocol is http', () => {
    const urlQrCode = `http://xya.com/dev`
    expect(isValidUrlQrCode(urlQrCode)).toMatchSnapshot()
  })

  it('should return true, if protocol is https', () => {
    const urlQrCode = `https://xya.com/dev`
    expect(isValidUrlQrCode(urlQrCode)).toMatchSnapshot()
  })

  it('should return false, if protocol is not valid', () => {
    const urlQrCode = `ftp://xya.com/dev`
    expect(isValidUrlQrCode(urlQrCode)).toBe(false)
  })

  it('should return false, if protocol is not valid', () => {
    const urlQrCode = `file:///xya.com/dev`
    expect(isValidUrlQrCode(urlQrCode)).toBe(false)
  })
})
