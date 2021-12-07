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
import { signDataResponseSchema, smallDeviceMemory } from './type-cxs'
import type { AriesOutOfBandInvite, InvitationPayload } from '../../invitation/type-invitation'
import type { CredentialOffer } from '../../claim-offer/type-claim-offer'
import {
  addAttestation,
  convertAgencyConfigToVcxProvision,
  convertCxsInitToVcxInit,
  convertCxsPushConfigToVcxPushTokenConfig,
  convertInvitationToVcxConnectionCreate,
  convertVcxConnectionToCxsConnection,
  convertVcxCredentialOfferToCxsClaimOffer,
  convertVcxProvisionResultToUserOneTimeInfo,
  paymentHandle,
} from './vcx-transformers'
import type { UserOneTimeInfo } from '../../store/user/type-user-store'
import type { AgencyPoolConfig, MessagePaymentDetails, PoolConfig } from '../../store/type-config-store'
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
import type { GenericObject } from '../../common/type-common'
import type { PairwiseAgent } from '../../store/type-connection-store'
import { uuid } from '../../services/uuid'

import {
  Agent,
  CloudWalletBackup,
  Connection,
  Credential,
  Library,
  DisclosedProof,
  Utils,
  Verifier,
  Wallet,
} from '@evernym/react-native-sdk'
import { WALLET_ITEM_NOT_FOUND } from './error-cxs'

const { RNUtils } = NativeModules

export function resetBackgroundTimeout() {
  if (Platform.OS === 'android') {
    return RNUtils.resetTimeout()
  }
}

export async function watchApplicationInactivity() {
  if (Platform.OS === 'android') {
    RNUtils.watchApplicationInactivity()
  }
}


/*
 * Agent API
 */
export async function updatePushTokenVcx(pushTokenConfig: CxsPushTokenConfig) {
  return await Agent.updateInfo({
    config: JSON.stringify(convertCxsPushConfigToVcxPushTokenConfig(pushTokenConfig)),
  })
}

export async function createOneTimeInfo(
  agencyConfig: AgencyPoolConfig,
): Promise<[null | string, null | UserOneTimeInfo]> {
  try {
    const walletPoolName = await getWalletPoolName()
    const vcxProvisionConfig: VcxProvision = await convertAgencyConfigToVcxProvision(
      agencyConfig,
      walletPoolName,
    )
    const provisionVcxResult: string = await Agent.provision({
      agencyConfig: JSON.stringify(vcxProvisionConfig),
    })
    const provisionResult: VcxProvisionResult = JSON.parse(provisionVcxResult)
    return [null, convertVcxProvisionResultToUserOneTimeInfo(provisionResult)]
  } catch (e) {
    return [`${e}`, null]
  }
}

export async function getProvisionToken(
  agencyConfig: AgencyPoolConfig,
  sponseeId: string,
  sponsorId: string,
): Promise<[null | string, null | string]> {
  try {
    const walletPoolName = await getWalletPoolName()
    const vcxConfig: VcxProvision = await convertAgencyConfigToVcxProvision(
      agencyConfig,
      walletPoolName,
    )
    const vcxProvisionConfig = {
      vcx_config: vcxConfig,
      source_id: 'someSourceId',
      sponsee_id: sponseeId,
      sponsor_id: sponsorId,
    }
    let provisionToken: string = await Agent.getProvisionToken({
      agencyConfig: JSON.stringify(vcxProvisionConfig),
    })

    return [null, provisionToken]
  } catch (e) {
    return [`${e}`, null]
  }
}

export async function createOneTimeInfoWithToken(
  agencyConfig: AgencyPoolConfig,
  token: string,
): Promise<[null | string, null | UserOneTimeInfo]> {
  try {
    const walletPoolName = await getWalletPoolName()
    const vcxProvisionConfig: VcxProvision = await convertAgencyConfigToVcxProvision(
      agencyConfig,
      walletPoolName,
    )
    const tokenWithAttestation = await addAttestation(token)
    const provisionVcxResult: string = await Agent.provisionWithToken({
      agencyConfig: JSON.stringify(vcxProvisionConfig),
      token: tokenWithAttestation,
    })
    const provisionResult: VcxProvisionResult = JSON.parse(provisionVcxResult)
    return [null, convertVcxProvisionResultToUserOneTimeInfo(provisionResult)]
  } catch (e) {
    return [`${e}`, null]
  }
}

export async function downloadMessages(
  messageStatus: string,
  uid_s: ?string,
  pwdids: string,
): Promise<string> {
  return await Agent.downloadMessages({
    messageStatus,
    uids: uid_s,
    pwdids,
  })
}

export async function vcxGetAgentMessages(
  messageStatus: string,
  uid_s: ?string,
): Promise<string> {
  return await Agent.downloadAgentMessages({
    messageStatus,
    uids: uid_s,
  })
}

export async function updateMessages(
  messageStatus: string,
  pwdidsJson: string,
): Promise<number> {
  return await Agent.updateMessages({
    messageStatus,
    pwdids: pwdidsJson,
  })
}

export async function createPairwiseAgent(): Promise<string> {
  const agentInfo = await Agent.createPairwiseAgent()
  return JSON.parse(agentInfo)
}

/*
 * Cloud Wallet Backup API
 */
export async function restoreWallet(
  walletPath: string,
  decryptionKey: string,
): Promise<number> {
  const { walletName } = await getWalletPoolName()
  const wallet_key = await getWalletKey()
  const config = JSON.stringify({
    wallet_name: walletName,
    wallet_key,
    exported_wallet_path: walletPath,
    backup_key: decryptionKey,
  })
  return await CloudWalletBackup.restore({
    config,
  })
}

export async function createWalletBackup(
  sourceID: string,
  backupKey: string,
): Promise<number> {
  return await CloudWalletBackup.create({
    sourceID,
    backupKey,
  })
}

export async function backupWalletBackup(
  walletBackupHandle: number,
  path: string,
): Promise<number> {
  return await CloudWalletBackup.send({
    handle: walletBackupHandle,
    path,
  })
}

export async function updateWalletBackupStateWithMessage(
  handle: number,
  message: string,
): Promise<number> {
  return await CloudWalletBackup.updateStateWithMessage({
    handle,
    message,
  })
}

/*
 * Connection API
 */
export async function acceptInvitationVcx(
  connectionHandle: number,
  agentInfo: PairwiseAgent | null,
): Promise<GenericObject> {
  const connectionOption = agentInfo ? { pairwise_agent_info: agentInfo } : {}

  let invitation

  try {
    invitation = await Connection.connect({
      handle: connectionHandle,
      options: JSON.stringify(connectionOption),
    })
  } catch (error) {
    if (error.code === WALLET_ITEM_NOT_FOUND) {
      // pairwise agent info not found in the wallet -> try to accept connection again but without predefined agent
      invitation = await Connection.connect({
        handle: connectionHandle,
        options: '{}',
      })
    } else {
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
    invitation,
  }

}

export async function deleteConnection(connectionHandle: number) {
  return await Connection.delete({
    handle: connectionHandle,
  })
}

export async function createConnectionWithInvite(
  invitation: InvitationPayload,
): Promise<number> {
  const { invite_details } = convertInvitationToVcxConnectionCreate(invitation)
  return await Connection.createWithInvitation({
    sourceID: invitation.requestId,
    invitation: JSON.stringify(invite_details),
  })
}

export async function createConnectionWithAriesInvite(
  invitation: InvitationPayload,
): Promise<number> {
  return await Connection.createWithInvitation({
    sourceID: invitation.requestId,
    invitation: invitation.original,
  })
}

export async function createConnectionWithAriesOutOfBandInvite(
  invitation: InvitationPayload,
): Promise<number> {
  return await Connection.createWithOutofbandInvitation({
    sourceID: invitation.requestId,
    invitation: invitation.original,
  })
}

export async function serializeConnection(
  handle: number,
): Promise<string> {
  return Connection.serialize({
    handle,
  })
}

// cache Promise of serializedString so that we don't call Bridge method again
export const getHandleBySerializedConnection = memoize(async function(
  serialized: string,
): Promise<number> {
  return await Connection.deserialize({
    serialized,
  })
})

export async function connectionSendMessage(
  connectionHandle: number,
  options: {
    message: string,
    messageType: string,
    messageTitle: string,
    refMessageId?: string,
  },
): Promise<string> {
  const sendMessageOptions = JSON.stringify({
    msg_type: options.messageType,
    msg_title: options.messageTitle,
    ref_msg_id: options.refMessageId || null,
  })

  const isAries = JSON.parse(options.message)['~thread']

  const msgId: string = await Connection.sendMessage({
    handle: connectionHandle,
    message: options.message,
    options: sendMessageOptions,
  })

  // since we are calling an external API, we need to make sure that
  // the data that we are receiving is the data that we need
  if (isAries && typeof msgId !== 'string') {
    throw new Error(
      `Invalid data received from wrapper. Excepted msgId, got ${msgId}`,
    )
  } else if (!isAries && (typeof msgId !== 'string' || msgId.length === 0)) {
    throw new Error(
      `Invalid data received from wrapper. Excepted msgId, got ${msgId}`,
    )
  }

  return msgId
}

export async function connectionSignData(
  connectionHandle: number,
  data: string,
  base64EncodingOption: string = 'NO_WRAP',
  encodeBeforeSigning: boolean = true,
): Promise<SignDataResponse> {
  const response: SignDataResponse = await Connection.signData({
    handle: connectionHandle,
    data,
    base64EncodingOption,
    encodeBeforeSigning,
  })

  // external API data needs to be validated
  if (!schemaValidator.validate(signDataResponseSchema, response)) {
    // if data is not as per our expectation from external API
    // then we raise invalid data error
    throw new Error(`Invalid data received`)
  }

  return response
}

export async function connectionRedirect(
  redirectConnectionHandle: number,
  connectionHandle: number,
): Promise<void> {
  return Connection.redirect({
    handle: redirectConnectionHandle,
    existingConnectionHandle: connectionHandle,
  })
}

export async function connectionReuse(
  connectionHandle: number,
  invite: AriesOutOfBandInvite,
): Promise<void> {
  return Connection.reuse({
    handle: connectionHandle,
    invitation: JSON.stringify(invite),
  })
}

export async function connectionGetState(
  connectionHandle: number,
): Promise<number> {
  return Connection.getState({
    handle: connectionHandle,
  })
}

export async function connectionUpdateState(connectionHandle: number) {
  return Connection.updateState({
    handle: connectionHandle,
  })
}

export async function connectionUpdateStateWithMessage(
  connectionHandle: number,
  message: string,
) {
  return Connection.updateStateWithMessage({
    handle: connectionHandle,
    message,
  })
}

export async function connectionSendAnswer(
  handle: number,
  question: string,
  answer: string,
): Promise<void> {
  return await Connection.sendAnswer({
    handle,
    question,
    answer,
  })
}

export async function createOutOfBandConnectionInvitation(
  goal: string,
  handshake?: boolean,
  attachment?: string | null,
  agentInfo: PairwiseAgent | null,
): Promise<GenericObject> {
  const connectionHandle = await Connection.createOutOfBandConnectionInvitation({
    sourceID: uuid(),
    goal,
    goalCode: '',
    handshake,
    attachment,
  })

  let {
    connection: pairwiseInfo,
    serializedConnection: vcxSerializedConnection,
    invitation,
  } = await acceptInvitationVcx(connectionHandle, agentInfo)

  return {
    pairwiseInfo,
    vcxSerializedConnection,
    invitation,
  }
}

export async function connectionNeedUpgrade(
  serialized: string,
): Promise<boolean> {
  return await Connection.needUpgrade({
    serialized,
  })
}

export async function connectionUpgrade(
  handle: number,
  data?: ?string,
): Promise<void> {
  return await Connection.upgrade({
    handle,
    data,
  })
}

/*
 * Credential API
 */
export async function credentialCreateWithOffer(
  sourceId: string,
  offer: string,
): Promise<number> {
  return await Credential.createWithOffer({
    sourceID: sourceId,
    offer,
  })
}

export async function serializeClaimOffer(
  handle: number,
): Promise<string> {
  return Credential.serialize({
    handle,
  })
}

export const getClaimHandleBySerializedClaimOffer = memoize(async function(
  serialized: string,
): Promise<number> {
  return await Credential.deserialize({
    serialized,
  })
})

export async function sendClaimRequest(
  handle: number,
  connectionHandle: number = 0,
  paymentHandle: number = 0,
): Promise<void> {
  return await Credential.sendRequest({
    handle,
    connectionHandle,
    paymentHandle,
  })
}

export async function updateClaimOfferState(handle: number) {
  return Credential.updateState({
    handle,
  })
}

export async function updateClaimOfferStateWithMessage(
  handle: number,
  message: string,
) {
  return await Credential.updateStateWithMessage({
    handle,
    message,
  })
}

export async function getClaimOfferState(handle: number): Promise<number> {
  return await Credential.getState({
    handle,
  })
}

export async function getClaimVcx(
  handle: number,
): Promise<GetClaimVcxResult> {
  const vcxClaimResult: string = await Credential.getCredentialMessage({
    handle,
  })
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

export async function deleteCredential(handle: number) {
  return await Credential.delete({
    handle,
  })
}

export async function credentialReject(
  handle: number,
  connectionHandle: number,
  comment: string,
): Promise<void> {
  return Credential.reject({
    handle,
    connectionHandle,
    comment,
  })
}

export async function credentialGetPresentationProposal(
  handle: number,
): Promise<string> {
  return Credential.getPresentationProposalMessage({
    handle,
  })
}

export async function createCredentialWithProprietaryOffer(
  sourceId: string,
  credentialOffer: string,
): Promise<CxsCredentialOfferResult> {
  const credential_handle = await credentialCreateWithOffer(
    sourceId,
    credentialOffer,
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
  credentialOffer: string,
): Promise<CxsCredentialOfferResult> {
  const credential_handle = await credentialCreateWithOffer(
    sourceId,
    credentialOffer,
  )

  const [vcxCredentialOffer]: [VcxCredentialOffer] = JSON.parse(credentialOffer)

  return {
    claimHandle: credential_handle,
    claimOffer: convertVcxCredentialOfferToCxsClaimOffer(vcxCredentialOffer),
  }
}

export async function createCredentialWithAriesOfferObject(
  sourceId: string,
  credentialOffer: CredentialOffer,
): Promise<CxsCredentialOfferResult> {
  return await credentialCreateWithOffer(
    sourceId,
    JSON.stringify(credentialOffer),
  )
}


/*
 * Library API
 */
export async function vcxShutdown(deleteWallet: boolean): Promise<boolean> {
  await Library.shutdown({
    deleteWallet,
  })

  return true
}

export async function init(config: CxsInitConfig): Promise<boolean> {
  const walletPoolName = await getWalletPoolName()
  const vcxInitConfig: VcxInitConfig = await convertCxsInitToVcxInit(
    config,
    walletPoolName,
  )
  return await Library.init({
    config: JSON.stringify(vcxInitConfig),
  })
}

async function preparePoolConfig(config: PoolConfig) {
  let walletPoolName: WalletPoolName = await getWalletPoolName()
  const genesisPath: string = await RNUtils.getGenesisPathWithConfig(config.genesis, config.key)
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
        await preparePoolConfig(config),
      )
    }
  }

  if (typeof poolConfig === 'string') {
    vcxInitPoolConfig.push(
      await preparePoolConfig({
        key: '',
        genesis: poolConfig,
      }),
    )
  }

  return await Library.initPool({
    config: JSON.stringify(vcxInitPoolConfig),
  })
}

// TODO:KS Need to rename this to something like walletInit
export async function simpleInit(): Promise<boolean> {
  const walletPoolName = await getWalletPoolName()
  const wallet_key = await getWalletKey()
  const initConfig = {
    wallet_name: walletPoolName.walletName,
    wallet_key,
  }
  return await Library.init({
    config: JSON.stringify(initConfig),
  })
}

/*
 * Proof
 */
export async function getMatchingCredentials(
  handle: number,
): Promise<string> {
  return await DisclosedProof.getCredentialsForProofRequest({
    handle,
  })
}

export async function generateProof(
  handle: number,
  selectedCredentials: string,
  selfAttestedAttributes: string,
): Promise<void> {
  return await DisclosedProof.generateProof({
    handle,
    selectedCredentials,
    selfAttestedAttributes,
  })
}

export async function sendProof(
  handle: number,
  connectionHandle: number,
): Promise<void> {
  return await DisclosedProof.sendProof({
    handle,
    connectionHandle,
  })
}

export async function proofCreateWithRequest(
  sourceId: string,
  proofRequest: string,
): Promise<number> {
  return await DisclosedProof.createWithRequest({
    sourceID: sourceId,
    proofRequest,
  })
}

export async function proofSerialize(handle: number): Promise<string> {
  return DisclosedProof.serialize({
    handle,
  })
}

export async function proofDeserialize(
  serialized: string,
): Promise<number> {
  return await DisclosedProof.deserialize({
    serialized,
  })
}

export async function proofReject(
  handle: number,
  connectionHandle: number,
): Promise<void> {
  return DisclosedProof.reject({
    handle,
    connectionHandle,
  })
}

export async function proofGetState(
  handle: number,
): Promise<number> {
  return await DisclosedProof.getState({
    handle,
  })
}

/*
 * Proof Verifier API
 */
export async function createProofVerifierWithProposal(presentationProposal: string, name: string): Promise<string> {
  return Verifier.createWithProposal({
    sourceID: uuid(),
    presentationProposal,
    name,
  })
}

export async function proofVerifierSendRequest(handle: number, connectionHandle: number): Promise<null> {
  return Verifier.sendProofRequest({
    handle,
    connectionHandle,
  })
}

export async function proofVerifierSerialize(handle: number): Promise<string> {
  return Verifier.serialize({
    handle,
  })
}

export async function proofVerifierDeserialize(serialized: number): Promise<number> {
  return Verifier.deserialize({
    serialized,
  })
}

export async function proofVerifierUpdateStateWithMessage(handle: number, message: number): Promise<number> {
  return Verifier.updateStateWithMessage({
    handle,
    message,
  })
}

export async function proofVerifierGetProofMessage(handle: number): Promise<any> {
  return Verifier.getProofMessage({
    handle,
  })
}

export async function proofVerifierGetProofRequest(handle: number): Promise<string> {
  return Verifier.getProofRequestMessage({
    handle,
  })
}

/*
 * Wallet API
 */
export async function decryptWalletFile(
  walletPath: string,
  decryptionKey: string,
): Promise<number> {
  const { walletName } = await getWalletPoolName()
  const wallet_key = await getWalletKey()

  const config = JSON.stringify({
    wallet_name: walletName,
    wallet_key,
    exported_wallet_path: walletPath,
    backup_key: decryptionKey,
  })
  return await Wallet.import({
    config,
  })
}

export async function sendTokenAmount(
  tokenAmount: string,
  recipientWalletAddress: string,
): Promise<boolean> {
  const sovrinAtoms = convertSovrinTokensToSovrinAtoms(tokenAmount)
  return Wallet.sendTokens({
    paymentHandle,
    tokens: sovrinAtoms,
    recipient: recipientWalletAddress,
  })
}

export async function encryptWallet({
                                      encryptedFileLocation,
                                      recoveryPassphrase,
                                    }: {
  encryptedFileLocation: string,
  recoveryPassphrase: Passphrase,
}): Promise<number> {
  return await Wallet.export({
    exportPath: encryptedFileLocation,
    encryptionKey: recoveryPassphrase.hash,
  })
}

export async function getWalletTokenInfo(): Promise<WalletTokenInfo> {
  const paymentHandle = 0
  const tokenInfo: string = await Wallet.getTokenInfo({
    paymentHandle,
  })
  return JSON.parse(tokenInfo)
}

export async function createPaymentAddress(seed: ?string) {
  return await Wallet.createPaymentAddress({
    seed,
  })
}

export const getWalletPoolName = memoize(async function() {
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

/*
 * Utils API
 */
export async function copyToPath(
  uri: string,
  destPath: string,
): Promise<number> {
  return await RNUtils.copyToPath(uri, destPath)
}

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

export function checkIfAnimationToUse() {
  return Platform.OS === 'android'
    ? RNUtils.totalMemory() / smallDeviceMemory < 1
    : false
}

export async function getBiometricError(): Promise<string> {
  if (Platform.OS === 'ios') {
    return await RNUtils.getBiometricError()
  }
  return ''
}

export async function toBase64FromUtf8(
  data: string,
  base64EncodingOption: string = 'NO_WRAP',
) {
  return RNUtils.toBase64FromUtf8(data, base64EncodingOption)
}

export async function toUtf8FromBase64(
  data: string,
  base64EncodingOption: string = 'NO_WRAP',
) {
  return await RNUtils.toUtf8FromBase64(data, base64EncodingOption)
}

export async function generateThumbprint(
  data: string,
  base64EncodingOption: string = 'NO_WRAP',
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
  timeOfAcceptance: number,
): Promise<string> {
  return Utils.setActiveTxnAuthorAgreement({
    text,
    version,
    taaDigest: hash,
    mechanism: accMechType,
    timestamp: timeOfAcceptance,
  })
}

export async function fetchPublicEntitiesForCredentials(): Promise<void> {
  return await Utils.fetchPublicEntities()
}

export async function getRequestRedirectionUrl(
  url: string,
): Promise<string> {
  return RNUtils.getRequestRedirectionUrl(url)
}
