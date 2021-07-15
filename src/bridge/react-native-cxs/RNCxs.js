// @flow
import { NativeModules, Platform } from 'react-native'
import memoize from 'lodash.memoize'
import type {
  CxsCredentialOfferResult,
  VcxProvisionResult,
  VcxProvision,
  CxsInitConfig,
  VcxInitConfig,
  CxsPushTokenConfig,
  VcxCredentialOffer,
  VcxClaimInfo,
  VcxConnectionConnectResult,
  WalletTokenInfo,
  PaymentAddress,
  SignDataResponse,
  WalletPoolName,
} from './type-cxs'
import type {
  AriesOutOfBandInvite,
  InvitationPayload,
} from '../../invitation/type-invitation'
import type { CredentialOffer } from '../../claim-offer/type-claim-offer'
import {
  convertAgencyConfigToVcxProvision,
  convertVcxProvisionResultToUserOneTimeInfo,
  convertCxsInitToVcxInit,
  convertCxsPushConfigToVcxPushTokenConfig,
  convertInvitationToVcxConnectionCreate,
  convertVcxConnectionToCxsConnection,
  convertVcxCredentialOfferToCxsClaimOffer,
  paymentHandle,
  addAttestation,
} from './vcx-transformers'
import type { UserOneTimeInfo } from '../../store/user/type-user-store'
import type {
  AgencyPoolConfig,
  MessagePaymentDetails,
  PoolConfig,
} from '../../store/type-config-store'
import type {
  ClaimPushPayload,
  GetClaimVcxResult,
} from '../../push-notification/type-push-notification'
import type {
  WalletHistoryEvent,
  WalletPayload,
} from '../../wallet/type-wallet'
import type { Passphrase } from '../../backup/type-backup'
import uniqueId from 'react-native-unique-id'
import { smallDeviceMemory, signDataResponseSchema } from './type-cxs'
import { secureSet, getWalletKey } from '../../services/storage'
import { __uniqueId } from '../../store/type-config-store'
import type { LedgerFeesData } from '../../ledger/type-ledger-store'
import { schemaValidator } from '../../services/schema-validator'
import {
  convertSovrinTokensToSovrinAtoms,
  convertSovrinAtomsToSovrinTokens,
  convertVcxLedgerFeesToLedgerFees,
} from '../../sovrin-token/sovrin-token-converter'
import { uuid } from "../../services/uuid";
import type { GenericObject } from '../../common/type-common'
import type { PairwiseAgent } from '../../store/type-connection-store'
import { WALLET_ITEM_NOT_FOUND } from "./error-cxs";

const { RNIndy, Helpers } = NativeModules

export function resetBackgroundTimeout() {
  return Helpers.resetTimeout()
}

export async function stopWithBackgroundTimeout() {
  return Helpers.stopWithBackgroundTimeout()
}

export async function acceptInvitationVcx(
  connectionHandle: number,
  agentInfo: PairwiseAgent | null,
): Promise<GenericObject> {
  const connectionOption = agentInfo ? { pairwise_agent_info: agentInfo } : {}

  let invitation

  try {
    invitation = await RNIndy.vcxAcceptInvitation(connectionHandle, JSON.stringify(connectionOption))
  } catch (error) {
    if (error.code === WALLET_ITEM_NOT_FOUND) {
      // pairwise agent info not found in the wallet -> try to accept connection again but without predefined agent
      invitation = await RNIndy.vcxAcceptInvitation(connectionHandle, '{}')
    }
    else {
      throw error
    }
  }
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

export async function updatePushTokenVcx(pushTokenConfig: CxsPushTokenConfig) {
  return await RNIndy.vcxUpdatePushToken(
    JSON.stringify(convertCxsPushConfigToVcxPushTokenConfig(pushTokenConfig))
  )
}

export async function deleteConnection(connectionHandle: number) {
  return await RNIndy.deleteConnection(connectionHandle)
}

export async function resetVcx(): Promise<boolean> {
  // we would remove above reset method and rename this method to reset
  // once we have integration available with vcx
  const result: boolean = await RNIndy.reset(true)

  return result
}

export async function vcxShutdown(deletePool: boolean): Promise<boolean> {
  await RNIndy.shutdownVcx(deletePool)

  return true
}

export async function getColor(imagePath: string): Promise<Array<string>> {
  return RNIndy.getColor(imagePath)
}

export async function sendTokenAmount(
  tokenAmount: string,
  recipientWalletAddress: string
): Promise<boolean> {
  const sovrinAtoms = convertSovrinTokensToSovrinAtoms(tokenAmount)
  return RNIndy.sendTokens(paymentHandle, sovrinAtoms, recipientWalletAddress)
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
    const provisionVcxResult: string = await RNIndy.createOneTimeInfo(
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
    let provisionToken: string = await RNIndy.getProvisionToken(
      JSON.stringify(vcxProvisionConfig)
    )

    // TODO: FIXME temp workaround until we get fixed VCX
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
    const tokenWithAttestation = await addAttestation(token)
    const provisionVcxResult: string = await RNIndy.createOneTimeInfoWithToken(
      JSON.stringify(vcxProvisionConfig),
      tokenWithAttestation
    )
    const provisionResult: VcxProvisionResult = JSON.parse(provisionVcxResult)
    return [null, convertVcxProvisionResultToUserOneTimeInfo(provisionResult)]
  } catch (e) {
    return [`${e}`, null]
  }
}

export async function init(config: CxsInitConfig): Promise<boolean> {
  const walletPoolName = await getWalletPoolName()
  const vcxInitConfig: VcxInitConfig = await convertCxsInitToVcxInit(
    config,
    walletPoolName
  )
  const initResult: boolean = await RNIndy.init(JSON.stringify(vcxInitConfig))

  return initResult
}

async function preparePoolConfig(config: PoolConfig) {
  let walletPoolName: WalletPoolName = await getWalletPoolName()
  const genesisPath: string = await RNIndy.getGenesisPathWithConfig(config.genesis, config.key)
  return {
    genesis_path: genesisPath,
    pool_name: walletPoolName.poolName + config.key,
  }
}

export async function initPool(
  poolConfig: string | Array<PoolConfig>,
): Promise<boolean> {
  let vcxInitPoolConfig = []

  if (Array.isArray(poolConfig)) {
    for (const config: PoolConfig of poolConfig) {
      vcxInitPoolConfig.push(
        await preparePoolConfig(config)
      )
    }
  }

  if (typeof poolConfig === 'string') {
    vcxInitPoolConfig.push(
      await preparePoolConfig({
        key: '',
        genesis: poolConfig
      })
    )
  }

  return await RNIndy.vcxInitPool(JSON.stringify(vcxInitPoolConfig))
}

// TODO:KS Need to rename this to something like walletInit
export async function simpleInit(): Promise<boolean> {
  const walletPoolName = await getWalletPoolName()
  const wallet_key = await getWalletKey()
  const initConfig = {
    wallet_name: walletPoolName.walletName,
    wallet_key,
  }
  const initResult: boolean = await RNIndy.init(JSON.stringify(initConfig))
  return initResult
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

export async function createConnectionWithInvite(
  invitation: InvitationPayload
): Promise<number> {
  const { invite_details } = convertInvitationToVcxConnectionCreate(invitation)
  const connectionHandle: number = await RNIndy.createConnectionWithInvite(
    invitation.requestId,
    JSON.stringify(invite_details)
  )

  return connectionHandle
}

export async function createConnectionWithAriesInvite(
  invitation: InvitationPayload
): Promise<number> {
  const connectionHandle: number = await RNIndy.createConnectionWithInvite(
    invitation.requestId,
    invitation.original
  )

  return connectionHandle
}

export async function createConnectionWithAriesOutOfBandInvite(
  invitation: InvitationPayload
): Promise<number> {
  const connectionHandle: number = await RNIndy.createConnectionWithOutOfBandInvite(
    invitation.requestId,
    invitation.original
  )

  return connectionHandle
}

export async function serializeConnection(
  connectionHandle: number
): Promise<string> {
  const serializedConnection: string = await RNIndy.getSerializedConnection(
    connectionHandle
  )

  return serializedConnection
}

// cache Promise of serializedString so that we don't call Bridge method again
export const getHandleBySerializedConnection = memoize(async function (
  serializedConnection: string
): Promise<number> {
  const connectionHandle: number = await RNIndy.deserializeConnection(
    serializedConnection
  )

  return connectionHandle
})

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
): Promise<number> {
  return await credentialCreateWithOffer(
    sourceId,
    JSON.stringify(credentialOffer)
  )
}

export async function credentialCreateWithOffer(
  sourceId: string,
  credentialOffer: string
): Promise<number> {
  return await RNIndy.credentialCreateWithOffer(sourceId, credentialOffer)
}

export async function serializeClaimOffer(
  claimHandle: number
): Promise<string> {
  const serializedClaimOffer: string = await RNIndy.serializeClaimOffer(
    claimHandle
  )

  return serializedClaimOffer
}

export const getClaimHandleBySerializedClaimOffer = memoize(async function (
  serializedClaimOffer: string
): Promise<number> {
  const claimHandle: number = await RNIndy.deserializeClaimOffer(
    serializedClaimOffer
  )

  return claimHandle
})

export async function sendClaimRequest(
  claimHandle: number,
  connectionHandle: number = 0,
  paymentHandle: number = 0
): Promise<void> {
  return await RNIndy.sendClaimRequest(
    claimHandle,
    connectionHandle,
    paymentHandle
  )
}

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

export async function encryptWallet({
  encryptedFileLocation,
  recoveryPassphrase,
}: {
  encryptedFileLocation: string,
  recoveryPassphrase: Passphrase,
}): Promise<number> {
  const exportHandle: number = await RNIndy.exportWallet(
    encryptedFileLocation,
    recoveryPassphrase.hash
  )

  return exportHandle
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
  const importHandle: number = await RNIndy.decryptWalletFile(config)

  return importHandle
}

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
  const importHandle: number = await RNIndy.restoreWallet(config)

  return importHandle
}

export async function copyToPath(
  uri: string,
  destPath: string
): Promise<number> {
  return await RNIndy.copyToPath(uri, destPath)
}

export async function updateClaimOfferState(claimHandle: number) {
  const updatedState: number = await RNIndy.updateClaimOfferState(claimHandle)

  return updatedState
}

export async function updateClaimOfferStateWithMessage(
  claimHandle: number,
  message: string
) {
  const updatedState: number = await RNIndy.updateClaimOfferStateWithMessage(
    claimHandle,
    message
  )

  return updatedState
}

export async function getClaimOfferState(claimHandle: number): Promise<number> {
  const state: number = await RNIndy.getClaimOfferState(claimHandle)

  return state
}

export async function getClaimVcx(
  claimHandle: number
): Promise<GetClaimVcxResult> {
  const vcxClaimResult: string = await RNIndy.getClaimVcx(claimHandle)
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

export async function exportWallet(wallet: WalletPayload): Promise<number> {
  const exportHandle: number = await RNIndy.exportWallet(
    wallet.walletPath,
    wallet.encryptionKey
  )

  return exportHandle
}

export async function createWalletBackup(
  sourceID: string,
  backupKey: string
): Promise<number> {
  return await RNIndy.createWalletBackup(sourceID, backupKey)
}

export async function backupWalletBackup(
  walletBackupHandle: number,
  path: string
): Promise<number> {
  return await RNIndy.backupWalletBackup(walletBackupHandle, path)
}

export async function updateWalletBackupState(
  walletBackupHandle: number
): Promise<number> {
  return await RNIndy.updateWalletBackupState(walletBackupHandle)
}

export async function updateWalletBackupStateWithMessage(
  walletBackupHandle: number,
  message: string
): Promise<number> {
  return await RNIndy.updateWalletBackupStateWithMessage(
    walletBackupHandle,
    message
  )
}

export async function serializeBackupWallet(
  walletBackupHandle: number
): Promise<number> {
  return await RNIndy.serializeBackupWallet(walletBackupHandle)
}

export async function deserializeBackupWallet(
  message: string
): Promise<number> {
  return await RNIndy.deserializeBackupWallet(message)
}

export function exitAppAndroid() {
  if (Platform.OS === 'android') {
    RNIndy.exitAppAndroid()
  }
}

export async function getMatchingCredentials(
  proofHandle: number
): Promise<string> {
  // TODO:KS Add a transformer here, for now we are just passing through
  return await RNIndy.proofRetrieveCredentials(proofHandle)
}

export async function generateProof(
  proofHandle: number,
  selectedCredentials: string,
  selfAttestedAttributes: string
): Promise<void> {
  return await RNIndy.proofGenerate(
    proofHandle,
    selectedCredentials,
    selfAttestedAttributes
  )
}

export async function sendProof(
  proofHandle: number,
  connectionHandle: number
): Promise<void> {
  return await RNIndy.proofSend(proofHandle, connectionHandle)
}

export async function proofGetState(
  proofHandle: number,
): Promise<number> {
  return await RNIndy.proofGetState(proofHandle)
}

export async function proofCreateWithRequest(
  sourceId: string,
  proofRequest: string
): Promise<number> {
  return await RNIndy.proofCreateWithRequest(sourceId, proofRequest)
}

export async function proofSerialize(proofHandle: number): Promise<string> {
  return await RNIndy.proofSerialize(proofHandle)
}

export async function proofDeserialize(
  serializedProofRequest: string
): Promise<number> {
  return await RNIndy.proofDeserialize(serializedProofRequest)
}

export async function downloadMessages(
  messageStatus: string,
  uid_s: ?string,
  pwdids: string
): Promise<string> {
  return await RNIndy.downloadMessages(messageStatus, uid_s, pwdids)
}

export async function vcxGetAgentMessages(
  messageStatus: string,
  uid_s: ?string
): Promise<string> {
  return await RNIndy.vcxGetAgentMessages(messageStatus, uid_s)
}

export async function updateMessages(
  messageStatus: string,
  pwdidsJson: string
): Promise<number> {
  return await RNIndy.updateMessages(messageStatus, pwdidsJson)
}

export async function getWalletTokenInfo(): Promise<WalletTokenInfo> {
  const paymentHandle = 0
  const tokenInfo: string = await RNIndy.getTokenInfo(paymentHandle)
  return JSON.parse(tokenInfo)
}

export async function createPaymentAddress(seed: ?string) {
  return await RNIndy.createPaymentAddress(seed)
}

export async function getLedgerFees(): Promise<LedgerFeesData> {
  const fees: string = await RNIndy.getLedgerFees()

  return convertVcxLedgerFeesToLedgerFees(fees)
}

export const checkIfAnimationToUse = memoize(function () {
  return Platform.OS === 'android'
    ? RNIndy.totalMemory / smallDeviceMemory < 1
      ? true
      : false
    : false
})

export async function getBiometricError(): Promise<string> {
  if (Platform.OS === 'ios') {
    return await RNIndy.getBiometricError()
  }
  return ''
}

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

  const msgId: string = await RNIndy.connectionSendMessage(
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
  const response: SignDataResponse = await RNIndy.connectionSignData(
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
  const response: boolean = await RNIndy.connectionVerifySignature(
    connectionHandle,
    data,
    signature
  )

  if (typeof response !== 'boolean') {
    throw new Error(`Expected response type was boolean but got ${response}`)
  }

  return response
}

export async function toBase64FromUtf8(
  data: string,
  base64EncodingOption: string = 'NO_WRAP'
) {
  return RNIndy.toBase64FromUtf8(data, base64EncodingOption)
}

export async function toUtf8FromBase64(
  data: string,
  base64EncodingOption: string = 'NO_WRAP'
) {
  return await RNIndy.toUtf8FromBase64(data, base64EncodingOption)
}

export async function generateThumbprint(
  data: string,
  base64EncodingOption: string = 'NO_WRAP'
) {
  return RNIndy.generateThumbprint(data, base64EncodingOption)
}
export async function getTxnAuthorAgreement(): Promise<string> {
  return RNIndy.getTxnAuthorAgreement()
}

export async function setActiveTxnAuthorAgreementMeta(
  text: string,
  version: string,
  hash: string | typeof undefined,
  accMechType: string,
  timeOfAcceptance: number
): Promise<string> {
  return RNIndy.setActiveTxnAuthorAgreementMeta(
    text,
    version,
    hash,
    accMechType,
    timeOfAcceptance
  )
}

export async function getAcceptanceMechanisms(
  submitterDid: ?string,
  timestamp: number,
  version: ?string
): Promise<string> {
  return RNIndy.getAcceptanceMechanisms(submitterDid, timestamp, version)
}

export async function appendTxnAuthorAgreement(
  requestJson: string,
  text: string,
  version: string,
  taaDigest: string,
  mechanism: string,
  timestamp: number
): Promise<string> {
  return RNIndy.appendTxnAuthorAgreement(
    requestJson,
    text,
    version,
    taaDigest,
    mechanism,
    timestamp
  )
}

export async function proofReject(
  proofHandle: number,
  connectionHandle: number
): Promise<void> {
  return RNIndy.proofReject(proofHandle, connectionHandle)
}

export async function connectionRedirect(
  redirectConnectionHandle: number,
  connectionHandle: number
): Promise<void> {
  return RNIndy.connectionRedirect(redirectConnectionHandle, connectionHandle)
}

export async function connectionReuse(
  connectionHandle: number,
  invite: AriesOutOfBandInvite
): Promise<void> {
  return RNIndy.connectionReuse(connectionHandle, JSON.stringify(invite))
}

export async function getRedirectDetails(
  connectionHandle: number
): Promise<void> {
  return RNIndy.getRedirectDetails(connectionHandle)
}

export async function connectionGetState(
  connectionHandle: number
): Promise<number> {
  return RNIndy.connectionGetState(connectionHandle)
}

export async function connectionUpdateState(connectionHandle: number) {
  return RNIndy.connectionUpdateState(connectionHandle)
}

export async function connectionUpdateStateWithMessage(
  connectionHandle: number,
  message: string
) {
  return RNIndy.connectionUpdateStateWithMessage(connectionHandle, message)
}

export async function fetchPublicEntitiesForCredentials(): Promise<void> {
  return await RNIndy.fetchPublicEntities()
}

export async function connectionSendAnswer(
  connectionHandle: number,
  question: string,
  answer: string
): Promise<void> {
  return await RNIndy.connectionSendAnswer(connectionHandle, question, answer)
}

export async function deleteCredential(credentialHandle: number) {
  return await RNIndy.deleteCredential(credentialHandle)
}

export async function credentialReject(
  credentialHandle: number,
  connectionHandle: number,
  comment: string
): Promise<void> {
  return RNIndy.credentialReject(credentialHandle, connectionHandle, comment)
}

export async function getRequestRedirectionUrl(
  url: string
): Promise<string> {
  return RNIndy.getRequestRedirectionUrl(url)
}

export async function credentialGetPresentationProposal(
  credentialHandle: number
): Promise<string> {
  return RNIndy.credentialGetPresentationProposal(credentialHandle)
}

export async function createOutOfBandConnectionInvitation(
  goal: string,
  handshake?: boolean,
  attachment?: string | null,
  agentInfo: PairwiseAgent | null,
): Promise<GenericObject> {
  const connectionHandle = await RNIndy.createOutOfBandConnection(
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

export async function createProofVerifierWithProposal(presentationProposal: string, name: string): Promise<string> {
  return RNIndy.createProofVerifierWithProposal(
    uuid(),
    presentationProposal,
    name,
  )
}

export async function proofVerifierSendRequest(handle: number, connectionHandle: number): Promise<null> {
  return RNIndy.proofVerifierSendRequest(handle, connectionHandle)
}

export async function proofVerifierSerialize(handle: number): Promise<string> {
  return RNIndy.proofVerifierSerialize(handle)
}

export async function proofVerifierDeserialize(serialized: number): Promise<number> {
  return RNIndy.proofVerifierDeserialize(serialized,)
}

export async function proofVerifierUpdateStateWithMessage(handle: number, message: number): Promise<number> {
  return RNIndy.proofVerifierUpdateStateWithMessage(handle, message)
}

export async function proofVerifierGetProofMessage(handle: number): Promise<any> {
  return RNIndy.proofVerifierGetProofMessage(handle)
}

export async function proofVerifierGetProofRequest(handle: number): Promise<string> {
  return RNIndy.proofVerifierGetPresentationRequest(handle,)
}

export async function createPairwiseAgent(): Promise<string> {
  const agentInfo = await RNIndy.createPairwiseAgent()
  return JSON.parse(agentInfo)
}
