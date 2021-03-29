// @flow
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {
  call,
  all,
  takeLatest,
  takeEvery,
  take,
  select,
  put,
  race,
} from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import { MESSAGE_TYPE } from '../api/api-constants'
import { captureError } from '../services/error/error-handler'
import {
  getIsAppLocked,
  getCurrentScreen,
  getBackupWalletHandle,
} from '../store/store-selector'
import {
  ALLOW_PUSH_NOTIFICATIONS,
  PUSH_NOTIFICATION_PERMISSION,
  PUSH_NOTIFICATION_UPDATE_TOKEN,
  PUSH_NOTIFICATION_RECEIVED,
  FETCH_ADDITIONAL_DATA,
  FETCH_ADDITIONAL_DATA_ERROR,
  HYDRATE_PUSH_TOKEN,
  FETCH_ADDITIONAL_DATA_PENDING_KEYS,
  UPDATE_RELEVANT_PUSH_PAYLOAD_STORE_AND_REDIRECT,
  UPDATE_RELEVANT_PUSH_PAYLOAD_STORE,
  SAVE_NOTIFICATION_OPEN_OPTIONS,
} from './type-push-notification'

import type {
  CustomError,
  NotificationPayload,
  ReactNavigation,
} from '../common/type-common'
import type {
  AdditionalDataPayload,
  PushNotificationUpdateTokenAction,
  FetchAdditionalDataAction,
  PushNotificationAction,
  PushNotificationStore,
  DownloadedNotification,
  ClaimOfferPushPayload,
  ClaimPushPayload,
  HydratePushTokenAction,
  updatePayloadToRelevantStoreAndRedirectAction,
  RedirectToRelevantScreen,
  NotificationOpenOptions,
} from './type-push-notification'
import {
  updatePushTokenVcx,
  vcxGetAgentMessages,
  updateWalletBackupStateWithMessage,
  backupWalletBackup,
} from '../bridge/react-native-cxs/RNCxs'
import {
  VCX_INIT_SUCCESS,
  MESSAGE_RESPONSE_CODE,
} from '../store/type-config-store'
import uniqueId from 'react-native-unique-id'
import { RESET } from '../common/type-common'
import { ensureVcxInitSuccess } from '../store/route-store'
import type {
  ProofRequestPushPayload,
  AdditionalProofDataPayload,
} from '../proof-request/type-proof-request'
import type { Claim } from '../claim/type-claim'
import { safeGet, safeSet, walletSet } from '../services/storage'
import {
  PUSH_COM_METHOD,
  LAST_SUCCESSFUL_CLOUD_BACKUP,
  homeRoute,
  inviteActionRoute,
} from '../common'
import type { NavigationParams, GenericObject } from '../common/type-common'

import { addPendingRedirection } from '../lock/lock-store'
import { claimOfferReceived } from '../claim-offer/claim-offer-store'
import { proofRequestReceived } from '../proof-request/proof-request-store'
import {
  updateMessageStatus,
  getUnacknowledgedMessages,
} from '../store/config-store'
import {
  claimOfferRoute,
  invitationRoute,
  proofRequestRoute,
  homeDrawerRoute,
  lockPinSetupRoute,
  lockTouchIdSetupRoute,
  lockPinSetupHomeRoute,
  lockEnterPinRoute,
  lockEnterFingerprintRoute,
  lockAuthorizationHomeRoute,
  questionRoute,
} from '../common'
import { claimReceivedVcx } from '../claim/claim-store'
import { questionReceived } from '../question/question-store'
import { customLogger } from '../store/custom-logger'
import {
  WALLET_FILE_NAME,
  AUTO_CLOUD_BACKUP_ENABLED,
  WALLET_BACKUP_FAILURE,
} from '../backup/type-backup'
import moment from 'moment'
import {
  cloudBackupSuccess,
  cloudBackupFailure,
  setAutoCloudBackupEnabled,
  viewedWalletError,
} from '../backup/backup-actions'
import { connectionHistoryBackedUp } from '../connection-history/connection-history-store'
import RNFetchBlob from 'rn-fetch-blob'
import { showInAppNotification } from '../in-app-notification/in-app-notification-actions'
import { ATTRIBUTE_TYPE } from '../proof-request/type-proof-request'
import { flattenAsync } from '../common/flatten-async'
import { Platform } from 'react-native'
import {usePushNotifications, vcxPushType} from '../external-imports'
import { inviteActionReceived } from '../invite-action/invite-action-store'

const blackListedRoute = {
  [proofRequestRoute]: proofRequestRoute,
  [claimOfferRoute]: claimOfferRoute,
  [lockPinSetupRoute]: lockPinSetupRoute,
  [lockTouchIdSetupRoute]: lockTouchIdSetupRoute,
  [lockPinSetupHomeRoute]: lockPinSetupHomeRoute,
  [lockEnterPinRoute]: lockEnterPinRoute,
  [lockEnterFingerprintRoute]: lockEnterFingerprintRoute,
  [lockAuthorizationHomeRoute]: lockAuthorizationHomeRoute,
  [invitationRoute]: invitationRoute,
  [questionRoute]: questionRoute,
}

const initialState = {
  isAllowed: null,
  notification: null,
  pushToken: null,
  isPristine: true,
  isFetching: false,
  error: null,
  pendingFetchAdditionalDataKey: null,
  navigateRoute: null,
  notificationOpenOptions: null,
}

export const pushNotificationPermissionAction = (isAllowed: boolean) => ({
  type: PUSH_NOTIFICATION_PERMISSION,
  isAllowed,
})

export const updatePushToken = (token: string) => ({
  type: PUSH_NOTIFICATION_UPDATE_TOKEN,
  token,
})

export function* onPushTokenUpdate(
  action: PushNotificationUpdateTokenAction
): Generator<*, *, *> {
  try {
    const pushToken = vcxPushType === 1 ? `FCM:${action.token}`: action.token
    const id = yield uniqueId()
    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      yield take(VCX_INIT_SUCCESS)
    }
    yield call(updatePushTokenVcx, { uniqueId: id, pushToken })
    yield* savePushTokenSaga(pushToken)
  } catch (e) {
    captureError(e)
  }
}

export function convertClaimOfferPushPayloadToAppClaimOffer(
  pushPayload: ClaimOfferPushPayload,
  extraPayload: { remotePairwiseDID: string }
): AdditionalDataPayload {
  /**
   * Below expression Converts this format
   * {
   *  name: ["Test"],
   *  height: ["170"]
   * }
   * TO
   * [
   *  {label: "name", data: "Test"},
   *  {label: "height", data: "170"},
   * ]
   */
  const revealedAttributes = Object.keys(pushPayload.claim).map(
    (attributeName) => {
      let attributeValue = pushPayload.claim[attributeName]
      if (Array.isArray(attributeValue)) {
        attributeValue = attributeValue[0]
      }
      return {
        label: attributeName,
        data: attributeValue,
        values: {},
      }
    }
  )

  return {
    issuer: {
      name: pushPayload.issuer_name || pushPayload.remoteName,
      did: pushPayload.issuer_did || extraPayload.remotePairwiseDID,
    },
    data: {
      name: pushPayload.claim_name,
      version: pushPayload.version,
      revealedAttributes,
      claimDefinitionSchemaSequenceNumber: pushPayload.schema_seq_no,
    },
    payTokenValue: pushPayload.price,
  }
}

export function convertProofRequestPushPayloadToAppProofRequest(
  pushPayload: ProofRequestPushPayload
): AdditionalProofDataPayload {
  const {
    proof_request_data,
    remoteName,
    proofHandle,
    ephemeralProofRequest,
    outofbandProofRequest,
  } = pushPayload
  const {
    requested_attributes,
    name,
    version,
    requested_predicates,
  } = proof_request_data

  const requestedAttributes = []
  Object.keys(requested_attributes).forEach((attributeKey) => {
    let attribute = requested_attributes[attributeKey]
    if (attribute.name) {
      requestedAttributes.push({
        label: attribute.name,
        values: {
          [attribute.name]: '',
        },
        type: ATTRIBUTE_TYPE.FILLED_ATTRIBUTE,
      })
    }

    // TODO:DA label is not used for multiple attributes, refactor is required
    if (attribute.names) {
      const names = attribute.names
      const values = names.reduce(
        (acc, name) => ({
          ...acc,
          [name]: '',
        }),
        {}
      )

      requestedAttributes.push({
        label: names.join(','),
        values: values,
        type: ATTRIBUTE_TYPE.FILLED_ATTRIBUTE,
      })
    }
  })

  if (requested_predicates) {
    Object.keys(requested_predicates).forEach((predicateKey) => {
      let attribute = requested_predicates[predicateKey]
      if (attribute.name) {
        requestedAttributes.push({
          label: attribute.name,
          p_type: attribute.p_type,
          p_value: attribute.p_value,
          type: ATTRIBUTE_TYPE.FILLED_PREDICATE,
        })
      }
    })
  }

  return {
    data: {
      name,
      version,
      requestedAttributes,
    },
    requester: {
      name: remoteName,
    },
    originalProofRequestData: proof_request_data,
    proofHandle,
    ephemeralProofRequest,
    outofbandProofRequest,
  }
}

export function convertClaimPushPayloadToAppClaim(
  pushPayload: ClaimPushPayload,
  uid: string,
  forDID: string
): Claim {
  return {
    ...pushPayload,
    messageId: pushPayload.claim_offer_id,
    remoteDid: pushPayload.from_did,
    uid,
    forDID,
  }
}

export const allowPushNotifications = () => ({
  type: ALLOW_PUSH_NOTIFICATIONS,
})

export function* enablePushNotificationsSaga(
  force?: boolean
): Generator<*, *, *> {
  // NOTE: Enable push notification
  if (usePushNotifications) {
    const pushToken = yield call(safeGet, PUSH_COM_METHOD)
    if (!pushToken || force) {
      yield call(() => messaging().requestPermission())
      yield put(pushNotificationPermissionAction(true))
    }
  }
}

function* allowPushNotificationsSaga(): Generator<*, *, *> {
  const pushToken = yield call(safeGet, PUSH_COM_METHOD)
  if (!pushToken) {
    const authorizationStatus: FirebaseMessagingTypes.AuthorizationStatus = yield call(
      () => messaging().requestPermission()
    )
    if (
      Platform.OS === 'android' ||
      [
        messaging.AuthorizationStatus.AUTHORIZED,
        messaging.AuthorizationStatus.PROVISIONAL,
      ].includes(authorizationStatus)
    ) {
      // if user provides push notification permission
      // then go ahead and get token from firebase
      // if getting token from firebase takes more than 2 minute
      // then cancel the task and return error
      // race timeout and getFirebaseToken
      const [
        [notificationTokenError, notificationToken],
        refreshedNotificationToken,
        getTokenTimeout,
      ] = yield race([
        call(flattenAsync(() => messaging().getToken())),
        call(onTokenRefresh),
        call(delay, 120000),
      ])
      if (!notificationToken && !refreshedNotificationToken) {
        console.log(
          `PN-006::Failed to get notification token, ${
            notificationTokenError || getTokenTimeout || ''
          }`
        )
      } else {
        // We might get notification token either from getToken, or from onRefresh
        const fcmNotificationToken =
          notificationToken || refreshedNotificationToken
        if (fcmNotificationToken) {
          yield put(updatePushToken(fcmNotificationToken))
        }
      }
    }

    yield put(pushNotificationPermissionAction(!!authorizationStatus))
  }
}

function onTokenRefresh() {
  return new Promise((resolve) => messaging().onTokenRefresh(resolve))
}

function* watchAllowPushNotification(): any {
  yield takeLatest(ALLOW_PUSH_NOTIFICATIONS, allowPushNotificationsSaga)
}

function* watchPushTokenUpdate(): any {
  yield takeLatest(PUSH_NOTIFICATION_UPDATE_TOKEN, onPushTokenUpdate)
}

export const pushNotificationReceived = (
  notification: DownloadedNotification
) => ({
  type: PUSH_NOTIFICATION_RECEIVED,
  notification,
})

export const fetchAdditionalData = (
  notificationPayload: NotificationPayload,
  notificationOpenOptions: ?NotificationOpenOptions
) => ({
  type: FETCH_ADDITIONAL_DATA,
  notificationPayload,
  notificationOpenOptions,
})

export const fetchAdditionalDataError = (error: CustomError) => ({
  type: FETCH_ADDITIONAL_DATA_ERROR,
  error,
})

export const setFetchAdditionalDataPendingKeys = (
  uid: string,
  forDID: string
) => ({
  type: FETCH_ADDITIONAL_DATA_PENDING_KEYS,
  uid,
  forDID,
})

export const saveNotificationOpenOptions = (
  notificationOpenOptions: NotificationOpenOptions
) => ({
  type: SAVE_NOTIFICATION_OPEN_OPTIONS,
  payload: notificationOpenOptions,
})

export function* fetchAdditionalDataSaga(
  action: FetchAdditionalDataAction
): Generator<*, *, *> {
  const { uid, type, msgType, forDID } = action.notificationPayload
  const { notificationOpenOptions } = action

  // Agency added new field `msgType` into push notification which should be used or go fallback to using `type`
  const type_ = msgType || type || ''

  // NOTE: CLOUD-BACKUP wait for push notification after createWalletBackup
  if (type_ === MESSAGE_TYPE.WALLET_BACKUP_READY) {
    try {
      // NOTE: CLOUD-BACKUP-STEP-2 get message
      const data = yield call(
        vcxGetAgentMessages,
        MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
        uid
      )

      let message = data.substring(1, data.length - 1)

      yield put(
        pushNotificationReceived({
          additionalData: message,
          type: type_,
          uid,
          remotePairwiseDID: 'NA',
          forDID: 'NA',
          notificationOpenOptions,
        })
      )

      // CLOUD-BACKUP-STEP-3
      const walletHandle = yield select(getBackupWalletHandle)
      yield call(updateWalletBackupStateWithMessage, walletHandle, message)

      const { fs } = RNFetchBlob
      const documentDirectory: string = fs.dirs.DocumentDir
      const backupTimeStamp = moment().format('YYYY-MM-DD-HH-mm-ss')
      let destinationZipPath: string = `${documentDirectory}/${WALLET_FILE_NAME}-${backupTimeStamp}.zip`

      // NOTE: similar logic is shareBackupSaga, not sure if this is needed
      // if (Platform.OS === 'android') {
      //   destinationZipPath = `file://${destinationZipPath}`
      // }

      // NOTE: CLOUD-BACKUP-STEP-4
      yield call(backupWalletBackup, walletHandle, destinationZipPath)
      return
    } catch (error) {
      customLogger.log(error)
      yield put(cloudBackupFailure('error'))
      return
    }
  }

  if (type_ === WALLET_BACKUP_FAILURE) {
    yield put(
      pushNotificationReceived({
        pushNotifMsgText: action.notificationPayload.pushNotifMsgText,
        pushNotifMsgTitle: action.notificationPayload.pushNotifMsgTitle,
        uid,
        type: type_,
        remotePairwiseDID: 'NA',
        forDID: 'NA',
        additionalData: {},
        notificationOpenOptions,
      })
    )
    walletSet(AUTO_CLOUD_BACKUP_ENABLED, 'false')
    safeSet(AUTO_CLOUD_BACKUP_ENABLED, 'false')
    safeSet(WALLET_BACKUP_FAILURE, 'true')
    yield put(setAutoCloudBackupEnabled(false))
    yield put(viewedWalletError(false))
    yield put(cloudBackupFailure(WALLET_BACKUP_FAILURE))
    return
  }

  // NOTE: CLOUD-BACKUP wait for push notification after backupWalletBackup
  if (type_ === MESSAGE_TYPE.WALLET_BACKUP_ACK) {
    try {
      //  NOTE: CLOUD-BACKUP-STEP-5
      const data = yield call(
        vcxGetAgentMessages,
        MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
        uid
      )

      let message = data.substring(1, data.length - 1)
      yield put(
        pushNotificationReceived({
          additionalData: message,
          type: type_,
          uid,
          remotePairwiseDID: 'NA',
          forDID: 'NA',
          notificationOpenOptions,
        })
      )

      // NOTE: CLOUD-BACKUP-STEP-6
      const walletHandle = yield select(getBackupWalletHandle)
      yield call(updateWalletBackupStateWithMessage, walletHandle, message)

      // NOTE: CLOUD-BACKUP-STEP-7 serialization(NOT IMPLEMENTED)

      const lastSuccessfulCloudBackup = moment().format()
      yield put(connectionHistoryBackedUp())
      safeSet(LAST_SUCCESSFUL_CLOUD_BACKUP, lastSuccessfulCloudBackup)
      yield put(cloudBackupSuccess(lastSuccessfulCloudBackup))
      return
    } catch (error) {
      customLogger.log(error)
      yield put(cloudBackupFailure('error'))
      return
    }
  }

  // Any message type except wallet backup we are using downloadMessagesSaga to download and process messages.
  // NotificationOpenOptions is used to identify which notification the user clicked on, which is used to open
  // the exact message.
  yield put(saveNotificationOpenOptions(notificationOpenOptions))
  yield put(getUnacknowledgedMessages(uid, forDID))
}

export const updatePayloadToRelevantStoreAndRedirect = (
  notification: DownloadedNotification
) => ({
  type: UPDATE_RELEVANT_PUSH_PAYLOAD_STORE_AND_REDIRECT,
  notification,
})

export const updatePayloadToRelevantStore = (
  notification: DownloadedNotification
) => ({
  type: UPDATE_RELEVANT_PUSH_PAYLOAD_STORE,
  notification,
})

export const goToUIScreen = (
  uiType: string,
  uid: string,
  navigation: $PropertyType<ReactNavigation, 'navigation'>
) => ({
  type: 'GO_TO_UI_SCREEN',
  uiType,
  uid,
  navigation,
})

function* watchUpdateRelevantPushPayloadStoreAndRedirect(): any {
  yield takeEvery(UPDATE_RELEVANT_PUSH_PAYLOAD_STORE_AND_REDIRECT, function* ({
    notification,
  }: updatePayloadToRelevantStoreAndRedirectAction) {
    yield* updatePayloadToRelevantStoreSaga(notification)
    yield* redirectToRelevantScreen({ ...notification, uiType: null })
    const { forDID: pairwiseDID, uid } = notification
    const directStatusUpdateMessageTypes = [
      MESSAGE_TYPE.QUESTION,
      MESSAGE_TYPE.QUESTION.toLowerCase(),
    ]
    if (directStatusUpdateMessageTypes.indexOf(notification.type) > -1) {
      yield* updateMessageStatus([{ pairwiseDID, uids: [uid] }])
    }
  })
}

export function* watchGoToUIScreen(): any {
  yield takeEvery('GO_TO_UI_SCREEN', redirectToRelevantScreen)
}

export function* updatePayloadToRelevantStoreSaga(
  message: DownloadedNotification
): Generator<*, *, *> {
  const {
    type,
    additionalData,
    uid,
    senderLogoUrl,
    remotePairwiseDID,
    forDID,
  } = message
  if (type) {
    switch (type) {
      case MESSAGE_TYPE.CLAIM_OFFER:
        yield put(
          claimOfferReceived(
            convertClaimOfferPushPayloadToAppClaimOffer(additionalData, {
              remotePairwiseDID,
            }),
            {
              uid,
              senderLogoUrl,
              remotePairwiseDID,
            }
          )
        )

        break
      case MESSAGE_TYPE.PROOF_REQUEST:
        yield put(
          proofRequestReceived(
            convertProofRequestPushPayloadToAppProofRequest(additionalData),
            {
              uid,
              senderLogoUrl,
              remotePairwiseDID,
            }
          )
        )
        break
      case MESSAGE_TYPE.CLAIM:
        yield put(
          claimReceivedVcx({
            connectionHandle: additionalData.connectionHandle,
            uid,
            type,
            forDID,
            remotePairwiseDID,
            msg: additionalData.message,
          })
        )
        break
      case MESSAGE_TYPE.QUESTION:
      case MESSAGE_TYPE.QUESTION.toLowerCase():
        yield put(questionReceived(additionalData))
        break
      case MESSAGE_TYPE.INVITE_ACTION:
        yield put(inviteActionReceived(additionalData))
        break
    }
  }
}

function* redirectToRelevantScreen(notification: RedirectToRelevantScreen) {
  const {
    additionalData,
    uiType,
    type,
    uid,
    notificationOpenOptions,
    remotePairwiseDID,
    forDID,
  } = notification
  if (uiType || type) {
    let routeToDirect = null
    let notificationText = ''
    switch (uiType || type) {
      case 'CLAIM_OFFER_RECEIVED':
      case MESSAGE_TYPE.CLAIM_OFFER:
        routeToDirect = claimOfferRoute
        notificationText = `Offering ${additionalData.claim_name}`
        break

      case MESSAGE_TYPE.PROOF_REQUEST:
      case 'PROOF_REQUEST_RECEIVED':
        routeToDirect = proofRequestRoute
        notificationText = `${additionalData.remoteName} wants you to share information`
        break

      case MESSAGE_TYPE.QUESTION:
      case MESSAGE_TYPE.QUESTION.toLowerCase():
        routeToDirect = questionRoute
        notificationText = `${additionalData.messageTitle}`
        break

      case MESSAGE_TYPE.INVITE_ACTION:
      case MESSAGE_TYPE.INVITE_ACTION.toLowerCase():
        routeToDirect = inviteActionRoute
        notificationText = `${additionalData.messageTitle}`
        break
    }

    if (routeToDirect) {
      yield handleRedirection(
        routeToDirect,
        {
          uid,
          notificationOpenOptions,
          senderDID: remotePairwiseDID,
          image: additionalData.senderLogoUrl,
          senderName: additionalData.remoteName,
          messageType: type,
          identifier: forDID,
        },
        notification,
        notificationText
      )
    }
  }
}

function* handleRedirection(
  routeName: string,
  params: NavigationParams,
  notification: RedirectToRelevantScreen,
  notificationText: string
): any {
  const isAppLocked: boolean = yield select(getIsAppLocked)
  if (isAppLocked) {
    yield put(
      addPendingRedirection([
        { routeName: homeRoute, params: { screen: homeDrawerRoute } },
        { routeName, params },
      ])
    )
    return
  }

  const currentScreen: string = yield select(getCurrentScreen)
  if (!blackListedRoute[currentScreen]) {
    if (
      params.notificationOpenOptions &&
      params.notificationOpenOptions.openMessageDirectly
    ) {
      // if we find that we can open notification directly
      // i.e. we received this notification from user tapping on notification
      // from notification center outside of the app
      // then we want user to go home screnn of particular notification
      // and then inside home screen, we want to show message
      // that belongs to this notification
      yield put(navigateToRoutePN(homeDrawerRoute, params))
    } else {
      // if we find that we did not have indication to open notification directly
      // that means we need to show in-app notification that we have received a message
      yield put(
        showInAppNotification({
          senderName: params.senderName,
          senderImage: params.image,
          senderDID: params.senderDID,
          text: notificationText,
          messageType: notification.type,
          messageId: params.uid,
          identifier: notification.forDID,
        })
      )
    }
  }
}

export const navigateToRoutePN = (
  routeName: string,
  params: GenericObject
) => ({
  type: 'NAVIGATE_TO_ROUTE',
  routeName,
  params,
})

export const clearNavigateToRoutePN = () => ({
  type: 'CLEAR_NAVIGATE_TO_ROUTE',
})

function* watchFetchAdditionalData(): any {
  yield takeEvery(FETCH_ADDITIONAL_DATA, fetchAdditionalDataSaga)
}

export const hydratePushToken = (token: string): HydratePushTokenAction => ({
  type: HYDRATE_PUSH_TOKEN,
  token,
})

export function* hydratePushTokenSaga(): Generator<*, *, *> {
  try {
    const token = yield call(safeGet, PUSH_COM_METHOD)
    if (token) {
      yield put(hydratePushToken(token))
    }
  } catch (e) {
    // capture error for safe get
    captureError(e)
    customLogger.error(`hydratePushTokenSaga: ${e}`)
  }
}

export function* savePushTokenSaga(pushToken: string): Generator<*, *, *> {
  try {
    yield call(safeSet, PUSH_COM_METHOD, pushToken)
    yield put({ type: 'PUSH_TOKEN_SAVED' })
  } catch (e) {
    // Need to figure out what should be done if storage fails
    customLogger.error(`savePushTokenSaga: ${e}`)
  }
}

export function* watchPushNotification(): any {
  yield all([
    watchPushTokenUpdate(),
    watchFetchAdditionalData(),
    watchGoToUIScreen(),
    watchUpdateRelevantPushPayloadStoreAndRedirect(),
    watchAllowPushNotification(),
  ])
}

export default function pushNotification(
  state: PushNotificationStore = initialState,
  action: PushNotificationAction
) {
  switch (action.type) {
    case PUSH_NOTIFICATION_PERMISSION:
      return {
        ...state,
        isAllowed: action.isAllowed,
      }
    case HYDRATE_PUSH_TOKEN:
    case PUSH_NOTIFICATION_UPDATE_TOKEN:
      return {
        ...state,
        pushToken: action.token,
        isAllowed: true,
      }
    case FETCH_ADDITIONAL_DATA:
      return {
        ...state,
        isPristine: false,
        isFetching: true,
      }
    case FETCH_ADDITIONAL_DATA_ERROR:
      return {
        ...state,
        isPristine: false,
        isFetching: false,
        error: action.error,
      }
    case PUSH_NOTIFICATION_RECEIVED:
      return {
        ...state,
        notification: action.notification,
      }
    case FETCH_ADDITIONAL_DATA_PENDING_KEYS:
      return {
        ...state,
        pendingFetchAdditionalDataKey: {
          ...state.pendingFetchAdditionalDataKey,
          [`${action.uid}-${action.forDID}`]: true,
        },
      }
    case RESET:
      return {
        ...state,
        notification: null,
        error: null,
      }
    case 'NAVIGATE_TO_ROUTE':
      return {
        ...state,
        navigateRoute: {
          routeName: action.routeName,
          params: action.params,
        },
      }
    case 'CLEAR_NAVIGATE_TO_ROUTE':
      return {
        ...state,
        navigateRoute: null,
      }
    case SAVE_NOTIFICATION_OPEN_OPTIONS:
      return {
        ...state,
        notificationOpenOptions: action.payload,
      }
    default:
      return state
  }
}
