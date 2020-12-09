// @flow

import type { Url } from 'url-parse'

import type {
  AriesConnectionInvite,
  AriesConnectionInvitePayload,
  AriesOutOfBandInvite,
} from '../../../invitation/type-invitation'

import { flattenAsync } from '../../../common/flatten-async'
import { toUtf8FromBase64 } from '../../../bridge/react-native-cxs/RNCxs'
import {
  isValidAriesV1InviteData,
  isValidAriesOutOfBandInviteData,
} from '../../../invitation/invitation'
import { flatJsonParse } from '../../../common/flat-json-parse'

export async function isAriesConnectionInviteQrCode(
  parsedUrl: Url
): Promise<AriesConnectionInvite | false> {
  const { query } = parsedUrl

  if (!query.c_i) {
    // if url does not have a query param named c_i, then return false
    return false
  }

  const body = query.c_i

  let qrData: null | AriesConnectionInvitePayload = null
  const parsedInviteUrlSafe = await getDecodedQrData(body, 'NO_WRAP')
  if (parsedInviteUrlSafe) {
    qrData = parsedInviteUrlSafe
  } else {
    const parsedInviteNoWrap = await getDecodedQrData(body, 'URL_SAFE')
    if (parsedInviteNoWrap) {
      qrData = parsedInviteNoWrap
    }
  }

  if (!qrData) {
    return false
  }

  return isValidAriesV1InviteData(qrData, JSON.stringify(qrData))
}

async function getDecodedQrData(
  encodedData: string,
  decodeType: 'URL_SAFE' | 'NO_WRAP'
): Promise<false | AriesConnectionInvitePayload> {
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
    null | AriesConnectionInvitePayload
  ] = flatJsonParse(decodedInviteJson)
  if (parseError || !invite) {
    return false
  }

  return invite
}

export async function isAriesOutOfBandInviteQrCode(
  parsedUrl: Url
): Promise<AriesOutOfBandInvite | false> {
  const { query } = parsedUrl

  if (!query.oob && !query.c_i) {
    // TODO: remove c_i case once Verity fix it.
    return false
  }

  const [decodeError, decodedInvite] = await flattenAsync(toUtf8FromBase64)(
    query.oob || query.c_i,
    'URL_SAFE'
  )
  if (decodeError || decodedInvite === null) {
    return false
  }

  try {
    return isValidAriesOutOfBandInviteData(JSON.parse(decodedInvite))
  } catch (e) {
    return false
  }
}
