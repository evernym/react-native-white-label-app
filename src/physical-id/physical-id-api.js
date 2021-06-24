// @flow

const physicalIdBaseUrl = 'http://localhost:1990'

async function post(config: {
  url: string,
  body: string,
  // we can use hardware based attestation to only allow
  // few selected apps to request SDK token from Evernym
  hardwareToken: string,
  contentType: ?string,
}) {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': config.contentType
        ? config.contentType
        : 'application/x-www-form-urlencoded;charset=UTF-8',
      Authorization: `Token token=${config.hardwareToken}`,
    },
    body: config.body,
  })

  return await response.json()
}

export async function getSdkToken(hardwareToken: string) {
  return post({
    url: `${physicalIdBaseUrl}/get-sdk-token`,
    body: '{}',
    hardwareToken,
  })
}

export async function getWorkflowData(
  workflowId: string,
  hardwareToken: string
) {
  return post({
    url: `${physicalIdBaseUrl}/get-workflow-data`,
    body: JSON.stringify({ workflowId }),
    hardwareToken,
  })
}

export async function getPhysicalIdInvitation(hardwareToken: string) {
  return post({
    url: `${physicalIdBaseUrl}/get-invitation`,
    body: '{}',
    contentType: 'application/json',
    hardwareToken,
  })
}
