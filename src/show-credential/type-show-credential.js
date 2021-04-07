export const SHOW_CREDENTIAL = 'SHOW_CREDENTIAL'
export type ShowCredentialAction = {
  type: typeof SHOW_CREDENTIAL,
  claimOfferUuid: string,
}
export const showCredential = (claimOfferUuid: string): ShowCredentialAction => ({
  type: SHOW_CREDENTIAL,
  claimOfferUuid,
})

export const SHOW_CREDENTIAL_READY = 'SHOW_CREDENTIAL_READY'
export type ShowCredentialReadyAction = {
  type: typeof SHOW_CREDENTIAL_READY,
  presentationProposal: string,
  connectionIdentifier: string,
}
export const showCredentialReady = (
  presentationProposal: string,
  connectionIdentifier: string,
): ShowCredentialReadyAction => ({
  type: SHOW_CREDENTIAL_READY,
  presentationProposal,
  connectionIdentifier,
})

export const SHOW_CREDENTIAL_FAIL = 'PREPARE_PRESENTATION_PROPOSAL_FAIL'
export type ShowCredentialFailAction = {
  type: typeof SHOW_CREDENTIAL_FAIL,
  error: string,
}
export const showCredentialFail = (error: string): ShowCredentialFailAction => ({
  type: SHOW_CREDENTIAL_FAIL,
  error,
})

export const CREDENTIAL_PRESENTATION_SENT = 'CREDENTIAL_PRESENTATION_SENT'
export type CredentialPresentationSentAction = {
  type: typeof CREDENTIAL_PRESENTATION_SENT,
}
export const credentialPresentationSent = (): CredentialPresentationSentAction => ({
  type: CREDENTIAL_PRESENTATION_SENT,
})

export const SHOW_CREDENTIAL_DONE = 'SHOW_CREDENTIAL_DONE'
export type ShowCredentialDoneAction = {
  type: typeof SHOW_CREDENTIAL_DONE,
}
export const showCredentialDone = (): ShowCredentialDoneAction => ({
  type: SHOW_CREDENTIAL_DONE,
})

export type ShowCredentialActions =
  | ShowCredentialAction
  | ShowCredentialReadyAction
  | ShowCredentialFailAction
  | CredentialPresentationSentAction
  | ShowCredentialDoneAction

export type ShowCredentialStore = {
  data: string | null,
  connectionIdentifier: string | null,
  error: string | null,
  isSent: boolean,
}

export const ShowCredentialStoreInitialState = {
  data: null,
  error: null,
  isSent: false,
}



