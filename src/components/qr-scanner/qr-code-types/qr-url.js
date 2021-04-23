// @flow
import urlParse, { type Url } from 'url-parse'

import type {
  AriesConnectionInvite,
  AriesOutOfBandInvite,
} from '../../../invitation/type-invitation'
import type {
  QrCodeOIDC,
  QR_SCAN_STATUS,
  QrCodeNonJsonUrl,
} from '../type-qr-scanner'

import { SCAN_STATUS, QR_CODE_TYPES } from '../type-qr-scanner'
import type { GenericObject } from '../../../common/type-common'
import { flatFetch } from '../../../common/flat-fetch'
import { flatJsonParse } from '../../../common/flat-json-parse'
import { isValidOIDCQrCode } from './qr-code-oidc'
import {getRequestRedirectionUrl} from '../../../bridge/react-native-cxs/RNCxs'
import { flattenAsync } from '../../../common/flatten-async'
import {isEncodedAriesConnectionInvitation} from "../../../invitation/kinds/aries-connection-invitation";
import {isEncodedAriesOutOfBandInvitation} from "../../../invitation/kinds/aries-out-of-band-invitation";
import { getBase64DecodedInvitation } from "../../../invitation/invitation-helpers";
import { schemaValidator } from '../../../services/schema-validator'
import { ephemeralProofRequestSchema } from '../../../proof-request/proof-request-qr-code-reader'

export function isValidUrl(urlQrCode: string): Url | false {
  const parsedUrl = urlParse(urlQrCode, {}, true)

  if (!validUrlScheme.includes(parsedUrl.protocol)) {
    return false
  }

  return parsedUrl
}

export async function getUrlData(
  parsedUrl: Url,
  url: string
): Promise<
  [
    null | QR_SCAN_STATUS,
    (
      | null
      | GenericObject
      | AriesConnectionInvite
      | AriesOutOfBandInvite
      | QrCodeOIDC
      | QrCodeNonJsonUrl
    )
  ]
> {
  // if we get url qr code, then there are three ways as of now that ConnectMe supports
  // to get data from url qr code

  // Three ways are to get data directly from URL query params

  // 1. get aries invitation data using url qr code
  const ariesConnectionInvite = await isEncodedAriesConnectionInvitation(parsedUrl)
  if (ariesConnectionInvite) {
    return [null, ariesConnectionInvite]
  }

  const ariesOutofbandConnectionInvite = await isEncodedAriesOutOfBandInvitation(
    parsedUrl
  )
  if (ariesOutofbandConnectionInvite) {
    return [null, ariesOutofbandConnectionInvite]
  }

  // 2. get OIDC authentication data from url
  const oidcQrCode = isValidOIDCQrCode(parsedUrl)
  if (oidcQrCode) {
    return [null, oidcQrCode]
  }

  // 3. get out of band invitation data from URL query parameter
  const outOfBandInvite = await isEncodedAriesOutOfBandInvitation(parsedUrl)
  if (outOfBandInvite) {
    return [null, outOfBandInvite]
  }

  // if there is no data available in url params, then try to download data
  // from the passed url and check if we get data from url

  // 4. get URL data. do not follow redirection. just return new url
  const [, redirectionUrl] = await flattenAsync(getRequestRedirectionUrl)(url)
  if (redirectionUrl) {
    // BCGov links contains message
    const parts = redirectionUrl.split('?m=')
    if (parts.length > 1) {
      const encodedMessage = parts[1]
      const data = await getBase64DecodedInvitation(encodedMessage)

      // is ephemeral proof request
      if (schemaValidator.validate(ephemeralProofRequestSchema, data)) {
        return [null, { type: QR_CODE_TYPES.EPHEMERAL_PROOF_REQUEST_V1, data: data }]
      }
    }

    // else handle link again
    const urlInvitationData = isValidUrl(redirectionUrl)
    if (urlInvitationData) {
      // downloaded data contains url - get its data
      return await getUrlData(urlInvitationData, redirectionUrl)
    }
  }

  // 5. download data and get a valid json object
  const [downloadErr, downloadedData] = await flatFetch(url)
  if (downloadedData) {
    // we are able to get data from url
    // now we need to verify that data is a valid json
    const [, parsedData] = flatJsonParse(downloadedData)

    if (parsedData) {
      // if we get some json data, then return it
      return [null, parsedData]
    }

    const urlInvitationData = isValidUrl(downloadedData)
    if (urlInvitationData) {
      // downloaded data contains url - get its data
      return await getUrlData(urlInvitationData, downloadedData)
    }

    // since we know that we got some downloadedData
    // but this downloaded data is not json
    // so we return with type non-json

    return [
      null,
      { type: QR_CODE_TYPES.URL_NON_JSON_RESPONSE, data: downloadedData },
    ]
  }
  if (downloadErr) {
    // $FlowFixMe
    return [downloadErr.message, null]
  }

  // if we reach to this point, that means that we could not get data from url
  // either by downloading data behind url, or by extracting data from url itself
  // so the url qr code is invalid
  return [SCAN_STATUS.INVALID_URL_QR_CODE, null]
}

export const validUrlScheme = ['https:', 'http:', 'id.streetcred:']
