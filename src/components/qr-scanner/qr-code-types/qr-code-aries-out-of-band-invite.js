// @flow

import type { Url } from 'url-parse'

import type { AriesOutOfBandInvite } from '../../../invitation/type-invitation'

import { flattenAsync } from '../../../common/flatten-async'
import { toUtf8FromBase64 } from '../../../bridge/react-native-cxs/RNCxs'
import { isValidAriesOutOfBandInviteData } from '../../../invitation/invitation'
import { flatJsonParse } from '../../../common/flat-json-parse'

export async function isAriesOutOfBandInviteQrCode(
  parsedUrl: Url
): Promise<AriesOutOfBandInvite | false> {
  const { query } = parsedUrl

  if (!query.c_i && !query.oob) {
    // if url does not have a query param named c_i, then return false
    return false
  }

  const body = query.c_i || query.oob

  let qrData: AriesOutOfBandInvite | null = null

  const parsedInviteUrlSafe = await getDecodedQrData(body, 'URL_SAFE')
  if (parsedInviteUrlSafe) {
    qrData = parsedInviteUrlSafe
  } else {
    const parsedInviteNoWrap = await getDecodedQrData(body, 'NO_WRAP')
    if (parsedInviteNoWrap) {
      qrData = parsedInviteNoWrap
    }
  }

  if (!qrData) {
    return false
  }

  return isValidAriesOutOfBandInviteData(qrData)
}

async function getDecodedQrData(
  encodedData: string,
  decodeType: 'URL_SAFE' | 'NO_WRAP'
): Promise<false | AriesOutOfBandInvite> {
  const [decodeInviteError, decodedInviteJson]: [
    null | typeof Error,
    null | string
  ] = await flattenAsync(toUtf8FromBase64)(encodedData, decodeType)
  if (decodeInviteError || !decodedInviteJson) {
    return false
  }

  // if we get some data back after decoding, now we try to parse it and see if it is valid json or not
  let [parseError, invite]: [
    null | typeof Error,
    null | AriesOutOfBandInvite
  ] = flatJsonParse(decodedInviteJson)
  if (parseError || !invite) {
    return false
  }

  return invite
}
