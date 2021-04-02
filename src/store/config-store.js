// @flow
import { Alert, Platform } from 'react-native'
import {
  put,
  take,
  all,
  call,
  race,
  fork,
  select,
  takeLatest,
  takeLeading,
  spawn,
} from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import PushNotificationIOS from '@react-native-community/push-notification-ios'

import { secureSet, getHydrationItem } from '../services/storage'
import {
  getErrorAlertsSwitchValue,
  getPushToken,
  getHydrationState,
  getConfig,
  getUserOneTimeInfo,
  getCurrentScreen,
  getAllConnectionsPairwiseDid,
  getConnection,
  getAgencyUrl,
  getConnectionByProp,
} from '../store/store-selector'
import {
  SERVER_ENVIRONMENT,
  HYDRATED,
  INITIALIZED,
  APP_INSTALLED,
  ALREADY_INSTALLED_RESULT,
  SERVER_ENVIRONMENT_CHANGED,
  SWITCH_ERROR_ALERTS,
  TOGGLE_ERROR_ALERTS,
  SWITCH_ENVIRONMENT,
  STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL,
  SAVE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  ERROR_SAVE_SWITCH_ENVIRONMENT,
  ERROR_HYDRATE_SWITCH_ENVIRONMENT,
  HYDRATE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  CHANGE_ENVIRONMENT_VIA_URL,
  schemaDownloadedEnvironmentDetails,
  MESSAGE_FAIL_ENVIRONMENT_SWITCH_TITLE,
  MESSAGE_FAIL_ENVIRONMENT_SWITCH_INVALID_DATA,
  MESSAGE_FAIL_ENVIRONMENT_SWITCH_ERROR,
  MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_DESCRIPTION,
  MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_TITLE,
  VCX_INIT_START,
  VCX_INIT_SUCCESS,
  VCX_INIT_FAIL,
  ERROR_VCX_INIT_FAIL,
  ERROR_VCX_PROVISION_FAIL,
  VCX_INIT_NOT_STARTED,
  UNSAFE_SCREENS_TO_DOWNLOAD_SMS,
  MESSAGE_RESPONSE_CODE,
  ACKNOWLEDGE_MESSAGES_FAIL,
  GET_MESSAGES_FAIL,
  ACKNOWLEDGE_MESSAGES,
  GET_MESSAGES_SUCCESS,
  GET_MESSAGES_LOADING,
  GET_UN_ACKNOWLEDGED_MESSAGES,
  SHOW_SNACK_ERROR,
  CLEAR_SNACK_ERROR,
  VCX_INIT_POOL_FAIL,
  VCX_INIT_POOL_SUCCESS,
  VCX_INIT_POOL_NOT_STARTED,
  VCX_INIT_POOL_START,
} from './type-config-store'
import type {
  ServerEnvironment,
  ConfigStore,
  ConfigAction,
  ServerEnvironmentChangedAction,
  SwitchEnvironmentAction,
  ChangeEnvironment,
  ChangeEnvironmentUrlAction,
  DownloadedMessage,
  DownloadedConnectionsWithMessages,
  AcknowledgeServerData,
  DownloadedConnectionMessages,
  GetUnacknowledgedMessagesAction,
  GetMessagesLoadingAction,
  GetMessagesSuccessAction,
  AcknowledgeMessagesAction,
  GetMessagesFailAction,
  AcknowledgeMessagesFailAction,
} from './type-config-store'
import type { CustomError } from '../common/type-common'
import { downloadEnvironmentDetails } from '../api/api'
import { schemaValidator } from '../services/schema-validator'
import type { EnvironmentDetailUrlDownloaded } from '../api/type-api'
import {
  init,
  vcxShutdown,
  downloadMessages,
  updateMessages,
  getHandleBySerializedConnection,
  createCredentialWithProprietaryOffer,
  createCredentialWithAriesOffer,
  proofCreateWithRequest,
  initPool,
} from '../bridge/react-native-cxs/RNCxs'
import { RESET } from '../common/type-common'
import type { Connection } from './type-connection-store'
import {
  updatePushToken,
  fetchAdditionalDataError,
  setFetchAdditionalDataPendingKeys,
  updatePayloadToRelevantStoreAndRedirect,
} from '../push-notification/push-notification-store'
import type { CxsPoolConfig } from '../bridge/react-native-cxs/type-cxs'
import type { UserOneTimeInfo } from './user/type-user-store'
import { connectRegisterCreateAgentDone } from './user/user-store'
import findKey from 'lodash.findkey'
import { SAFE_TO_DOWNLOAD_SMS_INVITATION } from '../sms-pending-invitation/type-sms-pending-invitation'
import { GENESIS_FILE_NAME } from '../api/api-constants'
import type {
  ClaimOfferMessagePayload,
  ClaimPushPayload,
} from './../push-notification/type-push-notification'
import type { ProofRequestPushPayload } from '../proof-request/type-proof-request'
import type { ClaimPushPayloadVcx } from './../claim/type-claim'
import type {
  QuestionPayload,
  QuestionRequest,
} from './../question/type-question'
import { MESSAGE_TYPE } from '../api/api-constants'
import { saveSerializedClaimOffer } from './../claim-offer/claim-offer-store'
import { getPendingFetchAdditionalDataKey } from './store-selector'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'
import { ensureVcxInitAndPoolConnectSuccess } from './route-store'
import {
  registerCloudAgentWithToken,
  registerCloudAgentWithoutToken,
} from './user/cloud-agent'
import {
  processAttachedRequest,
  updateAriesConnectionState,
} from '../invitation/invitation-store'
import type { AriesQuestionRequest } from '../question/type-question'
import {
  COMMITEDANSWER_PROTOCOL,
  QUESTIONANSWER_PROTOCOL,
} from '../question/type-question'
import {
  defaultServerEnvironment,
  serverEnvironments,
  usePushNotifications,
} from '../external-imports'
import type {
  InviteActionData,
  InviteActionPayload,
  InviteActionRequest,
} from '../invite-action/type-invite-action'
import { INVITE_ACTION_PROTOCOL } from '../invite-action/type-invite-action'

/**
 * this file contains configuration which is changed only from user action
 * this store should not contain any configuration
 * which are not result of user action
 */

export const sharedPoolConfig =
  '{"reqSignature":{},"txn":{"data":{"data":{"alias":"australia","client_ip":"52.64.96.160","client_port":"9702","node_ip":"52.64.96.160","node_port":"9701","services":["VALIDATOR"]},"dest":"UZH61eLH3JokEwjMWQoCMwB3PMD6zRBvG6NCv5yVwXz"},"metadata":{"from":"3U8HUen8WcgpbnEz1etnai"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"c585f1decb986f7ff19b8d03deba346ab8a0494cc1e4d69ad9b8acb0dfbeab6f"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"brazil","client_ip":"54.233.203.241","client_port":"9702","node_ip":"54.233.203.241","node_port":"9701","services":["VALIDATOR"]},"dest":"2MHGDD2XpRJohQzsXu4FAANcmdypfNdpcqRbqnhkQsCq"},"metadata":{"from":"G3knUCmDrWd1FJrRryuKTw"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"5c8f52ca28966103ff0aad98160bc8e978c9ca0285a2043a521481d11ed17506"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"canada","client_ip":"52.60.207.225","client_port":"9702","node_ip":"52.60.207.225","node_port":"9701","services":["VALIDATOR"]},"dest":"8NZ6tbcPN2NVvf2fVhZWqU11XModNudhbe15JSctCXab"},"metadata":{"from":"22QmMyTEAbaF4VfL7LameE"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"408c7c5887a0f3905767754f424989b0089c14ac502d7f851d11b31ea2d1baa6"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"england","client_ip":"52.56.191.9","client_port":"9702","node_ip":"52.56.191.9","node_port":"9701","services":["VALIDATOR"]},"dest":"DNuLANU7f1QvW1esN3Sv9Eap9j14QuLiPeYzf28Nub4W"},"metadata":{"from":"NYh3bcUeSsJJcxBE6TTmEr"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"d56d0ff69b62792a00a361fbf6e02e2a634a7a8da1c3e49d59e71e0f19c27875"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"korea","client_ip":"52.79.115.223","client_port":"9702","node_ip":"52.79.115.223","node_port":"9701","services":["VALIDATOR"]},"dest":"HCNuqUoXuK9GXGd2EULPaiMso2pJnxR6fCZpmRYbc7vM"},"metadata":{"from":"U38UHML5A1BQ1mYh7tYXeu"},"type":"0"},"txnMetadata":{"seqNo":5,"txnId":"76201e78aca720dbaf516d86d9342ad5b5d46f5badecf828eb9edfee8ab48a50"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"singapore","client_ip":"13.228.62.7","client_port":"9702","node_ip":"13.228.62.7","node_port":"9701","services":["VALIDATOR"]},"dest":"Dh99uW8jSNRBiRQ4JEMpGmJYvzmF35E6ibnmAAf7tbk8"},"metadata":{"from":"HfXThVwhJB4o1Q1Fjr4yrC"},"type":"0"},"txnMetadata":{"seqNo":6,"txnId":"51e2a46721d104d9148d85b617833e7745fdbd6795cb0b502a5b6ea31d33378e"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"virginia","client_ip":"34.225.215.131","client_port":"9702","node_ip":"34.225.215.131","node_port":"9701","services":["VALIDATOR"]},"dest":"EoGRm7eRADtHJRThMCrBXMUM2FpPRML19tNxDAG8YTP8"},"metadata":{"from":"SPdfHq6rGcySFVjDX4iyCo"},"type":"0"},"txnMetadata":{"seqNo":7,"txnId":"0a4992ea442b53e3dca861deac09a8d4987004a8483079b12861080ea4aa1b52"},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"3U8HUen8WcgpbnEz1etnai","value":"NXjsBfaDijk6P6W6fg1EKrzPYhDvkNHbDcSMaYdja4URdiEdaPFcqXQttgwytcKZL79BsV3i8ShWbDS5L9Um5Pj"}]},"txn":{"data":{"data":{"alias":"australia","blskey":"31My1Ya9D1v5edgkGfYb96k4HWN1GwWWUeEnzzgw3NpiVmjpyjKgPmTYvPWZAYt8CLJLWzoQrEcBYhKRedsx8JMEB4LyPVx5vgbcjKsiUK2985t9Pkpn45UAYjDvVmGSbF2y99mMjQxpt7nCwGZ9yKcEm1cLpyHxvbnceZGkf8e9HYs"},"dest":"UZH61eLH3JokEwjMWQoCMwB3PMD6zRBvG6NCv5yVwXz"},"metadata":{"digest":"f8297516300f34624d25bf38b558f8ac9df2830a4e7fe8ccdf6816ec597da4cc","from":"3U8HUen8WcgpbnEz1etnai","reqId":1518718611795589},"type":"0"},"txnMetadata":{"seqNo":8,"txnTime":1518718611},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"3U8HUen8WcgpbnEz1etnai","value":"4wiCViKevghYdtcdJXdAmS4Cwy9dAsc5eDUqHnjZXcnBbVpc71iHdyWj83U4teK65Yq2g2no8ddzJscEVTZn1ueC"}]},"txn":{"data":{"data":{"alias":"australia","blskey":"KMbkBaLigL6wUbYZmh3d41EeCRVrW1hWkpGRcy2CXZ6ugZF1Zb7ZeL3RPRasaARYkuWmjYAuLE8WiVC1dL5ZQuJczAJfDsk73hxivHxqeBaXDQwEBN2dESLZHdK3oMU79ZhqBqnEgvvAvmVyyneW661if5c45AFJgGYPtpenxS49MB"},"dest":"UZH61eLH3JokEwjMWQoCMwB3PMD6zRBvG6NCv5yVwXz"},"metadata":{"digest":"77ab856e84ef72f87a6e99ecd447da338d1eddf332b9cd33a1399aba98d39ef4","from":"3U8HUen8WcgpbnEz1etnai","reqId":1518718754041702},"type":"0"},"txnMetadata":{"seqNo":9,"txnTime":1518718754},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"G3knUCmDrWd1FJrRryuKTw","value":"5owgEB8jgYUaGsH3pV6DyFMSiwXPqMgM4u9NzgCyJpnENTzyF1BmeVaNomRunbL9R4EhfbrDNHW9RJFd5GT5pAPs"}]},"txn":{"data":{"data":{"alias":"brazil","blskey":"2G1tp8pjdRSiZnpsWpN5c4tnGGTCPbqEkf8MyaVnfSxBun7pdtRqq83E7XnY4uzNmzpBF5PZcPBonfZXzCT2qWjRAB7PaDUWU5zWfLKhNoRmEzaeFp2dVkd9XrcefSfynStWsiPmv4tG8CHX153kL9Le7LMBk9qCRjeXn77wCUXqyvB"},"dest":"2MHGDD2XpRJohQzsXu4FAANcmdypfNdpcqRbqnhkQsCq"},"metadata":{"digest":"999bb3eecd2807ebf31c619518775f6219a1a6e51234f3a1f3b1021dd900dd97","from":"G3knUCmDrWd1FJrRryuKTw","reqId":1518719363728031},"type":"0"},"txnMetadata":{"seqNo":10,"txnTime":1518719363},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"22QmMyTEAbaF4VfL7LameE","value":"5yVCBN5z8ehtM14FdGcRPDEc3asUrEH83PdbEBpfyrvHprn8iUZMBSCo4kkirvS1HirLLxU4mHssGvm4baGfTXfc"}]},"txn":{"data":{"data":{"alias":"canada","blskey":"q6nBf5jDDQN23yKEvVsxYjMkS843yspF44867S9Fhht2uUogbAed4cXLfxdTJMLYvsNT2fhA2jmnNSQwUyWfXjBFUSZqNhvJdC3d5XvcW8aqCGnV1BY9fR1kvrQXoLjaYgr1Je33NJxLNpJLumGF6WvuW6SuZYJPbfWxo7F1Vhy8oV"},"dest":"8NZ6tbcPN2NVvf2fVhZWqU11XModNudhbe15JSctCXab"},"metadata":{"digest":"306bb20ca4c46e485e0c93abd6ee9960d8954928d5603d79ade75c7ef22c4288","from":"22QmMyTEAbaF4VfL7LameE","reqId":1518719479176817},"type":"0"},"txnMetadata":{"seqNo":11,"txnTime":1518719479},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"NYh3bcUeSsJJcxBE6TTmEr","value":"G99xrEafV1BhUtgLb8jugDQvu4JLp5R2s5T4ZqSuy5pPNnDRZyhWn6iW89Uwe476uxxdugx7TzEXY61wZXCsUNs"}]},"txn":{"data":{"data":{"alias":"england","blskey":"3TXrLKV5Yn2BE47NBEvM9u6J2DUsn414sUhQQQN1X2mRKhsPvWnixqo1AbFC5kRVjpHDhRPzvenm7cApfGcCGMDME1mSwESxiYgkgpahc9DuGD5hvFieryk3yJ96jcumWA7NUUDYmiHhZfCThXvGS9agXK4Kt3sgxBYQ17yN7wj3cRN"},"dest":"DNuLANU7f1QvW1esN3Sv9Eap9j14QuLiPeYzf28Nub4W"},"metadata":{"digest":"fb5062d61960bd6f742519c6df9ca5463e6c83689cad58a7c84783a7d013c3fb","from":"NYh3bcUeSsJJcxBE6TTmEr","reqId":1518719555172082},"type":"0"},"txnMetadata":{"seqNo":12,"txnTime":1518719555},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"U38UHML5A1BQ1mYh7tYXeu","value":"4ns8r24bUMZqs2AVrBUpK66gGBA3pp2h98BM8XC2nHghbyrmWA6KpSjnmEfLKBgDZcFaoSX4Wu2d6TJzeRsVQQ8Q"}]},"txn":{"data":{"data":{"alias":"korea","blskey":"2b51xiHs4afNBiTUenKJ2XHmPMfYcNFHAwB2x39z953y1YawDTKnUW9Q2gPCQvRR5esvF235PHfv9b5GYFnXPo41wzotm7LiYsYimAarVh2PFo3CAz5DSo9xA6Xo9EhP2JnDSvi2APqGn2UpoYtpRtz2bMFurqrnw6UPz4vq91x23hJ"},"dest":"HCNuqUoXuK9GXGd2EULPaiMso2pJnxR6fCZpmRYbc7vM"},"metadata":{"digest":"4943fc79d796067841ad0aeb0e44c54bb88a1e152e2bc482925ebe3df9e5d032","from":"U38UHML5A1BQ1mYh7tYXeu","reqId":1518719649363976},"type":"0"},"txnMetadata":{"seqNo":13,"txnTime":1518719649},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"HfXThVwhJB4o1Q1Fjr4yrC","value":"2pC8hkN3MxyJeUZmkqhvvUEi3uCwTbKd14Yjc4uVJjNqx2Hj6oXvwaZPvmJn3VJMkKKE7tpFrtwyFXx8CJ5WwArf"}]},"txn":{"data":{"data":{"alias":"singapore","blskey":"CT7HsX8MAcAnWZ8CFF1ttdYG91hNc7K9dGfpcp4QprLRYVR2XSr2ywHuNT5zLPvTkGDjrjyF2HdMbLkdNGgRa5LH1Am3D619yycJjP8t51c2XygEjoa6J1TmUjYkuC44Q6Aq1BriX5hJ2oxJL3bvnM2g7QRzRPyFdM771zNutV72W3"},"dest":"Dh99uW8jSNRBiRQ4JEMpGmJYvzmF35E6ibnmAAf7tbk8"},"metadata":{"digest":"2dce61e98838e65cd7c303adc248c8fabeab4ecc0492f16572521b2f1939c975","from":"HfXThVwhJB4o1Q1Fjr4yrC","reqId":1518719769599617},"type":"0"},"txnMetadata":{"seqNo":14,"txnTime":1518719769},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"SPdfHq6rGcySFVjDX4iyCo","value":"2xLQwrn2jvg6XZcXGuW6AQ3PKiSHPNAdaHM6CVb8iwDA15HHoPUSi2PGkFvUyFya82QiCA22Y11NDX4Yh4Kx7DqR"}]},"txn":{"data":{"data":{"alias":"virginia","blskey":"372y1y4t9JdTtkyA4C5ANi88YGGaBtSpWd1FL6TJawxn1gnkebpztpsiN5AjTkwARMsTZWX8VyBZ3UGhPd7grmVgoBogTBf1LyvpnmVJR2p9TC26fDFz9GFhynAcPfHQ3xLvVjSyAYH8JjEHRS2yMXxhq8gZCTy494shNXP1wKCD8Ny"},"dest":"EoGRm7eRADtHJRThMCrBXMUM2FpPRML19tNxDAG8YTP8"},"metadata":{"digest":"113c1a81394cbadc48d57aef9d9eb93722f318d01261ed3dc162d8e0f527e37a","from":"SPdfHq6rGcySFVjDX4iyCo","reqId":1518719862981841},"type":"0"},"txnMetadata":{"seqNo":15,"txnTime":1518719863},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"A3h7JbvErKPCfaJx3VNRJ9","value":"4jzEdvJYAKB4vMNMU2VVe4dvGwT2fy28WPuvZipVEqf6R7qkuDWBXLYLBSzGAkUErtRKUnb7KH2eSrZSEgHRozTx"}]},"txn":{"data":{"data":{"alias":"ibm","blskey":"Wv1XfnPWngRPQNQnnaMsewidNtc6Rc2mx842q5ApKTgUdUs2YBZZFgSw4TdWa8HVMZvptiukdooXhTimEwxw9dFQRK5faYb2LBdeRZ6RR2kXz39a6vjyG71arL7Q6FnetH6N2NMFBACdu1PBUYKWAyBn5K8ZUUGgt2YhmZJ9DnieLa","client_ip":"169.60.5.114","client_port":9702,"node_ip":"169.60.5.114","node_port":9701,"services":["VALIDATOR"]},"dest":"Eq7m7GMFKPeq5Ek3HH1PkHxzZ46R9VL1Eube3U9wfjp5"},"metadata":{"digest":"a1dfd555da4085210b53245a199a7d431f4a6328e8936050ec3dc794fe5a2b07","from":"A3h7JbvErKPCfaJx3VNRJ9","reqId":1518798036389445},"type":"0"},"txnMetadata":{"seqNo":16,"txnTime":1518798036},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"TnxHS11bsfWrzzi612R2X8","value":"5tHfCPQfV2XAqo7V42akRqmtDqmbX4HUMAZSy9xKz6vERMSDFHmraW4ZEK9hUacjiRthn7P5KuLmopu1mCLwWXhq"}]},"txn":{"data":{"data":{"alias":"RFCU","blskey":"3FuY8wqmBi2XxL4EtJDo3Lhad48QN5ZbhH4kEV3Kfkeb53x94qmWfRndZQJo91M3aWtYpZaZqDaqrQMpuEcAvh8g9hLmb9BWbhK6BVvACSJ2RUiDhBRp4NPkg93tNmQjkdzWoUznFZvbPTTBPBcsmngTake7Sm4YLf1tbd8vuF7Nqkd","client_ip":"207.108.62.234","client_port":9702,"node_ip":"207.108.62.234","node_port":9701,"services":["VALIDATOR"]},"dest":"2B8bkZX3SvcBq3amP7aeATsSPz82RyyCJQbEjZpLgZLh"},"metadata":{"digest":"54d0fb8b9ebc2167d16f9d2027b49917fb484ec6e33caad48bf1516ba27460af","from":"TnxHS11bsfWrzzi612R2X8","reqId":1518798718080714},"type":"0"},"txnMetadata":{"seqNo":17,"txnTime":1518798718},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"ApndPYajjcdTnpvopThGwh","value":"5eyGhLmKmJx5SzkqmS5LD4s4rkQHDAeGh7PmZKhTNJ8MxdbSaZEGjVj4XYD37GeGTepfLwmivJDJjfYaDQGV7aoi"}]},"txn":{"data":{"data":{"alias":"pcValidator01","blskey":"3NU2sWYG7eeJY66W1FGpLgLaDS9fDQfKMNgPGMCk9iTcatMd4XdmAF5UqULkLUpGWABftNTrRsgm82DpfJ1cTu7CTB84KYoW4SYf7Rq4a2wi6rVbmU6k76ZYgmny6h8vqBbdRwozxVTjkPyzV6Z5MSA3vrDdf31iiiPEcXTTT3oFhKC","client_ip":"52.175.254.49","client_port":9799,"node_ip":"52.175.254.49","node_port":9701,"services":["VALIDATOR"]},"dest":"5fKwygs8KEGoUPGa65qz1oCm7h6Fb7HrML9r4jmZ9cic"},"metadata":{"digest":"9dd9cd0dc1ee21694c798c41e80922afd44e70b4e067b2c9c3582c929248ee74","from":"ApndPYajjcdTnpvopThGwh","reqId":1518809271040696},"type":"0"},"txnMetadata":{"seqNo":18,"txnTime":1518809270},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"G4zXq8L7L8n73WKSVv2HxY","value":"Yyd84xQCFWTQovZjUFohaXp3UhXdHX4wj25CGnpvcQs9LKE37DRj4DWvh2RkJALeBLtPZJsXwzKyuivPxLA8QVj"}]},"txn":{"data":{"data":{"alias":"NewtonD","blskey":"36fw9Bz4tLCkzZhUQdA2N51AZWCF6sdyiDuAX7WuNsqeq3C2dCzvS9GeSxt9t1BWxtHWc2GJDVBcqZKGh7Tg2eoQa1KTPhPFRdShBhYPDfP85gKKshHa5aEdLBvTsUkADaDoyFv4rhqTLDFbdcu4WsQE59pxyj3QTSAURgRhxkcm2oJ","client_ip":"52.165.40.82","client_port":9701,"node_ip":"40.69.165.222","node_port":9777,"services":["VALIDATOR"]},"dest":"HU8AkmtsqvcfEtvdWAZgZZFfvKYH8vu2YdgkkHrmNDGP"},"metadata":{"digest":"e0afed7d71f511362c2b21cb90c0b68fc1cb176e233d147a267375350133a6b6","from":"G4zXq8L7L8n73WKSVv2HxY","reqId":1519949508036643},"type":"0"},"txnMetadata":{"seqNo":19,"txnTime":1519949508},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"EKvw1VdXwS2pWKLLyBLCDs","value":"DqCfNstgx5q8gaM57b6qUooHCuhFFqqs7H995UDSBARoD7LWn6gaqJAmcz56NMUmtiWSqpqreBFxwPMr66xPj2Z"}]},"txn":{"data":{"data":{"alias":"Aalto","blskey":"emFqQUM4yqEWdhbk8KzLry6okMk5MsQUoR922BdBS8KBFxNAofPPDzDSR6pwu8ytZVVrfWGbVBs3D6WDt8dZAQY1xYJoAax7pt9Bkgen5Tc2BM5dLhuHpDwRLAmXFFxQbTxArAKidQeeB9wBJbScbbVnWjNNiYPreaZjgFXUGoWjSS","client_ip":"130.233.224.231","client_port":9702,"node_ip":"130.233.224.231","node_port":9701,"services":["VALIDATOR"]},"dest":"7JYQmTE6mBxa5RAZwXAj4bxqetAy64tcEUShqzJjLRrE"},"metadata":{"digest":"5c717908d4b75e92767cca818ac7530789c765c08207eec38cd18eff93b76502","from":"EKvw1VdXwS2pWKLLyBLCDs","reqId":1520418048198552},"type":"0"},"txnMetadata":{"seqNo":20,"txnTime":1520418048},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"Qm7Ugni6jFRpfbPkzhXzXH","value":"jAGG7yFmyLXRGUS2yqoNikvCGWhWeS9eFRyb5vfzu9ZjuAqbiyL4SfNv8NpMAs9Bsda5Y9kZfg9wrW8GufX8NNN"}]},"txn":{"data":{"data":{"alias":"Stuard","blskey":"4Yry2Z17vf1Hf24HvRrduj3Zi5LBJ1x7PbDqNWX19RxHcYJVjpy2f9qriZk7Fx812Xip6LEhsEXWRB1qKujBwdLNbCvMFYnJK2kS2B9HNgDgbVwDbpw16QNuJMtUnvQv1B6vCmci96gypYWMvZmJ6p9qsPXA7CZ2ZSjRuLg3RqvD7y4","client_ip":"10.0.0.10","client_port":9702,"node_ip":"10.0.0.10","node_port":9701,"services":["VALIDATOR"]},"dest":"C4e4rEwPZ4bM341VEL9ysnAgBiMW42RH3UmbriPuzoCb"},"metadata":{"digest":"70d1ed111dd5fec2e46378152f0e8ed5a99728e06288f721fad337b8ba9bae3c","from":"Qm7Ugni6jFRpfbPkzhXzXH","reqId":1521022519350930},"type":"0"},"txnMetadata":{"seqNo":21,"txnTime":1521022519},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"Qm7Ugni6jFRpfbPkzhXzXH","value":"5yKYfGouHn494CtFhEMLYYuWHC9rPhsUWBpXLneJT8jt869rjVxeab9iABYS2Uq55Avjwtd25Xfvyru57HwQMfZb"}]},"txn":{"data":{"data":{"alias":"Stuard","blskey":"4Yry2Z17vf1Hf24HvRrduj3Zi5LBJ1x7PbDqNWX19RxHcYJVjpy2f9qriZk7Fx812Xip6LEhsEXWRB1qKujBwdLNbCvMFYnJK2kS2B9HNgDgbVwDbpw16QNuJMtUnvQv1B6vCmci96gypYWMvZmJ6p9qsPXA7CZ2ZSjRuLg3RqvD7y4","client_ip":"185.27.183.66","client_port":9702,"node_ip":"185.27.183.66","node_port":9701,"services":["VALIDATOR"]},"dest":"C4e4rEwPZ4bM341VEL9ysnAgBiMW42RH3UmbriPuzoCb"},"metadata":{"digest":"0c7f5c756b286dcf1c769cec7a3d5cfeaf57c38ac25e4a83e9d37b417b20774c","from":"Qm7Ugni6jFRpfbPkzhXzXH","reqId":1521070797707610},"type":"0"},"txnMetadata":{"seqNo":22,"txnTime":1521070797},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"FzUUYiVKCDnSWd77NHfhpZ","value":"3Q3ijuEPihRyGsZFvmb414AWWQ7iMskCHoP7bC14FgPesNdPNY3pdfddEfPf5FrCg4wzdvdAFjKaBunHHwXCG4V3"}]},"txn":{"data":{"data":{"alias":"TNO","blskey":"37d7DmcwGWM7yfnpwLGzwVy6zZwoc6cAgeeSJFBWbVh6jq5tP8dPf7s2XDxxtWafmr1JdyzycBcNztEsE8Uf9qX2jRoXzhCnjEEYJCAByEn5hWC2VQ9EqkuKzq28Vob7Piof7rEJeUPxuBZtrXL1khyTN2waQtix6CYtv9QejNPZVJ2","client_ip":"134.221.127.143","client_port":9702,"node_ip":"134.221.127.143","node_port":9701,"services":["VALIDATOR"]},"dest":"TZxmZoXwNk1X5o48pXqbDFz6mTJT5QkiRme9z5p86KQ"},"metadata":{"digest":"0f3b44855c6f562b17321efe51f00edab1cdbe8608c667669e8085430fa32cc5","from":"FzUUYiVKCDnSWd77NHfhpZ","reqId":1521195244613677},"type":"0"},"txnMetadata":{"seqNo":23,"txnTime":1521195244},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"3jN1g2dAPKx5giEKnc5k9GiYHBw5yFZD8D8GiuFBL7wuHUDabobCeCCDezboxqkCpHSLsVE5hDzq6RQWUKwHXwv1"}]},"txn":{"data":{"data":{"alias":"Stuard","services":[]},"dest":"C4e4rEwPZ4bM341VEL9ysnAgBiMW42RH3UmbriPuzoCb"},"metadata":{"digest":"f24b5dda0fe64addafbbdd67aa2be5731064d6c6215d56e883e67009df0ce0d8","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1521760233710703},"type":"0"},"txnMetadata":{"seqNo":24,"txnTime":1521761250},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5omTkQAe1LmYQfY4PdYf3YEjVM1jBs2Qr8x8LAhghD3ymeudEvm1dyk3nQtEtNzFvAeGhnajWMA862DWM4Hg51vv"}]},"txn":{"data":{"data":{"alias":"Aalto","services":[]},"dest":"7JYQmTE6mBxa5RAZwXAj4bxqetAy64tcEUShqzJjLRrE"},"metadata":{"digest":"f526af4c7569c941f69f1fb2dc3ad6ef98bdef2aa2aceca33d43dc92900d65bb","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1521822633807532},"type":"0"},"txnMetadata":{"seqNo":25,"txnTime":1521822633},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"4YtbkvnTMfMA6d9FjkjBcueFGq5PnLoHFKn8HAGiLKxcob2QM6KsdwLRapQcbtn9N33NimyeFzrHCerzAcbS8fVq"}]},"txn":{"data":{"data":{"alias":"pcValidator01","services":[]},"dest":"5fKwygs8KEGoUPGa65qz1oCm7h6Fb7HrML9r4jmZ9cic"},"metadata":{"digest":"f0986bab87b08031cfaeb58a06e27e8c1214f4c20af0e26c709c1c3970c0b241","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1521825598199425},"type":"0"},"txnMetadata":{"seqNo":26,"txnTime":1521825598},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"G4zXq8L7L8n73WKSVv2HxY","value":"5kkkxWBUmYYcrFSKQcgaAEhcsiwJft74Js5VpwBzL1ssfFJRJgDdjhW27hZRCao994DW5b17Xgw6UqSyBLP7UmyD"}]},"txn":{"data":{"data":{"alias":"NewtonD","services":[]},"dest":"HU8AkmtsqvcfEtvdWAZgZZFfvKYH8vu2YdgkkHrmNDGP"},"metadata":{"digest":"e2d73bb8154e3372fa0c8d57c1383c2b4710308198a76580f15ce2c3ffd5f204","from":"G4zXq8L7L8n73WKSVv2HxY","reqId":1521831913747645},"type":"0"},"txnMetadata":{"seqNo":27,"txnTime":1521831913},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"G4zXq8L7L8n73WKSVv2HxY","value":"4L9AFEy3gdV1KNHsuG4gWSuETzTmJ2aD5TzSdWiQCm13o6GfNAY8YoemyiTiwnX8mzxdghgc38CLhEBm3DwfC3Dv"}]},"txn":{"data":{"data":{"alias":"NewtonD","services":["VALIDATOR"]},"dest":"HU8AkmtsqvcfEtvdWAZgZZFfvKYH8vu2YdgkkHrmNDGP"},"metadata":{"digest":"d83f3622a59d8fe15448389a185752add786de3eaf0cabfc17cea86dc503c2a5","from":"G4zXq8L7L8n73WKSVv2HxY","reqId":1521833231516195},"type":"0"},"txnMetadata":{"seqNo":28,"txnTime":1521833231},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"xzjjfKfJJJeQxZb5WhMYyHDcDG5dZCAvsYmBh6FtP9J1ckQUazaJ7AC2ksHzjARW9kkcFBS4B1M4R7y5Bc3BN5S"}]},"txn":{"data":{"data":{"alias":"TNO","services":[]},"dest":"TZxmZoXwNk1X5o48pXqbDFz6mTJT5QkiRme9z5p86KQ"},"metadata":{"digest":"03c5763b3be5b2c53be3f2af041071bdb2f2aa08754adbdcebbcbbe055036cd6","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1522073964061797},"type":"0"},"txnMetadata":{"seqNo":29,"txnTime":1522073964},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"nm4hZxHEb86rDjHddyuFgnuy7hS7bf1Biifnje3c75Kgn1eQ5frc9xwVWFUzZNFntfVckXQK3U97wRiiP7MrijK"}]},"txn":{"data":{"data":{"alias":"NewtonD","services":[]},"dest":"HU8AkmtsqvcfEtvdWAZgZZFfvKYH8vu2YdgkkHrmNDGP"},"metadata":{"digest":"a81744dd61919ea58d75904a8d6921be18362cecb174e3d5f318384c99d912c2","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1523554207793968},"type":"0"},"txnMetadata":{"seqNo":30,"txnTime":1523554207},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"LKjUWXR3QpGsMkgB2XFyzt","value":"671v9pVTeRwN4XybdY5tjGyJZCNhGPFq3bcBxymCGJ18EQbBdDa6LXGh3brvWQ53yncspYbywrgC7eGknnqYR2GB"}]},"txn":{"data":{"data":{"alias":"VeridiumIDC","blskey":"2HhwAzNXb6qrptphzJKiAYqGtE6dNNcK8Q33EJU8hNnAhvjC4X1Bk65MbgvPMpn4rP9HZAH78StG12HfU6VyLd6JBbp6gkgwvtXUK1QefTEGcRipj3XnVJ7tjU8KzxWqaZQW5exJQQQhmedCKZphKvvnb2wuVcoBVS3Ad3ZLm2d4apo","client_ip":"18.197.183.58","client_port":9702,"node_ip":"18.197.183.58","node_port":9701,"services":["VALIDATOR"]},"dest":"58uCeMaEiMHSi8MdEdcgVbpmzMKmiLSYCEz1vxPGJND6"},"metadata":{"digest":"64a71eb01fc9becdbea811aa449d9a588c22b47e7d7434b4dae437bf8153303f","from":"LKjUWXR3QpGsMkgB2XFyzt","reqId":1524737343827561},"type":"0"},"txnMetadata":{"seqNo":31,"txnTime":1524737343},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"RtMtkBrkHCEDtGXXqRfGoV","value":"3ontWhK6hYCpGx8DgirvihSqDarZUTQ3NacwtC4okP2BNpF1xp6tzjnx6iigt8kgaRSGPacXL93AHVXeS6fvQ41t"}]},"txn":{"data":{"data":{"alias":"oregon","blskey":"2bQaqiLhyAEJh6t1xhC3jKk5PRc7v8AsEH9dxSjgVvBqwrmoiDKfSmJKBXA9kCT1uQkpaGeYyP4bkb3RA1ABYebqcswkjdVUGRZYqyxasdBD2phUbNm6WNaGtyRkhJ265KZ7YP8QaDS3NCwTXT7b8vMNmaTL8Kd1Buvaq7gS3ZLJXU6","client_ip":"18.236.138.206","client_port":9702,"node_ip":"18.236.138.206","node_port":9701,"services":["VALIDATOR"]},"dest":"4wdqCSyPeiqCbQhjsbP9Xjasm7vuU7ithawkpuoBXCBM"},"metadata":{"digest":"add1f55e950e2411deecd700285802fd154fc68668e2020df9e97cad47d79491","from":"RtMtkBrkHCEDtGXXqRfGoV","reqId":1524852414943816},"type":"0"},"txnMetadata":{"seqNo":32,"txnTime":1524852415},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"2XCnRcUZJH2JEzotFHTqin","value":"5g4zsXjPumLMTVb8rCYoALeERtgue7qq6uda1vxA2wywZc5VDLBmrJbguwMztdXLCJQKg3qbu8bcYdJUERNdX1Bq"}]},"txn":{"data":{"data":{"alias":"findentity","blskey":"4jBpQMFjEabdTHArLHAbidwcaR5o7p4fAuYbfxrtypZtDbsDACj5mZRFVvkXy5F84g7ni6yNMfL5JV1E3qXYsg3fw33Jd3MTRyAGrZZmN3zNEq6WDNT8XQsaDasDUebJaTEmRWVKMZc8BbeipCPBjym2NvfAQyib1ywZZ5B8d7m5XXH","client_ip":"172.31.28.111","client_port":9799,"node_ip":"172.31.46.137","node_port":9700,"services":["VALIDATOR"]},"dest":"5bQhBNkoFKCFAtCxe1vcXBoq6FsnJ3nWKYwUfyVS3129"},"metadata":{"digest":"dcdd47c5bcffd8aeee8b281ed78b57eef5e3ba617f905885c0c7b356f07ab00a","from":"2XCnRcUZJH2JEzotFHTqin","reqId":1525741289118866},"type":"0"},"txnMetadata":{"seqNo":33,"txnTime":1525741289},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"2XCnRcUZJH2JEzotFHTqin","value":"4wTCrfhT5wzBLpEkadt2UP21kPxiPJPWoKUKs3VSGAsi2427aJbTzPMFokSpPukfEHqMikGCeXP95kPZ5eRKazBy"}]},"txn":{"data":{"data":{"alias":"findentity","blskey":"4jBpQMFjEabdTHArLHAbidwcaR5o7p4fAuYbfxrtypZtDbsDACj5mZRFVvkXy5F84g7ni6yNMfL5JV1E3qXYsg3fw33Jd3MTRyAGrZZmN3zNEq6WDNT8XQsaDasDUebJaTEmRWVKMZc8BbeipCPBjym2NvfAQyib1ywZZ5B8d7m5XXH","client_ip":"34.211.203.16","client_port":9799,"node_ip":"34.218.164.50","node_port":9700,"services":["VALIDATOR"]},"dest":"5bQhBNkoFKCFAtCxe1vcXBoq6FsnJ3nWKYwUfyVS3129"},"metadata":{"digest":"0581a913d81b117dc6f5eb67e6faf734f838a9d6dd2f2a550edb620940ed522c","from":"2XCnRcUZJH2JEzotFHTqin","reqId":1525799946176362},"type":"0"},"txnMetadata":{"seqNo":34,"txnTime":1525799946},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"RtMtkBrkHCEDtGXXqRfGoV","value":"2EQyW1W3EVq9Qkr6Dnk1baDeE8vPcDxgPoZdKkxnKYWLdi27NLvzjziUZ2Ckeuw4MqhDdBeafW36DMQo4fDzkjBT"}]},"txn":{"data":{"data":{"alias":"oregon","services":[]},"dest":"4wdqCSyPeiqCbQhjsbP9Xjasm7vuU7ithawkpuoBXCBM"},"metadata":{"digest":"cb346aa8a0234819aa63b5c63cf7928fbbc171f1b3c00e345c24fa3f4f1e9636","from":"RtMtkBrkHCEDtGXXqRfGoV","reqId":1526508235374190101},"type":"0"},"txnMetadata":{"seqNo":35,"txnTime":1526508235},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"YHTFcv8P93i35osabNm99n","value":"2X7YznzieZ1Kc6nzWawdQHG5Z8jV8vNiwHq5BBLn8rY6SGXQCSZhichDp5V7n9he64BKoYxU6YLHuNM2DLSsEvmG"}]},"txn":{"data":{"data":{"alias":"amihan-sovrin","blskey":"14Kn3VBKja9pDCUgoVpMzf4c9rXJpvDsaHrnXkB9WtvNMHPihinjiXUNNuKdVuYiai3iTDe7mjH5o2UjfoKyApdjEgGCKqgDKpH6uzH4ZcUekR5pfe4wC172X5tiBQFScm8Ti1VmqTnUdfvGi4rV4NpBGytPMkZE1qhL1WSDCoi8riW","client_ip":"35.187.226.254","client_port":9702,"node_ip":"35.197.150.130","node_port":9701,"services":["VALIDATOR"]},"dest":"2FZAgVmRC87ZbJXSh6seFi6n7AMfBo9HaCh8HseHi37U"},"metadata":{"digest":"2986a38eaa64cee8ebfa7e5184bc98949a57555bef663ab125f83603371d6591","from":"YHTFcv8P93i35osabNm99n","reqId":1528165772663287},"type":"0"},"txnMetadata":{"seqNo":36,"txnTime":1528165772},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5kJFNauix1UPNtii8g8ahpfmEyJaoAPnFXdeSpJ9Ge3GaaLhWM3Hmr9N8ACdf6Wrs8Yg1pkXLRwmBTuDSvJDe3A"}]},"txn":{"data":{"data":{"alias":"ibm","services":[]},"dest":"Eq7m7GMFKPeq5Ek3HH1PkHxzZ46R9VL1Eube3U9wfjp5"},"metadata":{"digest":"ecd93c53a03d0da0e011973c7c4312e4b5426390930247aa48aca2b70550c2be","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1528236888174137},"type":"0"},"txnMetadata":{"seqNo":37,"txnTime":1528236888},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"PRCWCTWYwGJB7rczzTqBBB","value":"5nJ3vmmFxC1qHjvSWFHLvhqyRtEmxo4Z2SMpuS2U5snEShd1ZMP22eDyd1nDgPJUHRAMuYM519eMoLw4Kj4CqZgf"}]},"txn":{"data":{"data":{"alias":"valNode01","blskey":"24cgjd77KER8uzhxb1c3DbecvrSMQd3nYxBjaJTqLkgBPuAizzoFdXQkdb8LNjgnP27hTHCpLSuatQSE2YYexNXqZDtAUqPMNfsZwAU151kYFfCc6ZWLRzsm4irf4PrS5ZpnSmhT3Ta4c3m12zoTmu3FDxUkJwEBC3ubdNdA8EHcVDz","client_ip":"52.43.138.62","client_port":9702,"node_ip":"52.43.138.62","node_port":9701,"services":["VALIDATOR"]},"dest":"AYQcyJvowniMsxU9P93yzyAPCFUxg7hm1xsXitFoBr6z"},"metadata":{"digest":"5b05dceab82e7288a1003793f0b4ff642284a021b3c5746b5d799b116068428e","from":"PRCWCTWYwGJB7rczzTqBBB","reqId":1528316277953334},"type":"0"},"txnMetadata":{"seqNo":38,"txnTime":1528316278},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"PRCWCTWYwGJB7rczzTqBBB","value":"4FHNA9VCJHMNUssRyaQYFsn6SVQdSddSg2BxRDFp1aurDAMY4o925WCGmoYLeNwMkf34w6nF5NrNHVhXSmPBZUs3"}]},"txn":{"data":{"data":{"alias":"valNode01","blskey":"24cgjd77KER8uzhxb1c3DbecvrSMQd3nYxBjaJTqLkgBPuAizzoFdXQkdb8LNjgnP27hTHCpLSuatQSE2YYexNXqZDtAUqPMNfsZwAU151kYFfCc6ZWLRzsm4irf4PrS5ZpnSmhT3Ta4c3m12zoTmu3FDxUkJwEBC3ubdNdA8EHcVDz","client_ip":"54.214.176.123","client_port":9702,"node_ip":"54.214.176.123","node_port":9701,"services":["VALIDATOR"]},"dest":"AYQcyJvowniMsxU9P93yzyAPCFUxg7hm1xsXitFoBr6z"},"metadata":{"digest":"b2a209bb10c902c01167e24e7f876ea2359356d43772f37cddefe42f5adf8c58","from":"PRCWCTWYwGJB7rczzTqBBB","reqId":1532033264248749},"type":"0"},"txnMetadata":{"seqNo":39,"txnTime":1532033227},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"tkPNgpHinWAPXvkbvnphC54pauknphTCMF5gzG5AHT1EUHJGS3bQnDi7UKNEYKAjujExWYJAHtM5iydk26yatBK"}]},"txn":{"data":{"data":{"alias":"valNode01","services":[]},"dest":"AYQcyJvowniMsxU9P93yzyAPCFUxg7hm1xsXitFoBr6z"},"metadata":{"digest":"a8eebd86b4cc9aa422f1fc3e6950def9498e7f51b1d9a720ba68413e53ccfbe9","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1532035631471362345},"type":"0"},"txnMetadata":{"seqNo":40,"txnTime":1532035631},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"Psfx4mLS23gBvZDoWz336H","value":"5VVAPQH1LaZmJ4XG1kKxnmUXawg9nTVc1kwULndbFR9yk19mT3vaM9DES342cBYmrpXuY8zQwsXHk4kSoBqZvezi"}]},"txn":{"data":{"data":{"alias":"trustscience-validator01","blskey":"2ToF3Pfb78JQ3pFs6mYxtofDnHLTBLP2RKCDfn6eVngN4zh4UiHvz9DuUS2dfTpAeZLqBDkKuU9pYRazeDN9fqWgzk6kgZYf8jeWgra7rk33ZbZjHFz1zQjNMk3eju5n9JNY4AFbUcXCTWCdFoSXF9fEySKuNANPqtFNz92H2VjrySF","client_ip":"54.214.176.123","client_port":9702,"node_ip":"54.214.176.123","node_port":9701,"services":["VALIDATOR"]},"dest":"8Tqj57DbizpjWQCHvybtKNqKFgfw2bjJbPZrhHDoRoND"},"metadata":{"digest":"d2612092e47da9a0bfb8c9367d0149927abe50aca98ed127b8cfd9b5975b290b","from":"Psfx4mLS23gBvZDoWz336H","reqId":1532121668250427244},"type":"0"},"txnMetadata":{"seqNo":41,"txnTime":1532121629},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5gVt2TSEFpJHWN3BwMn1YgcURpxtGfijmXjGu6Cf5CXkwTmTp4dhUN5Ue6WFZU7PcKSrKfu8PvroWPHCiP7AsMvL"}]},"txn":{"data":{"data":{"alias":"amihan-sovrin","services":[]},"dest":"2FZAgVmRC87ZbJXSh6seFi6n7AMfBo9HaCh8HseHi37U"},"metadata":{"digest":"4141b470e5def16f7fde7c3ee5efc02f712bc0e5260a59709385417047516736","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1532979260947795461},"type":"0"},"txnMetadata":{"seqNo":42,"txnTime":1532979261},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"4A2vM1MT3vxNdASCpxgYfzNajpYScAipcRoSyUaRkH9dZ4CmfhHjWogS7VF7WLRNXKUssQVG2DdLrUzuFEckaM6e"}]},"txn":{"data":{"data":{"alias":"findentity","services":[]},"dest":"5bQhBNkoFKCFAtCxe1vcXBoq6FsnJ3nWKYwUfyVS3129"},"metadata":{"digest":"06ee3b89112f96f93df9f91554b5f4ada39ef34dbc4dd198ab7bc60e0d2f0c57","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1532979375523513444},"type":"0"},"txnMetadata":{"seqNo":43,"txnTime":1532979375},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5tqAZojtpBxCaTkLvX6Why6MYyofYTUEt8taHxyXRBPrDugsCZjM5aRxEwXak7qNuUJGt2x9LMfVLdB81rk8yR2e"}]},"txn":{"data":{"data":{"alias":"VeridiumIDC","services":[]},"dest":"58uCeMaEiMHSi8MdEdcgVbpmzMKmiLSYCEz1vxPGJND6"},"metadata":{"digest":"aca82cab749e9d722134d46f0891269fcae59b7fd065fb3155dd632e2f740322","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1532979478035983569},"type":"0"},"txnMetadata":{"seqNo":44,"txnTime":1532979478},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"5wXZxmiE9PJaidic57FXGfTWjJCuEidh3FBRWMBjhg47JsBxJvoCVuGi7LMYYd7Wj5AdqLqLUC6oL7hKbEPmKr3b"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","client_ip":"169.61.131.234","client_port":9702,"node_ip":"169.61.131.234","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"ef3b5b33492990611a2d443d579681be95f504f1f82b4e9b6015418a72b5620d","from":"BD95LAmfVrD3JEwaereykM","reqId":1535389152858873},"type":"0"},"txnMetadata":{"seqNo":45,"txnTime":1535389153},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"PRCWCTWYwGJB7rczzTqBBB","value":"2PrAKjgg1itZrkaaa5YipCgtTKyeczeSrm8HfHUfu6n5raMPmHLCkzoYWcaHUYjMpL2LHrnhPhdG6HhCJgRbQgoj"}]},"txn":{"data":{"data":{"alias":"valNode01","blskey":"24cgjd77KER8uzhxb1c3DbecvrSMQd3nYxBjaJTqLkgBPuAizzoFdXQkdb8LNjgnP27hTHCpLSuatQSE2YYexNXqZDtAUqPMNfsZwAU151kYFfCc6ZWLRzsm4irf4PrS5ZpnSmhT3Ta4c3m12zoTmu3FDxUkJwEBC3ubdNdA8EHcVDz","client_ip":"127.0.0.1","client_port":9702,"node_ip":"127.0.0.1","node_port":9701,"services":[]},"dest":"AYQcyJvowniMsxU9P93yzyAPCFUxg7hm1xsXitFoBr6z"},"metadata":{"digest":"7f244345a273550cf1cbeee4a41a5917fe17947c355917c9c2c235de63d3a2e4","from":"PRCWCTWYwGJB7rczzTqBBB","reqId":1537808479067559676},"type":"0"},"txnMetadata":{"seqNo":46,"txnTime":1537808338},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"Psfx4mLS23gBvZDoWz336H","value":"3rywzxRvJAiFsuFmEayMxKxxsJDeLAWYM5t1Jxw4vNt9RAuh5WwcAUmcD1Un6urHMMBadpkxGVMyTHFca4jBAZTc"}]},"txn":{"data":{"data":{"alias":"trustscience-validator01","blskey":"2ToF3Pfb78JQ3pFs6mYxtofDnHLTBLP2RKCDfn6eVngN4zh4UiHvz9DuUS2dfTpAeZLqBDkKuU9pYRazeDN9fqWgzk6kgZYf8jeWgra7rk33ZbZjHFz1zQjNMk3eju5n9JNY4AFbUcXCTWCdFoSXF9fEySKuNANPqtFNz92H2VjrySF","client_ip":"127.0.0.2","client_port":9702,"node_ip":"127.0.0.2","node_port":9701,"services":[]},"dest":"8Tqj57DbizpjWQCHvybtKNqKFgfw2bjJbPZrhHDoRoND"},"metadata":{"digest":"01bea8a952895652f4ff5fed121fbab75fc5bea0cf4a5b905324efa944a5ba97","from":"Psfx4mLS23gBvZDoWz336H","reqId":1537818353199012189},"type":"0"},"txnMetadata":{"seqNo":47,"txnTime":1537818211},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"MHrp2wUhk1quHK9kGCcQtX","value":"4meKCAvuw588qWkDMy1pXvMtt4X6YK4hiQArsxEJ7wrY84JL9ZAN1efBby4BLZvQcE2Lx7kP9mrhsrAdBGXM8hCK"}]},"txn":{"data":{"data":{"alias":"trustscience-validator02","blskey":"2f8SF5UdftJkr19X7TQxtcy7EiP1MLLxnT4sppJuFfuprEKxdtRq2BbkyRF24Xbdd5tfWkf9MsPBs7aWqrNcoCjbL5hsawUmPy7tjWtZLhLgKYtKxfFtPFJETtTLaaUhyrnjNwYa7GoTBYKMdv72ZL1fjZjo3EK6jx3H6fohvSVK98P","client_ip":"54.214.176.123","client_port":9702,"node_ip":"54.214.176.123","node_port":9701,"services":["VALIDATOR"]},"dest":"2p77huA99n3pmj5hxYapzXMrEgATHAoQX2CkxS4TNya7"},"metadata":{"digest":"30ef842e8ccb04aa4051d12d3a565d921892a7f79254398eb9ab3b8ced265ece","from":"MHrp2wUhk1quHK9kGCcQtX","reqId":1537821923451170792},"type":"0"},"txnMetadata":{"seqNo":48,"txnTime":1537821782},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"2Tk12rX3eU93zqCGe5oeAH7WvudtqwLA9cK2Cg2UbirMhEh2YL7oR68SqMZDhvKDyeRtViLwbhNcfoSARGucm7yo"}]},"txn":{"data":{"data":{"alias":"trustscience-validator02","services":[]},"dest":"2p77huA99n3pmj5hxYapzXMrEgATHAoQX2CkxS4TNya7"},"metadata":{"digest":"8cf0e8b8db40d79a7019f1642de1f85764532b5ee7f6cd3a40872d7317632f3d","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1538150155109252223},"type":"0"},"txnMetadata":{"seqNo":49,"txnTime":1538150957},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"QuCBjYx4CbGCiMcoqQg1y","value":"SkAWnEADFvzxgtnWiEYrdZQivjX587hu1rBq1HgzVBubQAS8NaNcj8FEFYWLgtcYj91wdcNnSrx5aCC8nHRpfAH"}]},"txn":{"data":{"data":{"alias":"xsvalidatorec2irl","blskey":"4ge1yEvjdcV6sDSqbevqPRWq72SgkZqLqfavBXC4LxnYh4QHFpHkrwzMNjpVefvhn1cgejHayXTfTE2Fhpu1grZreUajV36T6sT4BiewAisdEw59mjMxkp9teYDYLQqwPUFPgaGKDbFCUBEaNdAP4E8Q4UFiF13Qo5842pAY13mKC23","blskey_pop":"R5PoEfWvni5BKvy7EbUbwFMQrsgcuzuU1ksxfvySH6FC5jpmisvcHMdVNik6LMvAeSdt6K4sTLrqnaaQCf5aCHkeTcQRgDVR7oFYgyZCkF953m4kSwUM9QHzqWZP89C6GkBx6VPuL1RgPahuBHDJHHiK73xLaEJzzFZtZZxwoWYABH","client_ip":"52.50.114.133","client_port":9702,"node_ip":"52.209.6.196","node_port":9701,"services":["VALIDATOR"]},"dest":"DXn8PUYKZZkq8gC7CZ2PqwECzUs2bpxYiA5TWgoYARa7"},"metadata":{"digest":"c1633443684eed4d621235388d23e6adf0264658bed09e26fd9ac41026fa4dde","from":"QuCBjYx4CbGCiMcoqQg1y","reqId":1540910673107959938},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":50,"txnTime":1540910673},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"FzAaV9Waa1DccDa72qwg13","value":"3q94ydPoBiKq7oBjAt5gTrdLDWagXn2GMGBXa1Shpd8FFqg25tXrkYBDvn1a81rN6E3bc9e9gUJwXNg3CZUBNYG6"}]},"txn":{"data":{"data":{"alias":"vnode1","blskey":"t5jtREu8au2dwFwtH6QWopmTGxu6qmJ3iSnk321yLgeu7mHQRXf2ZCBuez8KCAQvFZGqqAoy2FcYvDGCqQxRCz9qXKgiBtykzxjDjYu87JECwwddnktz5UabPfZmfu6EoDn4rFxvd4myPu2hksb5Z9GT6UeoEYi7Ub3yLFQ3xxaQXc","blskey_pop":"QuHB7tiuFBPQ6zPkwHfMtjzWqXJBLACtfggm7zCRHHgdva18VN4tNg7LUU2FfKGQSLZz1M7oRxhhgJkZLL19aGvaHB2MPtnBWK9Hr8LMiwi95UjX3TVXJri4EvPjQ6UUvHrjZGUFvKQphPyVTMZBJwfkpGAGhpbTQuQpEH7f56m1X5","client_ip":"159.89.118.181","client_port":9797,"node_ip":"206.189.143.34","node_port":9797,"services":["VALIDATOR"]},"dest":"9Aj2LjQ2fwszJRSdZqg53q5e6ayScmtpeZyPGgKDswT8"},"metadata":{"digest":"6815d516eead933d1163295ac5a1b34ef14fc842d5779a4de23847f5d3652f22","from":"FzAaV9Waa1DccDa72qwg13","reqId":1541014309248416875},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":51,"txnTime":1541014309},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"2Vq2bzfip9c3Zo1b5f9ZEffw1bD3jfWtphJd52Gov6opBcewVQWHcS912J251LTmx1YfNydAYWtL2EYQKuS4EXXm"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","blskey":"2j7jqdynFph7cbSwYgKYfzHKsVcQRfYxCU9AdhTAN8gUV8oFrnuPz348zLX8AMiEt85pKGw97FcACcDTJAGABvwCcXFNXNFGTN2U14JkRcg7yNuHFSWWgmdc1aBQJcJA5ZEtPgq2n47W14L3Y23LUv9E2CLViKUKv6nZqfrEeJi7zUE","blskey_pop":"RHxpCSQFv6Xso4JiEyt9jdTm6J3XUCh1SWy4g6hDsVWYqgrJEeLoXaYBBayB7fi6bDbUPuJVbVYPMA4HNA5eRwagc34gr8JhddgJupLxgzowkKkJa1WEm5vDNwqUfH7JihwwEzUPcmNTjnhGiovhRH4v8Mf1uPyzyS5AHsH8qNbrfZ","client_ip":"194.209.53.115","client_port":9777,"node_ip":"194.209.53.116","node_port":9778,"services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"c94bdafaea83c5668ac61ee754f7de174d90015049a539ddc969a165f6abf871","from":"bPTNiLzWPFHKr7mJGaump","reqId":1541412365363342035},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":52,"txnTime":1541412365},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"NUDC81qrSL5kkiwh4ZmUZ4NepE8sNPLtb3Qii41yiBu1kkudhEBct3Y3TtxJetyfhDmJPiSyWBmBUNxisP4L15t"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","blskey":"2j7jqdynFph7cbSwYgKYfzHKsVcQRfYxCU9AdhTAN8gUV8oFrnuPz348zLX8AMiEt85pKGw97FcACcDTJAGABvwCcXFNXNFGTN2U14JkRcg7yNuHFSWWgmdc1aBQJcJA5ZEtPgq2n47W14L3Y23LUv9E2CLViKUKv6nZqfrEeJi7zUE","blskey_pop":"RHxpCSQFv6Xso4JiEyt9jdTm6J3XUCh1SWy4g6hDsVWYqgrJEeLoXaYBBayB7fi6bDbUPuJVbVYPMA4HNA5eRwagc34gr8JhddgJupLxgzowkKkJa1WEm5vDNwqUfH7JihwwEzUPcmNTjnhGiovhRH4v8Mf1uPyzyS5AHsH8qNbrfZ","client_ip":"194.209.53.116","client_port":9778,"node_ip":"194.209.53.115","node_port":9777,"services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"f7e6c28166e69edb0468869fed131fbca344db0943f020cfb8e0137703401922","from":"bPTNiLzWPFHKr7mJGaump","reqId":1541432813752945620},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":53,"txnTime":1541432814},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5UzHhjZMh4N3w6zSK22RTzb6qFpLijjRgDkCT4XxnJYPYrW7erByfJf2FLkmR4LcdSDrSw4hkFuoH5dkPXpfFZzo"}]},"txn":{"data":{"data":{"alias":"xsvalidatorec2irl","services":[]},"dest":"DXn8PUYKZZkq8gC7CZ2PqwECzUs2bpxYiA5TWgoYARa7"},"metadata":{"digest":"ecdfec24f95a4ef3590f9024f1ce46fa4d8ef2288048c89f18d16822d34f517a","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1541451340102642933},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":54,"txnTime":1541451340},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"3Ygb9RCqsT3SwxpMx2WWrCk9W9pKCpg9qjQkERhKhZuCeEjc1C2YEnf3KtrkCxEVg1xti4gh5kCW97apU53jXBRa"}]},"txn":{"data":{"data":{"alias":"vnode1","services":[]},"dest":"9Aj2LjQ2fwszJRSdZqg53q5e6ayScmtpeZyPGgKDswT8"},"metadata":{"digest":"e7190621d62f017add97a35214ffe39c2820600e91eb7738ac1b6be14be7f7d2","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1541451384934782442},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":55,"txnTime":1541451385},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"34p6FetGiBaiF9rste9tU4bxjDa6jMhPr8drGFfWMfcDBeHrwu4mMdZBGq3RPpaD7G3E74EkgVNA65mPvTG7s7om"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":[]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"c3ec6df9998e376a2b31a4e8bf2f951eaa9779cbfa5b6eed166501f0c0fff6c7","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1541451415119667684},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":56,"txnTime":1541451415},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"FzAaV9Waa1DccDa72qwg13","value":"2GDovjbZyz2rh3rzFpmgqM9TycCxNhbW5esiYXgnkqj43QWz9dwCY5Jv7fSKdmEKK2EiJBuFKt7W8PZZFKyrMuqZ"}]},"txn":{"data":{"data":{"alias":"vnode1","blskey":"t5jtREu8au2dwFwtH6QWopmTGxu6qmJ3iSnk321yLgeu7mHQRXf2ZCBuez8KCAQvFZGqqAoy2FcYvDGCqQxRCz9qXKgiBtykzxjDjYu87JECwwddnktz5UabPfZmfu6EoDn4rFxvd4myPu2hksb5Z9GT6UeoEYi7Ub3yLFQ3xxaQXc","blskey_pop":"QuHB7tiuFBPQ6zPkwHfMtjzWqXJBLACtfggm7zCRHHgdva18VN4tNg7LUU2FfKGQSLZz1M7oRxhhgJkZLL19aGvaHB2MPtnBWK9Hr8LMiwi95UjX3TVXJri4EvPjQ6UUvHrjZGUFvKQphPyVTMZBJwfkpGAGhpbTQuQpEH7f56m1X5","client_ip":"206.189.143.34","client_port":9796,"node_ip":"206.189.143.34","node_port":9797,"services":["VALIDATOR"]},"dest":"9Aj2LjQ2fwszJRSdZqg53q5e6ayScmtpeZyPGgKDswT8"},"metadata":{"digest":"bf0cdbb6b134fc10fd7797fa24f4354a9e9d70dbc92570d23267e151299b24b4","from":"FzAaV9Waa1DccDa72qwg13","reqId":1541618294089244398},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":57,"txnTime":1541618294},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"Bt44zXEB8HkNHJ8mSGq8Hap4xq6QBo1YECwDscH8aoKocmE8LpDKs9nAwUxu5qrtRNHfj9n1bSeTAq593BT43T6"}]},"txn":{"data":{"data":{"alias":"xsvalidatorec2irl","services":["VALIDATOR"]},"dest":"DXn8PUYKZZkq8gC7CZ2PqwECzUs2bpxYiA5TWgoYARa7"},"metadata":{"digest":"59a07975ea03cca3db85c06f0e12a7095df449c56326f470aab9a5f473c4b41d","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1541715283104974168},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":58,"txnTime":1541715283},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"TK4JebQqeqq5t6x2bCwnD7","value":"MC5fG4DowNdB23vHXydtT4f7n1k6wcyZyPA7m3aVZWYfKVT7bwGKWqzmKWGAr1QNm3dkcL2MLVE11ALQsCcFpEt"}]},"txn":{"data":{"data":{"alias":"NodeTwinPeek","blskey":"Jrbf7k1xgkbhfKAmVXqfLLmFieGrxL1f1H6WRBZVB4Rvh8uCHGVoVzMppygH2XPLK4n1cnaBKe7zYxftgMaYXka1HLaScfsVCGqpkSa7d2hzerpcvPQMvo9TCCTP3jWb6uC9kVUHZkVqVvecMDtRkVqr3ZChUAoTM2e4UGmgqvE3Zk","blskey_pop":"RY3ZXV5WoHWMM631ov7ZMWoTX41Cnah4CrwQnXFrPHt49ajB8b5AjnrSDxCb9JEhC8WLVveuQMH7p6FJfoQHRaG2tR9pQLgLCXvbDozYPin4LwVzV3Wh2LNMorAtJgr3PfqxzUmFNEkbiGAbzMdBS1EXbDya9exgrLkrMLuLG1crLw","client_ip":"178.32.102.66","client_port":9782,"node_ip":"87.98.136.246","node_port":9781,"services":["VALIDATOR"]},"dest":"2bDviHYdDiTjyXYXEW92zQHEf1C1QsbFatJ6uSYuYrHh"},"metadata":{"digest":"0d187610d42d46fc90ab873fa1a43132c35d349083dcbf744cf81191ae4a4760","from":"TK4JebQqeqq5t6x2bCwnD7","reqId":1542035094044574100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":59,"txnTime":1542035094},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6mTar6XRRgYdhswcnq3ybf","value":"UfJqCMUzcX5CfqGouLMSivJ5qm5SqBdsJwKkV9aZHTsmHS3GwcBAur4aUP9VG43praqiqToCQ1jZiMyUYj7wKEw"}]},"txn":{"data":{"data":{"alias":"lab10","blskey":"2Yf73vj1CJBqibWHZTdL4Seygd53dSb4PKJugpeokVx8HdXwqhuEnk2nFBCYmXmFp4RxGprQuKDfGuxYDhKuBysHSCbbYwvoWaXXHYtxvD67Ytw37fQo9Stvgu5nCDwDWD3M8p7fkUF4UQRMqfa8W1tddWXgFr5NPSB13GrjJFcPgAn","blskey_pop":"RBGAkA3X7w1ADtQeYiVZW76uWdwRTdCwamappXLb3sD2iNvVBaSF1jPANo9K99QBe42kEAbJtbwsi4AoDWrjex6tVTQqiSxeAt2kRJpCZTGHfthHzLEnFtZqqksWeXQPRNzeeRagFRyZAQhPuL7wYMiz3a6CNnbgQL7dbMvNBaQsUs","client_ip":"5.9.17.149","client_port":9702,"node_ip":"5.9.17.149","node_port":9701,"services":["VALIDATOR"]},"dest":"7vruXjaKFp2t1WrsMTcVZuNQtmn35yimDrN7THYwcPof"},"metadata":{"digest":"515a3de1e3b1166208d6e2d5c7c020b9d9b56f5fbfb01e9ac1e2da96a8ebacb1","from":"6mTar6XRRgYdhswcnq3ybf","reqId":1542135182121048577},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":60,"txnTime":1542135183},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"2HaQjM7gQXQi4nL2CHLDAM6PaHXUsgQ6SoyHkncrNHQua5WWbcd6DjsB5gagvTAsyD9728xA3npf6c82GNCFqrd3"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"0e549b9dee11241b4b9605b540b7162a84c8fe0a466e30fc029929debb9f6f5f","from":"bPTNiLzWPFHKr7mJGaump","reqId":1542298164808052701},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":61,"txnTime":1542298165},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"wKcykStr9Mj6jbjHUjzjkQXnkz7K3S9GmjgB2kZ7KrWpNDrS3hWWydguhUzFcjHoxBDazdEBKgnu3WH15ytNrxx"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":[]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"93b91ab90788049d62246a754432eb2d5f47c8b20e6f7174d57fd42537749c14","from":"bPTNiLzWPFHKr7mJGaump","reqId":1542299088770647926},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":62,"txnTime":1542299089},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KvGE2tKSDuBXEkRc86dL4T","value":"5dwYyoYZu4LRnhdyRFXt7xEFFw2yT8QE7zVKRkD2XswxgsSY1gdnbPDnqBwoUTyUK7MjzeRjuGDJpeBBcHSmH7Wz"}]},"txn":{"data":{"data":{"alias":"trusted_you","blskey":"4Hf3okFu15E52JuH62AD4gNVyBdqg8mP4xzg6bViuYzA3ujCJpC5xCv2afiAgWq5w6ooxhNo4w88jny5je83HvJXUqc1jQNWApzcRr9Zqfz9ipqP3qJv6j8BZJU5VQPfLLfrGRrNG4UFPwHHqXLxcBfFJFqKuBMr9FeQc5LMP6LKhQr","blskey_pop":"RLK3VsTPH8BvpqjBUD1mn21jffYkZdAzEkxt397HcbpHd6zfXE6DbziXrWgVDdofZkuqUhrd7ecwY7yX3rYL182VxfWhvKTDx8VwrPyand6M2DWtR3c3rUwwqBkLJW5dXP2ZrPMnUrukJ88SXVrf4J23jiy9xFTZLAVZnt2Go582aB","client_ip":"51.140.243.125","client_port":9700,"node_ip":"51.140.220.111","node_port":9750,"services":["VALIDATOR"]},"dest":"7wetNy5AJpHfXvhTx4okZokSw5mcrgWgVZ8jJ3WHgrmd"},"metadata":{"digest":"1e72a8499fe7372eb9b3f7876a4bb965801c9ee611d79611afad3355f9133c9b","from":"KvGE2tKSDuBXEkRc86dL4T","reqId":1542323966510001027},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":63,"txnTime":1542323966},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"2LpmtWWx2ykmxYQ9QZ13PoXrtn77ETbjTrBRDmZULykruGVyDWp6Xn3EyrrNuEZVDxjFGKG1tdbcQKhUHKJn6LHA"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":[]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"e6a5bb4cd4189ecc6ae0858a32c7df509e81c181bab5cf4f43e72d480ea0f7a0","from":"bPTNiLzWPFHKr7mJGaump","reqId":1542361064125639673},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":64,"txnTime":1542361064},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"uV9yMB5sfwYNRjXfvbD8eajsW16SEfAxE62QVyX2f9YBkr2BBLed9WHE79Ww5v5ycV5mrduAr7rrYZnCNyNvgvv"}]},"txn":{"data":{"data":{"alias":"trusted_you","services":[]},"dest":"7wetNy5AJpHfXvhTx4okZokSw5mcrgWgVZ8jJ3WHgrmd"},"metadata":{"digest":"a915255c0490bd661652aae007d55c88736a9556a283e9087862db948fc01ab0","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1542394857400361543},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":65,"txnTime":1542394857},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"hywDqQdRthvVDSiUXgMueRW621soWAWgZeRFjyzxpvTMBDhxnc36P8PaWYnHsxXzVds57XAcQ3LKfEjZ1UyqvHJ"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"056b23376851dc03079a1c3fea1ec6a37d60d976cef577cb1534bfa5f37509db","from":"bPTNiLzWPFHKr7mJGaump","reqId":1542638324609009633},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":66,"txnTime":1542638324},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"TN7Sx7qF9RSmaDcTiFKWzd","value":"4E1w4F5QcM5PxBYYrbJkTDPNwqNnfE9X1nLPVfbfBwFurF2F74GA6BRcPxVoiWsTRMCeWtgZWzHjYcictzv7B7nk"}]},"txn":{"data":{"data":{"alias":"dativa_validator","blskey":"3bYtYhVodD49a3bTK2bZzTAZqt284tKQ2vgXG2arqUyYJRhYnDouhAaQAM7fctC84NvQRG2p1UwVdcdUZPkau5wdJ6fKWwpGo1mM2firHhYtiSZcCAfAbPQhTSSKnsaMnUzacuPC1e81ytr3cXjPobaAg4jJA637N2MGwUWv665o7ae","blskey_pop":"Qm7nQt5HjnaLSpCobPxAH8JG67J6bstaKop2XCsnBELR8tJNm1BYkqTTsj5HVRwXBkMg2vexNQ51B29cp9tSK3zK7ddbhWh8C4cDHoDQgaCHNz61hQxxYMx37yraFLggPF9WCaUckAn4fFxEvLBMV3EdcBZoTecwGPt2g1WhBDjB3M","client_ip":"52.91.89.252","client_port":9799,"node_ip":"35.174.181.186","node_port":9700,"services":["VALIDATOR"]},"dest":"F15n4nPZcnzDJJMNSZK8yNaeodi1PjZyDs83r4KC75hy"},"metadata":{"digest":"58a1d4e0b24778694973e2ff21eca5b9bba33ffb6d918836e1f76b75d1eab56d","from":"TN7Sx7qF9RSmaDcTiFKWzd","reqId":1542652100358243716},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":67,"txnTime":1542652100},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"sYtD5iKjZF1A9rkkY8E2AeHk4B5y81jWiY2BZEsLYy3s4HNQo9YKy5K6X9k1LbscodpMhC4VL4gZ4L7Y9YgvFBs"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":[]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"afa88dd032669c15cf2fb1d7f5d921c2325d2d721b6adffc20df7c8e094d4b91","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1542679993748339893},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":68,"txnTime":1542679994},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"TN7Sx7qF9RSmaDcTiFKWzd","value":"CRk8NSxyvawVi7LUhDdLgN22L5ZEqMpW5yUqVd9ri623VujthBNW6RWaQEagEJqzj9LtwWG3cRYMZzZ8tW8PFpf"}]},"txn":{"data":{"data":{"alias":"dativa_validator","blskey":"3bYtYhVodD49a3bTK2bZzTAZqt284tKQ2vgXG2arqUyYJRhYnDouhAaQAM7fctC84NvQRG2p1UwVdcdUZPkau5wdJ6fKWwpGo1mM2firHhYtiSZcCAfAbPQhTSSKnsaMnUzacuPC1e81ytr3cXjPobaAg4jJA637N2MGwUWv665o7ae","blskey_pop":"Qm7nQt5HjnaLSpCobPxAH8JG67J6bstaKop2XCsnBELR8tJNm1BYkqTTsj5HVRwXBkMg2vexNQ51B29cp9tSK3zK7ddbhWh8C4cDHoDQgaCHNz61hQxxYMx37yraFLggPF9WCaUckAn4fFxEvLBMV3EdcBZoTecwGPt2g1WhBDjB3M","client_ip":"35.174.181.186","client_port":9799,"node_ip":"35.174.181.186","node_port":9700,"services":["VALIDATOR"]},"dest":"F15n4nPZcnzDJJMNSZK8yNaeodi1PjZyDs83r4KC75hy"},"metadata":{"digest":"c52795b715a91b80167eecf727e15be08c7ea405b32be84ebded577f2bca7dd3","from":"TN7Sx7qF9RSmaDcTiFKWzd","reqId":1542737602414121779},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":69,"txnTime":1542737602},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KvGE2tKSDuBXEkRc86dL4T","value":"57mY4UHLprb4EdgPpnNBiermToDVqkLzJxso2bbsfo4GXomLHssQqjZrZvS1vgDjLgGGKLFpGZJeaKvXyLk1JUNy"}]},"txn":{"data":{"data":{"alias":"trusted_you","services":["VALIDATOR"]},"dest":"7wetNy5AJpHfXvhTx4okZokSw5mcrgWgVZ8jJ3WHgrmd"},"metadata":{"digest":"00477bfb2052242abbb95063d98b5acd1d3ab76e7d1519734e54b07aad6b9e99","from":"KvGE2tKSDuBXEkRc86dL4T","reqId":1542751929819744539},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":70,"txnTime":1542751929},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KvGE2tKSDuBXEkRc86dL4T","value":"td4qZQbCgAxg5jWNUEj5ySAvjN2W2cdywcpYhwrAcyu5H5EbyuyNXDJXLzgCRuTLoNUcKJY1z6GbrFa1rb3c9yU"}]},"txn":{"data":{"data":{"alias":"trusted_you","services":["VALIDATOR"]},"dest":"7wetNy5AJpHfXvhTx4okZokSw5mcrgWgVZ8jJ3WHgrmd"},"metadata":{"digest":"74436d978077d1b2a7325604b305ba71776432f078ae4f0685cd29780466fccd","from":"KvGE2tKSDuBXEkRc86dL4T","reqId":1542754098893802328},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":71,"txnTime":1542754099},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"2odhsxVn68qbBkYcaUWzFpk4KNtrUSh3QM6duqfGwBWN3CPbBYRFfvcYFiQqYZUazipKsWvqHvDsh27iycAadosq"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"a06031660b32d4a6dff612a466d0dad7f0563ac58ca06b2bd11c0f767e0ea25e","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1542820256271098712},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":72,"txnTime":1542820256},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"TN7Sx7qF9RSmaDcTiFKWzd","value":"8ubefkYZGbM2F9KeYYhGowKLi27dhss6S8bp8MiirdicFdCZ4PA5qGejbkQhuDfbbRkfxS8ZzreRAg56rkVE5vK"}]},"txn":{"data":{"data":{"alias":"dativa_validator","blskey":"3bYtYhVodD49a3bTK2bZzTAZqt284tKQ2vgXG2arqUyYJRhYnDouhAaQAM7fctC84NvQRG2p1UwVdcdUZPkau5wdJ6fKWwpGo1mM2firHhYtiSZcCAfAbPQhTSSKnsaMnUzacuPC1e81ytr3cXjPobaAg4jJA637N2MGwUWv665o7ae","blskey_pop":"Qm7nQt5HjnaLSpCobPxAH8JG67J6bstaKop2XCsnBELR8tJNm1BYkqTTsj5HVRwXBkMg2vexNQ51B29cp9tSK3zK7ddbhWh8C4cDHoDQgaCHNz61hQxxYMx37yraFLggPF9WCaUckAn4fFxEvLBMV3EdcBZoTecwGPt2g1WhBDjB3M","client_ip":"52.91.89.252","client_port":9799,"node_ip":"35.174.181.186","node_port":9700,"services":["VALIDATOR"]},"dest":"F15n4nPZcnzDJJMNSZK8yNaeodi1PjZyDs83r4KC75hy"},"metadata":{"digest":"62a7363b27f1e10c215c8ac44b0a6d737fd60ad14c4357c6c954d90283f21aab","from":"TN7Sx7qF9RSmaDcTiFKWzd","reqId":1542651103246022659},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":73,"txnTime":1542820263},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5UWP2RqYa8zdejirm5hA7myhrr59jzik9koEjyosJ6U3uHU1ySrKnRsogkXb91sFb6t9Rs9XS7yF6r9wLgW2tQLR"}]},"txn":{"data":{"data":{"alias":"dativa_validator","services":[]},"dest":"F15n4nPZcnzDJJMNSZK8yNaeodi1PjZyDs83r4KC75hy"},"metadata":{"digest":"a6c82dd6a170a73014ce079ce53bcf505bfbee47363a3ea88097cd58f1d38030","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1543358290828986263},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":74,"txnTime":1543359213},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"SYQLd1z2fd6BCcSHsraFbU","value":"5ohoJwSwPD3pGuXhMdvEcYUK3rPPa3HT5SyAgbd4SmHmA1Tgf5zdHef9mNDwR7AKEEgEkUGKNzjAKGTots5oeanF"}]},"txn":{"data":{"data":{"alias":"SovrinNode","blskey":"4ATbikmEcsPinBFgzWk3zKr1HPBg2Qyh4B6dEkR3U8oSauZGJakaHZMDx9LhrmajC5MdSURcLHJig8jqAAvJSkjk2kbpW9m97oWo8jPNw6cDv3bLxmhnkteCrfVvPokbeL4WyFbGZx5VLLrmtzsxodHrEhm6jkZcAhxcA29EzFPKm31","blskey_pop":"RYPJaQyeF6Xjk8jVDbF4gpKdRajTyhDG6VjZeWg93QEMDsWKmTu6CMFQ9SSf4Ao58jySP2Z1LSgKjvW6uJuVm5ZA29Rsdpv7i5y9XktMw14Pa4XH2YJWbpqvZZgteYBbUsFReF3FiSmaHX3JBo7WGWoVmLATxvSxBtPfKKTB2f3KtT","client_ip":"3.16.198.41","client_port":9702,"node_ip":"3.17.50.10","node_port":9701,"services":["VALIDATOR"]},"dest":"GfczFDBo6wCK7bwZA2dtTmEf5xGzZEDeELMP34bS9y1B"},"metadata":{"digest":"2d22f985e30f12bbd0af7dc89be3b82d7254762a212ea865a570063be3a9190c","from":"SYQLd1z2fd6BCcSHsraFbU","reqId":1543447274763531000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":75,"txnTime":1543447275},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"4NFboPNaWijRoMcgQkQFivTjjXaBeDzhQAa93MbAfHp8myBJ1fGnnrnLfyoBMQA1wZhSiAXyeuMiiG8rRhVjbNam"}]},"txn":{"data":{"data":{"alias":"dativa_validator","services":["VALIDATOR"]},"dest":"F15n4nPZcnzDJJMNSZK8yNaeodi1PjZyDs83r4KC75hy"},"metadata":{"digest":"71434b20259474ab9aee98e999a0818e8ac2872043cf5ae9945b307431ce6fbc","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1543513967433499896},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":76,"txnTime":1543513967},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"TN7Sx7qF9RSmaDcTiFKWzd","value":"qJLHVvfJiNEexfo7rwxXuNGqhhas1CFY5hxQBrh21dn6oEybkFy41pNVvhU2Qb4eW3j5VyBE65nnFqYi8k6JRRZ"}]},"txn":{"data":{"data":{"alias":"dativa_validator","blskey":"3bYtYhVodD49a3bTK2bZzTAZqt284tKQ2vgXG2arqUyYJRhYnDouhAaQAM7fctC84NvQRG2p1UwVdcdUZPkau5wdJ6fKWwpGo1mM2firHhYtiSZcCAfAbPQhTSSKnsaMnUzacuPC1e81ytr3cXjPobaAg4jJA637N2MGwUWv665o7ae","blskey_pop":"Qm7nQt5HjnaLSpCobPxAH8JG67J6bstaKop2XCsnBELR8tJNm1BYkqTTsj5HVRwXBkMg2vexNQ51B29cp9tSK3zK7ddbhWh8C4cDHoDQgaCHNz61hQxxYMx37yraFLggPF9WCaUckAn4fFxEvLBMV3EdcBZoTecwGPt2g1WhBDjB3M","client_ip":"100.24.186.243","client_port":9799,"node_ip":"35.174.181.186","node_port":9700,"services":["VALIDATOR"]},"dest":"F15n4nPZcnzDJJMNSZK8yNaeodi1PjZyDs83r4KC75hy"},"metadata":{"digest":"47ef7d8fa8fe23a6609710042b27ed83e8ee4520e7c51698ee04419c7b7b0daa","from":"TN7Sx7qF9RSmaDcTiFKWzd","reqId":1543514771626991925},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":77,"txnTime":1543514771},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"326qebvjJFB9dBhhM26n6nqRm1DrjDATdY8JR8r6Wr4snfrmBpasSZATrUarQzAzu3AdZia67zwQsmoepwfRRo7y"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.138","client_port":9702,"node_ip":"169.60.4.138","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"45bf4a0c9d8267ed8cfb37933cdf50ed3eaf23f7bcad6681a65cf55fd0120de0","from":"BD95LAmfVrD3JEwaereykM","reqId":1543518036999212000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":78,"txnTime":1543518052},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"2kHqvEXmgiRcPghcNdGGphFZJdBj4g5CXNsDQkFx15FAprGvmt5DbDC1N4FZQCd7Gi4LzSAn4cQ5eoKsnBmn5UnL"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.138","client_port":9702,"node_ip":"169.60.4.139","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"933101316c883ce1ade5c0fd93e226448fc88f38d858788be4986596f7b9be38","from":"BD95LAmfVrD3JEwaereykM","reqId":1543519064797689800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":79,"txnTime":1543519080},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"zPAr7xh7rcMYkAh3Vd73TFAoX45mtU3eaP57Ke6JPcv6ppMr4iYpafyB1X2DAB5sQsBRn2MVC1BJrfcwdCrDG1U"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.138","client_port":9702,"node_ip":"169.60.4.138","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"2dcd0cac5e059298e5cdfa8cf0081c95b33a6d9a09086909eff9d7b91f05e23a","from":"BD95LAmfVrD3JEwaereykM","reqId":1543519131380345700},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":80,"txnTime":1543519147},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"AWZpBgGbFFCobzuzsqdeZg","value":"35aYZ3mw5UyEZWjKRB6ciL1d3JqZaMmbWCdAp3TtoV5i1YkDN4nRV98bzPqdSeh5sX1atEifuNKSfEWkBVg4qMhW"}]},"txn":{"data":{"data":{"alias":"sparknz","blskey":"34cHakLPF7ZZtRjysMoXT2SFmaqWinh19y2orQ4BPncYsA2J5fkfhtd34jruhjbRWWLpTw92XgCsTrQPPSdUheyqqs2AFZ7QDwKESAxuukV7N6NwWQBEf7i8GTfJaL5vBqqJxDwDNH3j9oLdeMvtTjU8vrnWZLWb6TKjmzD8NrtwF6o","blskey_pop":"Qp3N5anCNnktZFVWpWJQHexcT18j66dXM5cSd6SAsn9uwMAxU8VxVLjDJrRmutVwbR81EzduJfVojMgPfDdHEPxEDFQKjG2EP6qTk7o7HRyts7kaSfkL1f8Dwk8f8tbU5gkaaLrAYGRkXSjnmMPJHXaj6zeeNQRatZJGeRMAG8o8fh","client_ip":"146.171.248.185","client_port":9701,"node_ip":"146.171.248.186","node_port":9701,"services":["VALIDATOR"]},"dest":"DdAqLDrkEW96hcVLsEtf8SrQnUGFK7uMLyHi775kYFVw"},"metadata":{"digest":"5d1e7deda854cda687afab5defd30a1e940eed638dbe7d3c57cb4e326891bd3c","from":"AWZpBgGbFFCobzuzsqdeZg","reqId":1543870622701863717},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":81,"txnTime":1543870623},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"31oppTng8a1BtbZDEo4LNQhF58AMjSvAznR94KxjQkA6BFJg2sgSwzVXWVbEhVL1H4RzaDPjfnHNPWztjDGTUYVX"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":[]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"2eb2a01dea5d319f834d1e7a06b8a07258e41f22d4f05422b12f9d5986bc34d5","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1544074481553187626},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":82,"txnTime":1544074482},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"41YVszp9VT9djZsVqswxQTnSRX7BEpv2M7QLvPn6rPUGStbDipB2rxwWxLCzFZRGyNQKRvUi42R2KHrHPfU7Wic7"}]},"txn":{"data":{"data":{"alias":"vnode1","services":[]},"dest":"9Aj2LjQ2fwszJRSdZqg53q5e6ayScmtpeZyPGgKDswT8"},"metadata":{"digest":"a4f609e0cbf8747f759a746909dbf1e3c9248db7552685ead0405ac72c9e8927","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1544074647137451532},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":83,"txnTime":1544074647},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"2KoQ12pS6MZA3ibexjZ2UqiTS4NiYvT79bwaxzS22cetgwDfqsmvsR7wWLuyXwkSU8HyX8X7NNK6xgfYPBN4mwMt"}]},"txn":{"data":{"data":{"alias":"vnode1","services":["VALIDATOR"]},"dest":"9Aj2LjQ2fwszJRSdZqg53q5e6ayScmtpeZyPGgKDswT8"},"metadata":{"digest":"92582f39703e76731d5698e5b73e19a8c1ba76f992f91932366607d707bb6a5f","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1544075270586069533},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":84,"txnTime":1544075271},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"32q6n5cXWTbbSafBxY1bS9yXopVjkL6esnq9RNPoWbGgNFRPntZFzZkZRpGf8g9WxJANYgHX5eWRcxtuAjVjuGMY"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"0ba8cb01d0926a2bc950883a1fe1994ac6f1ec3ceded488e0d00fc95f494bfc0","from":"bPTNiLzWPFHKr7mJGaump","reqId":1544110495269165919},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":85,"txnTime":1544110495},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KpBWkKc8yn3iWzjHDDmqBL","value":"5ZWLPJckDRWJc5TJrkpzyBxmsQQBEHfQhSvTKW6NSY2qVroijPMqVByf3tTAUXPfdQ4jGdTSWzS3E4YvvyqTaGf"}]},"txn":{"data":{"data":{"alias":"EBPI-validation-node","blskey":"4XiKTE8hX4d2WVxd85epKmN91wEz9knWXTrEu6Ug9RUb32zaQ4EC6KPmkVzPmE6QAigDaD9soYcKkUVxhzpTFSQuJbSCLUJuNpvDbdMznGw9YoX8n3bBM6bGgPxQzYfRtJGJ1JtWmhViHEF1FhyZxPYqHX1pUbUDd4yKzxJeEabMYDt","blskey_pop":"QkALSfgxL3p3fpswcYJhhaqzi6sYGQNErBSYjqVEuYkuYWPBvnFjNpCrw2GprHS8XcBzss2qeyTXpTRn4PPo3y4MFU61Jwbkbb4Du81Dwh7XUqjiWiV6HvHSdafaeX6P7cGdtcZZAFKsiUWxuosiaeXjk1y9T47ch1hEFSdoh6fBSo","client_ip":"185.242.244.69","client_port":9750,"node_ip":"185.242.244.69","node_port":9700,"services":["VALIDATOR"]},"dest":"j2JLXyTCAMuHSRqZ7eB2JCXSpPniDFUsyT5MJcGAjUG"},"metadata":{"digest":"7ac78f73c3c397596765d3a2b5afbf01096a051c7702d7e29e53573757912d3d","from":"KpBWkKc8yn3iWzjHDDmqBL","reqId":1544725436218772828},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":86,"txnTime":1544725436},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"3TmLPiQF71J954XuFXyPtFKpiECWTL52mCE9AABTCwsFMcx6rforPwsxVKvRjveEuJLv3uucY9ybPnoFfFxGgrKh"}]},"txn":{"data":{"data":{"alias":"EBPI-validation-node","services":[]},"dest":"j2JLXyTCAMuHSRqZ7eB2JCXSpPniDFUsyT5MJcGAjUG"},"metadata":{"digest":"c08be5f00f5976cd163f503430751494dad23d97b16a9c0835e717183039f081","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1544726215993081431},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":87,"txnTime":1544727345},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"5M3i1PbpvEQmTk25EmAY6N","value":"2RTUVnKLx3FGwBQofPD86z4KvgCpN4dbw6Xjvz7Ka9RYdZnydJZ3oE7pZr2Q6V1mZzGqPfAmnW2YEDqozk52THDt"}]},"txn":{"data":{"data":{"alias":"EBPI-validation-node","services":["VALIDATOR"]},"dest":"j2JLXyTCAMuHSRqZ7eB2JCXSpPniDFUsyT5MJcGAjUG"},"metadata":{"digest":"7f6a8dd88af17b623f0f8f28bff0f2188805f9f940b390d9b24b9c0f24956cb2","from":"5M3i1PbpvEQmTk25EmAY6N","reqId":1544733913396713000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":88,"txnTime":1544733914},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"5M3i1PbpvEQmTk25EmAY6N","value":"5hb9wbwvgaYCdwRYUAQvgHkUPzX6F6BhirapR2ni3BAYMGqT9irnJWVMciEdTGZj3rKY2ThAfVtNaMbSJnW6HCyc"}]},"txn":{"data":{"data":{"alias":"EBPI-validation-node","services":[]},"dest":"j2JLXyTCAMuHSRqZ7eB2JCXSpPniDFUsyT5MJcGAjUG"},"metadata":{"digest":"0f52e5c1d547772efd54bfd01d8ec1caa9ba6dce8ca9234ce977008835e4aa85","from":"5M3i1PbpvEQmTk25EmAY6N","reqId":1544734167152848000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":89,"txnTime":1544734168},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"bPTNiLzWPFHKr7mJGaump","value":"5SwN2QC6rG7iuQpwwgNccDRhfNBG3rbu8trV5UFnQwHAw8FG4UfhEMkMSk1XUouAqrzY8xZVxThTFgHBxUYyPURx"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"796c9b3f2b9f78bdd482763e0685e8d6b7f2764d4a3374c30b113a026dec6509","from":"bPTNiLzWPFHKr7mJGaump","reqId":1544781409602174729},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":90,"txnTime":1544781409},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"558b9TUNBbNFeGd7S5qW14uUYdx8tZzQP26UCMBuMbR1KXowJUPSebASQ5yMQWwTu3AoWwRUEH74en9wpMSLKo7P"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":[]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"61352cdff0ee3db0e06ddd2675b04a977efc2ff24ab099e6be4ea37c431f80b4","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1544812283315027137},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":91,"txnTime":1544812284},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"4xgBtM4FFMyfndQgbEb7wz","value":"3vBhqo64dvx2r86WuJKZuVfCtLD64FmWo3K1WY2wY1NYTZ7GZivqHjKi5ALCDyxmorD6U5yeMgFPgQCxCei69Ncx"}]},"txn":{"data":{"data":{"alias":"anonyome","blskey":"497qEgWR2PZx1ZUeCQBq2hTva16CkQZpVPtdG4o3tBFYRzXLQkvrEX7vyRrbov9LQQQriJfRdYZ41C8ju4BjPH77zF34diUeLxrtK1kMGoTdTHinLK1116XUW5GZpj7y7i3Aekxh69rDqZZbbd65JFrD2ZEJoNsHj8HydbVaAjm6wSa","blskey_pop":"QuNLxWz9jWEoFq3gh2DUbNZHBFiK26gQ66URFGGNNbd8WtKY9u8D94k2zL3P4K74Uzp6MmJPMJewAWuzVD7CQJCguzDPYMUtd57J1PX5VoJXp4ynmbDZhJQq4v393fU2YSLkhd6Fhci3nRovvyz3gPW4JbbtipzZGwp3VZPL1qZpf9","client_ip":"13.54.236.56","client_port":9744,"node_ip":"54.66.208.40","node_port":9733,"services":["VALIDATOR"]},"dest":"AM8oxRuxRyKvJoLRtAEBBPMXzpMqTtm9yQDenMkS76JQ"},"metadata":{"digest":"77ab8c07c8a525367353aae971bace52932b713b772dd57e9f6c6688942867d1","from":"4xgBtM4FFMyfndQgbEb7wz","reqId":1545088395580554723},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":92,"txnTime":1545088396},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"4xgBtM4FFMyfndQgbEb7wz","value":"5XCS6eP9z4jmSxCS4h3ai6vPJTaeNMNXttC2UyPFBinMEFQUtiZJFtCCPtY9Dx48wzN8JWuKPv8xnBqZhHb928Ey"}]},"txn":{"data":{"data":{"alias":"anonyome","blskey":"497qEgWR2PZx1ZUeCQBq2hTva16CkQZpVPtdG4o3tBFYRzXLQkvrEX7vyRrbov9LQQQriJfRdYZ41C8ju4BjPH77zF34diUeLxrtK1kMGoTdTHinLK1116XUW5GZpj7y7i3Aekxh69rDqZZbbd65JFrD2ZEJoNsHj8HydbVaAjm6wSa","blskey_pop":"QuNLxWz9jWEoFq3gh2DUbNZHBFiK26gQ66URFGGNNbd8WtKY9u8D94k2zL3P4K74Uzp6MmJPMJewAWuzVD7CQJCguzDPYMUtd57J1PX5VoJXp4ynmbDZhJQq4v393fU2YSLkhd6Fhci3nRovvyz3gPW4JbbtipzZGwp3VZPL1qZpf9","client_ip":"13.54.95.226","client_port":9744,"node_ip":"54.66.208.40","node_port":9733,"services":["VALIDATOR"]},"dest":"AM8oxRuxRyKvJoLRtAEBBPMXzpMqTtm9yQDenMkS76JQ"},"metadata":{"digest":"09742193d02bfd0a16e1a18f71e0cba235cd6872f018398f12945274f3117e65","from":"4xgBtM4FFMyfndQgbEb7wz","reqId":1545089703401067519},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":93,"txnTime":1545089703},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"e3SjQWaGqcQsq8EkBrCm7RTZUq6oB6LFF88w2gZ9h3xPES9AMioygTTYiRuLkgTtjLocHiYV1UjosX6ybGH7Y9F"}]},"txn":{"data":{"data":{"alias":"sovrin.sicpa.com","services":["VALIDATOR"]},"dest":"AcaN2zJ1vkQyEvmi2EyUMLzvzczQRvarNPjR2CbtNFAX"},"metadata":{"digest":"f9d4f83b612a218f58cb2aa50face3f7cb0ce488e6b37775d14f1ac85b68e6ce","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1545149889900994815},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":94,"txnTime":1545149890},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"5M3i1PbpvEQmTk25EmAY6N","value":"4ijAWFcxfZHB2M169arvZMudfZtwUEjpfhHVKsFDx9TzAVhEU8jwgj8ZXmVU2bFa3rLzBPTW3MrT43KyTCj6Y6Pu"}]},"txn":{"data":{"data":{"alias":"NodeTwinPeek","services":[]},"dest":"2bDviHYdDiTjyXYXEW92zQHEf1C1QsbFatJ6uSYuYrHh"},"metadata":{"digest":"b5f9a593b5368b30899793f12e4cec879b232c49746da332a53fe4c83cc94b41","from":"5M3i1PbpvEQmTk25EmAY6N","reqId":1546646026772409000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":95,"txnTime":1546646036},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"TK4JebQqeqq5t6x2bCwnD7","value":"2v25oRF7GET3wQZ7Q9TZqdMNVdaJAyR5rmsw3DGkyQkHw9HtyNHkq57EUV9K4Uf75gnyHhRQ9hxau2XJC6SNPa2C"}]},"txn":{"data":{"data":{"alias":"NodeTwinPeek","services":["VALIDATOR"]},"dest":"2bDviHYdDiTjyXYXEW92zQHEf1C1QsbFatJ6uSYuYrHh"},"metadata":{"digest":"f1402734f5bbc90db2dfa3db65d6cdc3ab839eadf13c1a7e16d769507e436696","from":"TK4JebQqeqq5t6x2bCwnD7","reqId":1546880167291826800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":96,"txnTime":1546880167},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"4RvNoSPKWa1whZRGjpGEq5UDKQUVd3h1m5aRr4xThoFyCR7D2HiszbPGRJH9hhD8V4Sh2cERksU85fyHpW1BUZDz"}]},"txn":{"data":{"data":{"alias":"ibmTest","services":[]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"d847f4140dbc101029081cd2abecc0f32465e310180917e12736d9f102dd2c6b","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1547489538349798313},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":97,"txnTime":1547489539},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5gCEwT2NHiUcuD53F6xW6vp6CnFabbk2kXoLLxfrUHqnjqMQDNwuSU6fm32aYFC2Z7KMjfs9jKfqPLEtwPFWASqi"}]},"txn":{"data":{"data":{"alias":"ibmTest","services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"e92c1fecf19b469d484bad7b3b2115b5e88df9c695afca551c5e1f3422f253f7","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1547497859538640883},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":98,"txnTime":1547497859},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"3Pcohi5dAcVz9k8hryvXn8x6ddGob5hWYzmHoeZdDi628Asc4Au1rmsMjZasvLPqj69MN1VfbE4kTC9oESUPbAeC"}]},"txn":{"data":{"data":{"alias":"ibmTest","client_ip":"169.60.4.139","client_port":9702,"node_ip":"169.60.4.139","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"56af49cfcb420ab39ecee2912fe3acaa2c0e9fcf4bc6dfdf783210cda55495eb","from":"BD95LAmfVrD3JEwaereykM","reqId":1547498794878924300},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":99,"txnTime":1547498795},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"46AVXqBesadhJLZvoRmcyPDDePE9Hi5DahjPC82fhw7irQnVXbvwNhqB7HXfCxtu8w8VifPhEcfihZcuNKBg995B"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.139","client_port":9702,"node_ip":"169.60.4.139","node_port":9701,"services":[]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"a1412abace57327ba53e022db6a977e198a6134fec1dc4a17050de981f165845","from":"BD95LAmfVrD3JEwaereykM","reqId":1547500122390156800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":100,"txnTime":1547500123},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"3yv5pLUCBnbC95FRb2qVrCtxRVBWB9ySRKkTxJ1M4pdTsXZPd3BHkDYTDqms9e3zPNtK5r8RQcg2ws6c5W4Nmy95"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.139","client_port":9702,"node_ip":"169.60.4.139","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"1f584ac4cc88cb57ad5d9005e4f5f17156b70aad80f302b642289e4840076f74","from":"BD95LAmfVrD3JEwaereykM","reqId":1547500156383195400},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":101,"txnTime":1547500157},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"3f1sTShBSY8s7axeGypUxfY8a4V19kYkkFPyGygGGveJ2KDNVSEtKJHbLQNkaxk1nJnKudWQGKzCS2AdjBG766rw"}]},"txn":{"data":{"data":{"alias":"ibmTest","services":[]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"03f65d7a7bc664f38199f4d34f6c8dd3fbeb5ad8744753b6a3f92def6d148ace","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1547500445740297593},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":102,"txnTime":1547500446},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"5zo62TywH6pZij5L3QU9zmjEmAf7czZDJnyF3zFHXhqcGfGYLWCeUuFqJ7bVMc8Bnfx2XxkYY4UtwZ6oz3HwrqdL"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.139","client_port":9702,"node_ip":"169.60.4.139","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"da6a5f92b960682e1c372ac18d3287e8a9db6e64cd5c07855a2cd95d5c13263b","from":"BD95LAmfVrD3JEwaereykM","reqId":1547500485921720200},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":103,"txnTime":1547500486},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"ftEtDcapN4TLHkeMDzvf4iQcrtAJvZx1VvvHnhDxqPxTcRVXWXLrQxNZWEjnjFet7ZNtsAQT6MmYHhZGztqrAVY"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.139","client_port":9702,"node_ip":"169.60.4.138","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"15e71658452369fb383b2887eb9c4bf3833a3df8e6c48138de55730e086c0e6e","from":"BD95LAmfVrD3JEwaereykM","reqId":1547501596782347800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":104,"txnTime":1547501597},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"7sTtbnHKD3zyosb1dFQAex","value":"23WRyTk9B2hPHXTMzFnjxJZZUhfsn9DLBbep5fEQqm6eTqYHiGrriTP9PbPLpVF1BHWsygVsVyr1jSQjr3VE6pKy"}]},"txn":{"data":{"data":{"alias":"regioit01","blskey":"RVjJZ8FJDMjFS6hTNVSXMx7S4BfQeX49CLTXvkHWvVQ4LRNBCsWAjwWFcDUzmdA2JA7hMRi9qvjh8vmPDahLeogJyWEByQFdJ4LnFo2NkDAfQwExHjLGXdawHPQjTduRrWYERpjwS9jFs3FXih6FcQRZb9mKrSW1tguSF7qGSdiNmV","blskey_pop":"R2v3TpVYmWpifxideMdW4EQo36w36VsppcDB44JNDxxCREiUZqrBj9RChgu6RRmHjj6SLchea5L515iadvA6STeQYh8tjMF87KH8s6RE5JAQagzX67X2fbpzai6A5Vq6w5wxLPJTKV4P9rkjxnH5Y6R1ReaVcKzZYk6j583WSUJZdZ","client_ip":"91.102.136.180","client_port":9700,"node_ip":"91.102.136.179","node_port":9701,"services":["VALIDATOR"]},"dest":"AQoViW7aucuvi8SC9QWur6u14ppmVvtMvduigy51NeCv"},"metadata":{"digest":"acd16644af0c402f1cce381e9dffcdd138d3d5098c54ac5c7d126be8b2923e50","from":"7sTtbnHKD3zyosb1dFQAex","reqId":1547571055916476853},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":105,"txnTime":1547571053},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"HS2VPUmJ1vJQHCjfH1w42H","value":"5htNrJWGu15CpxU7ocHYRkGQUygcaV41jcRmK9a1rvGoG59qWMJYpc4GvZeh2FttfobbxMZJfB57sggLhFS95y9S"}]},"txn":{"data":{"data":{"alias":"Absa","blskey":"31k6SUK7otXf9MXDgfGRb9N37z8xcZbdRmegNiK5k97sdfNvTSfKeEqSTxBqe7qqNa4ueYKDjW2MYgWBwYF1ohh5GzjUndykwttpffbkDGCrQAaUTJoBi9rJvrwCkkQeLKpoWTMkV6gYp1AiJkhKYiGhtCCAA3R5grGUpcMzDXqzt8R","blskey_pop":"QngATEwvD1MHDL4odeiMqg9AYp9emVmRDSQMeKwFXdtthR9x5tDvKrWFT1gZPECuaRWtEmQBQDzSxebiy5jZJ6DwNbP4EfLtKvHrmHUAVfXKvrzHJiwbeg56oXdyi84xsNLKKZrhhr8hEgpNN1F1FXHfJUDWNyMU3w81peiLLAkYrb","client_ip":"63.33.176.61","client_port":9702,"node_ip":"63.33.176.61","node_port":9701,"services":["VALIDATOR"]},"dest":"BUKQ26j7hqkW2bdQsoxHACyS1n7gCrHeYxLR4yaoWCr"},"metadata":{"digest":"31b150874511509e4ac355e37c9ce7f649fb12bc48a2cf9c591b0f390b076b67","from":"HS2VPUmJ1vJQHCjfH1w42H","reqId":1547574103955392127},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":106,"txnTime":1547574106},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"YTsBtQz1PgjHNNPsGa7i7i","value":"JJD9qYZF7z8nNqP2sAf1ER3HB9rH7FQBhPeVUjyaf3G9TsBUQCv3XVTgV9eGXke5tA7nmDHaQwhFhVDMfpZVq1E"}]},"txn":{"data":{"data":{"alias":"VALIDATOR1","blskey":"uSpMXhzYzgkShiEeWoSrKar8g2iCsg8KL9XaSSs9HNJt5MSCXKjPZtyHNN7KtuLi1ThxKZc8ZUUtjh9uz2ApXZU41PHLX4RsMEGdfMJf3FsPRP8RkodRtqXuxmTzKEvJJ4XihrgHCL85QBpBkmp2u7YioLqwhAxyDmFRLjFnHx4cwr","blskey_pop":"RHFFZHGBUFAkfYQr9nzn2FX2ZQn6u4FmRyfUTMC6DnVfBF7ogJz2oSS4vpi2MitFTwWCofZsB3g58wSPZA4PGAPR8KXjHQvEkB5MS3NDnAgjje1E8fX9XC41qhEJ1kdC68GtgTgJSJRfkmH9c3jjb8rhQskod6N8swtTpqwV4CGgoq","client_ip":"54.180.62.29","client_port":9798,"node_ip":"54.180.16.51","node_port":9799,"services":["VALIDATOR"]},"dest":"99UgWzvjVvhDHfd16V62VFdQEKn8Vk5fuMP2t1d6xx4w"},"metadata":{"digest":"d28d9fab163bd72cf7fbc254ca6b7b495101439870a064ceefd2b18f1d4417ad","from":"YTsBtQz1PgjHNNPsGa7i7i","reqId":1547599663946425568},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":107,"txnTime":1547599664},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KSZhtVyy7yQGxHLq8pxQwX","value":"2tHAgZ2A32YBJzLBWbXcCCfEYjRAfUeswRQQkrfttwk8Av1zvwHyfqQUfQKHKtTaQc1UeUjd7Z1axgEQf9LQqTCS"}]},"txn":{"data":{"data":{"alias":"swisscom","blskey":"2Y6bbfnx22jRKT6vDFq6kJayzqrU3N6hBGvqaepepgQHrC8KyfjwsnbAxr6NAySdFq81SopX5is2nc33d2Kei2jXGjktA7VgT3JPaSQxi6cb1UVKA3taVaqPXdbQvedkkGrgdGuHJgz2Tz5yZQertL2YiqUmKjPn78vSJWF3b6BXQ4B","blskey_pop":"QqARZRNUxwb9DWJW66DAifJNMCeWo2r3Mxy2HPrDEEiFvhba7FiSxQ8czJoVa2r58GwvT9Srvh2tifKUjMsnwt2o1GioMDpTS42MyENa6tvZuGnnsErVHekH5xccnGRe4zVLd3MAmzha8RDL5pMZeLzRw5rDpQLSnJQJKrQzqLho2X","client_ip":"164.128.162.43","client_port":9702,"node_ip":"164.128.162.42","node_port":9701,"services":["VALIDATOR"]},"dest":"58b3Fy45qjcBfVtEt2Zi1MgiRzX9PPmj68FwD143SuWQ"},"metadata":{"digest":"b582d138c5f92a84059eccae5c624392fc89899e02b559dfe5521b25230b10f6","from":"KSZhtVyy7yQGxHLq8pxQwX","reqId":1547651916293792395},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":108,"txnTime":1547651916},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KSZhtVyy7yQGxHLq8pxQwX","value":"2eF3euLofexGmoBY8BQutqNkPEGhWvomVQZK1PFs9iKRzUEkZPXAStxG8wuh59DRUcGTX3piZUQYPk6Cb7Dc3cCY"}]},"txn":{"data":{"data":{"alias":"swisscom","blskey":"2Y6bbfnx22jRKT6vDFq6kJayzqrU3N6hBGvqaepepgQHrC8KyfjwsnbAxr6NAySdFq81SopX5is2nc33d2Kei2jXGjktA7VgT3JPaSQxi6cb1UVKA3taVaqPXdbQvedkkGrgdGuHJgz2Tz5yZQertL2YiqUmKjPn78vSJWF3b6BXQ4B","blskey_pop":"QqARZRNUxwb9DWJW66DAifJNMCeWo2r3Mxy2HPrDEEiFvhba7FiSxQ8czJoVa2r58GwvT9Srvh2tifKUjMsnwt2o1GioMDpTS42MyENa6tvZuGnnsErVHekH5xccnGRe4zVLd3MAmzha8RDL5pMZeLzRw5rDpQLSnJQJKrQzqLho2X","client_ip":"164.128.162.42","client_port":9702,"node_ip":"164.128.162.43","node_port":9701,"services":["VALIDATOR"]},"dest":"58b3Fy45qjcBfVtEt2Zi1MgiRzX9PPmj68FwD143SuWQ"},"metadata":{"digest":"23c08c4db5ad3ca27e2fd38b3015525d3a76b41ba63c2fb82e2a15f67ca717fb","from":"KSZhtVyy7yQGxHLq8pxQwX","reqId":1547653252643574766},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":109,"txnTime":1547653252},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KSZhtVyy7yQGxHLq8pxQwX","value":"mUhTwVA6XGHF82XJj4eEa5xpaK6qCFF2bwLHsVt4pnfxdVxTMYHJBVHaQfbYALSuDQfdrgktLKv6Goo8PRzvANc"}]},"txn":{"data":{"data":{"alias":"swisscom","services":[]},"dest":"58b3Fy45qjcBfVtEt2Zi1MgiRzX9PPmj68FwD143SuWQ"},"metadata":{"digest":"60ac2ccf34f393880b544c5fab223e5daf36a5fd92565556d22d589be6d2d9d1","from":"KSZhtVyy7yQGxHLq8pxQwX","reqId":1547656208364157351},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":110,"txnTime":1547656208},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"24goM7gvgMmhYs7VSd4TJtmUinGTySwYiB59ViLvpbQ9WV4TJZr4R9q36wX7nKRwu9aPBXiJSiEU33ozREQd3SUt"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.139","client_port":9702,"node_ip":"169.60.4.139","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"2df2c048ffd27254d4abe5face1ca7984d058a819d791d15a11dfe6dc0885cb3","from":"BD95LAmfVrD3JEwaereykM","reqId":1547499944042787200},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":111,"txnTime":1547762408},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KSZhtVyy7yQGxHLq8pxQwX","value":"3dz2LU41uRHr4jByQMQPN8UNbTixsMWnRkCLFBGFLH91NsFkC4hYvTmS1fSqAZWmabMwNyXGWTgCVce2axC6R52M"}]},"txn":{"data":{"data":{"alias":"swisscom","blskey":"2Y6bbfnx22jRKT6vDFq6kJayzqrU3N6hBGvqaepepgQHrC8KyfjwsnbAxr6NAySdFq81SopX5is2nc33d2Kei2jXGjktA7VgT3JPaSQxi6cb1UVKA3taVaqPXdbQvedkkGrgdGuHJgz2Tz5yZQertL2YiqUmKjPn78vSJWF3b6BXQ4B","blskey_pop":"QqARZRNUxwb9DWJW66DAifJNMCeWo2r3Mxy2HPrDEEiFvhba7FiSxQ8czJoVa2r58GwvT9Srvh2tifKUjMsnwt2o1GioMDpTS42MyENa6tvZuGnnsErVHekH5xccnGRe4zVLd3MAmzha8RDL5pMZeLzRw5rDpQLSnJQJKrQzqLho2X","client_ip":"164.128.162.43","client_port":9702,"node_ip":"164.128.162.42","node_port":9701,"services":["VALIDATOR"]},"dest":"58b3Fy45qjcBfVtEt2Zi1MgiRzX9PPmj68FwD143SuWQ"},"metadata":{"digest":"a81375c6b2e43e5ed4d44d565901e33066d77785798ddd93ed2726bea6930c4f","from":"KSZhtVyy7yQGxHLq8pxQwX","reqId":1547652168940154534},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":112,"txnTime":1547762409},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"554joew9xsZWAuwzfgK5CvAgw3hapNcET6Z7qEnVXBNBe23c9TCeAWeRoM9GYDpEypkZcQFwiQcV3jRJXq3wiFPF"}]},"txn":{"data":{"data":{"alias":"swisscom","services":[]},"dest":"58b3Fy45qjcBfVtEt2Zi1MgiRzX9PPmj68FwD143SuWQ"},"metadata":{"digest":"0a4a47a4080c3899997cc6e71e78d1e3ffd675e13d95908c9a0b122f2dd0dc8d","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1548175587215323240},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":113,"txnTime":1548175587},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"nLE6kCvr6FwEBvZ8p6aw58DMwFSf7Q5CcEEyA17b4HHQMpZuYdwbpz5w2kuiSac4w9qRnPGB8ouLndmzMggFHi1"}]},"txn":{"data":{"data":{"alias":"EBPI-validation-node","services":["VALIDATOR"]},"dest":"j2JLXyTCAMuHSRqZ7eB2JCXSpPniDFUsyT5MJcGAjUG"},"metadata":{"digest":"03c6e7bb56d6a2870bc9cc7a8e3e4c226864faf1db51368047e9e92d38697138","from":"6feBTywcmJUriqqnGc1zSJ","reqId":1548184180516141458},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":114,"txnTime":1548184181},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"3pAYVxsFgE9u41tsucPUW4Jmy2LFQLKeNNiYcVi4MTm57GyheA5cVzbzLKq2wA4NABSd4EqLf2cCwmzZwUF2iAkE"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.138","client_port":9702,"node_ip":"169.60.4.138","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"be3db7c6f4526eaafece89054a366726ff34fb6d93943b847222fe5660454323","from":"BD95LAmfVrD3JEwaereykM","reqId":1548190805953640600},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":115,"txnTime":1548190806},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"2rn9DmGEeqU4V41MbGThxEuvdZ6qLHsVDeYqJDnpDayCWVhdxXERAfKokcxrXVHPA1Q2gyekZ3jMSuLaFua1jCwD"}]},"txn":{"data":{"data":{"alias":"ibmTest","blskey":"232Z7DQcjp5NPVZyzR6WWH9w9829F4NPBz87sx2LHZBnv2xntpaixyUc7J5hUtwnYgL7HyEZsf3Wgtdr5sGua7jhpJzixxtR2p4KoRZ48i62wA9Y5mJ4FmXBg3GxMwbegc2Nmqg33CGjB8cDGUZwR1jBERdZdsi3Y4CL9e9NsBqUu5C","blskey_pop":"RKL3Tji4ZKCsfBLaSAsnvDBn2TvmkkSSEKy2zDk467aXZFG4fpEV8t89w2FXGeU2vLHV1ppYpfefDoi1Qjgm7vxEPdEzys3ZxGJea9FXG78sQPurLF1XZtK1g6DV5L2YAyV3qC1pyGGibJvc5RNS6kdbihSwkpZnVRDwCr3Pk5DPiX","client_ip":"169.60.4.139","client_port":9702,"node_ip":"169.60.4.138","node_port":9701,"services":["VALIDATOR"]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"16bcd5c9ea536ed306bd414a3797076156c7e143ddcef630e95ee5b2a7d236d5","from":"BD95LAmfVrD3JEwaereykM","reqId":1548191738654080100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":116,"txnTime":1548191739},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"KSZhtVyy7yQGxHLq8pxQwX","value":"2SedyJRXPkF7yyCHkvEhGeyZ34W9MXrH5AVcFFgQJ4tbsWpF9gKvYL6gawbuvAE8W2FqkKoufWFf8kgxouaZV89v"}]},"txn":{"data":{"data":{"alias":"swisscom","client_ip":"127.0.0.3","client_port":9702,"node_ip":"127.0.0.3","node_port":9701},"dest":"58b3Fy45qjcBfVtEt2Zi1MgiRzX9PPmj68FwD143SuWQ"},"metadata":{"digest":"92c8ec4f3f0aaf806b18b74afb1e8e52d06d5096b9e0c3b3996af0dfc4bf627b","from":"KSZhtVyy7yQGxHLq8pxQwX","reqId":1548781193697645899},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":117,"txnTime":1548781193},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"HMT5rCkqvjcjZZHQFvQtsX","value":"5QNoTkHzevZ328EMXUTzWWveowZE1v4bfdhxaKfNGUvuUk4ympwnkzCPRFnz57xrvouC4A2rtd2T3vj4opCgQbMB"}]},"txn":{"data":{"data":{"alias":"Swisscom","blskey":"2Dys6A6wihGsazQLKe2hN8kHQ17u9Hix9pZ2uTBtuvMSLMaaWZrMnbXYoHcv7iDc58mGBnGEA335gXN8Y1Dntjd3YgeDYS7ffpxGHDuvMzuRpD2iktMCzUCRmsSMim32vURLkPTHs8Pg2fgg4vGcsmAeGk4tFVaCVC6gASgNU9JqDKX","blskey_pop":"RZ31hdcUW3zcD2XMTqvazNcX2YxwY4HSWah9tDzTW6A7G2uhzVoy9UTqzdrGHgZ183VoNKw1EeZvB6kRZYFLckwnW8pKT7r1GS4gUPPcnQxAtogy2bMnQQ8S4ZY5e7WYn2URJ2GF1TSGnzUzqu4iQZWiMeFsBc1CVH98A9PGmYQ3z7","client_ip":"164.128.162.43","client_port":9702,"node_ip":"164.128.162.42","node_port":9701,"services":["VALIDATOR"]},"dest":"B3x2KTn46sZmajraNm9oh6EUWnZWC5yQTrJAUifwDWRV"},"metadata":{"digest":"0ad6663c3841906ffafd51a467d7c43480d912551fbd98e9cd415e1571344455","from":"HMT5rCkqvjcjZZHQFvQtsX","reqId":1548781315218601114},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":118,"txnTime":1548781315},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"G4tfohtFDtmQJAEg6Pwgg6","value":"3oR6cXp4AbetwhgHacWjnF7LhnS8q8kVzA4nqvsvvxKzDEbiFSEF4UEU5BFiiAxtXg9nm6xk5X496v6JHETYdYjU"}]},"txn":{"data":{"data":{"alias":"NECValidator","blskey":"4UVe2Ryi4oPiECy8jxEHrXbNKbyjBjADotdD7ibRfpkfHjkD7UnBVcJKq8NFFf3rmGb8G3i7hGvZw8dUyQvcx67uAKNvYA3QMc3AL77aFNXHjiU5HdEBhwvq9qjs3BWZGoPyRfxun7EjMohiHvGTiZUxAzZD3R8qpaYaJ7DUdC3k24Y","blskey_pop":"QkN8FyGfub1yoMMzHhDBdrRyfKyrqX8kuiA6dXfAM3ghMGq1wWGbA8VuuCf4eWtxZvaD8iz9shC5zJn2C6pzo3BpmmP2bufsAGVWcNhTqxKPfXHds2JC4DagX7BV5mDfTriv4mF4EJD8PbwVgGvHzGFj4FuGTx3BnA9oay3rGxf1m9","client_ip":"52.69.239.67","client_port":9702,"node_ip":"13.230.94.222","node_port":9701,"services":["VALIDATOR"]},"dest":"BLu5t8JVbpHrRrocSx1HtMqJC8xruDLisaYZMZverkBs"},"metadata":{"digest":"3e03ca15f515f8fce2287600d02ef5dee412bc2874b836b8a5831ef9cb526701","from":"G4tfohtFDtmQJAEg6Pwgg6","reqId":1548808410060957151},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":119,"txnTime":1548808410},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"Kv2YdE5KGgdruMGW6p5w4b","value":"2Fm6QXXRYDhh34H7xRYFxHJQyHymyimPBJotwKzGUWJBGEcWPdYUhUFk2VDp9JyYhkapDchyhtS7VxjvQnHc6yR1"}]},"txn":{"data":{"data":{"alias":"xsvalidatorec2irl","services":[]},"dest":"DXn8PUYKZZkq8gC7CZ2PqwECzUs2bpxYiA5TWgoYARa7"},"metadata":{"digest":"e5b3e73768c7698aafa3a9679d2b91b58be5b6a4f7e5b9669c27838b94e3cd27","from":"Kv2YdE5KGgdruMGW6p5w4b","reqId":1551902688751838000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":120,"txnTime":1551902689},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"5M3i1PbpvEQmTk25EmAY6N","value":"5Rkz1NJxoU8rjaSeXHb77XrjD1Gedqm6ZxqN89YEtnajxztxcw5iKEBLnFg34in2ta2mkAdkLSBPEQbArPKFyG5f"}]},"txn":{"data":{"data":{"alias":"sparknz","services":[]},"dest":"DdAqLDrkEW96hcVLsEtf8SrQnUGFK7uMLyHi775kYFVw"},"metadata":{"digest":"34c208f6f214e973d926473b807e1220dd5f4167685101baa0fdde25da577054","from":"5M3i1PbpvEQmTk25EmAY6N","reqId":1551981105839004000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":121,"txnTime":1551981106},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"5M3i1PbpvEQmTk25EmAY6N","value":"29EBhTyCNsXJ9rruhPUfY5DLoXW5JiyZy7eGNxZ649sYefMZmJdpf8dnd2LxkCNswD9oGWPXbiRZbGfCEXc35Zkf"}]},"txn":{"data":{"data":{"alias":"vnode1","services":[]},"dest":"9Aj2LjQ2fwszJRSdZqg53q5e6ayScmtpeZyPGgKDswT8"},"metadata":{"digest":"df690f4b4bd3897bbd321563ef5fbf4fdaba2b095546b19d5cc7840f309871a4","from":"5M3i1PbpvEQmTk25EmAY6N","reqId":1552398621045487000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":122,"txnTime":1552398621},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"HS2VPUmJ1vJQHCjfH1w42H","value":"58FmzCHRRYsiyFE1NQht7Y6n5LLNMmxdVQkBnfBrpmmWHjgLWWjxSK3BwsJW1e2BHhoajGRBZdCSpMHPvwKDuXtU"}]},"txn":{"data":{"data":{"alias":"Absa","client_ip":"99.80.22.248","client_port":9702,"node_ip":"63.33.176.61","node_port":9701,"services":["VALIDATOR"]},"dest":"BUKQ26j7hqkW2bdQsoxHACyS1n7gCrHeYxLR4yaoWCr"},"metadata":{"digest":"96a1552ad574113e94baac125f9032c97e0a60abb5498ac43d2a12a85c0460fb","from":"HS2VPUmJ1vJQHCjfH1w42H","reqId":1552408626878108613},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":123,"txnTime":1552476998},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"BD95LAmfVrD3JEwaereykM","value":"4GCt8VdmfVFJtufoKD6HJBiiQTR6ujiK4bLn2NmdcQucKQNKD3Jr3McMAkwqnjDcduDdQW6AURLeSDyFBDqzZTfv"}]},"txn":{"data":{"data":{"alias":"ibmTest","services":[]},"dest":"7mcctKwaBjyzAbNPS8ix1LTNxex4JchkyLvjYfw2XexR"},"metadata":{"digest":"29a7d65b74832fc91178e60089521bf0212b48a05d7fc35be8841eeda8dc8f88","from":"BD95LAmfVrD3JEwaereykM","reqId":1552662332849012735},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":124,"txnTime":1552662333},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"c5GFhSHNMdaqjSyzQeaMa","value":"2ZSByqsx5w6rpQm6FbKt1scnUUu1VSbbwXBMoKcDCkyrdsm9yrgAKsR8myTW1z4EFt91zAFUJPoUaHnAd6oyBgin"}]},"txn":{"data":{"data":{"alias":"cynjanode","blskey":"4oMnfEbqH5fuLGQQSWLZA7L1y8D4zL232t6QiJhspA5GsKJAextNa3oyr1MK46byzax4EmyoyS74YkLD5ri6dJmRXFnKPZ9E4q8UTWFBRdmpwGiZXni9HXL8twBHhfnNE8vXirQLvzQ2gcSBRzdGHanPBwKnvqjoeNGfDfM1kT22pks","blskey_pop":"RFvdDmi1a8b1VYA8eRtTs9cC2dmhK8b2P7k9VWcPpPKwupyTQr2amdbq4GcbASyML6RXxAvZRuj2EJH3KabkT3hVPM8g1Wn1VYY2761pwCjcHfN1E2G2Nwe5sdwRqxvV965aYi9595SBVWWabx6bcJ9S5EDqKevrUnZ9nsG7xfoWEB","client_ip":"3.17.103.221","client_port":9702,"node_ip":"3.17.215.226","node_port":9701,"services":["VALIDATOR"]},"dest":"C8H9SzkM6NrfYB1jD6dMCmdBKXvcCgGZpvwD47xGdJFQ"},"metadata":{"digest":"eac8e6015ba1eb3f1b294f9c53e54bc79d27b0a690ab358bd826668999f9cc4a","from":"c5GFhSHNMdaqjSyzQeaMa","reqId":1552676534057365965},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":125,"txnTime":1552676534},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6aAJEoijPh3yqeDe9JCqRg","value":"2QzZSa4ComF5hNzGYp2KxtrAu57tstBk7jZrhv6CK95C36KL3Naif5hPJ2egD4ANjAo7VDyaSFks8fANFjFYTowH"}]},"txn":{"data":{"data":{"alias":"DigiCert-Node","blskey":"34ZnAnof88aahn2jShZqUPyvWXjM4pdjBukbH44BXAyZGcY2rivuMLHwCPZGGRf7JAVx6zGdnQiFziqwj8ndtGghht67H2DqHhoxxeCvgxv5aMAVW57z8ekGyMQXq1UWYEYgjFqY2Fi9bCTkGb4ywn4JEFvnfk3aEhVS92CpG5eYQHs","blskey_pop":"R5ksJ4cADE265315njhARQJS3eEqC4bBFjz6sW49Lc7cF814pMdKk4AjjHLCvKeViU6EP8YvhvpiuMhEYzmabsMnj7oesJGp6eqxkjSabFZ7LWk5wzfBW53fSAtBrK4KSGzAfU9zsmsNqBMuK1fiC7J1emxjaZfeXWkBV63dD36i95","client_ip":"63.33.233.212","client_port":9702,"node_ip":"34.250.128.221","node_port":9701,"services":["VALIDATOR"]},"dest":"5mYsynpwzx3muLWYP5ZmqWK8oZtP5k7xj5w85NDKJSM6"},"metadata":{"digest":"c4b76246a7000c018f70776f56accb4667a00eaab83933246b218f5cf4234fb2","from":"6aAJEoijPh3yqeDe9JCqRg","reqId":1553027997718160009},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":126,"txnTime":1553027997},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6aAJEoijPh3yqeDe9JCqRg","value":"2KPdokKdhFMouCFG2xFUmPpwhUSUzte5CdjykDd4YE1BdjZ8UuHsW7d7CLiLrcUkLxyFfKKZNHPZaLhTHjoSqTvF"}]},"txn":{"data":{"data":{"alias":"DigiCert-Node","blskey":"34ZnAnof88aahn2jShZqUPyvWXjM4pdjBukbH44BXAyZGcY2rivuMLHwCPZGGRf7JAVx6zGdnQiFziqwj8ndtGghht67H2DqHhoxxeCvgxv5aMAVW57z8ekGyMQXq1UWYEYgjFqY2Fi9bCTkGb4ywn4JEFvnfk3aEhVS92CpG5eYQHs","blskey_pop":"R5ksJ4cADE265315njhARQJS3eEqC4bBFjz6sW49Lc7cF814pMdKk4AjjHLCvKeViU6EP8YvhvpiuMhEYzmabsMnj7oesJGp6eqxkjSabFZ7LWk5wzfBW53fSAtBrK4KSGzAfU9zsmsNqBMuK1fiC7J1emxjaZfeXWkBV63dD36i95","client_ip":"34.250.128.221","client_port":9702,"node_ip":"34.250.128.221","node_port":9701,"services":["VALIDATOR"]},"dest":"5mYsynpwzx3muLWYP5ZmqWK8oZtP5k7xj5w85NDKJSM6"},"metadata":{"digest":"f5597be009afc3b9decda1e09c8f8d74bd039ac6d6cb890051c88ebeffaa16e9","from":"6aAJEoijPh3yqeDe9JCqRg","reqId":1553030138803227716},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":127,"txnTime":1553030138},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"2v7MzY14jwoMvakDWybDyf3o977GWDT1rQMd5eCEnmTjXy5kvoH99zZJVWXJibDYLU137JbsxQkh59T1HD4kNBbS"}]},"txn":{"data":{"data":{"alias":"brazil","services":[]},"dest":"2MHGDD2XpRJohQzsXu4FAANcmdypfNdpcqRbqnhkQsCq"},"metadata":{"digest":"8bca858f90639c68074c2bb5cdec23a1763e3f58ad38d82c8ebcc0c229c72daa","from":"6feBTywcmJUriqqnGc1zSJ","payloadDigest":"a89394bc38773f420ee0fa62a7e4be466a668c996b1a956e173c8c62ad4ec8ff","reqId":1558034106037397876},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":128,"txnTime":1558034106},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"QVvkFcetzE4g22g4px1iHqEonHimSsFBh7XkCTmEeBqK7oaN4j3TCDB7BjTxZmGhovc2GWVxRswN65nvFygYn7E"}]},"txn":{"data":{"data":{"alias":"canada","services":[]},"dest":"8NZ6tbcPN2NVvf2fVhZWqU11XModNudhbe15JSctCXab"},"metadata":{"digest":"59a7f83dc11a5fbb89f21738665dde7818425cade9b27ff2c944879d48aa2890","from":"6feBTywcmJUriqqnGc1zSJ","payloadDigest":"b9597e20b484f700011436a6c8b768918519980f808928de56b24225165e86e1","reqId":1558034149584193019},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":129,"txnTime":1558034149},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"gc57GehP57PUUN59tGadDjdE7LAmrfseFCqb1DgYenmFF73cUAF25gkPJxuLiFpPV5CiFPjSoAa1JQhAGUz5MDk"}]},"txn":{"data":{"data":{"alias":"england","services":[]},"dest":"DNuLANU7f1QvW1esN3Sv9Eap9j14QuLiPeYzf28Nub4W"},"metadata":{"digest":"f59bb98e1be7576c6575a5abc4ac38edd28148d84605a62437aaf3151c962f69","from":"6feBTywcmJUriqqnGc1zSJ","payloadDigest":"fe0b9e5440ac37828d86daa77be8a55c2b52c89274763673db58d9317c2d1925","reqId":1558034190209122296},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":130,"txnTime":1558034190},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"kU4vKskb9iZEy7YfUQWt9cVrYpmXcqTpctKCLnZ4JsQ9DCEL9ESZ9waC8Jw6qFAW7gQfDgqkehmkFbD9jZSgsyf"}]},"txn":{"data":{"data":{"alias":"korea","services":[]},"dest":"HCNuqUoXuK9GXGd2EULPaiMso2pJnxR6fCZpmRYbc7vM"},"metadata":{"digest":"45a6090bbffa535b34b103f0f4209b039e66c05fad50013d30e8cb139510d627","from":"6feBTywcmJUriqqnGc1zSJ","payloadDigest":"5724525adf9d82d113b1f785c39c6a3a6f6ea92e06e9dbdb57740f4e1e8a3654","reqId":1558034231813907676},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":131,"txnTime":1558034232},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"5VB9ELm2QkWug8s29obUiSxq5tWi588wnYX5nXJEmm5ewoVR5NSTHQcg9q2nm1rcy2aesVsB77e5LLWpae7uqjkb"}]},"txn":{"data":{"data":{"alias":"singapore","services":[]},"dest":"Dh99uW8jSNRBiRQ4JEMpGmJYvzmF35E6ibnmAAf7tbk8"},"metadata":{"digest":"0fb35dbf7589f7acfa487aa1eed473299d1405ed2c656b50b15175e5487f4aa9","from":"6feBTywcmJUriqqnGc1zSJ","payloadDigest":"0359d686d0935df89d4b8fbad5b7264104f2eef898a93cc388e67188d71980e4","reqId":1558034282845794593},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":132,"txnTime":1558034283},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"2wMAYGVoSt3ZtU3CzcvhzMAQ2EFhZvPwBsGKqpNmWvKVWbFeyC6yMZxHCVdtj2fqfj36FJkvPKkh3gwmvvrt6eeW"}]},"txn":{"data":{"data":{"alias":"virginia","services":[]},"dest":"EoGRm7eRADtHJRThMCrBXMUM2FpPRML19tNxDAG8YTP8"},"metadata":{"digest":"4ee79b267e7a5aa9ca96ee667f75dadfafdf1238c2841d2d5fa28accf542331c","from":"6feBTywcmJUriqqnGc1zSJ","payloadDigest":"1b4afb24a5d19cf90eb41bb9c265610a6922c6e0aa59386dc3af2016988f4dc6","reqId":1558034311268528084},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":133,"txnTime":1558034311},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6feBTywcmJUriqqnGc1zSJ","value":"3QyhWLE53fg8wsNRFJijV6QKax2deCAzhUa1g152KYJ7exk1iqv6mLsHtY5KXNiXLg1a8vxQiFj8Hp8iRb7CXrCA"}]},"txn":{"data":{"data":{"alias":"RFCU","services":[]},"dest":"2B8bkZX3SvcBq3amP7aeATsSPz82RyyCJQbEjZpLgZLh"},"metadata":{"digest":"58c132bc0b8c96fb7628e8b7af9a9086ff2b2c894091090f88eb328ee945fe28","from":"6feBTywcmJUriqqnGc1zSJ","payloadDigest":"64b6882e3cbf71154369d91f9da431d069b465116dada6ba685928cd11c7b9e3","reqId":1558034435821210238},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":134,"txnTime":1558034436},"ver":"1"}'

const sharedQAPoolConfig =
  '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","client_ip":"54.233.136.74","client_port":9702,"node_ip":"54.233.136.74","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","client_ip":"13.228.112.216","client_port":9704,"node_ip":"13.228.112.216","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","client_ip":"13.54.146.111","client_port":9706,"node_ip":"13.54.146.111","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","client_ip":"13.113.117.92","client_port":9708,"node_ip":"13.113.117.92","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node5","blskey":"2JSLkTGhnG3ZzGoeuZufc7V1kF5wxHqTuSUbaudhwRJzsGZupNHs5igohLnsdcYG7kFj1JGC5aV2JuiJtDtHPKBeGw24ZmBJ44YYaqfCMi5ywNyP42aSjMkvjtHrGS7oVoFbP4aG4aRaKZL3UZbbGcnGTK5kfacmBNKdPSQDyXGCoxB","client_ip":"52.209.67.38","client_port":9710,"node_ip":"52.209.67.38","node_port":9709,"services":["VALIDATOR"]},"dest":"4SWokCJWJc69Tn74VvLS6t2G2ucvXqM9FDMsWJjmsUxe"},"metadata":{"from":"92PMXtzRGuTAhAK5xPbwqq"},"type":"0"},"txnMetadata":{"seqNo":5,"txnId":"5abef8bc27d85d53753c5b6ed0cd2e197998c21513a379bfcf44d9c7a73c3a7e"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node6","blskey":"3D5JAwAhjW5gik1ogKrnQaVrHY94e8E56iA5UifXjjYypMm2LifLiaRtgWJPiFA6uv2EiGy4MYByZ88Rmi8K3mUvb9TZeR9sdLBxsTdqrikeenac8ZVNkdCaFmGWcw8xVGqgv9cs574YDj7nuLHbJUDXN17J2fzQiD83iVQVQHW1RuU","client_ip":"35.170.106.44","client_port":9712,"node_ip":"35.170.106.44","node_port":9711,"services":["VALIDATOR"]},"dest":"Cv1Ehj43DDM5ttNBmC6VPpEfwXWwfGktHwjDJsTV5Fz8"},"metadata":{"from":"HaN1iLFgVfM31ssY4obfYN"},"type":"0"},"txnMetadata":{"seqNo":6,"txnId":"a23059dc16aaf4513f97ca91f272235e809f8bda8c40f6688b88615a2c318ff8"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node7","blskey":"4ahBpE7gVEhW2evVgS69EJeSyciwbbby67iQj4htsgdtCxxXsEHMS6oKVeEQvrBBgncHfAddQyTt7ZF1PcfMX1Gu3xsgnzBDcLzPBz6ZdoXwi3uDPEoDZHXeDp1AFj8cidhfBWzY1FfKZMvh1HYQX8zZWMw579pYs3SyNoWLNdsNd8Q","client_ip":"52.60.212.231","client_port":9714,"node_ip":"52.60.212.231","node_port":9713,"services":["VALIDATOR"]},"dest":"BM8dTooz5uykCbYSAAFwKNkYfT4koomBHsSWHTDtkjhW"},"metadata":{"from":"BgJMUfWjWZBDAsu251dtrF"},"type":"0"},"txnMetadata":{"seqNo":7,"txnId":"e5f11aa7ec7091ca6c31a826eec885da7fcaa47611d03fdc3562b48247f179cf"},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"QmpV3t8LXRohUGtbbUNSPS","value":"2ngykT3mB3kZ7GETB5RebCxrQ8vZLhbqDV2CZfCYCZtKrrT5pJZfLFevz2ccGaKNsZssipLXHHooRPbDGWFB4QYg"}]},"txn":{"data":{"data":{"alias":"Node8","blskey":"4ZaPVUjKWct8pQ3NJxC3GDA9LZqk8bPLaLmncBCPk33NbQnF1FyAvkkfj2Kmh1BbrJN6eXH6suGTvPFkrpSyLcmyp9CHJoiibdXi6mKEftNBbekepf7vzGvAmqgybzcPy1dqrykWyKVVQPQwmXXtGqNB2eafuwx8TECWakJHcJTA6AC","blskey_pop":"RSZ6uTEGrXkzRMFztZRQkFJCH13BJFZC7G5DqF8K7J5YoHYsdaTzSQqGDjKaUMcuRuiUsTUta8udcF31JFJpszNzqdxTUjy5fAVFd2h2U2xW6SiucjGKGP88uNnx4eWv28P4HpaCd7A3cPxfnWpnpCtywRguqFa4TRurYZK5eTW7XM","client_ip":"34.238.15.130","client_port":9702,"node_ip":"34.238.15.130","node_port":9701,"services":["VALIDATOR"]},"dest":"CJqRrPMjPec5wvHDoggvxYUk13fXDbya3Aopc4TiFkNr"},"metadata":{"digest":"628b6fbcdbc127a3794b8c961d32763f2fc920c93b7920f279c128975862e518","from":"QmpV3t8LXRohUGtbbUNSPS","reqId":1542827868665723500},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":8,"txnTime":1542827869},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"6xs4YBuyNrnBvj7vg9HNUr","value":"3x6tN4t4m2nixdWmE5qvQULmER9RoVnZg2bXicfRDc2wHyCqgQbDHkJrDkgCn3VKYvRiMk9UtdeJkegjV6hhLKDG"}]},"txn":{"data":{"data":{"alias":"Node9","blskey":"2ngTBQLDh78H3o7u7FpZMUgcpjuQ4brqh5v2bEj3Xs84GGVpnAbihmdQcsba8WNwrvBK6ScPa8kLLfKikZBmsVtFpPxPjD9rdT8YsGrSnYCkJARr2DKzyupKDqVncVY7ahg8Q1cDeqqgbdZwGnaAA1gSKNWjH2LRNaXF2dYh2Gjkrdo","blskey_pop":"Rbe2kBioQxNvxcbn46oe31AjDBdMMBjSgZfsN3jhfyK4r7512h815HKugx7ttr6z3AKCQmXJMz3EWPMKZMDe8Km1od1p2oiURNPjhT56jjKhkhGUzm91ndgUaM7MctGmdGJJC2R65uorvhNa7mckm76r3rvLW2ZGQd4f4YfavYsFDq","client_ip":"18.224.191.0","client_port":9702,"node_ip":"18.224.191.0","node_port":9701,"services":["VALIDATOR"]},"dest":"GYUibLwguJX5YcEYmy1xE45j6cbdnSjyJm9bKPiM163Z"},"metadata":{"digest":"87590b4f2b216a6ed736f20fdf9a8e56779f42cbc8f3245eea40520c0da36efc","from":"6xs4YBuyNrnBvj7vg9HNUr","reqId":1543289863693979300},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":9,"txnTime":1543289864},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"GwtdgzL34rGiAHSn1cUXCY","value":"5m1xNHPXLjjk3cbSRus1KDZWoXp34VwNin4qh7Wb1AnRVwfHgNuyzLrnMWuh59JDqjenwizpMy2xErx6W1UYArQq"}]},"txn":{"data":{"data":{"alias":"Node10","blskey":"CETPJiNq31ezYnoYt3eTZU16NnjjH4k3LsTRidC3rMueVc9Kh8MxfwD1wmUuZ11eNM8bVgxb6nnZc7m7RA8QyRbeQV4MErKAFjg7CfrtvAoXA5Cffg8izYKAqt8XGPuJFW1Eozuzuw9SMSHaLKeVWTJiSSAAWSsn7zBP43HVZ5EaH3","blskey_pop":"REr2qjuvUcJbYVhtoqgBpvAZPyELwRvsAsNhQHhhLbo522qekXN26pjHvbVkS65QgBc2pMJY1MU7fXybhomMAdgn3FzSYT3mA6h9XqqfcQ938Mfuh6BmEeLGvAKHx3rXYm6y2hvQR3a5oFM2qXdWyGyqvzafnbcscy33NTBbSihJMd","client_ip":"13.52.73.93","client_port":9702,"node_ip":"13.52.73.93","node_port":9701,"services":["VALIDATOR"]},"dest":"67NLWsr8dFJrL6cDWcZkDce4hoSSGPBesk2PzqvGqL1R"},"metadata":{"digest":"93706a626154f9ae86b711c9dcb79aff86998d7f30d616618ff61ffb515e0399","from":"GwtdgzL34rGiAHSn1cUXCY","reqId":1543290254852664000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":10,"txnTime":1543290255},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"7PEcPbkwef9hUT8jZmwnRz","value":"3Xag18UQotErgFz4JCDzFZyv4TYTXKeMtE9qHks7P7vyxYEj3K12zP4co9NudR3yeunpBBc6kETijmtfxiEaT9JJ"}]},"txn":{"data":{"data":{"alias":"Node11","blskey":"28jA1xmLrYafA6rkMnTCRY66pnCj852jiVdta22k5W3R5XpXAVsPFvLu4RuKqGB1kb1ZVJqUuLF33cTjRzwRfvkzH9TYa8YNbvSayxtNioJMA5fSAkYmApAMPqHxJKZRoDtQbQ57ZDNGuJUGa7sQhdWdEDZD112N9eCmQEkcepQDswF","blskey_pop":"RTZ3YMzzhsjeXkXieyhnvYdpLGBrEwcJWd3tDcX74EBTtghzW53DaVsYF4M5be6YBuLTGNiZkbzV7AhQ4gjtjsk8t6RFPPxxGtFxQMUNjPrRdJWwGrynTpRuk3vxWy1XKpmd5hEaauXNJdBLdj5cRFCae6WkqYTqbQN3kxpF3dd7cT","client_ip":"54.180.49.161","client_port":9702,"node_ip":"54.180.49.161","node_port":9701,"services":["VALIDATOR"]},"dest":"4UjwEpgGVqpyovAxFRVP5mn2S4m6UHq2CftzeE73YrNq"},"metadata":{"digest":"b6c1ac39457bb232677fbb304fefde98c34f84ffd2370758d64c8ec2d5972d68","from":"7PEcPbkwef9hUT8jZmwnRz","reqId":1543294395868969600},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":11,"txnTime":1543294396},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"Efzpr21uNx4VD1C5UEqxoV","value":"4hbngw6iR3YSqBuqvpmvMECEB89qvmhbnozUJkKsCbekWsJZLhNao9LdkR9B3zPqLzhGqJUYe6tnvGLGmSv6Dyf3"}]},"txn":{"data":{"data":{"alias":"Node12","blskey":"27bu6w4yZXBMBu856gm57MyUYRF9V5rdmL8dNYUFEag1vW7Fg5ztV8HPTqgv7vjGiAeBdy4kRjM8LDo24US2sPLLJMccytSEAx2fhc7K4bPCRB3sxajkWegPa4niK3JAErUGk5G5rZijSwRLjGBeLks2KkShQEM49aszbXbzFKdAfUN","blskey_pop":"RYLx6Bo8wwj34MfpDHRaT52mjzcMLs3nvQgqNLZTBgT4K2zki8L8ni54Xwo1sU1hW3FvM7WHpB3AAJaiTEmDXETaFNpfUDnCNtstGdqfyosd3EtJFajsBLZxdWSVWAgqrJA6LCMpKaLvkPftXZdWDuaQFp89wTfjf4YZoYpATdpV7V","client_ip":"18.136.83.231","client_port":9712,"node_ip":"18.136.83.231","node_port":9711,"services":["VALIDATOR"]},"dest":"HKambpRxdh8fZ4a79etxhgwJ7Ew3MhHUg9mwVZSkbd7L"},"metadata":{"digest":"bb9506365e30f079159773bc55eb98fd4fdd0f835eda7465df4ae7e99ed68feb","from":"Efzpr21uNx4VD1C5UEqxoV","reqId":1543294638619864400},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":12,"txnTime":1543294639},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"FyxBQZRYprrQB45NWnQDj1","value":"5BGpjf2WqiSzNt1ia7kFCz6RaCqrPLn8S5KfUs1yx63BbnUb7buWYZxkmk7hv7tR58Yv78o48Y4st9WmMgsGeYqG"}]},"txn":{"data":{"data":{"alias":"Node13","blskey":"2bPruo3UZ6jyN5mV2rv9DenrA9QTGPttfs4u7dfsCQyGJ5N6wkHhhKmQKZqmMsUffPoCDqu9wBNWLEk8gE9FPRqzbGDXRk7RCbD5ZQZfz7WGfyCHmLUFghP3kBiZtYwoUBU6wRdaBZthGU1mKuAEvVTPnxaWhq6XzNJaxMLueepJkgF","blskey_pop":"QroMzqvaFZj2frQFrJjkJ3gKQxHHroYukELFtAy3Dr5PpArZc4JZg97MhvpZgvYevb7azCNB1NSX7zu11PfmziSqifVhpg9uQwfB7modPkhbdWHDF1z8Toje9ZAub442bqTqgoCdA87tZWLQaG5hXRno3FKbuwkc7uZzmJZv4AoEFZ","client_ip":"52.60.238.62","client_port":9704,"node_ip":"52.60.238.62","node_port":9703,"services":["VALIDATOR"]},"dest":"46v1cgPa6XAHCNqAL7hEFXkUq9j6AgwusDwQyjJqFwKE"},"metadata":{"digest":"db196e7c2cabbc6004c75010cd1a0a108606aa8661c5b7c1cd664ac27737cc18","from":"FyxBQZRYprrQB45NWnQDj1","reqId":1543294841314659100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":13,"txnTime":1543294842},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"58pmdYYfd3G58wjRMG4FPm","value":"4MuzMKAaLCHkCR1WNkKLYSQejknJj9gYPsKoyygokEjeGHYRpMqN1nv2MkWFVUmYwmckyJk73uyNJS9nTcPWgvrL"}]},"txn":{"data":{"data":{"alias":"Node14","blskey":"FMhVSQEkvbVgstQg2gekqpzrJMaD3gzegZdA6vjDzw6RyFZeMUUCkUYG8qUxwya14Ms2vB47K7NYTHpG9LQB7KvAJ3ey6RZDpJ6K9DLPUhwJ7RcHtaLgd9mC5PGStaAxEz46m9Bm58Ud75sWTHfof1WSDrAUfzohugxCFmDn1UE5oU","blskey_pop":"RNz5dNsVeaT5iRnebPYunZHnTmD1nN6jtYrkBEKuUmgYTnxvFvGd4KrhKX32tcCN3MJWw1HcJBgeC8JKid5Dk3p3T37tw6iK1GtsN2db8z9ixtu4js7K7jnR621y7WzYprrgyj8bkR4fuypJG6FkfrEqv6zHseGPLiS44cFt9DSP3D","client_ip":"13.237.14.3","client_port":9702,"node_ip":"13.237.14.3","node_port":9701,"services":["VALIDATOR"]},"dest":"6vqRjEMeskmFHdXtv3a63wYBCpCv7X16dUtLd1Ae4sWw"},"metadata":{"digest":"1f7d8e3a3d04c3ea8a161d4920841e8839a537285566cd6f354f623aab847700","from":"58pmdYYfd3G58wjRMG4FPm","reqId":1543298755617891100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":14,"txnTime":1543298756},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"GvSwCzgUQ8dvk86KvXYsvc","value":"65Z9kix11Rgb3JbR4EG2q3QgZA9Z5cLPc5jWfes1RVa7EbrRAEFCwy6v6CfGyGUSNztn297vnHDdksTtMZ44CNB3"}]},"txn":{"data":{"data":{"alias":"Node15","blskey":"4eLWvCQaZu2neu1FsnyAB7Q2w6quuZ8LsHks5xMGS4gMkvrh2M1bDweEQjoUvSCoxwXd3boweRcUyJHuiRWor5WbGdHV7ZD9peahucPP8ob1qh3JM455KdNtEAMGdBaiyadRgUdjymbj439omgpbckBV96SmauTxeodjzTuWxzw2pSY","blskey_pop":"R1onYHWb5KAeMR5HmTBG2Yvx2C7uL5wY3hnpHv2yNe53Ege7ykwVTwJT1e47ECPJw6CVFoB7vw95evYeL6kXvSSNhWSNbqzAXFTQUTM2rtzPvWJhcjZNdzQxdqQY6vJX6kTyCGccDc7eC7WMTF5XP2bcbiDeXBSdGStFjEoZ1x1xDV","client_ip":"13.231.84.229","client_port":9702,"node_ip":"13.231.84.229","node_port":9701,"services":["VALIDATOR"]},"dest":"9kkmFVkidPcGuqobckwZUNbtFj5fCj1F9PEKa7m5URaP"},"metadata":{"digest":"a85775e0266af4a003ad701cc310d2d724001a22e8a47748c5a3e419d26b49ec","from":"GvSwCzgUQ8dvk86KvXYsvc","reqId":1543298878891367700},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":15,"txnTime":1543298879},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"SDMTQVvToPfj6b5S3ZFcM5","value":"622A6KMFu1xxRtJ3nW2rjuuCZgsLKF1dmQK7zrdqTidNHfDPWi3jRz7a14nr7kLcMgpCZVTiWQGPhtrDqwCAum4T"}]},"txn":{"data":{"data":{"alias":"Node16","blskey":"vH4SkBmUdrwwDkqnZZZbVCsvLDCAQbvdJhNBiNCeEhHHVooN8s9T6aa1ZaPLgcpegzFmsqfo6iFf2DeGHTjJ2Ud4K6bBhL4BnAzhz1yWvfwGwH3qXhN8GCSqCLM9X1TyqJkBDpY1NomA7SGFV1beagG5DGdPPSsf8NY3FYQWnLvzr2","blskey_pop":"R5Xu5ou8bNrGfbTQzhLAHyzzPZ3ehVGNvanPWz2ZhP4QmvwdmMApswdHSJcneuLxWE6WNKkt1WecDokBG8rz238Mq36GYxhDaPcFVtyDsN91saAbA8jwo3fLvtegrPnmC7QV54YonySR3SmXWb6asyE953X59DzPxN1fgKycGZ6J47","client_ip":"35.157.209.156","client_port":9702,"node_ip":"35.157.209.156","node_port":9701,"services":["VALIDATOR"]},"dest":"6AweMwDifg6mQqmcefwcFXkw3Hhb46a4Tr6Xw6jEWKpA"},"metadata":{"digest":"6968125353a29f1f9945b5d0e56118b598f399d8ab5ff19ccb39823e158a7c7f","from":"SDMTQVvToPfj6b5S3ZFcM5","reqId":1543298972762091400},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":16,"txnTime":1543298973},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"3fKZzZtHiMvjKFZqAxRAhoi7g4Fyg7BibjzL3ZV3pDHizr39BKVgDKn6YLwwPytLn6TuK6qUrJTrGkvaoWjg3kCx"}]},"txn":{"data":{"data":{"alias":"Node2","services":[]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"digest":"1ac34166456d3b4b005aac2685dc05e56499c8de76388b3c9e22982780ae2d8b","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543521347520573200},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":17,"txnTime":1543521348},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"4fkXouYVh4FoZMfLduYpHBdmiVwEMVj9oXkjpHNCDEbyyPnUUbVwHZaReRMhXZNXhaDAxwaTW4vYYyXfXofCe7a6"}]},"txn":{"data":{"data":{"alias":"Node3","services":[]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"digest":"a6f07cfe4cdcb58ff5776dd4f0b839047f1c8efe701443e30ded666046ed6e52","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543521448649793800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":18,"txnTime":1543521449},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"e11FkBtZLWaJRa4KZ2F74GAe6zE3W3zhXDzs9jriUR1rkmtvUV41J9KEo2hKmsy6oVtWJLSUCiGRj6jxnFkF6TJ"}]},"txn":{"data":{"data":{"alias":"Node5","services":[]},"dest":"4SWokCJWJc69Tn74VvLS6t2G2ucvXqM9FDMsWJjmsUxe"},"metadata":{"digest":"ba59f8d99d8d7d28252597d9c14f9e9406ac464ccc3f4b1c2bcc8d3d281d502a","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543525731348040900},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":19,"txnTime":1543525732},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"NCoAcWkBxxEjSRnZwS88m5AQFfdC1fuV4M65wW8VGbM8ni67QJdU9HudC8xZa2cumsEgKEdC3VKXmgXhe9bkgeD"}]},"txn":{"data":{"data":{"alias":"Node9","services":[]},"dest":"GYUibLwguJX5YcEYmy1xE45j6cbdnSjyJm9bKPiM163Z"},"metadata":{"digest":"ba0d86d1f8354de84435ee8e8491870a8549857275bdece854cdd3633d664848","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543526006636030400},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":20,"txnTime":1543526008},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5kd3Fksh6gKzCEuxmq3jABGMYc7je9hWBQy8Zet1UdAw2wTokksY5Y2JnUKG3zxbniMTKxqZFAawZLPztsAf6mET"}]},"txn":{"data":{"data":{"alias":"Node10","services":[]},"dest":"67NLWsr8dFJrL6cDWcZkDce4hoSSGPBesk2PzqvGqL1R"},"metadata":{"digest":"ebf12c11db4e723190958e8611cde8dd757f4891a327a25036947b1bc4ff8d84","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543526071372916700},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":21,"txnTime":1543526072},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5dVcCo6iGSsomCThsoz8Y4VkBmVU3pYZrxDkDPhgx9DvMhb6L799enic2rWonWdhKGWedtwqpJd53arLMiVJcvi4"}]},"txn":{"data":{"data":{"alias":"Node11","services":[]},"dest":"4UjwEpgGVqpyovAxFRVP5mn2S4m6UHq2CftzeE73YrNq"},"metadata":{"digest":"533ba5113ddea0225a295f9f414dff31a777f34ea28fed51ab052ef925a768e8","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543526126187279500},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":22,"txnTime":1543526127},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"J9kexRNFrCgH9SjEAhEwrfiXbcGBkFSwkWaoozrF2XVnLav9n9jn8vFSGqJLjDoKL7qKMYxT6Qrd1WEtCcaD9bk"}]},"txn":{"data":{"data":{"alias":"Node13","services":[]},"dest":"46v1cgPa6XAHCNqAL7hEFXkUq9j6AgwusDwQyjJqFwKE"},"metadata":{"digest":"b8de97d5bf7074cbfd7d13b738225f039e08975b37e57238b3e17b1515810bd9","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543526327235819900},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":23,"txnTime":1543526328},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5otsow8xyZtPUxYycmTEbeKV6V5JMFKT16QB4ujjJAFBh4dhivfgj8HkhtfeR4ii299DJcSYSh9qcGkgHqyiMTpJ"}]},"txn":{"data":{"data":{"alias":"Node15","services":[]},"dest":"9kkmFVkidPcGuqobckwZUNbtFj5fCj1F9PEKa7m5URaP"},"metadata":{"digest":"0d36370a3782a491a9e75c2d9ccd45aae7c3c86e2f59867be464823c4e8c48b9","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543526417492088000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":24,"txnTime":1543526419},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"uE3xqbu8Ppm9GKWNBW2w116fbdEc2vguXzocZAUjNmKWssTGyDf936CYGbcMDEo7FogtvL9LVA1wEKBPAtPWF5T"}]},"txn":{"data":{"data":{"alias":"Node16","services":[]},"dest":"6AweMwDifg6mQqmcefwcFXkw3Hhb46a4Tr6Xw6jEWKpA"},"metadata":{"digest":"410e4d0789b891e7bd303b1f9cb200bf7f76d99c22286a41d3cada3f96f5424b","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543526457139950800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":25,"txnTime":1543526458},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5vQFC1C7SDhgVu9CTkm8u7YPyq2DebbPwkiaWH1YWpZbiTkTBoD1QxQzU3ahDBen7KaaE6wKH7E3wUqVeen2wGxM"}]},"txn":{"data":{"data":{"alias":"Node2","services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"digest":"f134cff7d4f035c03dea976ae8acee1c1850c157ec8461fdc63591288d3b9e5f","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543594459416616100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":26,"txnTime":1543594461},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"2gpFmpDy7AZUmEjw4k1TbnxMvLKJ18Vj6LELpJ3UatKb9vgXB56PmJqXZqW91DzUEzDvoq9ad4cKboRp2GmzzYse"}]},"txn":{"data":{"data":{"alias":"Node3","services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"digest":"14f39a5260f107d0e780b46161d3ce08b8b0adcf3c57c494cc729369695ea543","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543594645916703100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":27,"txnTime":1543594648},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5BPK8ittb6sdWM3ubF11S4UBQiHBBqbdBJtC3i5W5v6FLyqyCm5WDwe3XXbR1UBBXCerpWZ1fiF8jGMwZ7AJ1MJs"}]},"txn":{"data":{"data":{"alias":"Node5","services":["VALIDATOR"]},"dest":"4SWokCJWJc69Tn74VvLS6t2G2ucvXqM9FDMsWJjmsUxe"},"metadata":{"digest":"1fd2981e10a2cdd858f49f8f33530d0195c1667d4b306092e942c2f87e559b43","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543594743690088700},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":28,"txnTime":1543594746},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5TaiLuPa17V9TLRovSbcEXdN94XRNeBBEikziHqbe658hxbwTnKbjkxZN9W9GFdfgCVGbEaMuJSKeHanMM6CWFHS"}]},"txn":{"data":{"data":{"alias":"Node9","services":["VALIDATOR"]},"dest":"GYUibLwguJX5YcEYmy1xE45j6cbdnSjyJm9bKPiM163Z"},"metadata":{"digest":"d5294ad3bf306292e75581b14781d04bcd19cab69798b7ea71fcdebbc176511e","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543594935087920800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":29,"txnTime":1543594937},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"2RUePE7TSakNbyh6zRAb78EsUSETsH9857Mm3K2UYkaKbtUqKvmftk3kADD4WvtSg7h1FcD4guhRhiF5FeBgzKfF"}]},"txn":{"data":{"data":{"alias":"Node10","services":["VALIDATOR"]},"dest":"67NLWsr8dFJrL6cDWcZkDce4hoSSGPBesk2PzqvGqL1R"},"metadata":{"digest":"6f223ae78c2c8498689ff998a992f43783140cb1e461e78a77cdd09e96c70344","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543615615144591100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":30,"txnTime":1543615615},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"3TyZrLo6B15dmYp53GrZt3JEuZ4Gf6DUTQiBiAo3A2vfJYW4nHG6pDWUqTeXrmozgZmGHpw5cEKLDDqo2VWaqm8F"}]},"txn":{"data":{"data":{"alias":"Node10","services":["VALIDATOR"]},"dest":"67NLWsr8dFJrL6cDWcZkDce4hoSSGPBesk2PzqvGqL1R"},"metadata":{"digest":"5b34ba267409e1e959e27e7a2cc7bc71170e36f55c0dd592837a3b01f91a5777","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543615651549110600},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":31,"txnTime":1543615652},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"2PkhJ6F8WnasEB24d2wPhBD1qSmm9bdA5aiZ8ucnNTvDCgm5GPoBw5r5xMnckEGiwZuBtwiyVP61MwEdPsXex1Sp"}]},"txn":{"data":{"data":{"alias":"Node11","services":["VALIDATOR"]},"dest":"4UjwEpgGVqpyovAxFRVP5mn2S4m6UHq2CftzeE73YrNq"},"metadata":{"digest":"1aa5bc0abebd22a1a4ded2bc3f05820bfcab1a1eb754afd2690fc7a23870d58d","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543615938251984600},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":32,"txnTime":1543615938},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"2pDthXpSnakGvvXf53Vfk11ry43i7NzomCvvXFtBRzTsScd7w8abUtwNq44cn8pNYRsX1PoT38zhUFmQukUpZp4q"}]},"txn":{"data":{"data":{"alias":"Node13","services":["VALIDATOR"]},"dest":"46v1cgPa6XAHCNqAL7hEFXkUq9j6AgwusDwQyjJqFwKE"},"metadata":{"digest":"7f94d9bca13b8d4c2b4299c42fb9d57e6a3e51c7273aa472ad64d6850ae25668","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543616158918994200},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":33,"txnTime":1543616159},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"4btfoQgmkMZMhQcsrWMV2GN2911FXTY4fsN8bqMDpDC9pKLX1qdFF3DKuhPc4uqbxv3fpq1UzavXELTRFhaYqqvz"}]},"txn":{"data":{"data":{"alias":"Node15","services":["VALIDATOR"]},"dest":"9kkmFVkidPcGuqobckwZUNbtFj5fCj1F9PEKa7m5URaP"},"metadata":{"digest":"ff3e4228a4c1ba78c48d008a86247b67c1a0f9e83f0b17996288f826a0bd8182","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543616278005815400},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":34,"txnTime":1543616278},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"3GeFBc7sCRcUK8iVvahWi2UoiXm6PftfumqrbtDyj3Swu5MYqt7ThBtURZRuubXCNFgs5xdbiG9bwucsNEuDvghz"}]},"txn":{"data":{"data":{"alias":"Node16","services":["VALIDATOR"]},"dest":"6AweMwDifg6mQqmcefwcFXkw3Hhb46a4Tr6Xw6jEWKpA"},"metadata":{"digest":"623281e5ae5d2ee32793123ef8b42b4c7881504eb5ce6a0fa7ffd058d787ddc0","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1543616311094645200},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":35,"txnTime":1543616311},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"QmpV3t8LXRohUGtbbUNSPS","value":"5UEmrCZBLuagFfVvW6TwMWnkLj6FFPefXcsbaaQoZMWb3rAUuC7ZYj7hWmrHTDBh5sgzW7rEz6pC5pQ69LdaxTLe"}]},"txn":{"data":{"data":{"alias":"Node8","client_ip":"34.225.165.217","client_port":9702,"node_ip":"34.225.165.217","node_port":9701,"services":["VALIDATOR"]},"dest":"CJqRrPMjPec5wvHDoggvxYUk13fXDbya3Aopc4TiFkNr"},"metadata":{"digest":"eee5240ae42ae79bcd59072c955ddac02ca198a8ee3a7422670e5a551a3aad32","from":"QmpV3t8LXRohUGtbbUNSPS","reqId":1544471809415021100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":36,"txnTime":1544471812},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"7PEcPbkwef9hUT8jZmwnRz","value":"4R4HH8VjKvfJqA98ZkUjLsssoTARKZx97QwzbjNKiD2KCo17JBMhh81EtmcHU5K8Phdp3PoS73apuLFEqZ3FsANJ"}]},"txn":{"data":{"data":{"alias":"Node11","client_ip":"13.124.117.203","client_port":9702,"node_ip":"13.124.117.203","node_port":9701,"services":["VALIDATOR"]},"dest":"4UjwEpgGVqpyovAxFRVP5mn2S4m6UHq2CftzeE73YrNq"},"metadata":{"digest":"f3d4bfda9061ab88d4c8d9c5854ed8f5a2d28d47b6a01c0ab7aea5ac91c15a96","from":"7PEcPbkwef9hUT8jZmwnRz","reqId":1544480018082506800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":37,"txnTime":1544480021},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"FyxBQZRYprrQB45NWnQDj1","value":"3xDenad5RNmVA4Sy7uPAH6cNmvH2A4N5okosz5sWyWu8Jgi9RijbG15zDKrmukxKFW992cVeKPDzUGaHN35dAgsB"}]},"txn":{"data":{"data":{"alias":"Node13","client_ip":"35.183.88.12","client_port":9704,"node_ip":"35.183.88.12","node_port":9703,"services":["VALIDATOR"]},"dest":"46v1cgPa6XAHCNqAL7hEFXkUq9j6AgwusDwQyjJqFwKE"},"metadata":{"digest":"d257ec1e8908daeea3bb2d8ae59284d2fcff55a06d6464ad101e692eeb0cc36a","from":"FyxBQZRYprrQB45NWnQDj1","reqId":1544480347265311500},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":38,"txnTime":1544480351},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"58pmdYYfd3G58wjRMG4FPm","value":"3PPp9UMpc8pFmxEDTYH9H5nEFvqXZ7wuuVtxwHtspMAmUKNd7NWWo6tcuyMs3yXxC9NkuMqp1HNd1V497Fn4z6MG"}]},"txn":{"data":{"data":{"alias":"Node14","client_ip":"13.237.14.2","client_port":9702,"node_ip":"13.237.14.2","node_port":9701,"services":["VALIDATOR"]},"dest":"6vqRjEMeskmFHdXtv3a63wYBCpCv7X16dUtLd1Ae4sWw"},"metadata":{"digest":"8f7ca9ae432e88e30e9f31ea64f9c6ae6f62c68d1df43b028bab66734035f42e","from":"58pmdYYfd3G58wjRMG4FPm","reqId":1544480576267118100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":39,"txnTime":1544480579},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"58pmdYYfd3G58wjRMG4FPm","value":"47bkst9rsgfzK96Rz2ZnsbojhgEC3iSyrh8HB2tGFVz97BUUPi9CFu2dJSCME1ck7fwYdGJu7cnhMn4mM9gN2Kxs"}]},"txn":{"data":{"data":{"alias":"Node14","client_ip":"13.237.14.1","client_port":9702,"node_ip":"13.237.14.1","node_port":9701,"services":["VALIDATOR"]},"dest":"6vqRjEMeskmFHdXtv3a63wYBCpCv7X16dUtLd1Ae4sWw"},"metadata":{"digest":"4d26c383d290fc46c740aa49f8a3a829297ee1a064972849dc884c50694abf8f","from":"58pmdYYfd3G58wjRMG4FPm","reqId":1544480601314428900},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":40,"txnTime":1544480605},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"58pmdYYfd3G58wjRMG4FPm","value":"VsD4rzwvkMYr4H2h8HFgshwVXtz4iVXR1JiHeFyhcpbR9URDayVVZFuzmjxKKPrf9nn5e2QEVDjNukVX1X63u2c"}]},"txn":{"data":{"data":{"alias":"Node14","client_ip":"13.237.14.3","client_port":9702,"node_ip":"13.237.14.3","node_port":9701,"services":["VALIDATOR"]},"dest":"6vqRjEMeskmFHdXtv3a63wYBCpCv7X16dUtLd1Ae4sWw"},"metadata":{"digest":"c6e270bb6f3c1d810450578a8db6575cae0831ec58c99dedc9e8ade965e3c9b7","from":"58pmdYYfd3G58wjRMG4FPm","reqId":1544480616475397700},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":41,"txnTime":1544480620},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"L42FuX7KUwdkNqoKoc5UFx","value":"64kW9LUSuuahnSoFdyEFxAFWtQWqKVAspySAuVB9TFEmZYu1UjYmbL6LjXmvH4S3AaCqw9iWTB3H5BAsT9PB5YHJ"}]},"txn":{"data":{"data":{"alias":"Node17","blskey":"33o9D3PaTM8xe33PejC5uqU2dbXrRHTarJkW7wacBKirVTXzJdpDRBTAwfdu5Mr6UfYnoAGyidcYUArSLfJ6HQQw7y9Sf4tKwuEY3nxd2FhiweoPezTkUDPwFWXcBaqS245btmGpEE34RzoQrChSvFv9CY6yeYbchC4w4tRydppUYZb","blskey_pop":"Qo7KAx4rqayFXeL73UVHyWpnTFs3EbC3ewtqkoXoUMCZf6FbqiwoNEu8mEUXFwodhcYAanCyV3hoaSWkcu6PVYf35gJ5zchEQeBfD7aULEXiNjVJCdnrJUuNswhH9HgcGhXqavtUEYvcthVss5cq9XDtnR2bBzFZZLFMY8UeMhfbM1","client_ip":"35.158.135.100","client_port":9702,"node_ip":"35.158.135.100","node_port":9701,"services":["VALIDATOR"]},"dest":"51tSHs2dWwTFyRrvnSEnmaw4b2pgSGJC7wvbVTD7uSan"},"metadata":{"digest":"c1eb94193a545dc9a26e3bc02511c3170b9e8694136ba85e8979f37c7d05f128","from":"L42FuX7KUwdkNqoKoc5UFx","reqId":1548975229243261100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":42,"txnTime":1548975230},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"L42FuX7KUwdkNqoKoc5UFx","value":"21MnZ3uNoWb1WfNfqzyr4Z6a3CGwu9Lvgv3PmWGFdkugxRKxDzFUCBxrDqXJXfkefc4mLQL5naEcDjmEQnNCDrMi"}]},"txn":{"data":{"data":{"alias":"Node17","client_ip":"35.158.135.100","client_port":9702,"node_ip":"35.158.135.100","node_port":9701,"services":[]},"dest":"51tSHs2dWwTFyRrvnSEnmaw4b2pgSGJC7wvbVTD7uSan"},"metadata":{"digest":"253765855531ea821a8a2033d0cd45ed6ab16dc96cd869ac7f2577dc7f315a2e","from":"L42FuX7KUwdkNqoKoc5UFx","reqId":1548975401485993600},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":43,"txnTime":1548975402},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5XkykedVYf3MUk5rNDNTrRU7cjcLMtf1y4RvaLVs3nkgxVwr4sFbigihSPRApsVKVEiXQhFDFVqkfn71ecxJ52MD"}]},"txn":{"data":{"data":{"alias":"Node12","services":[]},"dest":"HKambpRxdh8fZ4a79etxhgwJ7Ew3MhHUg9mwVZSkbd7L"},"metadata":{"digest":"a50c7dfd1976a75d1a5d3b680bca6daa0521318d4962ca6d51842bc97960ce92","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551203412019239500},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":44,"txnTime":1551203414},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5TAQ2U5Bn3bDniLPDdyN978uNQkrUwA3NKygRK9BjH4bqX13xW5AV98VSA6TXvjCHn4BiWSFVQzcP1HJsnBHpTRY"}]},"txn":{"data":{"data":{"alias":"Node14","services":[]},"dest":"6vqRjEMeskmFHdXtv3a63wYBCpCv7X16dUtLd1Ae4sWw"},"metadata":{"digest":"1488663a27508d424c6ad4d03bf381cae0a0bae701aaed6939cbd92c5783845e","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551204953038864800},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":45,"txnTime":1551204955},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"4WhHUgw8pewvzDmtPxDjQWkzRuirh5Y9hA2hYaJbp5rT74JkEHgWqHEjy2ssskFHcmTuEuHtG4haE3WA2PBaBYk8"}]},"txn":{"data":{"data":{"alias":"Node16","services":[]},"dest":"6AweMwDifg6mQqmcefwcFXkw3Hhb46a4Tr6Xw6jEWKpA"},"metadata":{"digest":"ef61ecff7df0d4782f95981a296ff559d69941ef38b74c10030894ed7a7ed1ed","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551206611662917100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":46,"txnTime":1551206613},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"3tPCdgzpJbMR4WywDEcHmACiGvYXLbwUDUGKR1Jbb6Pr7bui4Hy5EcS6GgyUiDjaAUiab53zGFSsuNhY1LKzB23"}]},"txn":{"data":{"data":{"alias":"Node16","services":[]},"dest":"6AweMwDifg6mQqmcefwcFXkw3Hhb46a4Tr6Xw6jEWKpA"},"metadata":{"digest":"115612c22ca01e53b1ffbdd49a468f97025b8c81f6a82feda01fe6ad69250d5a","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551206801023524100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":47,"txnTime":1551206803},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"21RHDstR2LZS8mvmn2hBHFgY5oyNFpsNoQAxxTRZDsjuTwbvoZPM1C6yZcin8ozvytyhnDSiYAyU4dfAU3RVjEyt"}]},"txn":{"data":{"data":{"alias":"Node8","services":[]},"dest":"CJqRrPMjPec5wvHDoggvxYUk13fXDbya3Aopc4TiFkNr"},"metadata":{"digest":"f827692e0375385e2d5150152c5f5da9ef664b21ec49b5b80f67e6a876db3825","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551207352258526100},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":48,"txnTime":1551207354},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"u9u7raMhb3v1btMitRaS3p1w9QvCGRbPmqajk779KBBmsqVFevJVXMRoAFFYaZoUDmLiPcLhNSZPKRRMTQ81Rrw"}]},"txn":{"data":{"data":{"alias":"Node9","services":[]},"dest":"GYUibLwguJX5YcEYmy1xE45j6cbdnSjyJm9bKPiM163Z"},"metadata":{"digest":"293d318c119b1630dbedbaae96b3b00d50ebc3f00408a1e208255edb20a80b16","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551207361655418300},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":49,"txnTime":1551207363},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5PUs4jdePLpVWsAG7zzA2iNi3ZsiiRreq2EUmjwQ8S4dFNgJQ64uqsBD3ysfHpphsmoepupZuqMPPKM92Bq3fEK9"}]},"txn":{"data":{"data":{"alias":"Node10","services":[]},"dest":"67NLWsr8dFJrL6cDWcZkDce4hoSSGPBesk2PzqvGqL1R"},"metadata":{"digest":"9d3c336bf6b7d0c8f0db1ae71a8209f34146acd419e9cafb819827c351758699","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551207388071020900},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":50,"txnTime":1551207390},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5Z67eiWX67KvfkWdhR5hfoFLcyQjyxxVHVFMgvXvzyoMapmMgd4mVPFnyb2SPc3zoherQd4Cy6XUdSUB2TtnjdyG"}]},"txn":{"data":{"data":{"alias":"Node11","services":[]},"dest":"4UjwEpgGVqpyovAxFRVP5mn2S4m6UHq2CftzeE73YrNq"},"metadata":{"digest":"47b38044dcfe4fd1530e3337641bb21e2e7751e03818e74f1584a069a70a5cde","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551207457831017000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":51,"txnTime":1551207459},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"4beaoajWrgnS3YeByaFcg9dkLss3zqjpdYtwbfaSqvTzztmEn4FbebTZ2H1ou8QqCMiAsPhxNWKEoJ6vD7fxX7Hn"}]},"txn":{"data":{"data":{"alias":"Node13","services":[]},"dest":"46v1cgPa6XAHCNqAL7hEFXkUq9j6AgwusDwQyjJqFwKE"},"metadata":{"digest":"ee69451947d9bbb8c274e3575fee95d54cbada451c891b085d6cc46b9566d326","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551207464311167000},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":52,"txnTime":1551207466},"ver":"1"}\n{"reqSignature":{"type":"ED25519","values":[{"from":"V4SGRU86Z58d6TV7PBUe6f","value":"5E2TKK68bY4xuV79ATg3S538DBcQaGBDj7n2BucLh1vQytBbJGmyFvQETAnmeVH7mXatKCCXa5MutjGjLa3WnEZQ"}]},"txn":{"data":{"data":{"alias":"Node15","services":[]},"dest":"9kkmFVkidPcGuqobckwZUNbtFj5fCj1F9PEKa7m5URaP"},"metadata":{"digest":"aa3aa23712945117e2a3dbc7f7443750300eeab6ec484632c9c29b5ee6b975ab","from":"V4SGRU86Z58d6TV7PBUe6f","reqId":1551207522088238500},"protocolVersion":2,"type":"0"},"txnMetadata":{"seqNo":53,"txnTime":1551207524},"ver":"1"}'

export const baseUrls = {
  [SERVER_ENVIRONMENT.DEVELOPMENT]: {
    agencyUrl: 'http://52.35.57.49',
    agencyDID: 'dTLdJqRZLwMuWSogcKfBT',
    agencyVerificationKey: 'LsPQTDHi294TexkFmZK9Q9vW4YGtQRuLV8wuyZi94yH',
    poolConfig:
      '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","client_ip":"35.164.240.131","client_port":9702,"node_ip":"35.164.240.131","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","client_ip":"35.164.240.131","client_port":9704,"node_ip":"35.164.240.131","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","client_ip":"35.164.240.131","client_port":9706,"node_ip":"35.164.240.131","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","client_ip":"35.164.240.131","client_port":9708,"node_ip":"35.164.240.131","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}',
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.SANDBOX]: {
    agencyUrl: 'http://52.25.123.226',
    agencyDID: 'Nv9oqGX57gy15kPSJzo2i4',
    agencyVerificationKey: 'CwpcjCc6MtVNdQgwoonNMFoR6dhzmRXHHaUCRSrjh8gj',
    poolConfig:
      '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","client_ip":"34.212.206.9","client_port":9702,"node_ip":"34.212.206.9","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","client_ip":"34.212.206.9","client_port":9704,"node_ip":"34.212.206.9","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","client_ip":"34.212.206.9","client_port":9706,"node_ip":"34.212.206.9","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","client_ip":"34.212.206.9","client_port":9708,"node_ip":"34.212.206.9","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}',
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.STAGING]: {
    agencyUrl: 'https://agency.pstg.evernym.com',
    agencyDID: 'LqnB96M6wBALqRZsrTTwda',
    agencyVerificationKey: 'BpDPZHLbJFu67sWujecoreojiWZbi2dgf4xnYemUzFvB',
    poolConfig: sharedPoolConfig,
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.DEMO]: {
    agencyUrl: 'https://agency.pps.evernym.com',
    agencyDID: '3mbwr7i85JNSL3LoNQecaW',
    agencyVerificationKey: '2WXxo6y1FJvXWgZnoYUP5BJej2mceFrqBDNPE3p6HDPf',
    poolConfig: sharedPoolConfig,
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.QATEST1]: {
    agencyUrl: 'http://casq002.pqa.evernym.com',
    agencyDID: 'L1gaixoxvbVg97HYnrr6rG',
    agencyVerificationKey: 'BMzy1cEuSFvnKYjjBxY4jC2gQbNmaVX3Kg5zJJiXAwq8',
    poolConfig: sharedQAPoolConfig,
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.QA]: {
    agencyUrl: 'https://agency.pqa.evernym.com',
    agencyDID: 'LhiSANFohRXBWaKSZDvTH5',
    agencyVerificationKey: 'BjpTLofEbVYJ8xxXQxScbmubHsgpHY5uvScfXqW9B1vB',
    poolConfig: sharedQAPoolConfig,
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.DEVRC]: {
    agencyUrl: 'https://agency.pdev.evernym.com',
    agencyDID: 'LiLBGgFarh954ZtTByLM1C',
    agencyVerificationKey: 'Bk9wFrud3rz8v3nAFKGib6sQs8zHWzZxfst7Wh3Mbc9W',
    poolConfig: sharedPoolConfig,
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.DEVTEAM1]: {
    agencyUrl: 'https://agency-team1.pdev.evernym.com',
    agencyDID: 'TGLBMTcW9fHdkSqown9jD8',
    agencyVerificationKey: 'FKGV9jKvorzKPtPJPNLZkYPkLhiS1VbxdvBgd1RjcQHR',
    poolConfig:
      '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","blskey_pop":"RahHYiCvoNCtPTrVtP7nMC5eTYrsUA8WjXbdhNc8debh1agE9bGiJxWBXYNFbnJXoXhWFMvyqhqhRoq737YQemH5ik9oL7R4NTTCz2LEZhkgLJzB3QRQqJyBNyv7acbdHrAT8nQ9UkLbaVL9NBpnWXBTw4LEMePaSHEw66RzPNdAX1","client_ip":"54.71.181.31","client_port":9702,"node_ip":"54.71.181.31","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","blskey_pop":"Qr658mWZ2YC8JXGXwMDQTzuZCWF7NK9EwxphGmcBvCh6ybUuLxbG65nsX4JvD4SPNtkJ2w9ug1yLTj6fgmuDg41TgECXjLCij3RMsV8CwewBVgVN67wsA45DFWvqvLtu4rjNnE9JbdFTc1Z4WCPA3Xan44K1HoHAq9EVeaRYs8zoF5","client_ip":"54.71.181.31","client_port":9704,"node_ip":"54.71.181.31","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","blskey_pop":"QwDeb2CkNSx6r8QC8vGQK3GRv7Yndn84TGNijX8YXHPiagXajyfTjoR87rXUu4G4QLk2cF8NNyqWiYMus1623dELWwx57rLCFqGh7N4ZRbGDRP4fnVcaKg1BcUxQ866Ven4gw8y4N56S5HzxXNBZtLYmhGHvDtk6PFkFwCvxYrNYjh","client_ip":"54.71.181.31","client_port":9706,"node_ip":"54.71.181.31","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","blskey_pop":"RPLagxaR5xdimFzwmzYnz4ZhWtYQEj8iR5ZU53T2gitPCyCHQneUn2Huc4oeLd2B2HzkGnjAff4hWTJT6C7qHYB1Mv2wU5iHHGFWkhnTX9WsEAbunJCV2qcaXScKj4tTfvdDKfLiVuU2av6hbsMztirRze7LvYBkRHV3tGwyCptsrP","client_ip":"54.71.181.31","client_port":9708,"node_ip":"54.71.181.31","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}',
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.DEVTEAM2]: {
    agencyUrl: 'https://agency-team2.pdev.evernym.com',
    agencyDID: 'TGLBMTcW9fHdkSqown9jD8',
    agencyVerificationKey: 'FKGV9jKvorzKPtPJPNLZkYPkLhiS1VbxdvBgd1RjcQHR',
    poolConfig:
      '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","blskey_pop":"RahHYiCvoNCtPTrVtP7nMC5eTYrsUA8WjXbdhNc8debh1agE9bGiJxWBXYNFbnJXoXhWFMvyqhqhRoq737YQemH5ik9oL7R4NTTCz2LEZhkgLJzB3QRQqJyBNyv7acbdHrAT8nQ9UkLbaVL9NBpnWXBTw4LEMePaSHEw66RzPNdAX1","client_ip":"35.160.9.251","client_port":9702,"node_ip":"35.160.9.251","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","blskey_pop":"Qr658mWZ2YC8JXGXwMDQTzuZCWF7NK9EwxphGmcBvCh6ybUuLxbG65nsX4JvD4SPNtkJ2w9ug1yLTj6fgmuDg41TgECXjLCij3RMsV8CwewBVgVN67wsA45DFWvqvLtu4rjNnE9JbdFTc1Z4WCPA3Xan44K1HoHAq9EVeaRYs8zoF5","client_ip":"35.160.9.251","client_port":9704,"node_ip":"35.160.9.251","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","blskey_pop":"QwDeb2CkNSx6r8QC8vGQK3GRv7Yndn84TGNijX8YXHPiagXajyfTjoR87rXUu4G4QLk2cF8NNyqWiYMus1623dELWwx57rLCFqGh7N4ZRbGDRP4fnVcaKg1BcUxQ866Ven4gw8y4N56S5HzxXNBZtLYmhGHvDtk6PFkFwCvxYrNYjh","client_ip":"35.160.9.251","client_port":9706,"node_ip":"35.160.9.251","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","blskey_pop":"RPLagxaR5xdimFzwmzYnz4ZhWtYQEj8iR5ZU53T2gitPCyCHQneUn2Huc4oeLd2B2HzkGnjAff4hWTJT6C7qHYB1Mv2wU5iHHGFWkhnTX9WsEAbunJCV2qcaXScKj4tTfvdDKfLiVuU2av6hbsMztirRze7LvYBkRHV3tGwyCptsrP","client_ip":"35.160.9.251","client_port":9708,"node_ip":"35.160.9.251","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}',
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.DEVTEAM3]: {
    agencyUrl: 'https://agency-team3.pdev.evernym.com',
    agencyDID: 'TGLBMTcW9fHdkSqown9jD8',
    agencyVerificationKey: 'FKGV9jKvorzKPtPJPNLZkYPkLhiS1VbxdvBgd1RjcQHR',
    poolConfig:
      '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","blskey_pop":"RahHYiCvoNCtPTrVtP7nMC5eTYrsUA8WjXbdhNc8debh1agE9bGiJxWBXYNFbnJXoXhWFMvyqhqhRoq737YQemH5ik9oL7R4NTTCz2LEZhkgLJzB3QRQqJyBNyv7acbdHrAT8nQ9UkLbaVL9NBpnWXBTw4LEMePaSHEw66RzPNdAX1","client_ip":"34.217.237.253","client_port":9702,"node_ip":"34.217.237.253","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","blskey_pop":"Qr658mWZ2YC8JXGXwMDQTzuZCWF7NK9EwxphGmcBvCh6ybUuLxbG65nsX4JvD4SPNtkJ2w9ug1yLTj6fgmuDg41TgECXjLCij3RMsV8CwewBVgVN67wsA45DFWvqvLtu4rjNnE9JbdFTc1Z4WCPA3Xan44K1HoHAq9EVeaRYs8zoF5","client_ip":"34.217.237.253","client_port":9704,"node_ip":"34.217.237.253","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","blskey_pop":"QwDeb2CkNSx6r8QC8vGQK3GRv7Yndn84TGNijX8YXHPiagXajyfTjoR87rXUu4G4QLk2cF8NNyqWiYMus1623dELWwx57rLCFqGh7N4ZRbGDRP4fnVcaKg1BcUxQ866Ven4gw8y4N56S5HzxXNBZtLYmhGHvDtk6PFkFwCvxYrNYjh","client_ip":"34.217.237.253","client_port":9706,"node_ip":"34.217.237.253","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","blskey_pop":"RPLagxaR5xdimFzwmzYnz4ZhWtYQEj8iR5ZU53T2gitPCyCHQneUn2Huc4oeLd2B2HzkGnjAff4hWTJT6C7qHYB1Mv2wU5iHHGFWkhnTX9WsEAbunJCV2qcaXScKj4tTfvdDKfLiVuU2av6hbsMztirRze7LvYBkRHV3tGwyCptsrP","client_ip":"34.217.237.253","client_port":9708,"node_ip":"34.217.237.253","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}',
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.PROD]: {
    agencyUrl: 'https://agency.evernym.com',
    agencyDID: 'DwXzE7GdE5DNfsrRXJChSD',
    agencyVerificationKey: '844sJfb2snyeEugKvpY7Y4jZJk9LT6BnS6bnuKoiqbip',
    poolConfig:
      '{"reqSignature":{},"txn":{"data":{"data":{"alias":"ev1","client_ip":"54.207.36.81","client_port":"9702","node_ip":"18.231.96.215","node_port":"9701","services":["VALIDATOR"]},"dest":"GWgp6huggos5HrzHVDy5xeBkYHxPvrRZzjPNAyJAqpjA"},"metadata":{"from":"J4N1K1SEB8uY2muwmecY5q"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"b0c82a3ade3497964cb8034be915da179459287823d92b5717e6d642784c50e6"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"zaValidator","client_ip":"154.0.164.39","client_port":"9702","node_ip":"154.0.164.39","node_port":"9701","services":["VALIDATOR"]},"dest":"BnubzSjE3dDVakR77yuJAuDdNajBdsh71ZtWePKhZTWe"},"metadata":{"from":"UoFyxT8BAqotbkhiehxHCn"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"d5f775f65e44af60ff69cfbcf4f081cd31a218bf16a941d949339dadd55024d0"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"danube","client_ip":"128.130.204.35","client_port":"9722","node_ip":"128.130.204.35","node_port":"9721","services":["VALIDATOR"]},"dest":"476kwEjDj5rxH5ZcmTtgnWqDbAnYJAGGMgX7Sq183VED"},"metadata":{"from":"BrYDA5NubejDVHkCYBbpY5"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"ebf340b317c044d970fcd0ca018d8903726fa70c8d8854752cd65e29d443686c"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"royal_sovrin","client_ip":"35.167.133.255","client_port":"9702","node_ip":"35.167.133.255","node_port":"9701","services":["VALIDATOR"]},"dest":"Et6M1U7zXQksf7QM6Y61TtmXF1JU23nsHCwcp1M9S8Ly"},"metadata":{"from":"4ohadAwtb2kfqvXynfmfbq"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"24d391604c62e0e142ea51c6527481ae114722102e27f7878144d405d40df88d"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"digitalbazaar","client_ip":"34.226.105.29","client_port":"9701","node_ip":"34.226.105.29","node_port":"9700","services":["VALIDATOR"]},"dest":"D9oXgXC3b6ms3bXxrUu6KqR65TGhmC1eu7SUUanPoF71"},"metadata":{"from":"rckdVhnC5R5WvdtC83NQp"},"type":"0"},"txnMetadata":{"seqNo":5,"txnId":"56e1af48ef806615659304b1e5cf3ebf87050ad48e6310c5e8a8d9332ac5c0d8"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"OASFCU","client_ip":"38.70.17.248","client_port":"9702","node_ip":"38.70.17.248","node_port":"9701","services":["VALIDATOR"]},"dest":"8gM8NHpq2cE13rJYF33iDroEGiyU6wWLiU1jd2J4jSBz"},"metadata":{"from":"BFAeui85mkcuNeQQhZfqQY"},"type":"0"},"txnMetadata":{"seqNo":6,"txnId":"825aeaa33bc238449ec9bd58374b2b747a0b4859c5418da0ad201e928c3049ad"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"BIGAWSUSEAST1-001","client_ip":"34.224.255.108","client_port":"9796","node_ip":"34.224.255.108","node_port":"9769","services":["VALIDATOR"]},"dest":"HMJedzRbFkkuijvijASW2HZvQ93ooEVprxvNhqhCJUti"},"metadata":{"from":"L851TgZcjr6xqh4w6vYa34"},"type":"0"},"txnMetadata":{"seqNo":7,"txnId":"40fceb5fea4dbcadbd270be6d5752980e89692151baf77a6bb64c8ade42ac148"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"DustStorm","client_ip":"207.224.246.57","client_port":"9712","node_ip":"207.224.246.57","node_port":"9711","services":["VALIDATOR"]},"dest":"8gGDjbrn6wdq6CEjwoVStjQCEj3r7FCxKrA5d3qqXxjm"},"metadata":{"from":"FjuHvTjq76Pr9kdZiDadqq"},"type":"0"},"txnMetadata":{"seqNo":8,"txnId":"6d1ee3eb2057b8435333b23f271ab5c255a598193090452e9767f1edf1b4c72b"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"prosovitor","client_ip":"138.68.240.143","client_port":"9711","node_ip":"138.68.240.143","node_port":"9710","services":["VALIDATOR"]},"dest":"C8W35r9D2eubcrnAjyb4F3PC3vWQS1BHDg7UvDkvdV6Q"},"metadata":{"from":"Y1ENo59jsXYvTeP378hKWG"},"type":"0"},"txnMetadata":{"seqNo":9,"txnId":"15f22de8c95ef194f6448cfc03e93aeef199b9b1b7075c5ea13cfef71985bd83"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"iRespond","client_ip":"52.187.10.28","client_port":"9702","node_ip":"52.187.10.28","node_port":"9701","services":["VALIDATOR"]},"dest":"3SD8yyJsK7iKYdesQjwuYbBGCPSs1Y9kYJizdwp2Q1zp"},"metadata":{"from":"JdJi97RRDH7Bx7khr1znAq"},"type":"0"},"txnMetadata":{"seqNo":10,"txnId":"b65ce086b631ed75722a4e1f28fc9cf6119b8bc695bbb77b7bdff53cfe0fc2e2"},"ver":"1"}',
    paymentMethod: 'sov',
  },
  [SERVER_ENVIRONMENT.BCOVRIN_TEST]: {
    agencyUrl: 'https://agency.pqa.evernym.com',
    agencyDID: 'LhiSANFohRXBWaKSZDvTH5',
    agencyVerificationKey: 'BjpTLofEbVYJ8xxXQxScbmubHsgpHY5uvScfXqW9B1vB',
    poolConfig:
      '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","blskey_pop":"RahHYiCvoNCtPTrVtP7nMC5eTYrsUA8WjXbdhNc8debh1agE9bGiJxWBXYNFbnJXoXhWFMvyqhqhRoq737YQemH5ik9oL7R4NTTCz2LEZhkgLJzB3QRQqJyBNyv7acbdHrAT8nQ9UkLbaVL9NBpnWXBTw4LEMePaSHEw66RzPNdAX1","client_ip":"138.197.138.255","client_port":9702,"node_ip":"138.197.138.255","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","blskey_pop":"Qr658mWZ2YC8JXGXwMDQTzuZCWF7NK9EwxphGmcBvCh6ybUuLxbG65nsX4JvD4SPNtkJ2w9ug1yLTj6fgmuDg41TgECXjLCij3RMsV8CwewBVgVN67wsA45DFWvqvLtu4rjNnE9JbdFTc1Z4WCPA3Xan44K1HoHAq9EVeaRYs8zoF5","client_ip":"138.197.138.255","client_port":9704,"node_ip":"138.197.138.255","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","blskey_pop":"QwDeb2CkNSx6r8QC8vGQK3GRv7Yndn84TGNijX8YXHPiagXajyfTjoR87rXUu4G4QLk2cF8NNyqWiYMus1623dELWwx57rLCFqGh7N4ZRbGDRP4fnVcaKg1BcUxQ866Ven4gw8y4N56S5HzxXNBZtLYmhGHvDtk6PFkFwCvxYrNYjh","client_ip":"138.197.138.255","client_port":9706,"node_ip":"138.197.138.255","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","blskey_pop":"RPLagxaR5xdimFzwmzYnz4ZhWtYQEj8iR5ZU53T2gitPCyCHQneUn2Huc4oeLd2B2HzkGnjAff4hWTJT6C7qHYB1Mv2wU5iHHGFWkhnTX9WsEAbunJCV2qcaXScKj4tTfvdDKfLiVuU2av6hbsMztirRze7LvYBkRHV3tGwyCptsrP","client_ip":"138.197.138.255","client_port":9708,"node_ip":"138.197.138.255","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}',
    paymentMethod: 'sov',
  },
  ...serverEnvironments,
}

export const cloudBackupEnvironments = [
  SERVER_ENVIRONMENT.PROD,
  SERVER_ENVIRONMENT.DEMO,
  SERVER_ENVIRONMENT.STAGING,
]

// making defaults sane so that developers don't need to remember
// what settings should be in dev environment
const isDevEnvironment = __DEV__ && process.env.NODE_ENV !== 'test'
export const defaultEnvironment = defaultServerEnvironment
  ? SERVER_ENVIRONMENT[defaultServerEnvironment]
  : isDevEnvironment
  ? SERVER_ENVIRONMENT.DEVTEAM1
  : SERVER_ENVIRONMENT.PROD

const initialState: ConfigStore = {
  ...baseUrls[defaultEnvironment],
  isAlreadyInstalled: false,
  // this flag is used to identify if we got the already stored data
  // from the phone and loaded in app
  isHydrated: false,
  // configurable error alert messages
  showErrorAlerts: false,
  // used to track if vcx is initialized successfully
  // if vcx is not initialized, then we won't be able
  // to call bridge methods that deals claims, connections, proofs, etc.
  vcxInitializationState: VCX_INIT_NOT_STARTED,
  vcxInitializationError: null,
  vcxPoolInitializationState: VCX_INIT_POOL_NOT_STARTED,
  vcxPoolInitializationError: null,
  isInitialized: false,
  messageDownloadStatus: GET_MESSAGES_SUCCESS,
  snackError: null,
  isLoading: false,
  isVcxPoolInitFailed: false,
  isVcxInitFailed: false,
  isGetMessagesFailed: false,
}

export const hydrated = () => ({
  type: HYDRATED,
})

export const initialized = () => ({
  type: INITIALIZED,
})

export const alreadyInstalledAction = (isAlreadyInstalled: boolean) => ({
  type: ALREADY_INSTALLED_RESULT,
  isAlreadyInstalled,
})

export const appInstalledSuccess = () => ({
  type: APP_INSTALLED,
})

export const changeEnvironmentUrl = (url: string) => ({
  type: CHANGE_ENVIRONMENT_VIA_URL,
  url,
})

export const reset = () => ({
  type: RESET,
})

export function* resetStore(): Generator<*, *, *> {
  yield put(reset())
}

export function* onChangeEnvironmentUrl(
  action: ChangeEnvironmentUrlAction
): Generator<*, *, *> {
  try {
    const { url } = action
    const environmentDetails: EnvironmentDetailUrlDownloaded = yield call(
      downloadEnvironmentDetails,
      url
    )
    if (
      !schemaValidator.validate(
        schemaDownloadedEnvironmentDetails,
        environmentDetails
      )
    ) {
      // TODO: We need to make a component which displays message
      // in whole app, something like toast in android
      // for now, we are using native alert to show error and messages
      Alert.alert(
        MESSAGE_FAIL_ENVIRONMENT_SWITCH_TITLE,
        MESSAGE_FAIL_ENVIRONMENT_SWITCH_INVALID_DATA(url)
      )

      return
    }

    // TODO:KS When we pick up environment switch story using QR code
    // then we need to fix below stuff
    // yield* deleteDeviceSpecificData()
    // yield* deleteWallet()
    yield* resetStore()

    yield put(
      changeEnvironment(
        environmentDetails.agencyUrl,
        environmentDetails.agencyDID,
        environmentDetails.agencyVerificationKey,
        environmentDetails.poolConfig,
        environmentDetails.paymentMethod
      )
    )

    if (usePushNotifications) {
      const pushToken: string = yield select(getPushToken)
      yield put(updatePushToken(pushToken))
    }

    // TODO Un-comment and call vcx reset when we re-enable this feature
    // yield call(reset, environmentDetails.poolConfig)
    yield put(vcxInitReset())

    // if we did not get any exception till this point
    // that means environment is switched
    Alert.alert(
      MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_TITLE,
      MESSAGE_SUCCESS_ENVIRONMENT_SWITCH_DESCRIPTION
    )
  } catch (e) {
    captureError(e)
    Alert.alert(
      MESSAGE_FAIL_ENVIRONMENT_SWITCH_TITLE,
      MESSAGE_FAIL_ENVIRONMENT_SWITCH_ERROR(e.message)
    )
  }
}

export function* watchChangeEnvironmentUrl(): any {
  yield takeLatest(CHANGE_ENVIRONMENT_VIA_URL, onChangeEnvironmentUrl)
}

export const changeEnvironment = (
  agencyUrl: string,
  agencyDID: string,
  agencyVerificationKey: string,
  poolConfig: string,
  paymentMethod: string
) => {
  let updatedPoolConfig = poolConfig

  // We can get pool config from user that does not have \n
  // or it might contain \\n or it might contain just \n
  if (poolConfig) {
    if (poolConfig.indexOf('\\n') > -1) {
      updatedPoolConfig = poolConfig.split('\\n').join('\n')
    }

    // TODO: Raise error about invalid pool config
  }

  let updatedAgencyUrl = agencyUrl.trim()
  const endIndex = agencyUrl.length - 1

  if (updatedAgencyUrl[endIndex] === '/') {
    // if we got the agency url that ends to with '/'
    // then we save it after removing that slash
    updatedAgencyUrl = updatedAgencyUrl.slice(0, endIndex)
  }

  return {
    type: SWITCH_ENVIRONMENT,
    poolConfig: updatedPoolConfig,
    agencyDID,
    agencyVerificationKey,
    agencyUrl: updatedAgencyUrl,
    paymentMethod,
  }
}

export const saveSwitchedEnvironmentDetailFail = (error: CustomError) => ({
  type: SAVE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  error,
})

export function* onEnvironmentSwitch(
  action: SwitchEnvironmentAction
): Generator<*, *, *> {
  const { type, ...switchedEnvironmentDetail } = action
  try {
    yield call(
      secureSet,
      STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL,
      JSON.stringify(switchedEnvironmentDetail)
    )
  } catch (e) {
    captureError(e)
    // we need to add some fallback if user storage is not available
    // or is full or if user deleted our data
    yield put(
      saveSwitchedEnvironmentDetailFail({
        code: ERROR_SAVE_SWITCH_ENVIRONMENT.code,
        message: `${ERROR_SAVE_SWITCH_ENVIRONMENT.message}${e.message}`,
      })
    )
  }
}

export function* watchSwitchEnvironment(): any {
  yield takeLatest(SWITCH_ENVIRONMENT, onEnvironmentSwitch)
}

export function* hydrateSwitchedEnvironmentDetails(): any {
  try {
    const switchedEnvironmentDetail: string | null = yield call(
      getHydrationItem,
      STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL
    )
    // if we did not find any saved environment details
    // then we are running an older version of the app where we did not save
    // environment details with which app was running
    // In all those previous instances our default environment was DEMO
    // so now, we have to switch default environment to DEMO
    const {
      agencyUrl,
      agencyDID,
      agencyVerificationKey,
      poolConfig,
      paymentMethod,
    }: ChangeEnvironment = switchedEnvironmentDetail
      ? JSON.parse(switchedEnvironmentDetail)
      : baseUrls[SERVER_ENVIRONMENT.DEMO]
    // if environment that is saved is same as what we have as default
    // then there is no need to raise change environment action
    const currentAgencyUrl = yield select(getAgencyUrl)
    if (currentAgencyUrl !== agencyUrl) {
      yield put(
        changeEnvironment(
          agencyUrl,
          agencyDID,
          agencyVerificationKey,
          poolConfig,
          paymentMethod
        )
      )
    }
  } catch (e) {
    captureError(e)
    customLogger.log(`hydrateSwitchedEnvironmentDetails: ${e}`)
    yield put(
      hydrateSwitchedEnvironmentDetailFail({
        code: ERROR_HYDRATE_SWITCH_ENVIRONMENT.code,
        message: `${ERROR_HYDRATE_SWITCH_ENVIRONMENT.message}${e.message}`,
      })
    )
  }
}

export function* persistEnvironmentDetails(): any {
  // we wait to persist environment details till we know that now user can't
  // change environment in UX flow
  const currentScreen: string = yield select(getCurrentScreen)
  if (UNSAFE_SCREENS_TO_DOWNLOAD_SMS.indexOf(currentScreen) > -1) {
    // user is on screens where he has chance to change environment details
    // so we wait for event which tells that we are safe
    yield take(SAFE_TO_DOWNLOAD_SMS_INVITATION)
  }

  const {
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
    paymentMethod,
  }: ConfigStore = yield select(getConfig)
  yield call(onEnvironmentSwitch, {
    type: SWITCH_ENVIRONMENT,
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
    paymentMethod,
  })
}

export const hydrateSwitchedEnvironmentDetailFail = (error: CustomError) => ({
  type: HYDRATE_SWITCH_ENVIRONMENT_DETAIL_FAIL,
  error,
})

export const changeServerEnvironment = (
  serverEnvironment: ServerEnvironment
): ServerEnvironmentChangedAction => ({
  type: SERVER_ENVIRONMENT_CHANGED,
  serverEnvironment,
})

export const switchErrorAlerts = () => ({
  type: SWITCH_ERROR_ALERTS,
})

export const toggleErrorAlerts = (isShowErrorAlert: boolean) => ({
  type: TOGGLE_ERROR_ALERTS,
  isShowErrorAlert,
})

export function* watchSwitchErrorAlerts(): any {
  while (true) {
    for (let i = 0; i < 4; i++) {
      yield take(SWITCH_ERROR_ALERTS)
    }

    const switchValue = yield select(getErrorAlertsSwitchValue)
    yield put(toggleErrorAlerts(!switchValue))
  }
}

export const vcxInitSuccess = () => ({
  type: VCX_INIT_SUCCESS,
})

export const vcxInitFail = (error: CustomError) => ({
  type: VCX_INIT_FAIL,
  error,
})

export const vcxInitPoolSuccess = () => ({
  type: VCX_INIT_POOL_SUCCESS,
})

export const vcxInitPoolFail = (error: CustomError) => ({
  type: VCX_INIT_POOL_FAIL,
  error,
})

export const vcxInitReset = () => ({
  type: VCX_INIT_NOT_STARTED,
})

export function* ensureAppHydrated(): Generator<*, *, *> {
  const isHydrated = yield select(getHydrationState)
  if (!isHydrated) {
    yield take(HYDRATED)
  }
}

export function* initVcx(findingWallet?: any): Generator<*, *, *> {
  if (findingWallet !== true) {
    yield* ensureAppHydrated()
    while (true) {
      // Since we have added a feature flag, so we need to wait
      // to know that user is going to enable the feature flag or not
      // now problem is how do we know when to stop waiting
      // so we are assuming that whenever user goes past lock-selection
      // screen, that means now user can't enable feature flag
      // because there is no way to enable that flag now
      const currentScreen: string = yield select(getCurrentScreen)
      if (UNSAFE_SCREENS_TO_DOWNLOAD_SMS.indexOf(currentScreen) > -1) {
        // user is on screens where he has chance to change environment details
        // so we wait for event which tells that we are safe
        // it might happen that this saga triggeres before route change
        // and hence it might get stuck waiting for event to happen
        // so we timeout and check route again, and we do this in a loop
        // and break when we are on safe route
        const { onSafeRoute } = yield race({
          onSafeRoute: take(SAFE_TO_DOWNLOAD_SMS_INVITATION),
          timeout: call(delay, 5000),
        })
        if (onSafeRoute) {
          break
        }
      }
      break
    }
  }

  // check if we already have user one time info
  // if we already have one time info, that means we don't have to register
  // with agency again, and we can just raise success action for VCX_INIT
  let userOneTimeInfo: UserOneTimeInfo = yield select(getUserOneTimeInfo)
  const {
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
    paymentMethod,
  }: ConfigStore = yield select(getConfig)
  const agencyConfig = {
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
    paymentMethod,
  }

  if (!userOneTimeInfo) {
    // app is hydrated, but we haven't got user one time info
    // so now we go ahead and create user one time info
    try {
      // Creating user one time info is also called as creating cloud agent
      // For one app installation, there is one cloud agent provisioned
      // Later on, when we have multiple devices per user, then
      // we plan to have one cloud agent for every device per user
      // for now, One cloud agent for one app installation

      // There are two ways to register/provision cloud agent on agency
      // 1. Create cloud agent with token
      // 2. Create cloud agent without token

      // We prefer to create cloud agent with token
      const [
        registerWithTokenError,
        userOneTimeInfoWithToken,
      ] = yield* registerCloudAgentWithToken(agencyConfig)

      if (registerWithTokenError || !userOneTimeInfoWithToken) {
        yield put({
          type: 'REGISTER_CLOUD_AGENT_WITH_TOKEN_FAIL',
          error: registerWithTokenError,
        })

        console.log('WARN: Fallback to old provisioning protocol')

        // if agency does not yet support creating cloud agent with token
        // then we try second option to try creating cloud agent without token
        const [
          registerWithoutTokenError,
          userOneTimeInfoWithoutToken,
        ] = yield* registerCloudAgentWithoutToken(agencyConfig)
        if (registerWithoutTokenError || !userOneTimeInfoWithoutToken) {
          yield put(vcxInitFail(ERROR_VCX_INIT_FAIL(registerWithoutTokenError)))
          return
        }
        userOneTimeInfo = userOneTimeInfoWithoutToken
      } else {
        userOneTimeInfo = userOneTimeInfoWithToken
      }

      if (findingWallet !== true) {
        yield put(connectRegisterCreateAgentDone(userOneTimeInfo))
      }
    } catch (e) {
      captureError(e)
      yield call(vcxShutdown, false)
      yield put(vcxInitFail(ERROR_VCX_PROVISION_FAIL(e.message)))
      return
    }
  }

  // once we reach here, we are sure that either user one time info is loaded from disk
  // or we provisioned one time agent for current user if not already available

  // Connection to Pool Ledger is not required for some operations like Connection establishing, answering questions etc.
  // We must be connected to Pool Ledger only when accept Credential Offer or Proof Request.
  // So, we can skip connecting to pool ledger during vcx library initialization and run it in a background later.

  // re-try vcx init 4 times, if it does not get success in 4 attempts, raise fail
  let retryCount = 0
  let lastInitException = new Error('')
  while (retryCount < 4) {
    try {
      yield call(
        init,
        {
          ...userOneTimeInfo,
          ...agencyConfig,
        },
        getGenesisFileName(agencyUrl)
      )
      if (findingWallet !== true) {
        yield put(vcxInitSuccess())
      }
      break
    } catch (e) {
      captureError(e)
      lastInitException = e
      retryCount++
    }
  }

  if (retryCount > 3) {
    if (findingWallet !== true) {
      yield put(vcxInitFail(ERROR_VCX_INIT_FAIL(lastInitException.message)))
      return
    }
  }

  // start connecting to pool ledger process
  yield spawn(connectToPool)
}

export function* connectToPool(): Generator<*, *, *> {
  const { agencyUrl, poolConfig }: ConfigStore = yield select(getConfig)

  const config: CxsPoolConfig = {
    poolConfig: poolConfig,
  }
  const genesisFileName = getGenesisFileName(agencyUrl)

  // re-try init pool 2 times, if it does not get success, raise fail
  let lastInitException = new Error('')
  for (let i = 0; i < 2; i++) {
    try {
      yield call(initPool, config, genesisFileName)
      yield put(vcxInitPoolSuccess())
      return
    } catch (e) {
      captureError(e)
      lastInitException = e
      // wait for 10 seconds before trying again
      yield call(delay, 10000)
    }
  }
  // we could not connect to the pool - raise error
  yield put(vcxInitPoolFail(ERROR_VCX_INIT_FAIL(lastInitException.message)))
}

export const ERROR_POOL_INIT_FAIL =
  'Unable to connect to pool ledger. Check your internet connection or try to restart app.'

export const getGenesisFileName = (agencyUrl: string) => {
  return (
    GENESIS_FILE_NAME +
    '_' +
    findKey(baseUrls, (environment) => environment.agencyUrl === agencyUrl)
  )
}

export function* showSnackError(error: string): Generator<*, *, *> {
  // show snack error
  yield put({
    type: SHOW_SNACK_ERROR,
    error: error,
  })

  // clear error for snack after 5 seconds
  yield call(delay, 5000)
  yield put({
    type: CLEAR_SNACK_ERROR,
  })
}

export function* watchVcxInitStart(): any {
  yield takeLeading(VCX_INIT_START, initVcx)
}

export function* watchVcxInitPoolStart(): any {
  yield takeLeading(VCX_INIT_POOL_START, connectToPool)
}

export function* getMessagesSaga(
  params: ?GetUnacknowledgedMessagesAction
): Generator<*, *, *> {
  try {
    //make sure vcx is initialized
    const vcxResult = yield* ensureVcxInitAndPoolConnectSuccess()
    if (vcxResult && vcxResult.fail) {
      yield take(VCX_INIT_SUCCESS)
    }
    const allConnectionsPairwiseDids = yield select(
      getAllConnectionsPairwiseDid
    )
    // we don't have any connections.
    // So, we don't need to query Agent for new messages
    if (allConnectionsPairwiseDids.length === 0) {
      yield put(getMessagesSuccess())
      return
    }
    yield put(getMessagesLoading())
    const data = yield call(
      downloadMessages,
      MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
      params?.uid || null,
      params?.forDid || allConnectionsPairwiseDids.join(',')
    )
    if (data && data.length != 0) {
      try {
        if (Platform.OS === 'ios') {
          // Remove all the FCM notifications from the tray
          PushNotificationIOS.removeAllDeliveredNotifications()
        }
        const parsedData: DownloadedConnectionsWithMessages = JSON.parse(data)

        yield* processMessages(parsedData)
        yield* acknowledgeServer(parsedData)
      } catch (e) {
        captureError(e)
        // throw error
      }
    }
    yield put(getMessagesSuccess())
  } catch (e) {
    captureError(e)
    //ask about retry scenario
    yield put(getMessagesFail())
  }
}

export const traverseAndGetAllMessages = (
  data: DownloadedConnectionsWithMessages
): Array<DownloadedMessage> => {
  let messages: Array<DownloadedMessage> = []
  if (Array.isArray(data)) {
    data.map(
      (connection) =>
        connection &&
        connection.msgs &&
        connection.msgs.map((message) => {
          messages.push(message)
        })
    )
  } else {
    return []
  }
  return messages
}

export function* processMessages(
  data: DownloadedConnectionsWithMessages
): Generator<*, *, *> {
  const msgTypes = [
    MESSAGE_TYPE.PROOF_REQUEST,
    MESSAGE_TYPE.CLAIM,
    MESSAGE_TYPE.CLAIM_OFFER,
    MESSAGE_TYPE.QUESTION,
    MESSAGE_TYPE.QUESTION.toLowerCase(),
    MESSAGE_TYPE.ARIES,
    MESSAGE_TYPE.INVITE_ACTION,
  ]
  // send each message in data to handleMessage
  // additional data will be fetched and passed to relevant( claim, claimOffer, proofRequest,etc )store.
  const messages: Array<DownloadedMessage> = traverseAndGetAllMessages(data)
  const dataAlreadyExists = yield select(getPendingFetchAdditionalDataKey)

  for (let i = 0; i < messages.length; i++) {
    try {
      // get message type
      const messageType = messages[i].type
      let isAries = messageType === MESSAGE_TYPE.ARIES

      let connection = []
      if (isAries) {
        // if message type is unkown that means we are in aries protocol
        // and in aries protocol, senderDID is actually myPairwiseAgentDID
        // so we need to select connection on the basis of myPairwiseAgentDID
        // instead of senderDID
        connection = yield select(
          getConnectionByProp,
          'myPairwiseAgentDid',
          messages[i].senderDID
        )

        // connection related o received message was deleted
        if (!connection || !connection[0]) {
          continue
        }
      } else {
        connection = yield select(getConnection, messages[i].senderDID)
      }

      let { myPairwiseDid: pairwiseDID, senderDID } =
        connection && connection[0]

      if (
        !(
          dataAlreadyExists &&
          dataAlreadyExists[`${messages[i].uid}-${pairwiseDID}`] &&
          msgTypes.indexOf(messages[i].type) > -1
        )
      ) {
        yield put(
          setFetchAdditionalDataPendingKeys(messages[i].uid, pairwiseDID)
        )
        if (isAries) {
          yield fork(handleAriesMessage, {
            ...messages[i],
            senderDID,
          })
        } else {
          yield fork(handleProprietaryMessage, messages[i])
        }
      }
    } catch (e) {
      // capturing error for handleMessage fork
      captureError(e)
      customLogger.log(e)
    }
  }
}

export const convertDecryptedPayloadToQuestion = (
  connectionHandle: number,
  decryptedPayload: string,
  uid: string,
  forDID: string,
  senderDID: string,
  messageTitle: string,
  messageText: string
): QuestionPayload => {
  const parsedPayload = JSON.parse(decryptedPayload)
  const parsedMsg: QuestionRequest = JSON.parse(parsedPayload['@msg'])

  return {
    '@type': parsedMsg['@type'],
    protocol: COMMITEDANSWER_PROTOCOL,
    messageId: parsedMsg['@id'],
    question_text: parsedMsg.question_text,
    question_detail: parsedMsg.question_detail,
    valid_responses: parsedMsg.valid_responses,
    timing: parsedMsg['@timing'],
    issuer_did: senderDID,
    remoteDid: '',
    uid,
    from_did: senderDID,
    forDID,
    connectionHandle,
    remotePairwiseDID: senderDID,
    messageTitle: parsedMsg.question_text || messageTitle,
    messageText: parsedMsg.question_detail || messageText,
    externalLinks: parsedMsg.external_links || [],
    originalQuestion: parsedPayload['@msg'],
  }
}

export const convertDecryptedPayloadToAriesQuestion = (
  connectionHandle: number,
  decryptedPayload: string,
  uid: string,
  forDID: string,
  senderDID: string
): QuestionPayload => {
  const parsedPayload = JSON.parse(decryptedPayload)
  const parsedMsg: AriesQuestionRequest = JSON.parse(parsedPayload['@msg'])

  return {
    '@type': parsedMsg['@type'],
    protocol: QUESTIONANSWER_PROTOCOL,
    messageId: parsedMsg['@id'],
    question_text: parsedMsg.question_text,
    question_detail: parsedMsg.question_detail,
    valid_responses: parsedMsg.valid_responses,
    nonce: parsedMsg.nonce,
    timing: parsedMsg['~timing'],
    issuer_did: senderDID,
    remoteDid: '',
    uid,
    from_did: senderDID,
    forDID,
    connectionHandle,
    remotePairwiseDID: senderDID,
    messageTitle: parsedMsg.question_text,
    messageText: parsedMsg.question_detail,
    externalLinks: [],
    originalQuestion: parsedPayload['@msg'],
  }
}

export const convertDecryptedPayloadToInviteAction = (
  connectionHandle: number,
  decryptedPayload: string,
  uid: string,
  forDID: string,
  senderDID: string,
  remoteName: string
): InviteActionPayload => {
  const parsedPayload = JSON.parse(decryptedPayload)
  const parsedMsg: InviteActionRequest = JSON.parse(parsedPayload['@msg'])

  let parsedGoalCode: InviteActionData = {
    inviteActionTitle: parsedMsg.goal_code,
  }

  try {
    parsedGoalCode = JSON.parse(parsedMsg.goal_code)
    if (parsedGoalCode.hasOwnProperty('invite_action_meta_data')) {
      parsedGoalCode = {
        inviteActionTitle:
          parsedGoalCode.invite_action_meta_data.invite_action_title,
        inviteActionDetails:
          parsedGoalCode.invite_action_meta_data.invite_action_detail,
        acceptText: parsedGoalCode.invite_action_meta_data.accept_text,
        denyText: parsedGoalCode.invite_action_meta_data.deny_text,
        token: parsedGoalCode.invite_action_meta_data.id_pal_token,
      }
    }
  } catch (e) {}

  return {
    '@type': parsedMsg['@type'],
    protocol: INVITE_ACTION_PROTOCOL,
    messageId: parsedMsg['@id'],
    timing: parsedMsg['@timing'],
    issuer_did: senderDID,
    remoteDid: '',
    uid,
    from_did: senderDID,
    forDID,
    connectionHandle,
    remotePairwiseDID: senderDID,
    inviteActionTitle: parsedGoalCode.inviteActionTitle,
    inviteActionDetails: parsedGoalCode.inviteActionDetails,
    acceptText: parsedGoalCode.acceptText,
    denyText: parsedGoalCode.denyText,
    token: parsedGoalCode.token,
    originalInviteAction: parsedPayload['@msg'],
    remoteName,
  }
}

function* handleProprietaryMessage(
  downloadedMessage: DownloadedMessage
): Generator<*, *, *> {
  const { senderDID, uid, type, decryptedPayload } = downloadedMessage
  const remotePairwiseDID = senderDID
  const connection: Connection[] = yield select(getConnection, senderDID)
  const {
    identifier: forDID,
    vcxSerializedConnection,
    logoUrl: senderLogoUrl,
    senderName,
  }: Connection = connection[0]
  const connectionHandle = yield call(
    getHandleBySerializedConnection,
    vcxSerializedConnection
  )

  try {
    if (!decryptedPayload) {
      // received message doesn't contain any payload, so just return
      return
    }

    let additionalData:
      | ClaimOfferMessagePayload
      | ProofRequestPushPayload
      | ClaimPushPayload
      | ClaimPushPayloadVcx
      | QuestionPayload
      | null = null

    let messageType = null

    // toLowerCase here to handle type 'question' and 'Question'
    if (type.toLowerCase() === MESSAGE_TYPE.QUESTION.toLowerCase()) {
      additionalData = convertDecryptedPayloadToQuestion(
        connectionHandle,
        decryptedPayload,
        uid,
        forDID,
        senderDID,
        '',
        ''
      )
    }

    // proprietary credential offer
    if (type === MESSAGE_TYPE.CLAIM_OFFER) {
      const message = JSON.parse(decryptedPayload)['@msg']

      // update type so that messages can be processed and added
      messageType = MESSAGE_TYPE.CLAIM_OFFER

      const { claimHandle, claimOffer } = yield call(
        createCredentialWithProprietaryOffer,
        uid,
        message
      )
      yield fork(saveSerializedClaimOffer, claimHandle, forDID, uid)

      additionalData = {
        ...claimOffer,
        remoteName: senderName,
        issuer_did: senderDID,
        from_did: senderDID,
        to_did: forDID,
      }
      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
    }

    // proprietary credential
    if (type === MESSAGE_TYPE.CLAIM) {
      messageType = MESSAGE_TYPE.CLAIM
      additionalData = {
        connectionHandle,
        message: decryptedPayload,
      }
    }

    // proprietary proof request
    if (type === MESSAGE_TYPE.PROOF_REQUEST) {
      const message = JSON.parse(decryptedPayload)['@msg']

      messageType = MESSAGE_TYPE.PROOF_REQUEST

      const proofHandle = yield call(proofCreateWithRequest, uid, message)

      additionalData = {
        ...JSON.parse(message),
        proofHandle,
      }

      // acknowledge proof request because existing acknowledge saga
      // does not acknowledge aries based proof request
      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
    }

    if (type === MESSAGE_TYPE.INVITE_ACTION) {
      if (!decryptedPayload) return
      additionalData = convertDecryptedPayloadToInviteAction(
        connectionHandle,
        decryptedPayload,
        uid,
        forDID,
        senderDID,
        senderName
      )
      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
    }

    if (!additionalData) {
      // we did not get any data or either push notification type is not supported
      return
    }

    const message = {
      type: messageType || type,
      additionalData: {
        remoteName: senderName,
        ...additionalData,
      },
      uid,
      senderLogoUrl,
      remotePairwiseDID,
      forDID,
      notificationOpenOptions: {
        uid,
        openMessageDirectly: true,
      },
    }

    yield put(updatePayloadToRelevantStoreAndRedirect(message))
  } catch (e) {
    captureError(e)
    yield put(
      fetchAdditionalDataError({
        code: 'OCS-000',
        message: `Invalid additional data: ${e}`,
      })
    )
  }
}

function* handleAriesMessage(message: DownloadedMessage): Generator<*, *, *> {
  let { senderDID, uid, type, decryptedPayload } = message
  const remotePairwiseDID = senderDID
  const connection: Connection[] = yield select(getConnection, senderDID)
  const {
    identifier: forDID,
    vcxSerializedConnection,
    logoUrl: senderLogoUrl,
    senderName,
  }: Connection = connection[0]
  const connectionHandle = yield call(
    getHandleBySerializedConnection,
    vcxSerializedConnection
  )

  try {
    if (!decryptedPayload) {
      // received message doesn't contain any payload, so just return
      return
    }

    let additionalData:
      | ClaimOfferMessagePayload
      | ProofRequestPushPayload
      | ClaimPushPayload
      | ClaimPushPayloadVcx
      | QuestionPayload
      | null = null

    let messageType = null

    // if we don't find any matching type, then our type can be expected from aries
    // now we can try to look inside decryptedpayload
    const payload = JSON.parse(decryptedPayload)
    const payloadType = payload['@type']

    if (
      payloadType.name === 'CRED_OFFER' ||
      payloadType.name === 'credential-offer'
    ) {
      const message = payload['@msg']
      const parseMessage = JSON.parse(message)

      const messageId = uid

      if (parseMessage && parseMessage[0]) {
        uid = parseMessage[0]['thread_id']
      }

      // update type so that messages can be processed and added
      messageType = MESSAGE_TYPE.CLAIM_OFFER

      const { claimHandle, claimOffer } = yield call(
        createCredentialWithAriesOffer,
        uid,
        message
      )
      yield fork(saveSerializedClaimOffer, claimHandle, forDID, uid)

      additionalData = {
        ...claimOffer,
        remoteName: senderName,
        issuer_did: senderDID,
        from_did: senderDID,
        to_did: forDID,
      }
      yield fork(updateMessageStatus, [
        { pairwiseDID: forDID, uids: [messageId] },
      ])
    }

    if (
      type === MESSAGE_TYPE.CLAIM ||
      payloadType.name === 'CRED' ||
      payloadType.name === 'credential'
    ) {
      const message = payload['@msg']

      messageType = MESSAGE_TYPE.CLAIM
      additionalData = {
        connectionHandle,
        message,
      }
    }

    if (
      type === MESSAGE_TYPE.PROOF_REQUEST ||
      ['proof_request', 'proof-request', 'presentation-request'].includes(
        payloadType.name.toLowerCase()
      )
    ) {
      const message = payload['@msg']

      messageType = MESSAGE_TYPE.PROOF_REQUEST

      const proofHandle = yield call(proofCreateWithRequest, uid, message)

      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])

      additionalData = {
        ...JSON.parse(message),
        proofHandle,
      }
    }

    if (payloadType.name === 'handshake-reuse-accepted') {
      yield call(processAttachedRequest, forDID)

      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
    }

    if (payloadType.name === 'committed-question') {
      additionalData = convertDecryptedPayloadToQuestion(
        connectionHandle,
        decryptedPayload,
        uid,
        forDID,
        senderDID,
        '',
        ''
      )

      messageType = MESSAGE_TYPE.QUESTION

      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
    }

    if (payloadType.name === 'question') {
      additionalData = convertDecryptedPayloadToAriesQuestion(
        connectionHandle,
        decryptedPayload,
        uid,
        forDID,
        senderDID
      )

      messageType = MESSAGE_TYPE.QUESTION

      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
    }

    if (payloadType.name === 'invite-action') {
      additionalData = convertDecryptedPayloadToInviteAction(
        connectionHandle,
        decryptedPayload,
        uid,
        forDID,
        senderDID,
        senderName
      )

      messageType = MESSAGE_TYPE.INVITE_ACTION

      yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
    }

    if (payloadType && payloadType.name === 'aries' && payload['@msg']) {
      const payloadMessageType = JSON.parse(payload['@msg'])['@type']

      if (
        payloadMessageType &&
        payloadMessageType.includes('connections') &&
        (payloadMessageType.endsWith('response') ||
          payloadMessageType.endsWith('problem_report'))
      ) {
        // if we receive connection response message or connection problem report
        // we need to update state of related corresponding connection object
        yield call(
          updateAriesConnectionState,
          forDID,
          vcxSerializedConnection,
          payload['@msg']
        )

        // as we handled the received message we need to update its status
        // to read
        yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
      }

      if (payloadMessageType && payloadMessageType.endsWith('ack')) {
        // if we have just ack data then for now send acknowledge to server
        // so that we don't download it again
        yield fork(updateMessageStatus, [{ pairwiseDID: forDID, uids: [uid] }])
      }
    }

    if (!additionalData) {
      // we did not get any data or either push notification type is not supported
      return
    }

    const message = {
      type: messageType || type,
      additionalData: {
        remoteName: senderName,
        ...additionalData,
      },
      uid,
      senderLogoUrl,
      remotePairwiseDID,
      forDID,
      notificationOpenOptions: {
        uid,
        openMessageDirectly: true,
      },
    }

    yield put(updatePayloadToRelevantStoreAndRedirect(message))
  } catch (e) {
    captureError(e)
    yield put(
      fetchAdditionalDataError({
        code: 'OCS-000',
        message: `Invalid additional data: ${e}`,
      })
    )
  }
}

// TODO: change the data type from any to proper type
export function* acknowledgeServer(
  data: Array<DownloadedConnectionMessages>
): Generator<*, *, *> {
  // toLowerCase here to handle type 'question' and 'Question'
  const msgTypes = [MESSAGE_TYPE.QUESTION, MESSAGE_TYPE.QUESTION.toLowerCase()]
  let acknowledgeServerData: AcknowledgeServerData = []
  let tempData = data
  if (Array.isArray(tempData) && tempData.length > 0) {
    tempData.map((msgData) => {
      let pairwiseDID = msgData.pairwiseDID
      let uids = []
      if (msgData['msgs'] && Array.isArray(msgData['msgs'])) {
        msgData['msgs'].map((msg) => {
          // Check for Aries protocol
          let decryptedPayload =
            msg['decryptedPayload'] && JSON.parse(msg['decryptedPayload'])
          let isAries = false
          let isMsgTypeAriesQuestion = false
          if (decryptedPayload) {
            isAries = decryptedPayload['@type']['name'] === 'aries'
            isMsgTypeAriesQuestion = JSON.parse(decryptedPayload['@msg'])[
              '@type'
            ].includes('question')
          }

          if (isAries) {
            if (
              msg.statusCode === MESSAGE_RESPONSE_CODE.MESSAGE_PENDING &&
              isMsgTypeAriesQuestion
            ) {
              uids.push(msg.uid)
            }
          } else if (
            msg.statusCode === MESSAGE_RESPONSE_CODE.MESSAGE_PENDING &&
            msgTypes.indexOf(msg.type) >= 0
          ) {
            uids.push(msg.uid)
          }
        })
      }
      if (uids.length > 0)
        acknowledgeServerData.push({
          pairwiseDID,
          uids,
        })
    })
    if (acknowledgeServerData.length > 0)
      yield updateMessageStatus(acknowledgeServerData)
  }
}

export function* updateMessageStatus(
  acknowledgeServerData: AcknowledgeServerData
): Generator<*, *, *> {
  if (!Array.isArray(acknowledgeServerData)) {
    yield put(acknowledgeMessagesFail('Empty Array'))
    return
  }
  try {
    const messagesToAck = JSON.stringify(acknowledgeServerData)
    yield call(updateMessages, 'MS-106', messagesToAck)
  } catch (e) {
    captureError(e)
    yield put(
      acknowledgeMessagesFail(`failed at updateMessages api, ${e.message}`)
    )
  }
}

export function* watchGetMessagesSaga(): any {
  yield takeLeading(
    [VCX_INIT_SUCCESS, GET_UN_ACKNOWLEDGED_MESSAGES],
    getMessagesSaga
  )
}

export const getUnacknowledgedMessages = (
  uid?: string,
  forDid?: string
): GetUnacknowledgedMessagesAction => ({
  type: GET_UN_ACKNOWLEDGED_MESSAGES,
  uid,
  forDid,
})
export const getMessagesLoading = (): GetMessagesLoadingAction => ({
  type: GET_MESSAGES_LOADING,
})

export const getMessagesSuccess = (): GetMessagesSuccessAction => ({
  type: GET_MESSAGES_SUCCESS,
})

export const acknowledgeMessages = (): AcknowledgeMessagesAction => ({
  type: ACKNOWLEDGE_MESSAGES,
})

export const getMessagesFail = (): GetMessagesFailAction => ({
  type: GET_MESSAGES_FAIL,
})

export const acknowledgeMessagesFail = (
  message: string
): AcknowledgeMessagesFailAction => ({
  type: ACKNOWLEDGE_MESSAGES_FAIL,
  error: message,
})

export function* watchConfig(): any {
  yield all([
    watchSwitchErrorAlerts(),
    watchSwitchEnvironment(),
    watchChangeEnvironmentUrl(),
    watchVcxInitStart(),
    watchVcxInitPoolStart(),
    persistEnvironmentDetails(),
  ])
}

export const getEnvironmentName = (configStore: ConfigStore) => {
  const { agencyUrl } = configStore

  return findKey(baseUrls, (environment) => environment.agencyUrl === agencyUrl)
}

export default function configReducer(
  state: ConfigStore = initialState,
  action: ConfigAction
) {
  switch (action.type) {
    case SERVER_ENVIRONMENT_CHANGED:
      const urls = baseUrls[action.serverEnvironment]
      return {
        ...state,
        ...urls,
      }
    case ALREADY_INSTALLED_RESULT:
      return {
        ...state,
        isAlreadyInstalled: action.isAlreadyInstalled,
      }
    case HYDRATED:
      return {
        ...state,
        isHydrated: true,
      }
    case INITIALIZED:
      return {
        ...state,
        isInitialized: true,
      }
    case APP_INSTALLED:
      return {
        ...state,
        isAlreadyInstalled: true,
      }
    case TOGGLE_ERROR_ALERTS:
      return {
        ...state,
        showErrorAlerts: action.isShowErrorAlert,
      }
    case SWITCH_ENVIRONMENT:
      return {
        ...state,
        poolConfig: action.poolConfig,
        agencyDID: action.agencyDID,
        agencyVerificationKey: action.agencyVerificationKey,
        agencyUrl: action.agencyUrl,
        paymentMethod: action.paymentMethod,
      }
    case VCX_INIT_NOT_STARTED:
      return {
        ...state,
        vcxInitializationState: VCX_INIT_NOT_STARTED,
        vcxInitializationError: null,
      }
    case VCX_INIT_START:
      return {
        ...state,
        vcxInitializationState: VCX_INIT_START,
        vcxInitializationError: null,
        isLoading: true,
      }
    case VCX_INIT_SUCCESS:
      return {
        ...state,
        vcxInitializationState: VCX_INIT_SUCCESS,
        isVcxInitFailed: false,
        isLoading: false,
      }
    case VCX_INIT_FAIL:
      return {
        ...state,
        vcxInitializationState: VCX_INIT_FAIL,
        vcxInitializationError: action.error,
        isVcxInitFailed: true,
        isLoading: false,
      }
    case VCX_INIT_POOL_NOT_STARTED:
      return {
        ...state,
        vcxPoolInitializationState: VCX_INIT_POOL_NOT_STARTED,
        vcxPoolInitializationError: null,
      }
    case VCX_INIT_POOL_START:
      return {
        ...state,
        vcxPoolInitializationState: VCX_INIT_POOL_START,
        vcxPoolInitializationError: null,
        isLoading: true,
      }
    case VCX_INIT_POOL_SUCCESS:
      return {
        ...state,
        vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
        isVcxPoolInitFailed: false,
        isLoading: false,
      }
    case VCX_INIT_POOL_FAIL:
      return {
        ...state,
        vcxPoolInitializationState: VCX_INIT_POOL_FAIL,
        vcxPoolInitializationError: action.error,
        isVcxPoolInitFailed: true,
        isLoading: false,
      }
    case GET_UN_ACKNOWLEDGED_MESSAGES:
      return {
        ...state,
        isLoading: true,
      }
    case GET_MESSAGES_FAIL:
      return {
        ...state,
        isGetMessagesFailed: true,
        isLoading: false,
      }
    case GET_MESSAGES_LOADING:
    case GET_MESSAGES_SUCCESS:
      return {
        ...state,
        messageDownloadStatus: action.type,
        isGetMessagesFailed: false,
        isLoading: true,
      }
    case SHOW_SNACK_ERROR:
      return {
        ...state,
        snackError: action.error,
      }
    case CLEAR_SNACK_ERROR:
      return {
        ...state,
        snackError: null,
      }
    default:
      return state
  }
}
