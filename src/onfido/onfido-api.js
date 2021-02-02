// @flow
import type { GenericObject } from '../common/type-common'

const applicantParams = {
  // as per onFido team we can hard code name and user's name
  // would be extracted from documents that user uploads
  // this paramter is needed because onFido API needs this param
  first_name: 'Evernym',
  last_name: 'msdk',
}

const onFidoBaseUrl = 'https://api.onfido.com/v2/applicants/'
const onFidoChecks = [
  ['type', 'express'],
  ['async', 'true'],
  ['reports[][name]', 'document'],
  ['reports[][name]', 'facial_similarity'],
  ['reports[][variant]', 'standard'],
]
const checkParamsQueryString = encodeStringifyArray(onFidoChecks)
const onfidoInvitationUrl = 'https://credentials-gateway.onfido.com/invite'

function encodeStringify(params: GenericObject) {
  return Object.keys(params)
    .map(key => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    })
    .join('&')
}

function encodeStringifyArray(params: Array<[string, string]>) {
  return params
    .map(
      param => `${encodeURIComponent(param[0])}=${encodeURIComponent(param[1])}`
    )
    .join('&')
}

async function post(config: {
  url: string,
  body: string,
  contentType: ?string,
  token: string,
}) {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': config.contentType
        ? config.contentType
        : 'application/x-www-form-urlencoded;charset=UTF-8',
      Authorization: `Token token=${config.token}`,
    },
    body: config.body,
  })

  return await response.json()
}

export async function getApplicantId(first_name: ?string, token: string) {
  const applicantParamsQueryString = encodeStringify({
    ...applicantParams,
    ...{ first_name: first_name || applicantParams.first_name },
  })

  return post({
    url: onFidoBaseUrl,
    body: applicantParamsQueryString,
    contentType: null,
    token,
  })
}

export async function getCheckUuid(applicantId: string, token: string) {
  return post({
    url: `${onFidoBaseUrl}${applicantId}/checks`,
    body: checkParamsQueryString,
    contentType: null,
    token,
  })
}

export async function getOnfidoInvitation(applicantId: string, token: string) {
  return post({
    url: onfidoInvitationUrl,
    body: JSON.stringify({ applicant_uuid: applicantId }),
    contentType: 'application/json',
    token,
  })
}
