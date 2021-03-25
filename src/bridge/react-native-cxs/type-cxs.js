// @flow

import type { UserOneTimeInfo } from '../../store/user/type-user-store'
import type { AgencyPoolConfig } from '../../store/type-config-store'
import type { ClaimOfferPushPayload } from '../../push-notification/type-push-notification'
import type {ProprietaryConnectionInvitation} from "../../invitation/type-invitation";

export type AriesProtocolConfig = {
  protocol_type: string,
}

export type VcxProvision = {
  agency_url: string,
  agency_did: string,
  agency_verkey: string,
  payment_method: string,
} & AriesProtocolConfig

export type VcxProvisionResult = {
  wallet_name: string,
  wallet_key: string,
  agency_endpoint: string,
  agency_did: string,
  agency_verkey: string,
  // myOneTimeDid
  sdk_to_remote_did: string,
  // myOneTimeVerificationKey
  sdk_to_remote_verkey: string,
  // oneTimeAgencyDid
  institution_did: string,
  // oneTimeAgencyVerificationKey
  institution_verkey: string,
  // myOneTimeAgentDid
  remote_to_sdk_did: string,
  // myOneTimeAgentVerificationKey
  remote_to_sdk_verkey: string,
}

export type CxsInitConfig = UserOneTimeInfo & AgencyPoolConfig

export type VcxInitConfig = {
  agency_endpoint: string,
  agency_did: string,
  agency_verkey: string,
  wallet_key: string,
  wallet_name: string,
  remote_to_sdk_did: string,
  remote_to_sdk_verkey: string,
  sdk_to_remote_did: string,
  sdk_to_remote_verkey: string,
  institution_did: string,
  institution_verkey: string,
} & AriesProtocolConfig

export type VcxPushTokenConfig = {
  id: string,
  value: string,
}

export type CxsPushTokenConfig = {
  uniqueId: string,
  pushToken: string,
}

export type CxsPoolConfig = {
  poolConfig: string,
}

export type CxsPoolConfigWithGenesisPath = CxsPoolConfig & {
  genesis_path: string,
}

export type VcxPoolInitConfig = {
  genesis_path: string,
  pool_name?: string,
}

export type VcxCreateConnection = {
  source_id: string,
  invite_details: ProprietaryConnectionInvitation,
}

export type VcxConnectionConnectResult = {|
  source_id: string,
  pw_did: string,
  pw_verkey: string,
  uuid: string,
  endpoint: string,
  agent_did: string,
  agent_vk: string,
  their_pw_did: string,
  their_pw_verkey: string,
|}

export type VcxCredentialOffer = {
  msg_type: string,
  version: string,
  to_did: string,
  from_did: string,
  libindy_offer: string,
  cred_def_id: string,
  credential_attrs: { [string]: Array<string> },
  schema_seq_no: number,
  claim_name: string,
  claim_id: string,
  payment_address?: ?string,
  price?: ?string,
}

export type CxsCredentialOfferResult = {
  claimHandle: number,
  claimOffer: ClaimOfferPushPayload,
}

export type VcxClaimInfo = {
  credential_id?: string,
  credential?: string,
  credential_offer?: string,
}

export type WalletPoolName = {
  walletName: string,
  poolName: string,
}

export type UTXO = {
  amount: number,
  extra: string,
  paymentAddress: string,
  source: string,
}

export type PaymentAddress = {
  address: string,
  balance: number,
  utxo: UTXO[],
}

export type WalletTokenInfo = {
  balance_str: string,
  addresses: PaymentAddress[],
}

export const smallDeviceMemory = 1073741824

export type SignDataResponse = {
  data: string,
  signature: string,
}

export const signDataResponseSchema = {
  type: 'object',
  properties: {
    data: { type: 'string', minLength: 1 },
    signature: { type: 'string', minLength: 1 },
  },
  required: ['data', 'signature'],
}
