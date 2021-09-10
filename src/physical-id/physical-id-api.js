// @flow

async function post(config: {
  url: string,
  body: string,
  domainDID: string,
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
      domainDID: config.domainDID,
    },
    body: config.body,
  })

  let responseText = await response.json()
  if (!response.ok) {
    throw new Error(responseText.errorMessage || responseText.message || responseText)
  }
  return responseText
}

export async function getSdkToken(
  hardwareToken: string,
  domainDID: string,
  verityFlowBaseUrl: string
) {
  return post({
    url: `${verityFlowBaseUrl}/get-mc-sdk-token`,
    body: '{}',
    hardwareToken,
    domainDID,
  })
}

export async function getPhysicalIdInvitation(
  hardwareToken: string,
  domainDID: string,
  verityFlowBaseUrl: string
) {
  return post({
    url: `${verityFlowBaseUrl}/create-invitation`,
    body: '{}',
    contentType: 'application/json',
    hardwareToken,
    domainDID,
  })
}

export async function issueCredential({
  workflowId,
  connectionDID,
  hardwareToken,
  country,
  document,
  domainDID,
  verityFlowBaseUrl,
  credDefId,
}: {
  workflowId: string,
  connectionDID: string,
  hardwareToken: string,
  country: string,
  document: string,
  domainDID: string,
  verityFlowBaseUrl: string,
  credDefId: string,
}) {
  return post({
    url: `${verityFlowBaseUrl}/issue-credential`,
    body: JSON.stringify({
      workflowId,
      connectionDID,
      country,
      document,
      credDefId,
    }),
    contentType: 'application/json',
    hardwareToken,
    domainDID,
  })
}
