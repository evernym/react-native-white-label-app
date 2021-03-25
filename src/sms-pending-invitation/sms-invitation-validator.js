// @flow
import urlParse from 'url-parse'

import type { InvitationUrl } from './type-sms-pending-invitation'

export function isValidInvitationUrl(
  passedUrlString: string
): InvitationUrl | boolean {
  if (passedUrlString.length > validInvitationUrlLength) {
    return false
  }

  const { protocol } = urlParse(passedUrlString, {}, true)

  if (validInvitationUrlScheme.indexOf(protocol) < 0) {
    return false
  }

  return {
    url: passedUrlString,
  }
}

// only trust if scheme is https, http is not allowed
export const validInvitationUrlScheme = ['https:', 'http:']

// maximum length allowed for whole url-qr-code
export const validInvitationUrlLength = 2048
