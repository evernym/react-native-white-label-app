// @flow

import {
  COMMITEDANSWER_QUESTION_PROTOCOL,
  QUESTION_STATUS,
} from '../../src/question/type-question'
import { STORAGE_STATUS } from '../../src/common/type-common'

export const mockExternalLink = {
  text: 'An external link',
  src: 'https://somexternal.com/link',
}

export const mockExternalLinkNoText = {
  src: 'https://secondlink.com/external',
}

export const mockExternalLinks = [mockExternalLink, mockExternalLinkNoText]

export const mockQuestionPayload = {
  messageTitle: 'Message Title',
  messageText: 'Message Text',
  '@type': COMMITEDANSWER_QUESTION_PROTOCOL,
  messageId: 'MSG-ID',
  question_text: 'Question Text',
  question_detail: 'Question Detail',
  valid_responses: [
    { text: 'Answer 1', nonce: 'YES' },
    { text: 'Answer 2', nonce: 'No' },
  ],
  timing: { expires_time: '2017-06-01:05:07:07' },
  issuer_did: 'issuerDid',
  remoteDid: 'remoteDid',
  uid: '001',
  from_did: 'senderDID1',
  forDID: 'myPairwiseDid',
  externalLinks: [],
}

export const mockQuestionPayload2 = {
  messageTitle: 'Survey request for family members',
  messageText: 'Hi User,',
  '@type': COMMITEDANSWER_QUESTION_PROTOCOL,
  messageId: 'MSG-ID-2',
  question_text: 'How many members are in your family',
  question_detail:
    'Some more details regarding question that should scrolled along with some data',
  valid_responses: [
    { text: '0 to 2 people', nonce: 'akdfakjfkjdaadkgak' },
    { text: '3 to 5 people', nonce: 'hyjjjjuifhjkiutyojoh' },
    { text: '6 to 10 people', nonce: 'hyjjjjuifhjkiutdsyojoh' },
  ],
  timing: { expires_time: '2017-06-01:05:07:07' },
  issuer_did: 'issuerDid',
  remoteDid: 'remoteDid',
  uid: '002',
  from_did: 'senderDID1',
  forDID: 'myPairwiseDid',
  externalLinks: mockExternalLinks,
}

export const mockQuestionPayload3 = {
  messageTitle: 'Are you trying to sign in?',
  messageText: 'Hi User,',
  '@type': COMMITEDANSWER_QUESTION_PROTOCOL,
  messageId: 'MSG-ID-3',
  question_text: 'Are you trying to sign in to gmail.com?',
  question_detail: 'Are you trying to sign in to gmail.com?',
  valid_responses: [{ text: 'Yes', nonce: 'akdfakjfkjdaadkgak' }],
  timing: { expires_time: '2017-06-01:05:07:07' },
  issuer_did: 'issuerDid',
  remoteDid: 'remoteDid',
  uid: '003',
  from_did: 'senderDID1',
  forDID: 'myPairwiseDid',
  externalLinks: [],
}

export const mockQuestionReceivedState = {
  data: {
    [mockQuestionPayload.uid]: {
      payload: mockQuestionPayload,
      status: QUESTION_STATUS.RECEIVED,
      answer: null,
      answerMsgId: null,
      error: null,
    },
    [mockQuestionPayload2.uid]: {
      payload: mockQuestionPayload2,
      status: QUESTION_STATUS.RECEIVED,
      answer: null,
      answerMsgId: null,
      error: null,
    },
  },
  storageStatus: STORAGE_STATUS.RESTORE_SUCCESS,
}
