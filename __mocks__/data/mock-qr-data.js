// @flow

export const mockAriesV1InvitationUrl =
  'http://localhost:80/?c_i=somebase64encodedstring'

export const mockAriesV1QrCode = {
  '@id': '7bf4f041-5ed4-4246-b309-396aeae830ab',
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation',
  label: 'alice',
  recipientKeys: ['6B5wQFpWbwJYB7qQYWydSwvCNKGoTZq6KvUe8TWBgPFY'],
  routingKeys: [
    '7re7C6zmg3p1r1hzHZSQJgt27wbycLeuzgopq1xNZqs6',
    '7G3LhXFKXKTMv7XGx1Qc9wqkMbwcU2iLBHL8x1JXWWC2',
  ],
  serviceEndpoint: 'https://agency.com/agency/msg',
}

export const mockAriesV1QrCodeNoRecipientKeys = {
  '@id': '7bf4f041-5ed4-4246-b309-396aeae830ab',
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation',
  label: 'alice',
  routingKeys: [
    '7re7C6zmg3p1r1hzHZSQJgt27wbycLeuzgopq1xNZqs6',
    '7G3LhXFKXKTMv7XGx1Qc9wqkMbwcU2iLBHL8x1JXWWC2',
  ],
  serviceEndpoint: 'https://agency.com/agency/msg',
}

export const mockAriesV1QrCodeNoRoutingKeys = {
  '@id': '7bf4f041-5ed4-4246-b309-396aeae830ab',
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation',
  label: 'alice',
  recipientKeys: ['6B5wQFpWbwJYB7qQYWydSwvCNKGoTZq6KvUe8TWBgPFY'],
  serviceEndpoint: 'https://agency.com/agency/msg',
}

export const mockAriesV1QrCodeNullRoutingKeys = {
  '@id': '7bf4f041-5ed4-4246-b309-396aeae830ab',
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation',
  label: 'alice',
  recipientKeys: ['6B5wQFpWbwJYB7qQYWydSwvCNKGoTZq6KvUe8TWBgPFY'],
  routingKeys: null,
  serviceEndpoint: 'https://agency.com/agency/msg',
}

export const mockAriesV1QrCodeNoLabel = {
  '@id': '7bf4f041-5ed4-4246-b309-396aeae830ab',
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation',
  recipientKeys: ['6B5wQFpWbwJYB7qQYWydSwvCNKGoTZq6KvUe8TWBgPFY'],
  routingKeys: null,
  serviceEndpoint: 'https://agency.com/agency/msg',
}

export const mockAriesV1QrCodeNullLabel = {
  '@id': '7bf4f041-5ed4-4246-b309-396aeae830ab',
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation',
  label: null,
  recipientKeys: ['6B5wQFpWbwJYB7qQYWydSwvCNKGoTZq6KvUe8TWBgPFY'],
  routingKeys: null,
  serviceEndpoint: 'https://agency.com/agency/msg',
}

export const mockEphemeralProofRequestQrCode = {
  '@id': '7bf4f041-5ed4-4246-b309-396aeae830bc',
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/invitation',
  'request_presentations~attach': [
    {
      '@id': '7bf4f041-5ed4-4246-b309-396aeae830cd',
      'mime-type': 'application/json',
      data: {
        base64: 'oihkadnkfnakfadfda=/',
      },
    },
  ],
  comment: 'Sender Name',
  '~service': {
    recipientKeys: ['6B5wQFpWbwJYB7qQYWydSwvCNKGoTZq6KvUe8TWBgPFY'],
    routingKeys: [
      '7re7C6zmg3p1r1hzHZSQJgt27wbycLeuzgopq1xNZqs6',
      '7G3LhXFKXKTMv7XGx1Qc9wqkMbwcU2iLBHL8x1JXWWC2',
    ],
    serviceEndpoint: 'https://agency.com/agency/msg',
  },
}
