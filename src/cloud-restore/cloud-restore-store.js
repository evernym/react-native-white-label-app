// @flow
import {
  CloudRestoreStatus,
  initialState,
  RESTORE_CLOUD_SUBMIT_PASSPHRASE,
  RESET_ERROR,
  SET_CLOUD_RESTORE_MESSAGE,
} from './cloud-restore-type'
import type { RestoreCloudSubmitPassphraseAction } from './cloud-restore-type'
import { pinHash as generateKey, generateSalt } from '../lock/pin-hash'
import { WALLET_FILE_NAME } from '../backup/type-backup'
import { takeLatest, all, put, call, select, fork } from 'redux-saga/effects'
import { ERROR_RESTORE, RestoreStatus } from '../restore/type-restore'
import { restoreWallet, vcxShutdown } from '../bridge/react-native-cxs/RNCxs'
import { getConfig } from '../store/store-selector'
import RNFetchBlob from 'rn-fetch-blob'
import { safeSet } from '../services/storage'
import { PIN_ENABLED_KEY, IN_RECOVERY } from '../lock/type-lock'
import { hydrate, hydrateNonReduxData } from '../store/hydration-store'
import { enablePushNotificationsSaga } from '../push-notification/push-notification-store'
import { customLogger } from '../store/custom-logger'
import { restoreStatus } from '../restore/restore-store'
import {
  initVcx,
} from '../store/config-store'
import type { ConfigStore } from '../store/type-config-store'
import { environments, cloudBackupEnvironments } from '../environment'
import { changeEnvironment } from '../switch-environment/switсh-environment-store'

export const errorRestore = (error: string) => ({
  type: ERROR_RESTORE,
  error,
})

function* findWalletInCloud(
  key?: string,
  walletFilePath: string,
  hashedPassphrase: string
) {
  let foundWalletInCloud = -1
  if (key) {
    yield put(setCloudRestoreMessage('Downloading backup'))
    yield put(
      changeEnvironment(
        environments[key].agencyUrl,
        environments[key].agencyDID,
        environments[key].agencyVerificationKey,
        environments[key].poolConfig,
        environments[key].paymentMethod
      )
    )
  }

  try {
    yield* initVcx(true)
    foundWalletInCloud = yield call(
      restoreWallet,
      walletFilePath,
      hashedPassphrase
    )
  } catch (e) {}

  if (foundWalletInCloud != 0) {
    yield call(vcxShutdown, true)
  } else {
    yield call(vcxShutdown, false)
  }

  return foundWalletInCloud
}

export function* cloudRestore(
  action: RestoreCloudSubmitPassphraseAction
): Generator<*, *, *> {
  try {
    // try to locate the cloud backup...
    const { passphrase } = action
    const salt = yield call(generateSalt, false)
    const hashedPassphrase = yield call(
      generateKey,
      passphrase,
      salt //use hardcoded salt
    )
    const { fs } = RNFetchBlob
    const restoreDirectoryPath = `${fs.dirs.DocumentDir}/restoreDirectory`
    fs.mkdir(restoreDirectoryPath)
    let walletFilePath = `${restoreDirectoryPath}/${WALLET_FILE_NAME}.wallet`

    yield put(setCloudRestoreMessage('Locating backup'))
    // NOTE: Try the default selected agency first
    const { agencyDID }: ConfigStore = yield select(getConfig)
    let foundWalletInCloud = yield* findWalletInCloud(
      undefined,
      walletFilePath,
      hashedPassphrase
    )

    // NOTE: If we could not find the wallet backup in the default selected agency then
    // try to find it in the list of backup environments
    if (foundWalletInCloud != 0) {
      for (const key of cloudBackupEnvironments) {
        if (agencyDID !== environments[key].agencyDID) {
          foundWalletInCloud = yield* findWalletInCloud(
            key,
            walletFilePath,
            hashedPassphrase
          )
          if (foundWalletInCloud == 0) {
            break
          }
        }
      }
    }

    if (foundWalletInCloud != 0) {
      throw new Error('Could not find the backup in the cloud!!!')
    }
    yield put(setCloudRestoreMessage('Restoring wallet'))

    // copied from restoreFileDecrypt
    yield put(restoreStatus(RestoreStatus.FILE_DECRYPT_SUCCESS))

    // since we have decrypted file successfully, now we restore data from wallet
    // Need to set this here manually, because in normal flow this flag
    // will be set when user sets pin code. However, since user is importing
    // wallet file, we know that user has already enabled pin code
    // so we set this flag manually
    yield call(safeSet, IN_RECOVERY, 'true')
    yield call(safeSet, PIN_ENABLED_KEY, 'true')
    yield* hydrate()
    // hydrate data in secure storage which is not put in store by hydrate saga
    yield fork(hydrateNonReduxData)

    try {
      //Push Notification permissions are asked when we do our first connection
      //but in this case if connections are imported from backup then that case is missed
      //since connection is already there
      // so after push token update
      // we need to do requestPermission or else push notifications won't come
      yield call(enablePushNotificationsSaga, true)

    } catch (e) {
      // even if we user does not give permission for push notification
      // we should not be stopping from restore success event
      customLogger.log(
        'Push notification permission failed while restoring backup'
      )
    }
    yield put(restoreStatus(RestoreStatus.RESTORE_DATA_STORE_SUCCESS))
    // } catch (e) {
    //   captureError(e)
    //   yield put(errorRestore(DECRYPT_FAILED_MESSAGE(e.message)))
    // }
  } catch (e) {
    yield put(
      errorRestore(
        'Error locating backup, please try enter recover phrase again'
      )
    )
  }
  // Downloading cloud backup...
  // Decrypting cloud backup..
  // Restoring cloud backup...
}

export const resetError = () => ({
  type: RESET_ERROR,
})

export const submitPassphrase = (passphrase: string) => ({
  type: RESTORE_CLOUD_SUBMIT_PASSPHRASE,
  passphrase,
})

export const setCloudRestoreMessage = (message: string) => ({
  type: SET_CLOUD_RESTORE_MESSAGE,
  message,
})
export function* watchCloudRestore(): any {
  yield all([cloudRestoreSaga()])
}

export function* cloudRestoreSaga(): any {
  yield takeLatest(RESTORE_CLOUD_SUBMIT_PASSPHRASE, cloudRestore)
}

export default function cloudRestoreReducer(
  // state: CloudRestoreStore = initialState,
  state: any = initialState,
  // action: CloudRestoreActions
  action: any
) {
  switch (action.type) {
    case RESTORE_CLOUD_SUBMIT_PASSPHRASE:
      return {
        ...state,
        status: CloudRestoreStatus.LOCATING_BACKUP_START,
        message: 'Locating your backup...',
        passphrase: action.passphrase,
        error: null,
      }
    case ERROR_RESTORE:
      return {
        ...state,
        error: action.error,
        message: 'error',
      }
    case RESET_ERROR:
      return {
        ...state,
        error: null,
        message: '',
      }
    case SET_CLOUD_RESTORE_MESSAGE:
      return {
        ...state,
        message: action.message,
      }
    default:
      return state
  }
}
