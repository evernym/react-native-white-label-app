// @flow
export const SHOW_CREDENTIAL = 'SHOW_CREDENTIAL'
export type ShowCredentialAction = {
  type: typeof SHOW_CREDENTIAL,
  claimOfferUuid: string,
}

export const SHOW_CREDENTIAL_READY = 'SHOW_CREDENTIAL_READY'
export type ShowCredentialReadyAction = {
  type: typeof SHOW_CREDENTIAL_READY,
  presentationProposal: string,
  credentialUuid: string,
  connectionIdentifier: string,
}

export const SHOW_CREDENTIAL_FAIL = 'SHOW_CREDENTIAL_FAIL'
export type ShowCredentialFailAction = {
  type: typeof SHOW_CREDENTIAL_FAIL,
  error: string,
}

export const CREDENTIAL_PRESENTATION_SENT = 'CREDENTIAL_PRESENTATION_SENT'
export type CredentialPresentationSentAction = {
  type: typeof CREDENTIAL_PRESENTATION_SENT,
}

export const SHOW_CREDENTIAL_FINISHED = 'SHOW_CREDENTIAL_FINISHED'
export type ShowCredentialFinishedAction = {
  type: typeof SHOW_CREDENTIAL_FINISHED,
}

export type ShowCredentialActions =
  | ShowCredentialAction
  | ShowCredentialReadyAction
  | ShowCredentialFailAction
  | CredentialPresentationSentAction
  | ShowCredentialFinishedAction

export type ShowCredentialStore = {
  data: string | null,
  credentialUuid: string | null,
  connectionIdentifier: string | null,
  error: string | null,
  isSent: boolean,
}

export const ShowCredentialStoreInitialState = {
  data: null,
  credentialUuid: null,
  connectionIdentifier: null,
  error: null,
  isSent: false,
}
