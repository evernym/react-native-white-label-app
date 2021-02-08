// @flow
import type { QuestionResponse } from '../question/type-question'
import type { ReactNavigation } from '../common/type-common'
export const TAA_STATUS = {
  IDLE: 'IDLE',
  GET_TAA_IN_PROGRESS: 'GET_TAA_IN_PROGRESS',
  GET_TAA_SUCCESS: 'GET_TAA_SUCCESS',
  GET_TAA_ERROR: 'GET_TAA_ERROR',
  ACCEPT_TAA_IN_PROGRESS: 'ACCEPT_TAA_IN_PROGRESS',
  ACCEPT_TAA_SUCCESS: 'ACCEPT_TAA_SUCCESS',
  ACCEPT_TAA_ERROR: 'ACCEPT_TAA_ERROR',
}

export const TAA_RECEIVED = 'TAA_RECEIVED'
export const TAA_ACCEPT_SUBMIT = 'TAA_ACCEPT_SUBMIT'
export const UPDATE_TAA_STATUS = 'UPDATE_TAA_STATUS'
export const HYDRATE_TAA_ACCEPTED_VERSION = 'HYDRATE_TAA_ACCEPTED_VERSION'

export const CHECK_TXN_AUTHOR_AGREEMENT = 'CHECK_TXN_AUTHOR_AGREEMENT'
export type CheckTxnAuthorAgreementAction = {
  type: typeof CHECK_TXN_AUTHOR_AGREEMENT,
}

export type SubmitTxnAuthorAgreementAction = {
  type: typeof TAA_ACCEPT_SUBMIT,
}

export const TAA_ACCEPTED = 'TAA_ACCEPTED'

export type TAAResponse = {
  version: string,
  text: string,
  aml: Object,
}
export type TAAPayload = {
  version: string,
  text: string,
  aml: Object,
}

export type TxnAuthorAgreementAcceptedAction = {
  type: typeof TAA_ACCEPTED,
  taaAcceptedVersion: string,
  answer: QuestionResponse,
}
export type TxnAuthorAgreementScreenProps = {
  haveAlreadySignedAgreement: boolean,
  text: string,
  version: string,
  taaAcceptedVersion: string,
  status: string,
  taaAcceptSubmit: () => void,
  checkTxnAuthorAgreement: () => void,
  taaAccepted: () => void,
} & ReactNavigation

export type TxnAuthorAgreementStore = {
  haveAlreadySignedAgreement: boolean,
  text: string,
  version: string,
  status: string,
  thereIsANewAgreement: boolean,
  taaAcceptedVersion: string,
}

export type TxnAuthorAgreementAction =
  | CheckTxnAuthorAgreementAction
  | TxnAuthorAgreementAcceptedAction
