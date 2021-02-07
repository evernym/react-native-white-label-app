// @flow
import { api, options } from './api-utils'
import type {
  GetInvitationLinkApiData,
  EnvironmentDetailUrlDownloaded,
} from './type-api'

export const getInvitationLink = ({
  agencyUrl,
  smsToken,
}: GetInvitationLinkApiData) =>
  api(`${agencyUrl}/agency/url-mapper/${smsToken}`, options('GET'))

export const downloadEnvironmentDetails = (
  url: string
): Promise<EnvironmentDetailUrlDownloaded> => api(url, options())
