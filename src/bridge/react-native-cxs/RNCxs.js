// @flow
import { NativeModules, Platform } from 'react-native'
import memoize from 'lodash.memoize'
import type {
  CxsCredentialOfferResult,
  CxsInitConfig,
  CxsPoolConfig,
  CxsPushTokenConfig,
  PaymentAddress,
  SignDataResponse,
  VcxClaimInfo,
  VcxConnectionConnectResult,
  VcxCredentialOffer,
  VcxInitConfig,
  VcxPoolInitConfig,
  VcxProvision,
  VcxProvisionResult,
  WalletTokenInfo,
} from './type-cxs'
import { signDataResponseSchema, smallDeviceMemory } from './type-cxs'
import type { AriesOutOfBandInvite, InvitationPayload } from '../../invitation/type-invitation'
import type { CredentialOffer } from '../../claim-offer/type-claim-offer'
import {
  convertAgencyConfigToVcxProvision,
  convertAriesCredentialOfferToCxsClaimOffer,
  convertCxsInitToVcxInit,
  convertCxsPoolInitToVcxPoolInit,
  convertCxsPushConfigToVcxPushTokenConfig,
  convertInvitationToVcxConnectionCreate,
  convertVcxConnectionToCxsConnection,
  convertVcxCredentialOfferToCxsClaimOffer,
  convertVcxProvisionResultToUserOneTimeInfo,
  paymentHandle,
} from './vcx-transformers'
import type { UserOneTimeInfo } from '../../store/user/type-user-store'
import type { AgencyPoolConfig, MessagePaymentDetails } from '../../store/type-config-store'
import { __uniqueId } from '../../store/type-config-store'
import type { ClaimPushPayload, GetClaimVcxResult } from '../../push-notification/type-push-notification'
import type { WalletHistoryEvent } from '../../wallet/type-wallet'
import type { Passphrase } from '../../backup/type-backup'
import uniqueId from 'react-native-unique-id'
import { getWalletKey, secureSet } from '../../services/storage'
import type { LedgerFeesData } from '../../ledger/type-ledger-store'
import { schemaValidator } from '../../services/schema-validator'
import {
  convertSovrinAtomsToSovrinTokens,
  convertSovrinTokensToSovrinAtoms,
  convertVcxLedgerFeesToLedgerFees,
} from '../../sovrin-token/sovrin-token-converter'
import { uuid } from '../../services/uuid'
import type { GenericObject } from '../../common/type-common'
import type { PairwiseAgent } from '../../store/type-connection-store'

import {
  Agent,
  CloudWalletBackup,
  Connection,
  Credential,
  Library,
  Proof,
  Utils,
  Verifier,
  Wallet,
} from 'react-native-vcx-wrapper'

const { RNUtils } = NativeModules

// Agent
export async function updatePushTokenVcx(pushTokenConfig: CxsPushTokenConfig) {
  return await Agent.updateInfo(
    JSON.stringify(convertCxsPushConfigToVcxPushTokenConfig(pushTokenConfig))
  )
}

export async function createOneTimeInfo(
  agencyConfig: AgencyPoolConfig
): Promise<[null | string, null | UserOneTimeInfo]> {
  try {
    const walletPoolName = await getWalletPoolName()
    const vcxProvisionConfig: VcxProvision = await convertAgencyConfigToVcxProvision(
      agencyConfig,
      walletPoolName
    )
    const provisionVcxResult: string = await Agent.provision(
      JSON.stringify(vcxProvisionConfig)
    )
    const provisionResult: VcxProvisionResult = JSON.parse(provisionVcxResult)
    return [null, convertVcxProvisionResultToUserOneTimeInfo(provisionResult)]
  } catch (e) {
    return [`${e}`, null]
  }
}

export async function getProvisionToken(
  agencyConfig: AgencyPoolConfig,
  comMethod: { type: number, id: string, value: string },
  sponsorId: string
): Promise<[null | string, null | string]> {
  try {
    const walletPoolName = await getWalletPoolName()
    const vcxConfig: VcxProvision = await convertAgencyConfigToVcxProvision(
      agencyConfig,
      walletPoolName
    )
    const vcxProvisionConfig = {
      vcx_config: vcxConfig,
      source_id: 'someSourceId',
      com_method: comMethod,
      sponsee_id: comMethod.id,
      sponsor_id: sponsorId,
    }
    let provisionToken: string = await Agent.getProvisionToken(
      JSON.stringify(vcxProvisionConfig)
    )

    let tempProvisionToken = JSON.parse(provisionToken)
    tempProvisionToken['sponseeId'] = comMethod.id
    provisionToken = JSON.stringify(tempProvisionToken)

    return [null, provisionToken]
  } catch (e) {
    return [`${e}`, null]
  }
}

export async function createOneTimeInfoWithToken(
  agencyConfig: AgencyPoolConfig,
  token: string
): Promise<[null | string, null | UserOneTimeInfo]> {
  try {
    const walletPoolName = await getWalletPoolName()
    const vcxProvisionConfig: VcxProvision = await convertAgencyConfigToVcxProvision(
      agencyConfig,
      walletPoolName
    )
    const provisionVcxResult: string = await Agent.provisionWithToken(
      JSON.stringify(vcxProvisionConfig),
      token
    )
    const provisionResult: VcxProvisionResult = JSON.parse(provisionVcxResult)
    return [null, convertVcxProvisionResultToUserOneTimeInfo(provisionResult)]
  } catch (e) {
    return [`${e}`, null]
  }
}

export async function decryptWalletFile(
  walletPath: string,
  decryptionKey: string
): Promise<number> {
  const { walletName } = await getWalletPoolName()
  const wallet_key = await getWalletKey()

  const config = JSON.stringify({
    wallet_name: walletName,
    wallet_key,
    exported_wallet_path: walletPath,
    backup_key: decryptionKey,
  })
  return await Agent.import(config)
}

export async function downloadMessages(
  messageStatus: string,
  uid_s: ?string,
  pwdids: string
): Promise<string> {
  return await Agent.downloadMessages(messageStatus, uid_s, pwdids)
}

export async function vcxGetAgentMessages(
  messageStatus: string,
  uid_s: ?string
): Promise<string> {
  return await Agent.downloadAgentMessages(messageStatus, uid_s)
}

export async function updateMessages(
  messageStatus: string,
  pwdidsJson: string
): Promise<number> {
  return await Agent.updateMessages(messageStatus, pwdidsJson)
}

export async function createPairwiseAgent(): Promise<string> {
  const agentInfo = await Agent.createPairwiseAgent()
  return JSON.parse(agentInfo)
}

// Cloud Wallet Backup
export async function restoreWallet(
  walletPath: string,
  decryptionKey: string
): Promise<number> {
  const { walletName } = await getWalletPoolName()
  const wallet_key = await getWalletKey()
  const config = JSON.stringify({
    wallet_name: walletName,
    wallet_key,
    exported_wallet_path: walletPath,
    backup_key: decryptionKey,
  })
  return await CloudWalletBackup.restore(config)
}

export async function createWalletBackup(
  sourceID: string,
  backupKey: string
): Promise<number> {
  return await CloudWalletBackup.create(sourceID, backupKey)
}

export async function backupWalletBackup(
  walletBackupHandle: number,
  path: string
): Promise<number> {
  return await CloudWalletBackup.send(walletBackupHandle, path)
}

export async function updateWalletBackupStateWithMessage(
  walletBackupHandle: number,
  message: string
): Promise<number> {
  return await CloudWalletBackup.updateStateWithMessage(
    walletBackupHandle,
    message
  )
}

// Connection
export async function acceptInvitationVcx(
  connectionHandle: number,
  agentInfo: PairwiseAgent | null,
): Promise<GenericObject> {
  const connectionOption = agentInfo ? { pairwise_agent_info: agentInfo } : {}

  const invitation = await Connection.connect(connectionHandle, JSON.stringify(connectionOption))
  const serializedConnection: string = await serializeConnection(connectionHandle)

  const {
    data,
  }: {
    data: VcxConnectionConnectResult,
    version: string,
  } = JSON.parse(serializedConnection)

  // un-comment below line if data structure is changed
  // if (data.state && version === '2.0') {
  //   // if this is aries version of connection
  //   return convertVcxConnectionV2ToCMConnection(data)
  // } else if (data.pw_did) {
  // }

  return {
    connection: convertVcxConnectionToCxsConnection(data),
    serializedConnection,
    invitation
  }
}

export async function deleteConnection(connectionHandle: number) {
  return await Connection.delete(connectionHandle)
}

export async function createConnectionWithInvite(
  invitation: InvitationPayload
): Promise<number> {
  const { invite_details } = convertInvitationToVcxConnectionCreate(invitation)
  return await Connection.createWithInvitation(
    invitation.requestId,
    JSON.stringify(invite_details)
  )
}

export async function createConnectionWithAriesInvite(
  invitation: InvitationPayload
): Promise<number> {
  return await Connection.createWithInvitation(
    invitation.requestId,
    invitation.original
  )
}

export async function createConnectionWithAriesOutOfBandInvite(
  invitation: InvitationPayload
): Promise<number> {
  return await Connection.createWithOutofbandInvitation(
    invitation.requestId,
    invitation.original
  )
}

export async function serializeConnection(
  connectionHandle: number
): Promise<string> {
  return await Connection.serialize(
    connectionHandle
  )
}

// cache Promise of serializedString so that we don't call Bridge method again
export const getHandleBySerializedConnection = memoize(async function (
  serializedConnection: string
): Promise<number> {
  return await Connection.deserialize(
    serializedConnection
  )
})

export async function connectionSendMessage(
  connectionHandle: number,
  options: {
    message: string,
    messageType: string,
    messageTitle: string,
    refMessageId?: string,
  }
): Promise<string> {
  const sendMessageOptions = JSON.stringify({
    msg_type: options.messageType,
    msg_title: options.messageTitle,
    ref_msg_id: options.refMessageId || null,
  })

  const isAries = JSON.parse(options.message)['~thread']

  const msgId: string = await Connection.sendMessage(
    connectionHandle,
    options.message,
    sendMessageOptions
  )

  // since we are calling an external API, we need to make sure that
  // the data that we are receiving is the data that we need
  if (isAries && typeof msgId !== 'string') {
    throw new Error(
      `Invalid data received from wrapper. Excepted msgId, got ${msgId}`
    )
  } else if (!isAries && (typeof msgId !== 'string' || msgId.length === 0)) {
    throw new Error(
      `Invalid data received from wrapper. Excepted msgId, got ${msgId}`
    )
  }

  return msgId
}

export async function connectionSignData(
  connectionHandle: number,
  data: string,
  base64EncodingOption: string = 'NO_WRAP',
  encodeBeforeSigning: boolean = true
): Promise<SignDataResponse> {
  const response: SignDataResponse = await Connection.signData(
    connectionHandle,
    data,
    base64EncodingOption,
    encodeBeforeSigning
  )

  // external API data needs to be validated
  if (!schemaValidator.validate(signDataResponseSchema, response)) {
    // if data is not as per our expectation from external API
    // then we raise invalid data error
    throw new Error(`Invalid data received`)
  }

  return response
}

export async function connectionVerifySignature(
  connectionHandle: number,
  data: string,
  signature: string
): Promise<boolean> {
  const response: boolean = await Connection.verifySignature(
    connectionHandle,
    data,
    signature
  )

  if (typeof response !== 'boolean') {
    throw new Error(`Expected response type was boolean but got ${response}`)
  }

  return response
}

export async function connectionRedirect(
  redirectConnectionHandle: number,
  connectionHandle: number
): Promise<void> {
  return Connection.redirect(redirectConnectionHandle, connectionHandle)
}

export async function connectionReuse(
  connectionHandle: number,
  invite: AriesOutOfBandInvite
): Promise<void> {
  return Connection.reuse(connectionHandle, JSON.stringify(invite))
}

export async function connectionGetState(
  connectionHandle: number
): Promise<number> {
  return Connection.getState(connectionHandle)
}

export async function connectionUpdateState(connectionHandle: number) {
  return Connection.updateState(connectionHandle)
}

export async function connectionUpdateStateWithMessage(
  connectionHandle: number,
  message: string
) {
  return Connection.updateStateWithMessage(connectionHandle, message)
}

export async function connectionSendAnswer(
  connectionHandle: number,
  question: string,
  answer: string
): Promise<void> {
  return await Connection.sendAnswer(connectionHandle, question, answer)
}

export async function createOutOfBandConnectionInvitation(
  goal: string,
  handshake?: boolean,
  attachment?: string | null,
  agentInfo: PairwiseAgent | null,
): Promise<GenericObject> {
  const connectionHandle = await Connection.createOutOfBandConnectionInvitation(
    uuid(),
    null,
    goal,
    handshake,
    attachment
  )

  let {
    connection: pairwiseInfo,
    serializedConnection: vcxSerializedConnection,
    invitation,
  } =  await acceptInvitationVcx(connectionHandle, agentInfo)

  return {
    pairwiseInfo,
    vcxSerializedConnection,
    invitation,
  }
}

// Credential
export async function credentialCreateWithOffer(
  sourceId: string,
  credentialOffer: string
): Promise<number> {
  return await Credential.createWithOffer(sourceId, credentialOffer)
}

export async function serializeClaimOffer(
  claimHandle: number
): Promise<string> {
  return await Credential.serialize(
    claimHandle
  )
}

export const getClaimHandleBySerializedClaimOffer = memoize(async function (
  serializedClaimOffer: string
): Promise<number> {
  return await Credential.deserialize(
    serializedClaimOffer
  )
})

export async function sendClaimRequest(
  claimHandle: number,
  connectionHandle: number,
  paymentHandle: number
): Promise<void> {
  return await Credential.sendRequest(
    claimHandle,
    connectionHandle,
    paymentHandle
  )
}

export async function updateClaimOfferState(claimHandle: number) {
  return await Credential.updateState(claimHandle)
}

export async function updateClaimOfferStateWithMessage(
  claimHandle: number,
  message: string
) {
  return await Credential.updateStateWithMessage(
    claimHandle,
    message
  )
}

export async function getClaimOfferState(claimHandle: number): Promise<number> {
  return await Credential.getState(claimHandle)
}

export async function getClaimVcx(
  claimHandle: number
): Promise<GetClaimVcxResult> {
  const vcxClaimResult: string = await Credential.getCredentialMessage(claimHandle)
  const vcxClaim: VcxClaimInfo = JSON.parse(vcxClaimResult)
  const { credential, credential_id } = vcxClaim

  if (!credential || !credential_id) {
    throw new Error('credential not found in vcx')
  }

  const credentialPayload: ClaimPushPayload = JSON.parse(credential)
  return {
    claimUuid: credential_id,
    claim: credentialPayload,
  }
}

export async function deleteCredential(credentialHandle: number) {
  return await Credential.delete(credentialHandle)
}

export async function credentialReject(
  credentialHandle: number,
  connectionHandle: number,
  comment: string
): Promise<void> {
  return Credential.reject(credentialHandle, connectionHandle, comment)
}

export async function credentialGetPresentationProposal(
  credentialHandle: number
): Promise<string> {
  return Credential.getPresentationProposalMessage(credentialHandle)
}

export async function createCredentialWithProprietaryOffer(
  sourceId: string,
  credentialOffer: string
): Promise<CxsCredentialOfferResult> {
  const credential_handle = await credentialCreateWithOffer(
    sourceId,
    credentialOffer
  )

  const [vcxCredentialOffer, paymentDetails]: [
    VcxCredentialOffer,
    MessagePaymentDetails
  ] = JSON.parse(credentialOffer)

  vcxCredentialOffer.price =
    paymentDetails && paymentDetails.price
      ? convertSovrinAtomsToSovrinTokens(paymentDetails.price)
      : null

  return {
    claimHandle: credential_handle,
    claimOffer: convertVcxCredentialOfferToCxsClaimOffer(vcxCredentialOffer),
  }
}

export async function createCredentialWithAriesOffer(
  sourceId: string,
  credentialOffer: string
): Promise<CxsCredentialOfferResult> {
  const credential_handle = await credentialCreateWithOffer(
    sourceId,
    credentialOffer
  )

  const [vcxCredentialOffer]: [VcxCredentialOffer] = JSON.parse(credentialOffer)

  return {
    claimHandle: credential_handle,
    claimOffer: convertVcxCredentialOfferToCxsClaimOffer(vcxCredentialOffer),
  }
}

export async function createCredentialWithAriesOfferObject(
  sourceId: string,
  credentialOffer: CredentialOffer
): Promise<CxsCredentialOfferResult> {
  const credential_handle = await credentialCreateWithOffer(
    sourceId,
    JSON.stringify(credentialOffer)
  )

  return {
    claimHandle: credential_handle,
    claimOffer: convertAriesCredentialOfferToCxsClaimOffer(credentialOffer),
  }
}

// Library
export async function vcxShutdown(deletePool: boolean): Promise<boolean> {
  await Library.shutdown(deletePool)

  return true
}

export async function init(config: CxsInitConfig): Promise<boolean> {
  const walletPoolName = await getWalletPoolName()
  const vcxInitConfig: VcxInitConfig = await convertCxsInitToVcxInit(
    config,
    walletPoolName
  )
  return await Library.init(JSON.stringify(vcxInitConfig))
}

export async function initPool(
  config: CxsPoolConfig,
  fileName: string
): Promise<boolean> {
  const genesis_path: string = await RNUtils.getGenesisPathWithConfig(
    config.poolConfig,
    fileName
  )

  const initConfig = {
    ...config,
    genesis_path,
  }

  const walletPoolName = await getWalletPoolName()
  const vcxInitPoolConfig: VcxPoolInitConfig = await convertCxsPoolInitToVcxPoolInit(
    initConfig,
    walletPoolName
  )
  return await Library.initPool(JSON.stringify(vcxInitPoolConfig))
}

// TODO:KS Need to rename this to something like walletInit
export async function simpleInit(): Promise<boolean> {
  const walletPoolName = await getWalletPoolName()
  const wallet_key = await getWalletKey()
  const initConfig = {
    wallet_name: walletPoolName.walletName,
    wallet_key,
  }
  return await Library.init(JSON.stringify(initConfig))
}

// Proof
export async function getMatchingCredentials(
  proofHandle: number
): Promise<string> {
  return await Proof.getCredentialsForProofRequest(proofHandle)
}

export async function generateProof(
  proofHandle: number,
  selectedCredentials: string,
  selfAttestedAttributes: string
): Promise<void> {
  return await Proof.generateProof(
    proofHandle,
    selectedCredentials,
    selfAttestedAttributes
  )
}

export async function sendProof(
  proofHandle: number,
  connectionHandle: number
): Promise<void> {
  return await Proof.sendProof(proofHandle, connectionHandle)
}

export async function proofCreateWithRequest(
  sourceId: string,
  proofRequest: string
): Promise<number> {
  return await Proof.createWithRequest(sourceId, proofRequest)
}

export async function proofSerialize(proofHandle: number): Promise<string> {
  return await Proof.serialize(proofHandle)
}

export async function proofDeserialize(
  serializedProofRequest: string
): Promise<number> {
  return await Proof.deserialize(serializedProofRequest)
}

export async function proofReject(
  proofHandle: number,
  connectionHandle: number
): Promise<void> {
  return Proof.reject(proofHandle, connectionHandle)
}

// Verifier
export async function createProofVerifierWithProposal(presentationProposal: string, name: string): Promise<string> {
  return Verifier.createWithProposal(
    uuid(),
    presentationProposal,
    name,
  )
}

export async function proofVerifierSendRequest(handle: number, connectionHandle: number): Promise<null> {
  return Verifier.sendProofRequest(handle, connectionHandle)
}

export async function proofVerifierSerialize(handle: number): Promise<string> {
  return Verifier.serialize(handle)
}

export async function proofVerifierDeserialize(serialized: number): Promise<number> {
  return Verifier.deserialize(serialized,)
}

export async function proofVerifierUpdateStateWithMessage(handle: number, message: number): Promise<number> {
  return Verifier.updateStateWithMessage(handle, message)
}

export async function proofVerifierGetProofMessage(handle: number): Promise<any> {
  return Verifier.getProofMessage(handle)
}

export async function proofVerifierGetProofRequest(handle: number): Promise<string> {
  return Verifier.getProofRequestMessage(handle,)
}

// Wallet
export async function sendTokenAmount(
  tokenAmount: string,
  recipientWalletAddress: string
): Promise<boolean> {
  const sovrinAtoms = convertSovrinTokensToSovrinAtoms(tokenAmount)
  return Wallet.sendTokens(paymentHandle, sovrinAtoms, recipientWalletAddress)
}

export async function encryptWallet({
  encryptedFileLocation,
  recoveryPassphrase,
}: {
  encryptedFileLocation: string,
  recoveryPassphrase: Passphrase,
}): Promise<number> {
  return await Wallet.export(
    encryptedFileLocation,
    recoveryPassphrase.hash
  )
}

export async function copyToPath(
  uri: string,
  destPath: string
): Promise<number> {
  return await RNUtils.copyToPath(uri, destPath)
}

export async function getWalletTokenInfo(): Promise<WalletTokenInfo> {
  const paymentHandle = 0
  const tokenInfo: string = await Wallet.getTokenInfo(paymentHandle)
  return JSON.parse(tokenInfo)
}

export async function createPaymentAddress(seed: ?string) {
  return await Wallet.createPaymentAddress(seed)
}

export const getWalletPoolName = memoize(async function () {
  const appUniqueId = await uniqueId()
  await secureSet(__uniqueId, appUniqueId)
  const walletName = `${appUniqueId}-cm-wallet`
  // Not sure why, but VCX is applying validation check on pool name
  // they don't like alphanumeric or _, so we have to remove "-"
  // from our guid that we generated
  const strippedAppUniqueId = appUniqueId.replace(/\-/g, '')
  const poolName = `${strippedAppUniqueId}cmpool`
  return {
    walletName,
    poolName,
  }
})

export async function getWalletBalance(): Promise<string> {
  const { balance_str: balance }: WalletTokenInfo = await getWalletTokenInfo()

  return convertSovrinAtomsToSovrinTokens(balance)
}

export async function getWalletAddresses(): Promise<string[]> {
  const { addresses }: WalletTokenInfo = await getWalletTokenInfo()

  // TODO:KS For now we don't need to store any other data on our react-native
  // when we need to store all data, then we would return only addresses
  // for now we are just returning addresses and ignoring anything else
  return addresses.map((address: PaymentAddress) => address.address)
}

export async function getWalletHistory(): Promise<WalletHistoryEvent[]> {
  const walletHistoryData = [
    {
      id: 'asd',
      senderAddress:
        'sov:ksudgyi8f98gsih7655hgifuyg79s89s98ydf98fg7gks8fjhkss8f030',
      action: 'Withdraw',
      tokenAmount: '5656',
      timeStamp: 'Tue, 04 Aug 2015 12:38:41 GMT',
    },
    {
      id: 'kld',
      senderName: 'Sovrin Foundation',
      senderAddress:
        'sov:ksudgyi8f98gsih7655hgifuyg79s89s98ydf98fg7gks8fjhkss8f030',
      action: 'Purchase',
      tokenAmount: '10000',
      timeStamp: 'Tue, 04 Aug 2015 14:38:41 GMT',
    },
  ]

  return new Promise.resolve(walletHistoryData)
}

// Utils
export async function getColor(imagePath: string): Promise<Array<string>> {
  return RNUtils.getColor(imagePath)
}

export function exitAppAndroid() {
  if (Platform.OS === 'android') {
    RNUtils.exitAppAndroid()
  }
}

export async function getLedgerFees(): Promise<LedgerFeesData> {
  const fees: string = await Utils.getLedgerFees()

  return convertVcxLedgerFeesToLedgerFees(fees)
}

export const checkIfAnimationToUse = memoize(function () {
  return Platform.OS === 'android'
    ? RNUtils.totalMemory() / smallDeviceMemory < 1
    : false
})

export async function getBiometricError(): Promise<string> {
  if (Platform.OS === 'ios') {
    return await RNIndy.getBiometricError()
  }
  return ''
}

export async function toBase64FromUtf8(
  data: string,
  base64EncodingOption: string = 'NO_WRAP'
) {
  return RNUtils.toBase64FromUtf8(data, base64EncodingOption)
}

export async function toUtf8FromBase64(
  data: string,
  base64EncodingOption: string = 'NO_WRAP'
) {
  return await RNUtils.toUtf8FromBase64(data, base64EncodingOption)
}

export async function generateThumbprint(
  data: string,
  base64EncodingOption: string = 'NO_WRAP'
) {
  return RNUtils.generateThumbprint(data, base64EncodingOption)
}

export async function getTxnAuthorAgreement(): Promise<string> {
  return Utils.getLedgerAuthorAgreement()
}

export async function setActiveTxnAuthorAgreementMeta(
  text: string,
  version: string,
  hash: string | typeof undefined,
  accMechType: string,
  timeOfAcceptance: number
): Promise<string> {
  return Utils.setActiveTxnAuthorAgreement(
    text,
    version,
    hash,
    accMechType,
    timeOfAcceptance
  )
}

export async function fetchPublicEntitiesForCredentials(): Promise<void> {
  return await Utils.fetchPublicEntities()
}

export async function getRequestRedirectionUrl(
  url: string
): Promise<string> {
  return RNUtils.getRequestRedirectionUrl(url)
}
