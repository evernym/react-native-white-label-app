// @flow

import merge from 'lodash.merge'

import { CHECK_PIN_IDLE } from '../src/lock/type-lock'
import { INVITATION_RECEIVED } from '../src/invitation/type-invitation'
import {
  CLAIM_OFFER_STATUS,
  CLAIM_REQUEST_STATUS,
} from '../src/claim-offer/type-claim-offer'
import { invitationAccepted, } from '../src/invitation/invitation-store'
import { sendClaimRequestSuccess, } from '../src/claim-offer/claim-offer-store'
import { claimStorageSuccess } from '../src/claim/claim-store'
import {
  proofRequestReceived,
  sendProofSuccess,
} from '../src/proof-request/proof-request-store'
import { color, colors } from '../src/common/styles/constant'
import {
  qrCodeScannerTabRoute,
  homeRoute,
  claimOfferRoute,
} from '../src/common/route-constants'
import {
  agencyUrl,
  agencyDID,
  agencyVerificationKey,
  poolConfig,
  paymentMethod,
  configStoreNotHydratedInstalledVcxInit,
} from './data/config-store-mock-data'
import { userOneTimeInfo } from './data/user-store-mock-data'
import { STORE_STATUS } from '../src/wallet/type-wallet'
import { ledgerStoreWithTransferFees } from './data/ledger-store-mock-data'
import { PREPARE_BACKUP_SUCCESS } from '../src/backup/type-backup'
import { STORAGE_STATUS } from '../src/common/type-common'
import {
  PROOF_REQUEST_STATUS,
  PROOF_STATUS,
} from '../src/proof-request/type-proof-request'
import { inAppNotificationMockData } from './data/in-app-notification-mock-data'
import { HISTORY_EVENT_TYPE } from '../src/connection-history/type-connection-history'

// sadly, we can't export all variables in one line and use them in file as well
// to use them in this file, we have to import them first
// and then export variables, we can't use default export
// and has to export each variables by name
// because es6 modules are statically resolved
// hopefully it will not be so bad once we move all of mocked data
// into it's own file and use those files to import data wherever we need it
// instead of going through one file
// or may be in this file we can do default export and then this file
// will be used for access to all other files
export {
  agencyUrl,
  agencyDID,
  agencyVerificationKey,
  poolConfig,
  paymentMethod,
  configStoreNotHydratedInstalledVcxInit,
} from './data/config-store-mock-data'

export const senderDid1 = 'senderDID1'
export const senderName1 = 'sender1'
export const senderLogoUrl1 = 'http://testissuer.com/logoUrl.png'
export const senderVerKey1 = 'senderVerificationKey1'
export const senderAgentDID1 = 'senderAgentDID1'
export const endpoint = 'endpoint'
export const uid = 'uid'
export const smsToken = 'gm76ku'
export const proofHandle = 1

export const senderAgentKeyDelegationProof = {
  agentDID: senderAgentDID1,
  agentDelegatedKey: 'agentDelegatedKey',
  signature: 'signature',
}

export const senderDetail = {
  name: senderName1,
  agentKeyDlgProof: senderAgentKeyDelegationProof,
  DID: senderDid1,
  logoUrl: senderLogoUrl1,
  verKey: senderVerKey1,
}

export const senderAgencyDetail = {
  DID: senderDid1,
  verKey: senderVerKey1,
  endpoint: endpoint,
}

const targetName = 'target name'
const connectionRequestId1 = 'requestId1'
const connectionRequestId2 = 'requestId2'

export const smsDownloadedPayload = {
  senderDetail,
  senderAgencyDetail,
  targetName,
  connReqId: connectionRequestId1,
  statusCode: 'MS-102',
  statusMsg: 'message sent',
}

export function* getTestInvitationPayload(): Generator<*, *, *> {
  yield {
    payload: {
      senderEndpoint: 'endpoint',
      requestId: connectionRequestId1,
      senderAgentKeyDelegationProof,
      senderName: 'sender1',
      senderDID: senderDid1,
      senderLogoUrl: 'lu',
      senderVerificationKey: 'sVk',
      targetName,
      senderDetail,
      senderAgencyDetail,
    },
  }

  yield {
    payload: {
      senderEndpoint: 'endpoint',
      requestId: connectionRequestId2,
      senderAgentKeyDelegationProof,
      senderName: 'sender2',
      senderDID: 'senderDID2',
      senderLogoUrl: 'lu',
      senderVerificationKey: 'sVk 2',
      targetName: 'target name',
      senderDetail,
      senderAgencyDetail,
    },
  }
}

const gen = getTestInvitationPayload()
const firstInvitationPayload = gen.next().value

export const pairwiseConnection = {
  identifier: 'pairwiseIdentifier1',
  verificationKey: 'pairwiseVerificationKey1',
}

export const myPairWiseConnectionDetails = {
  myPairwiseAgentDid: 'myPairwiseAgentDID',
  myPairwiseAgentVerKey: 'myPairwiseAgentVerKey',
  myPairwiseDid: 'pairwiseIdentifier1',
  myPairwisePeerVerKey: 'senderVerificationKey1',
  myPairwiseVerKey: 'pairwiseVerificationKey1',
}

export const vcxSerializedConnection = '{someVcxSerializedFormat}'

export const pendingConnectionData = {
  identifier: firstInvitationPayload
    ? firstInvitationPayload.payload.senderDID
    : '',
  logoUrl: firstInvitationPayload
    ? firstInvitationPayload.payload.senderLogoUrl
    : '',
  ...(firstInvitationPayload ? firstInvitationPayload.payload : {}),
  myPairwiseDid: '',
  myPairwiseVerKey: '',
  myPairwiseAgentDid: '',
  myPairwiseAgentVerKey: '',
  myPairwisePeerVerKey: '',
  publicDID: undefined,
}

export const successConnectionData = {
  newConnection: {
    identifier: pairwiseConnection.identifier,
    logoUrl: firstInvitationPayload
      ? firstInvitationPayload.payload.senderLogoUrl
      : '',
    ...(firstInvitationPayload ? firstInvitationPayload.payload : {}),
    ...myPairWiseConnectionDetails,
    vcxSerializedConnection,
  },
}

export const invitationAcceptedData = firstInvitationPayload
  ? {
      senderDID: firstInvitationPayload.payload.senderDID,
      payload: firstInvitationPayload.payload,
    }
  : {}

export const claimOfferId = 'usd123'
export const claimOfferIssueDate = 123456789
export const claimUUID = 'claimUUID'
export const colorTheme = '#86B93B'
  export const claimDefinitionSchemaSequenceNumber = 36
const issuerDid = 'issuerDid'
export const senderLogoUrl = 'http://testissuer.com/logoUrl.png'

export const attributes = [
  {
    'address1': 'address1',
    'address2': 'address2',
  }
]

const requestedAttributes = [
  {
    label: 'address1',
    data: 'address1',
  },
  {
    label: 'address2',
    data: 'address2',
  },
]

export const originalProofRequestData = {
  nonce: '123432421212',
  name: 'proof_req_1',
  version: '0.1',
  requested_attributes: {
    attr1_uuid: {
      name: 'Address 1',
    },
    attr2_uuid: {
      name: 'Address 2',
    },
  },
  requested_predicates: {},
}

export const originalProofRequestDataWithPredicates = {
  nonce: '123432421212',
  name: 'proof_req_1',
  version: '0.1',
  requested_attributes: {},
  requested_predicates: {
    predicate1_uuid: {
      name: 'Age 1',
      p_type: '>',
      p_value: 20,
    },
    predicate2_uuid: {
      name: 'Age 2',
      p_type: '>',
      p_value: 20,
    },
  },
}

export const originalProofRequestDataWithAttributesAndPredicates = {
  nonce: '123432421212',
  name: 'proof_req_1',
  version: '0.1',
  requested_attributes: {
    attr1_uuid: {
      name: 'Address 1',
    },
    attr2_uuid: {
      name: 'Address 2',
    },
  },
  requested_predicates: {
    predicate1_uuid: {
      name: 'Age 1',
      p_type: '>',
      p_value: 20,
    },
    predicate2_uuid: {
      name: 'Age 2',
      p_type: '>',
      p_value: 20,
    },
  },
}

export const originalProofRequestDataWithSpaces = {
  nonce: '123432421212',
  name: 'proof_req_1',
  version: '0.1',
  requested_attributes: {
    attr1_uuid: {
      name: 'A d d r e s s    1',
    },
    attr2_uuid: {
      name: '  Ad  dress 2 ',
    },
  },
  requested_predicates: {},
}

export const originalProofRequestData10Attributes = {
  nonce: '123432421212',
  name: 'proof_req_2',
  version: '0.1',
  requested_attributes: {
    attr1_uuid: {
      name: 'Address 1',
    },
    attr2_uuid: {
      name: 'Address 2',
    },
    attr3_uuid: {
      name: 'Address 3',
    },
    attr4_uuid: {
      name: 'Address 4',
    },
    attr5_uuid: {
      name: 'Address 5',
    },
    attr6_uuid: {
      name: 'Address 6',
    },
    attr7_uuid: {
      name: 'Address 7',
    },
    attr8_uuid: {
      name: 'Address 8',
    },
    attr9_uuid: {
      name: 'Address 9',
    },
    attr10_uuid: {
      name: 'Address 10',
    },
  },
  requested_predicates: {},
}

export const originalProofRequestDataMissingAttribute = {
  nonce: '123432421212',
  name: 'proof_req_1',
  version: '0.1',
  requested_attributes: {
    attr1_uuid: {
      name: 'address1',
    },
    attr2_uuid: {
      name: 'address2',
    },
    attr3_uuid: {
      name: 'address3',
    },
  },
  requested_predicates: {},
}

export const claimOfferPayload = {
  data: {
    name: 'Home Address',
    version: '1.0.0',
    revealedAttributes: [
      {
        label: 'Address 1',
        data: 'Address Address Address',
      },
      {
        label: 'Address 2',
        data: 'Address 2 Address 2 Address 2',
      },
    ],
    claimDefinitionSchemaSequenceNumber,
  },
  issuer: {
    name: 'Test Issuer',
    did: issuerDid,
  },
  statusMsg: 'pending',
  uid: claimOfferId,
  senderLogoUrl: 'http://testissuer.com/logoUrl.png',
  remotePairwiseDID: 'ha66899sadfjZJGINKN0770',
  status: 'RECEIVED',
  claimRequestStatus: 'CLAIM_REQUEST_SUCCESS',
}

export const pendingClaimHistory = {
  action: 'PENDING',
  data: [
    {
      label: 'Address 1',
      data: 'Address Address Address',
    },
    {
      label: 'Address 2',
      data: 'Address 2 Address 2 Address 2',
    },
  ],
  id: 'id',
  name: 'Home Address',
  status: 'PENDING',
  timestamp: 'timestamp',
  type: 'CLAIM',
  remoteDid: 'ha66899sadfjZJGINKN0770',
  originalPayload: {
    type: 'CLAIM_RECEIVED',
    messageId: claimOfferId,
  },
}

export const claimOffer = {
  payload: {
    data: {
      name: 'Home Address',
      version: '1.0.0',
      revealedAttributes: [
        {
          label: 'Address 1',
          data: 'Address Address Address',
        },
        {
          label: 'Address 2',
          data: 'Address 2 Address 2 Address 2',
        },
      ],
      claimDefinitionSchemaSequenceNumber,
    },
    issuer: {
      name: 'Test Issuer',
      did: issuerDid,
    },
    statusMsg: 'pending',
    status: 'RECEIVED',
    claimRequestStatus: 'CLAIM_REQUEST_SUCCESS',
  },
  payloadInfo: {
    uid: claimOfferId,
    senderLogoUrl: 'http://testissuer.com/logoUrl.png',
    remotePairwiseDID: 'ha66899sadfjZJGINKN0770',
  },
}

export const event = {
  action: '',
  data: [],
  id: '123434325dsfefw',
  name: 'test',
  status: 'status',
  timestamp: '',
  remoteDid: senderDid1,
  type: HISTORY_EVENT_TYPE.INVITATION,
  originalPayload: {},
  senderName: 'Test Issuer',
  senderLogoUrl: 'http://testissuer.com/logoUrl.png',
}

export const claim = {
  messageId: '1',
  claim: {
    name: ['test', 'anon cred test'],
    date_of_birth: ['20-2-1800', 'anon cred date'],
  },
  schema_seq_no: claimDefinitionSchemaSequenceNumber,
  issuer_did: issuerDid,
  signature: {
    primary_claim: {
      m2: 'm2',
      a: 'a',
      e: 'e',
      v: 'v',
    },
  },
  remoteDid: 'remoteDid',
  uid: claimOfferId,
  from_did: 'from_did',
  forDID: 'forDID',
}

export const proofRequestId = 'pid123'

export const proofRequest = {
  payload: {
    data: {
      name: 'Home Address',
      version: '1.0.0',
      requestedAttributes: [
        {
          label: 'Address 1',
          values: {
            'Address 1': '',
          },
        },
        {
          label: 'Address 2',
          values: {
            'Address 2': '',
          },
        },
      ],
    },
    requester: {
      name: 'Test Issuer',
    },
    originalProofRequestData,
    statusMsg: 'pending',
    proofHandle,
  },
  payloadInfo: {
    uid: proofRequestId,
    senderLogoUrl: 'http://cr0ybot.github.io/ingress-logos/ingress.png',
    remotePairwiseDID: senderDid1,
  },
}

export const proofRequestWithPredicates = {
  payload: {
    data: {
      name: 'Home Address',
      version: '1.0.0',
      requestedAttributes: [
        {
          label: 'Address 1',
          values: {
            'Address 1': '',
          },
        },
        {
          label: 'Address 2',
          values: {
            'Address 2': '',
          },
        },
        {
          label: 'Age 1',
          values: {
            'Age 1': '',
          },
        },
        {
          label: 'Age 2',
          values: {
            'Age 2': '',
          },
        },
      ],
    },
    requester: {
      name: 'Test Issuer',
    },
    originalProofRequestData: originalProofRequestDataWithAttributesAndPredicates,
    statusMsg: 'pending',
    proofHandle,
  },
  payloadInfo: {
    uid: proofRequestId,
    senderLogoUrl: 'http://cr0ybot.github.io/ingress-logos/ingress.png',
    remotePairwiseDID: senderDid1,
  },
}

export const fulfilledRequestedAttributes = [
  { label: 'address1', data: 'Address 1' },
  { label: 'address2', data: 'Address 2' },
]

export const proof = {
  proofs: {
    'claim::f760213b-e719-47fb-9669-b72c5c410e8c': {
      proof: {
        primary_proof: {
          eq_proof: {
            revealed_attrs: {
              name: '11',
              sex: '59',
            },
            a_prime: '13',
            e: '51',
            v: '13',
            m: {},
            m1: '67',
            m2: '60',
          },
          ge_proofs: [],
        },
        non_revoc_proof: null,
      },
      schema_seq_no: claimDefinitionSchemaSequenceNumber,
      issuer_did: issuerDid,
    },
  },
  aggregated_proof: {
    c_hash: '31',
    c_list: [[claimDefinitionSchemaSequenceNumber]],
  },
  requested_proof: {
    revealed_attrs: {
      attr2_uuid: ['claim::f760213b-e719-47fb-9669-b72c5c410e8c', 'male', '59'],
      attr1_uuid: ['claim::f760213b-e719-47fb-9669-b72c5c410e8c', 'Alex', '11'],
    },
    unrevealed_attrs: {},
    self_attested_attrs: {},
    predicates: {},
  },
}

export const pendingRedirection = [
  { routeName: homeRoute, params: {} },
  { routeName: claimOfferRoute, params: { uid: 'asd123' } },
]

export const missingAttributes = [{ key: 'attr2_uuid', name: 'sex' }]
export const missingAttributes1 = [
  { key: 'attr2_uuid', name: 'sex' },
  { key: 'attr3_uuid', name: 'height' },
]

export const selfAttestedAttributes = {
  attr2_uuid: {
    name: 'sex',
    data: 'male',
    key: 'attr2_uuid',
  },
}

export const preparedProof = {
  attrs: {
    attr1_uuid: [
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73',
          attrs: { name: 'Alex', sex: 'male' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    attr2_uuid: [
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b5',
          attrs: { height: '150' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
  },
  predicates: {},
}

export const homeAddressPreparedProof = {
  attrs: {
    attr1_uuid: [
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73',
          attrs: { ['Address 1']: 'Address 1' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    attr2_uuid: [
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b5',
          attrs: { ['Address 2']: 'Address 2' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
  },
  predicates: {},
}

export const homeAddressPreparedProofMultipleCreds = {
  attrs: {
    attr1_uuid: [
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73',
          attrs: { ['Address 1']: 'Address 1' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d86',
          attrs: { ['Address 1']: 'Address 1 reverse' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe7f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    attr2_uuid: [
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b',
          attrs: { ['Address 2']: 'Address 2' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed7652767',
          attrs: { ['Address 2']: 'Address 2 reverse' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
  },
  predicates: {},
}

export const preparedProofWithMissingAttribute = {
  attrs: {
    attr1_uuid: [
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73',
          attrs: { name: 'Alex', sex: 'male' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    attr3_uuid: [
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b5',
          attrs: { height: '150' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    [missingAttributes[0].key]: [null],
  },
  predicates: {},
}

export const homeAddressPreparedProofWithMissingAttribute = {
  attrs: {
    attr1_uuid: [
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73',
          attrs: { ['Address 1']: 'Evernym Ltd, Hyd.' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73',
          attrs: { ['Address 1']: 'Sovrin Ltd, Utah.' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag2',
          schema_id: 'V4SGRU86Z58d6TV7P:3:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    attr3_uuid: [
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b5',
          attrs: { ['Address 2']: 'Address 2' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag2',
          schema_id: 'V4SGRU86Z58d6TV7P:3:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    [missingAttributes[0].key]: [null],
  },
  predicates: {},
}

export const homeAddressAndAgePreparedProof = {
  attrs: {
    attr1_uuid: [
      {
        cred_info: {
          referent: 'claim::ea03d8ca-eeb4-4944-b7d6-5abcf4503d73',
          attrs: { ['Address 1']: 'Address 1' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    attr2_uuid: [
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed765276b5',
          attrs: { ['Address 2']: 'Address 2' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    predicate1_uuid: [
      {
        cred_info: {
          referent: 'claim::6a0f42b4-1210-4bdb-ad53-10ed765276ca',
          attrs: { ['Age 1']: '20' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
    predicate2_uuid: [
      {
        cred_info: {
          referent: 'claim::110f42b4-1210-4bdb-ad53-10ed765276ca',
          attrs: { ['Age 2']: '22' },
          cred_def_id: 'V4SGRU86Z58d6TV7PBUe6f:3:CL:24:tag1',
          schema_id: 'V4SGRU86Z58d6TV7Pf:2:slKljrSQ80tCQ40F:33089',
        },
      },
    ],
  },
  predicates: {},
}

// Fix `any` return. This is not important here because of following reasons
// 1. any is considered a return type inside mock data, this is not used in our app
// 2. getNavigation is only used for tests
// 3. Tests always define params that are needed and provide mock implementation
//     for the part that those tests need.
// 4. Even if we miss a prop in getNavigation, then also tests will fail
//     and we will know what prop to add. Since it is a compile time operation
//     it is very east to identify and get early feedback
export function getNavigation(params?: any): any {
  return {
    navigate: jest.fn(),
    state: {
      key: 'somekey',
      routeName: 'someRouteName',
      path: '/someRouteName',
      index: 1,
      routes: [],
    },
    route: {
      params: params || {},
    },
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    isFocused: jest.fn().mockReturnValue(true),
    push: jest.fn(),
    dismiss: jest.fn(),
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    toggleDrawer: jest.fn(),
    addListener: jest.fn(),
    replace: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    dangerouslyGetParent: jest.fn(),
    reset: jest.fn(),
    key: 'somekey',
    routeName: 'someRouteName',
    path: '/someRouteName',
    index: 1,
    routes: [],
  }
}

// TODO:  we should be just able to pass an object and
// TODO: it should deep extend default store state.if we don't deep extend We have to make many calls for getStore and getState
// TODO: for any property that we want to override
export function getStore(store?: Object = {}) {
  return {
    getState() {
      return merge(
        {},
        {
          backup: {
            backupWalletPath:
              '/Users/CoreSimulator/Devices/5F89AA14-B694-465F-82C3-838552AB4B85/data/Containers/Data/Application/4536A441-4B70-4A30-8DCC-5274E6781535/Documents/backup.zip',
            error: null,
            lastSuccessfulBackup: '2018-06-27T18:27:35+05:30',
            lastSuccessfulCloudBackup: '2018-06-27T18:27:35+05:30',
            cloudBackupPending: false,
            passphrase: {
              phrase:
                'gander troubling deodorize justify twitter darkish confront politely',
              salt: 's',
              hash: 'b7a563bcbbeb892b',
            },
            showBanner: true,
            status: 'BACKUP_COMPLETE',
            prepareBackupStatus: PREPARE_BACKUP_SUCCESS,
          },
          config: configStoreNotHydratedInstalledVcxInit,
          deepLink: {
            error: undefined,
            isLoading: true,
            tokens: {},
          },
          lock: {
            checkPinStatus: CHECK_PIN_IDLE,
            pendingRedirection: undefined,
            isAppLocked: false,
            isLockEnabled: 'true',
            isTouchIdEnabled: true,
            showDevMode: false,
            inRecovery: 'false',
          },
          connections: {
            connectionThemes: {
              default: {
                primary: `rgba(${color.actions.button.primary.rgba})`,
                secondary: `rgba(${color.actions.button.secondary.rgba})`,
              },
            },
            data: undefined,
          },
          route: {
            currentScreen: qrCodeScannerTabRoute,
            timeStamp: 1557756720914,
          },
          smsPendingInvitation: {},
          eula: {
            isEulaAccept: true,
          },
          invitation: {},
          pushNotification: {
            isAllowed: true,
            notification: undefined,
            pushToken: undefined,
            isPristine: true,
            isFetching: false,
            error: undefined,
            pendingFetchAdditionalDataKey: undefined,
            navigateRoute: undefined,
          },
          claim: {
            [uid]: {
              claim,
            },
            claimMap: claimMap,
          },
          user: {
            isFetching: false,
            error: null,
            userOneTimeInfo,
            avatarName: userAvatarImageName,
          },
          wallet: {
            walletBalance,
            walletAddresses,
            walletHistory,
            backup,
            payment,
          },
          restore: {
            status: 'none',
            error: null,
            restoreFile: {
              fileName: 'backup.zip',
              fileSize: 22,
              type: 'application/zip',
              uri:
                'file://data/Containers/Data/Application/021D78D1-044B-4874-BE8D-EC71781CA978/tmp/com.evernym.connectme.callcenter-Inbox/backup.zip',
            },
          },
          ledger: ledgerStoreWithTransferFees,
          offline: {
            offline: false,
          },
          sendlogs: {
            encryptLogStatus: false,
          },
          history: {
            data: {
              connections: {
                senderDID3: {
                  data: connectionHistory['September 2017'].data,
                  newBadge: connectionHistory['September 2017'].newBadge,
                },
                senderDID4: {
                  data: connectionHistory['October 2017'].data,
                  newBadge: connectionHistory['October 2017'].newBadge,
                },
                senderDID5: {
                  data: connectionHistory['November 2017'].data,
                  newBadge: connectionHistory['November 2017'].newBadge,
                },
                senderDID6: {
                  data: connectionHistory['December 2017'].data,
                  newBadge: connectionHistory['December 2017'].newBadge,
                },
                senderDID7: {
                  data: connectionHistory['January 2017'].data,
                  newBadge: connectionHistory['January 2017'].newBadge,
                },
                senderDID8: {
                  data: connectionHistory['February 2017'].data,
                  newBadge: connectionHistory['February 2017'].newBadge,
                },
              },
              connectionsUpdated: true,
            },
            isLoading: true,
          },
          claimOffer: {
            vcxSerializedClaimOffers: {},
            claimOfferUid: {
              data: {
                name: 'dataname',
                revealedAttributes: [],
                version: 'version',
                claimDefinitionSchemaSequenceNumber: 34,
              },
              issuer: {
                name: 'issuername',
                did: 'adsfasdfadf',
              },
              uid: 'claimOfferUid',
              status: CLAIM_OFFER_STATUS.RECEIVED,
              remotePairwiseDID: 'claimOffer.remotePairwiseDID',
              claimRequestStatus: CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST,
            },
          },
          proofRequest: {
            uidProofReceived: {
              data: {
                requestedAttributes: [],
                version: 'proofRequestVersion',
                name: 'proofRequestName',
              },
              uid: 'uidProofReceived',
              status: PROOF_REQUEST_STATUS.RECEIVED,
              remotePairwiseDID: 'remotePairwiseDID',
              proofStatus: PROOF_STATUS.SEND_PROOF_SUCCESS,
              requester: {
                name: 'uidProofReceived.requester.name',
              },
              proofHandle: 1235890,
              originalProofRequestData: {
                version: 'asdf',
                nonce: 'dsfsdf',
                name: 'asdfasdf',
                requested_attributes: {},
              },
            },
            requester: {
              uid: 'requesterUID',
              status: PROOF_REQUEST_STATUS.RECEIVED,
              remotePairwiseDID: 'remotePairwiseDID',
              proofStatus: PROOF_STATUS.SEND_PROOF_SUCCESS,
              requester: {
                name: 'requester.name',
              },
              proofHandle: 12340987,
              originalProofRequestData: {
                version: 'asdf',
                nonce: 'dsfsdf',
                name: 'asdfasdf',
                requested_attributes: {},
              },
              data: {
                name: 'dataname',
                version: 'dataversion',
                requestedAttributes: [],
              },
            },
          },
          question: {
            data: {},
            storageStatus: STORAGE_STATUS.RESTORE_SUCCESS,
          },
          proof: {
            uidProofReceived: {
              proof: {
                requested_proof: {
                  unrevealed_attrs: {},
                  self_attested_attrs: {},
                  revealed_attrs: {},
                  predicates: {},
                },
                proofs: {},
                aggregated_proof: {
                  c_list: [],
                  c_hash: 'proofC_Hash',
                },
              },
            },
          },
          txnAuthorAgreement: {
            haveAlreadySignedAgreement: false,
            thereIsANewAgreement: false,
            status: 'IDLE',
            text: '',
            taaAcceptedVersion: '',
            version: '',
          },
          inAppNotification: inAppNotificationMockData,
        },
        store
      )
    },
    // $FlowFixMe Don't why this is failing, may be we upgrade to flow 0.63
    dispatch: jest.fn(),
    // $FlowFixMe Don't why this is failing, may be we upgrade to flow 0.63
    subscribe: jest.fn(),
  }
}

export const invitationReceivedEvent = {
  type: INVITATION_RECEIVED,
  data: { ...firstInvitationPayload },
}

export const invitationAcceptedEvent = invitationAccepted(
  invitationAcceptedData.senderDID,
  invitationAcceptedData.payload
)

export const sendClaimRequestSuccessEvent = sendClaimRequestSuccess(
  uid,
  claimOfferPayload
)

export const claimReceivedSuccessEvent = claimStorageSuccess(
  uid,
  claimUUID,
  claimOfferIssueDate
)

export const proofRequestReceivedEvent = proofRequestReceived(
  proofRequest.payload,
  proofRequest.payloadInfo
)

export const proofSharedEvent = sendProofSuccess(proofRequestId)

export const proofRequestAutofill = {
  status: 'RECEIVED',
  proofStatus: 'NONE',
  uid: proofRequestId,
  senderLogoUrl,
  remotePairwiseDID: 'remotePairWiseDID',
  data: {
    name: 'proof_req_auto_filled',
    version: 'version',
    requestedAttributes,
  },
  requester: {
    name: 'reqeusterName',
  },
  originalProofRequestData,
  statusMsg: 'statusMsg',
  proofHandle: 0,
}

export { userOneTimeInfo } from './data/user-store-mock-data'

export const backup = {
  status: STORE_STATUS.IDLE,
  fileStatus: STORE_STATUS.IDLE,
  error: null,
  latest: '2017-09-06T00:00:00+05:30',
  backupPath: 'test_backup_path',
  encryptionKey: 'walletEncryptionKey',
}

export const qrData = {
  id: 'yta2odh',
  s: {
    n: 'ent-name',
    dp: {
      d: 'N2Uyi6SVsHZq1VWXuA3EMg',
      k: 'CTfF2sZ5q4oPcBvTP75pgx3WGzYiLSTwHGg9zUsJJegi',
      s:
        '/FxHMzX8JaH461k1SI5PfyxF5KwBAe6VlaYBNLI2aSZU3APsiWBfvSC+mxBYJ/zAhX9IUeTEX67fj+FCXZZ2Cg==',
    },
    d: 'F2axeahCaZfbUYUcKefc3j',
    l: 'ent-logo-url',
    v: '74xeXSEac5QTWzQmh84JqzjuXc8yvXLzWKeiqyUnYokx',
  },
  sa: {
    d: 'BDSmVkzxRYGE4HKyMKxd1H',
    v: '6yUatReYWNSUfEtC2ABgRXmmLaxCyQqsjLwv2BomxsxD',
    e: '52.38.32.107:80/agency/msg',
  },
  t: 'there',
}

export const validQrCodeEnvironmentSwitchUrl =
  'https://s3-us-west-2.amazonaws.com/vcx-env/dev'

export const validInvitationUrlQrCode = 'https://dev-agency.com/vcx-env/dev'

export const connectionHistory = {
  'September 2017': {
    data: [
      {
        id: '1',
        type: 'INVITATION',
        icon: require('../src/images/linked.png'),
        action: 'CONNECTED',
        timestamp: '2017-09-06T00:00:00+05:30',
        data: [
          {
            label: 'Evernym',
            data: '2017-09-06T00:00:00+05:30',
          },
        ],
        name: 'Enterprise name',
        status: 'INVITATION_RECEIVED',
        remoteDid: 'remoteDid',
        originalPayload: {},
      },
    ],
    newBadge: false,
  },
  'October 2017': {
    data: [
      {
        id: '1',
        type: 'INVITATION',
        icon: require('../src/images/linked.png'),
        action: 'SHARED',
        timestamp: '2017-09-06T00:00:00+05:30',
        data: [
          {
            label: 'Evernym',
            data: '2017-09-06T00:00:00+05:30',
          },
        ],
        name: 'Enterprise name',
        status: 'INVITATION_RECEIVED',
        remoteDid: 'remoteDid',
        originalPayload: {},
      },
    ],
    newBadge: false,
  },
  'November 2017': {
    data: [
      {
        id: '1',
        type: 'INVITATION',
        icon: require('../src/images/linked.png'),
        action: 'PENDING',
        timestamp: '2017-09-06T00:00:00+05:30',
        data: [
          {
            label: 'Evernym',
            data: '2017-09-06T00:00:00+05:30',
          },
        ],
        name: 'Enterprise name',
        status: 'INVITATION_RECEIVED',
        remoteDid: 'remoteDid',
        originalPayload: {},
      },
    ],
    newBadge: false,
  },
  'December 2017': {
    data: [
      {
        id: '1',
        type: 'INVITATION',
        icon: require('../src/images/linked.png'),
        action: 'PROOF RECEIVED',
        timestamp: '2017-09-06T00:00:00+05:30',
        data: [
          {
            label: 'Evernym',
            data: '2017-09-06T00:00:00+05:30',
          },
        ],
        name: 'Enterprise name',
        status: 'INVITATION_RECEIVED',
        remoteDid: 'remoteDid',
        originalPayload: {
          payloadInfo: {
            uid: 'uidProofReceived',
          },
          payload: {
            requester: {
              name: 'bob',
            },
          },
        },
      },
    ],
    newBadge: false,
  },
  'January 2017': {
    data: [
      {
        id: '1',
        type: 'INVITATION',
        icon: require('../src/images/linked.png'),
        action: 'RECEIVED',
        timestamp: '2017-09-06T00:00:00+05:30',
        data: [
          {
            label: 'Evernym',
            data: '2017-09-06T00:00:00+05:30',
          },
        ],
        name: 'Enterprise name',
        status: 'INVITATION_RECEIVED',
        remoteDid: 'remoteDid',
        originalPayload: {
          payloadInfo: {
            uid: 'uidProofReceived',
          },
          payload: {
            requester: {
              name: 'bob',
            },
          },
        },
      },
    ],
    newBadge: false,
  },
  'February 2017': {
    data: [
      {
        id: '1',
        type: 'INVITATION',
        icon: require('../src/images/linked.png'),
        action: 'CLAIM OFFER RECEIVED',
        timestamp: '2017-09-06T00:00:00+05:30',
        data: [
          {
            label: 'Evernym',
            data: '2017-09-06T00:00:00+05:30',
          },
        ],
        name: 'Enterprise name',
        status: 'INVITATION_RECEIVED',
        remoteDid: 'remoteDid',
        originalPayload: {
          payloadInfo: {
            uid: 'uidProofReceived',
          },
          payload: {
            requester: {
              name: 'bob',
            },
          },
        },
      },
    ],
    newBadge: false,
  },
}

export const mockConnection1 = {
  ...successConnectionData.newConnection,
  vcxSerializedConnection: '',
  identifier: '4ej819kkjywdppuje79',
  name: 'Test Connection1',
  senderName: 'senderName',
  senderDID: 'senderDID',
  remoteConnectionId: '70075yyojywdppuje79',
  size: 100,
  logoUrl: 'https://logourl.com/logo.png',
  publicDID: null,
}

export const connections = {
  ['4ej819kkjywdppuje79']: mockConnection1,
  ['3nj819kkjywdppuje86']: {
    ...successConnectionData.newConnection,
    vcxSerializedConnection: '',
    identifier: '3nj819kkjywdppuje86',
    name: 'Test Connection2',
    senderName: 'senderName',
    senderDID: 'senderDID',
    remoteConnectionId: '70075yyojywdppuje79',
    size: 100,
    logoUrl: 'https://logourl.com/logo.png',
    publicDID: null,
  },
  ['7fj819kkjywdppuje34']: {
    ...successConnectionData.newConnection,
    vcxSerializedConnection: '',
    identifier: '7fj819kkjywdppuje34',
    name: 'Test Connection3',
    senderName: 'senderName',
    senderDID: 'senderDID',
    remoteConnectionId: '70075yyojywdppuje79',
    size: 100,
    logoUrl: 'https://logourl.com/logo.png',
    publicDID: null,
  },
}

export const claimMap = {
  claimUuid1: {
    logoUrl: senderLogoUrl,
    myPairwiseDID: myPairWiseConnectionDetails.myPairwiseDid,
    senderDID: senderDid1,
    issueDate: 120,
  },
}

export const claimOfferPushNotification = {
  additionalData: {
    data: {
      name: 'Home Address',
      version: '1.0.0',
      revealedAttributes: [
        {
          label: 'Address 1',
          data: 'Address Address Address',
        },
        {
          label: 'Address 2',
          data: 'Address 2 Address 2 Address 2',
        },
      ],
    },
    issuer: {
      name: 'Test Issuer',
      did: 'issuerDid',
    },
    statusMsg: 'pending',
  },
  type: 'claimOffer',
  uid: 'usd123',
  senderLogoUrl: 'http://testissuer.com/logoUrl.png',
  remotePairwiseDID: 'ha66899sadfjZJGINKN0770',
  forDID: 'forDID',
  notificationOpenOptions: null,
}

export const getSmsPendingInvitationOfToken = (token: string) => ({
  [token]: {
    error: null,
    isFetching: false,
    status: 'RECEIVED',
    payload: smsDownloadedPayload,
  },
})

export const defaultUUID = 'a4f35623-b50c-40ea-a2b0-f7cd06e03142'

export const userAvatarImageName = `user-avatar.jpeg`

export const userAvatarImagePath = `/var/application/DocumentDir/${userAvatarImageName}`

export const walletBalance = {
  data: '1000',
  status: STORE_STATUS.SUCCESS,
  error: null,
}

export const payment = {
  tokenAmount: '5656',
  status: STORE_STATUS.SUCCESS,
  error: null,
}

export const walletAddresses = {
  data: ['sov:ksudgyi8f98gsih7655hgifuyg79s89s98ydf98fg7gks8fjhkss8f030'],
  status: STORE_STATUS.SUCCESS,
  error: null,
}

export const walletHistory = {
  transactions: [
    {
      id: 'asd',
      senderAddress: 'sov:senderAddress',
      action: 'Withdraw',
      tokenAmount: '5656',
      timeStamp: 'Tue, 04 Aug 2015 12:38:41 GMT',
    },
    {
      id: 'kld',
      senderName: 'senderName',
      senderAddress: 'sov:senderAddress',
      action: 'Purchase',
      tokenAmount: '10000',
      timeStamp: 'Tue, 04 Aug 2015 14:38:41 GMT',
    },
  ],
  status: STORE_STATUS.SUCCESS,
  error: null,
}

export {
  vcxProvisionResult,
  serializedClaimOffers,
  serializedClaimOffer,
  vcxClaimOffer,
} from './data/vcx-mock-data'
export { connectionThemes } from './data/connections-mock-data'

export const proofRequestPushPayloadAdditionalData = {
  '@type': {
    name: 'PROOF_REQUEST',
    version: '1.0',
  },
  '@topic': {
    tid: 1,
    mid: 9,
  },
  proof_request_data: originalProofRequestData,
  remoteName: 'Evernym',
  proofHandle,
}
