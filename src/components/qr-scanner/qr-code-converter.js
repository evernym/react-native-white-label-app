// @flow

import type { InvitationPayload } from '../../invitation/type-invitation'

import { flatJsonParse } from '../../common/flat-json-parse'
import {
  convertProprietaryInvitationToAppInvitation,
  convertShortProprietaryInvitationToAppInvitation,
  isProprietaryInvitation,
  isShortProprietaryInvitation,
} from '../../invitation/kinds/proprietary-connection-invitation'
import { getUrlData, isValidUrl } from './qr-code-types/qr-url'
import {
  convertAriesInvitationToAppInvitation,
  isAriesInvitation,
} from '../../invitation/kinds/aries-connection-invitation'
import { CONNECTION_INVITE_TYPES } from '../../invitation/type-invitation'
import { SCAN_STATUS } from './type-qr-scanner'
import {
  convertAriesOutOfBandInvitationToAppInvitation,
  isAriesOutOfBandInvitation,
} from '../../invitation/kinds/aries-out-of-band-invitation'

export async function convertQrCodeToAppInvitation(
  qrCode: string
): Promise<[null | string, null | InvitationPayload]> {
  let qrData = null

  // check if qr code data is url or json object
  const urlQrCode = isValidUrl(qrCode)

  if (urlQrCode) {
    // we have different url type qr codes as well,
    // identify which type of url qr it is and get a json object from url
    const [urlError, urlData] = await getUrlData(urlQrCode, qrCode)
    if (urlError) {
      // we could not get data from url, show error to user
      return [urlError, null]
    }

    qrData = urlData
  }

  if (!qrData) {
    // If we are here, that means we either got data in `qrData` variable from url
    // or it was not urlQrCode, so we need to check if it is json object
    const [parseError, parsedData] = flatJsonParse(qrCode)
    if (parseError) {
      // we did not get data from url,
      // then we tried to check if data is json, and that also failed in parsing
      // show error to user and end continuing with this function
      return [SCAN_STATUS.FAIL, null]
    }

    qrData = parsedData
  }

  if (!qrData) {
    // if we still does not get data, then show another error to user
    return ['QR:001 Invalid QR code', null]
  }

  // now we got json object, either via qr code or via downloading from url

  // check if version 1.0 short qr invitation
  const shortInviteQrCode = isShortProprietaryInvitation(qrData)
  if (shortInviteQrCode) {
    return [
      null,
      convertShortProprietaryInvitationToAppInvitation(shortInviteQrCode),
    ]
  }

  // check if version 1.0 qr invitation
  const smsInviteQrCode = isProprietaryInvitation(qrData)
  if (smsInviteQrCode) {
    return [null, convertProprietaryInvitationToAppInvitation(smsInviteQrCode)]
  }

  // check if aries invite
  if (qrData.type === CONNECTION_INVITE_TYPES.ARIES_V1_QR) {
    return [null, convertAriesInvitationToAppInvitation(qrData)]
  }

  // aries invitation can be directly copied as json string as well
  // above case handles when aries invite comes from url encoded
  const ariesV1Invite = isAriesInvitation(qrData, JSON.stringify(qrData))
  if (ariesV1Invite) {
    return [null, convertAriesInvitationToAppInvitation(ariesV1Invite)]
  }

  const outOfBandInvite = isAriesOutOfBandInvitation(qrData)
  if (outOfBandInvite) {
    return [
      null,
      await convertAriesOutOfBandInvitationToAppInvitation(outOfBandInvite),
    ]
  }

  return [SCAN_STATUS.FAIL, null]
}
