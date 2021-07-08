// @flow
import { Platform } from 'react-native'
import { all, call, fork, put, race, select, take, takeLeading } from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import PushNotificationIOS from '@react-native-community/push-notification-ios'
import {
  getAllConnectionsPairwiseDid,
  getConfig,
  getConnection,
  getCurrentScreen,
  getErrorAlertsSwitchValue,
  getHydrationState,
  getUserOneTimeInfo,
} from './store-selector'
import type {
  AcknowledgeMessagesAction,
  AcknowledgeMessagesFailAction,
  AcknowledgeServerData,
  ConfigAction,
  ConfigStore,
  DownloadedConnectionMessages,
  DownloadedConnectionsWithMessages,
  DownloadedMessage,
  GetMessagesFailAction,
  GetMessagesLoadingAction,
  GetMessagesSuccessAction,
  GetUnacknowledgedMessagesAction,
} from './type-config-store'
import {
  ACKNOWLEDGE_MESSAGES,
  ACKNOWLEDGE_MESSAGES_FAIL,
  ALREADY_INSTALLED_RESULT,
  APP_INSTALLED,
  CLEAR_SNACK_ERROR,
  ERROR_VCX_INIT_FAIL,
  ERROR_VCX_PROVISION_FAIL,
  GET_MESSAGES_FAIL,
  GET_MESSAGES_LOADING,
  GET_MESSAGES_SUCCESS,
  GET_UN_ACKNOWLEDGED_MESSAGES,
  HYDRATED,
  INITIALIZED,
  MESSAGE_RESPONSE_CODE,
  SHOW_SNACK_ERROR,
  TOGGLE_ERROR_ALERTS,
  UNSAFE_SCREENS_TO_DOWNLOAD_SMS,
  VCX_INIT_FAIL,
  VCX_INIT_NOT_STARTED,
  VCX_INIT_POOL_FAIL,
  VCX_INIT_POOL_NOT_STARTED,
  VCX_INIT_POOL_START,
  VCX_INIT_POOL_SUCCESS,
  VCX_INIT_START,
  VCX_INIT_SUCCESS,
} from './type-config-store'
import type { CustomError, GenericObject } from '../common/type-common'
import { RESET } from '../common/type-common'
import { schemaValidator } from '../services/schema-validator'
import {
  createCredentialWithAriesOffer,
  createCredentialWithProprietaryOffer,
  downloadMessages,
  getHandleBySerializedConnection,
  init,
  initPool,
  proofCreateWithRequest,
  toBase64FromUtf8,
  updateMessages,
  vcxShutdown,
} from '../bridge/react-native-cxs/RNCxs'
import type { Connection } from './type-connection-store'
import {
  fetchAdditionalDataError,
  setFetchAdditionalDataPendingKeys,
  updatePayloadToRelevantStoreAndRedirect,
  updatePayloadToRelevantStoreSaga,
} from '../push-notification/push-notification-store'
import type { UserOneTimeInfo } from './user/type-user-store'
import { connectRegisterCreateAgentDone } from './user/user-store'
import findKey from 'lodash.findkey'
import { SAFE_TO_DOWNLOAD_SMS_INVITATION } from '../sms-pending-invitation/type-sms-pending-invitation'
import { GENESIS_FILE_NAME, MESSAGE_TYPE } from '../api/api-constants'
import type { ClaimOfferMessagePayload } from './../push-notification/type-push-notification'
import type { ProofRequestPushPayload } from '../proof-request/type-proof-request'
import type { ClaimPushPayload } from './../claim/type-claim'
import type { QuestionPayload } from './../question/type-question'
import { saveSerializedClaimOffer } from './../claim-offer/claim-offer-store'
import { getAllConnections, getPendingFetchAdditionalDataKey } from './store-selector'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'
import { ensureVcxInitSuccess } from './route-store'
import { registerCloudAgentWithoutToken, registerCloudAgentWithToken } from './user/cloud-agent'
import { processAttachedRequest, updateAriesConnectionState } from '../invitation/invitation-store'
import { COMMITEDANSWER_PROTOCOL, QUESTIONANSWER_PROTOCOL } from '../question/type-question'
import { autoAcceptCredentialPresentationRequest } from '../external-imports'
import type { InviteActionData, InviteActionPayload, InviteActionRequest } from '../invite-action/type-invite-action'
import { INVITE_ACTION_PROTOCOL } from '../invite-action/type-invite-action'
import { retrySaga } from '../api/api-utils'
import { CLOUD_AGENT_UNAVAILABLE } from '../bridge/react-native-cxs/error-cxs'
import { updateVerifierState } from '../verifier/verifier-store'
import { presentationProposalSchema } from '../proof-request/proof-request-qr-code-reader'
import { deleteOneTimeConnection, deleteOneTimeConnectionOccurredSaga } from './connections-store'
import { getAttachedRequestData } from '../invitation/invitation-helpers'
import { environments, defaultEnvironment } from '../environment'
import {
  persistEnvironmentDetails,
  watchChangeEnvironmentUrl,
  watchSwitchEnvironment,
} from '../switch-environment/switсh-environment-store'
import {
  SERVER_ENVIRONMENT_CHANGED,
  SWITCH_ENVIRONMENT,
  SWITCH_ERROR_ALERTS,
} from '../switch-environment/type-switch-environment'

const initialState: ConfigStore = {
  ...environments[defaultEnvironment],
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

export const reset = () => ({
  type: RESET,
})

export function* resetStore(): Generator<*, *, *> {
  yield put(reset())
}

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
}

export function* connectToPool(): Generator<*, *, *> {
  const { agencyUrl }: ConfigStore = yield select(getConfig)

  const configName = getConfigName(agencyUrl)
  const environment = environments[configName]
  if (!environment) {
    yield put(vcxInitPoolFail(ERROR_VCX_INIT_FAIL('Cannot find requested configuration')))
    return
  }

  // re-try init pool 2 times, if it does not get success, raise fail
  let lastInitException = new Error('')
  for (let i = 0; i < 2; i++) {
    try {
      yield call(initPool, environment.poolConfig)
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

export const getConfigName = (agencyUrl: string) => {
  return findKey(environments, (environment) => environment.agencyUrl === agencyUrl)
}

export const getGenesisFileName = (agencyUrl: string) => {
  return (
    GENESIS_FILE_NAME +
    '_' +
    findKey(environments, (environment) => environment.agencyUrl === agencyUrl)
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
  params: ?GetUnacknowledgedMessagesAction,
): Generator<*, *, *> {
  try {
    const userOneTimeInfo = yield select(getUserOneTimeInfo)
    if (!userOneTimeInfo) {
      // agent has not been provisioned yet
      return
    }

    //make sure vcx is initialized
    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      yield take(VCX_INIT_SUCCESS)
    }
    const allConnectionsPairwiseDids = yield select(
      getAllConnectionsPairwiseDid,
    )
    // we don't have any connections.
    // So, we don't need to query Agent for new messages
    if (allConnectionsPairwiseDids.length === 0) {
      yield put(getMessagesSuccess())
      return
    }
    yield put(getMessagesLoading())
    const data = yield* retrySaga(
      call(
        downloadMessages,
        MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
        params?.uid || null,
        params?.forDid || allConnectionsPairwiseDids.join(','),
      ),
      CLOUD_AGENT_UNAVAILABLE,
    )
    if (data && data.length > 0) {
      try {
        if (Platform.OS === 'ios') {
          // Remove all the FCM notifications from the tray
          PushNotificationIOS.removeAllDeliveredNotifications()
        }
        const parsedData: DownloadedConnectionsWithMessages = JSON.parse(data)
        yield* processMessages(parsedData)
        yield fork(acknowledgeServer, parsedData)
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
  data: DownloadedConnectionsWithMessages,
): Array<DownloadedMessage> => {
  let messages: Array<DownloadedMessage> = []
  if (Array.isArray(data)) {
    data.map(
      (connection) =>
        connection &&
        connection.msgs &&
        connection.msgs.map((message) => {
          messages.push({ ...message, pairwiseDID: connection.pairwiseDID })
        }),
    )
  } else {
    return []
  }
  return messages
}

export function* processMessages(
  data: DownloadedConnectionsWithMessages,
): Generator<*, *, *> {
  // send each message in data to handleMessage
  // additional data will be fetched and passed to relevant( claim, claimOffer, proofRequest,etc )store.
  const messages: Array<DownloadedMessage> = traverseAndGetAllMessages(data)
  const dataAlreadyExists = yield select(getPendingFetchAdditionalDataKey)

  for (let i = 0; i < messages.length; i++) {
    try {
      let pairwiseDID = messages[i].pairwiseDID || ''

      if (
        !(
          dataAlreadyExists &&
          dataAlreadyExists[`${messages[i].uid}-${pairwiseDID}`]
        )
      ) {
        yield put(
          setFetchAdditionalDataPendingKeys(messages[i].uid, pairwiseDID),
        )

        // get message type
        let isAries = messages[i].type === MESSAGE_TYPE.ARIES

        if (isAries) {
          yield fork(handleAriesMessage, messages[i])
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

export const convertToAriesProofRequest = async (message: GenericObject) =>
  JSON.stringify({
    '@type': 'https://didcomm.org/present-proof/1.0/request-presentation',
    '@id': message['thread_id'],
    comment: 'Verification Request',
    'request_presentations~attach': [
      {
        '@id': 'libindy-request-presentation-0',
        'mime-type': 'application/json',
        data: {
          base64: await toBase64FromUtf8(
            JSON.stringify(message['proof_request_data']),
          ),
        },
      },
    ],
    '~service': message['~service'],
  })

export const convertDecryptedPayloadToQuestion = (
  connectionHandle: number,
  message: string,
  uid: string,
  forDID: string,
  senderDID: string,
  protocol: string,
): QuestionPayload => {
  const parsedMsg = JSON.parse(message)

  return {
    '@type': parsedMsg['@type'],
    protocol: protocol,
    messageId: parsedMsg['@id'],
    question_text: parsedMsg.question_text,
    question_detail: parsedMsg.question_detail,
    valid_responses: parsedMsg.valid_responses,
    nonce: protocol === QUESTIONANSWER_PROTOCOL ? parsedMsg.nonce : undefined,
    timing: protocol === QUESTIONANSWER_PROTOCOL ? parsedMsg['~timing'] : parsedMsg['@timing'],
    issuer_did: senderDID,
    remoteDid: '',
    uid,
    from_did: senderDID,
    forDID,
    connectionHandle,
    remotePairwiseDID: senderDID,
    messageTitle: parsedMsg.question_text || '',
    messageText: parsedMsg.question_detail || '',
    externalLinks: parsedMsg.external_links || [],
    originalQuestion: message,
  }
}

export const convertDecryptedPayloadToInviteAction = (
  connectionHandle: number,
  message: string,
  uid: string,
  forDID: string,
  senderDID: string,
  remoteName: string,
): InviteActionPayload => {
  const parsedMsg: InviteActionRequest = JSON.parse(message)

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
  } catch (e) {
  }

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
    originalInviteAction: message,
    remoteName,
  }
}

function* handleProprietaryMessage(
  downloadedMessage: DownloadedMessage,
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
    vcxSerializedConnection,
  )

  try {
    if (!decryptedPayload) {
      // received message doesn't contain any payload, so just return
      return
    }

    const message = JSON.parse(decryptedPayload)['@msg']
    if (!message) {
      // received message doesn't contain any payload, so just return
      return
    }

    let additionalData:
      | ClaimOfferMessagePayload
      | ProofRequestPushPayload
      | ClaimPushPayload
      | ClaimPushPayload
      | QuestionPayload
      | null = null

    let messageType = null

    // toLowerCase here to handle type 'question' and 'Question'
    if (type.toLowerCase() === MESSAGE_TYPE.QUESTION.toLowerCase()) {
      additionalData = convertDecryptedPayloadToQuestion(
        connectionHandle,
        message,
        uid,
        forDID,
        senderDID,
        COMMITEDANSWER_PROTOCOL,
      )
    }

    // proprietary credential offer
    if (type === MESSAGE_TYPE.CLAIM_OFFER) {
      // update type so that messages can be processed and added
      messageType = MESSAGE_TYPE.CLAIM_OFFER

      const { claimHandle, claimOffer } = yield call(
        createCredentialWithProprietaryOffer,
        uid,
        message,
      )
      yield fork(saveSerializedClaimOffer, claimHandle, forDID, uid)

      additionalData = {
        ...claimOffer,
        remoteName: senderName,
        issuer_did: senderDID,
        from_did: senderDID,
        to_did: forDID,
      }
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
      messageType = MESSAGE_TYPE.PROOF_REQUEST

      const proofHandle = yield call(proofCreateWithRequest, uid, message)

      additionalData = {
        ...JSON.parse(message),
        proofHandle,
      }
    }

    if (type === MESSAGE_TYPE.INVITE_ACTION) {
      additionalData = convertDecryptedPayloadToInviteAction(
        connectionHandle,
        message,
        uid,
        forDID,
        senderDID,
        senderName,
      )
    }

    if (!additionalData) {
      // we did not get any data or either push notification type is not supported
      return
    }

    const payload = {
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
      },
    }

    yield put(updatePayloadToRelevantStoreAndRedirect(payload))
  } catch (e) {
    captureError(e)
    yield put(
      fetchAdditionalDataError({
        code: 'OCS-000',
        message: `Invalid additional data: ${e}`,
      }),
    )
  }
}

function* handleAriesMessage(downloadMessage: DownloadedMessage): Generator<*, *, *> {
  let { uid, type, decryptedPayload, pairwiseDID } = downloadMessage

  const connections = yield select(getAllConnections)
  const connection = connections[pairwiseDID]
  if (!connection) {
    return
  }

  const senderDID = connection.senderDID
  const remotePairwiseDID = connection.senderDID

  if (!decryptedPayload) {
    // received message doesn't contain any payload, so just return
    return
  }

  const payload = JSON.parse(decryptedPayload)
  const payloadType = payload['@type']
  let message = payload['@msg']
  if (!message) {
    // received message doesn't contain any payload, so just return
    return
  }

  const {
    identifier: forDID,
    vcxSerializedConnection,
    logoUrl: senderLogoUrl,
    senderName,
    attachedRequest,
  }: Connection = connection

  const connectionHandle = yield call(
    getHandleBySerializedConnection,
    vcxSerializedConnection,
  )

  try {
    let additionalData:
      | ClaimOfferMessagePayload
      | ProofRequestPushPayload
      | ClaimPushPayload
      | ClaimPushPayload
      | QuestionPayload
      | null = null

    let messageType = null
    let redirectToScreen = true

    if (payloadType.name === 'credential-offer') {
      const parseMessage = JSON.parse(message)
      if (parseMessage && parseMessage[0]) {
        uid = parseMessage[0]['thread_id']
      }

      // update type so that messages can be processed and added
      messageType = MESSAGE_TYPE.CLAIM_OFFER

      const { claimHandle, claimOffer } = yield call(
        createCredentialWithAriesOffer,
        uid,
        message,
      )
      yield fork(saveSerializedClaimOffer, claimHandle, forDID, uid)

      additionalData = {
        ...claimOffer,
        remoteName: senderName,
        issuer_did: senderDID,
        from_did: senderDID,
        to_did: forDID,
      }
    }

    if (payloadType.name === 'credential') {
      messageType = MESSAGE_TYPE.CLAIM
      additionalData = {
        connectionHandle,
        message,
      }
    }

    if (payloadType.name === 'presentation-request') {
      messageType = MESSAGE_TYPE.PROOF_REQUEST
      let proofRequest = JSON.parse(message)

      if (proofRequest['~service']) {
        // Aries Proof Request
        message = yield call(convertToAriesProofRequest, proofRequest)
      }

      const proofHandle = yield call(proofCreateWithRequest, uid, message)

      additionalData = {
        ...proofRequest,
        proofHandle,
        identifier: forDID,
      }

      if (proofRequest['thread_id'] && attachedRequest) {
        const data = yield call(getAttachedRequestData, attachedRequest.data)

        if (
          data &&
          schemaValidator.validate(presentationProposalSchema, data) &&
          data['@id'] === proofRequest['thread_id']
        ) {
          yield fork(deleteOneTimeConnectionOccurredSaga, deleteOneTimeConnection(forDID))
          additionalData.ephemeralProofRequest = proofRequest['~service']
            ? message
            : undefined
          if (autoAcceptCredentialPresentationRequest) {
            additionalData.additionalPayloadInfo = {
              hidden: true,
              autoAccept: true,
            }
            redirectToScreen = false
          }
        }
      }
    }

    if (payloadType.name === 'handshake-reuse-accepted') {
      yield call(processAttachedRequest, connection)
    }

    if (payloadType.name === 'committed-question') {
      additionalData = convertDecryptedPayloadToQuestion(
        connectionHandle,
        message,
        uid,
        forDID,
        senderDID,
        COMMITEDANSWER_PROTOCOL,
      )
      messageType = MESSAGE_TYPE.QUESTION
    }

    if (payloadType.name === 'question') {
      additionalData = convertDecryptedPayloadToQuestion(
        connectionHandle,
        message,
        uid,
        forDID,
        senderDID,
        QUESTIONANSWER_PROTOCOL,
      )
      messageType = MESSAGE_TYPE.QUESTION
    }

    if (payloadType.name === 'invite-action') {
      additionalData = convertDecryptedPayloadToInviteAction(
        connectionHandle,
        message,
        uid,
        forDID,
        senderDID,
        senderName,
      )
      messageType = MESSAGE_TYPE.INVITE_ACTION
    }

    if (payloadType.name === 'presentation') {
      yield call(updateVerifierState, message)
    }

    if (payloadType.name === 'problem-report') {
      const payloadMessageType = JSON.parse(message)['@type']
      if (payloadMessageType && payloadMessageType.includes('present-proof')) {
        yield call(updateVerifierState, message)
      }
    }

    if (payloadType && payloadType.name === 'aries' && message) {
      const payloadMessageType = JSON.parse(message)['@type']

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
          message,
        )
      }

      if (payloadMessageType && payloadMessageType.endsWith('ack')) {
        // if we have just ack data then for now send acknowledge to server
        // so that we don't download it again
      }
    }

    if (!additionalData) {
      // we did not get any data or either push notification type is not supported
      return
    }

    const payload = {
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
      },
    }

    if (redirectToScreen) {
      yield put(updatePayloadToRelevantStoreAndRedirect(payload))
    } else {
      yield* updatePayloadToRelevantStoreSaga(payload)
    }
  } catch (e) {
    captureError(e)
    yield put(
      fetchAdditionalDataError({
        code: 'OCS-000',
        message: `Invalid additional data: ${e}`,
      }),
    )
  }
}

export function* acknowledgeServer(
  data: Array<DownloadedConnectionMessages>,
): Generator<*, *, *> {
  let tempData = data
  if (Array.isArray(tempData) && tempData.length > 0) {
    let acknowledgeServerData: AcknowledgeServerData = []
    tempData.forEach(msgData => {
      const uids = msgData.msgs
        // We need to omit proprietary CLAIM message. We update it only after actual processing
        .filter(msg => msg.type !== MESSAGE_TYPE.CLAIM)
        .map(msg => msg.uid)
      if (uids.length > 0)
        acknowledgeServerData.push({
          pairwiseDID: msgData.pairwiseDID,
          uids,
        })
    })
    if (acknowledgeServerData.length > 0) {
      yield updateMessageStatus(acknowledgeServerData)
    }
  }
}

export function* updateMessageStatus(
  acknowledgeServerData: AcknowledgeServerData,
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
      acknowledgeMessagesFail(`failed at updateMessages api, ${e.message}`),
    )
  }
}

export function* watchGetMessagesSaga(): any {
  yield takeLeading(
    [VCX_INIT_SUCCESS, GET_UN_ACKNOWLEDGED_MESSAGES],
    getMessagesSaga,
  )
}

export const getUnacknowledgedMessages = (
  uid?: string,
  forDid?: string,
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
  message: string,
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

export default function configReducer(
  state: ConfigStore = initialState,
  action: ConfigAction,
) {
  switch (action.type) {
    case SERVER_ENVIRONMENT_CHANGED:
      const urls = environments[action.serverEnvironment]
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
