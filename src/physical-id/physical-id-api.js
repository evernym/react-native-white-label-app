// @flow

const physicalIdBaseUrl = 'https://70b5-160-202-39-43.ngrok.io'

async function post(config: {
  url: string,
  body: string,
  // we can use hardware based attestation to only allow
  // few selected apps to request SDK token from Evernym
  hardwareToken: string,
  contentType?: ?string,
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

export async function getWorkflowData({
  workflowId,
  hardwareToken,
  country,
  document,
}: {
  workflowId: string,
  hardwareToken: string,
  country: string,
  document: string,
}) {
  return post({
    url: `${physicalIdBaseUrl}/get-workflow-data`,
    body: JSON.stringify({ workflowId, country, document }),
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

export async function issueCredential({
  workflowId,
  connectionDID,
  hardwareToken,
  country,
  document,
}: {
  workflowId: string,
  connectionDID: string,
  hardwareToken: string,
  country: string,
  document: string,
}) {
  return post({
    url: `${physicalIdBaseUrl}/issue-credential`,
    body: JSON.stringify({ workflowId, connectionDID, country, document }),
    contentType: 'application/json',
    hardwareToken,
  })
}
