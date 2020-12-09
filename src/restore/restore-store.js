// @flow

import { unzip } from 'react-native-zip-archive'
import messaging from '@react-native-firebase/messaging'
import {
  takeLatest,
  all,
  put,
  call,
  take,
  select,
  fork,
} from 'redux-saga/effects'
import RNFetchBlob from 'rn-fetch-blob'

import type { CustomError } from '../common/type-common'
import type {
  SaveToAppDirectory,
  RestoreActions,
  SaveFiletoAppDirectoryAction,
  RestoreSubmitPassphrase,
  RestoreStore,
  RestoreStoreStatus,
} from './type-restore'

import { decryptWalletFile, copyToPath } from '../bridge/react-native-cxs/RNCxs'
import {
  SAVE_FILE_TO_APP_DIRECTORY,
  RESTORE_STATUS,
  ERROR_RESTORE,
  RESTORE_SUBMIT_PASSPHRASE,
  RestoreStatus,
  initialState,
  FILE_SAVE_ERROR_MESSAGE,
  DECRYPT_FAILED_MESSAGE,
  RESTORE_RESET,
} from './type-restore'
import { WALLET_FILE_NAME } from '../backup/type-backup'
import { PASSPHRASE_SALT_STORAGE_KEY } from '../common/secure-storage-constants'
import { getRestoreStatus, getRestoreFileName } from '../store/store-selector'
import { pinHash as generateKey, generateSalt } from '../lock/pin-hash'
import { Platform } from 'react-native'
import { hydrate, hydrateNonReduxData } from '../store/hydration-store'
import { pushNotificationPermissionAction } from '../push-notification/push-notification-store'
import { safeSet, walletSet } from '../services/storage'
import { PIN_ENABLED_KEY, IN_RECOVERY } from '../lock/type-lock'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'
import { generateRecoveryPhraseSuccess } from '../backup/backup-store'

export const saveFileToAppDirectory = (data: SaveToAppDirectory) => ({
  type: SAVE_FILE_TO_APP_DIRECTORY,
  data,
})

export const restoreStatus = (status: RestoreStoreStatus) => ({
  type: RESTORE_STATUS,
  status,
})

export const errorRestore = (error: CustomError) => ({
  type: ERROR_RESTORE,
  error,
})

export const submitPassphrase = (passphrase: string) => ({
  type: RESTORE_SUBMIT_PASSPHRASE,
  passphrase,
})

export const resetRestore = () => ({
  type: RESTORE_RESET,
})

export function* restoreFileDecrypt(
  action: RestoreSubmitPassphrase
): Generator<*, *, *> {
  try {
    const { passphrase } = action
    if ((yield select(getRestoreStatus)) !== 'FILE_SAVED_TO_APP_DIRECTORY') {
      while (true) {
        const { status } = yield take(RESTORE_STATUS)

        if (status === 'FILE_SAVED_TO_APP_DIRECTORY') {
          break
        }
      }
    }

    yield put(restoreStatus(RestoreStatus.DECRYPTION_START))
    const { fs } = RNFetchBlob
    const restoreZipFilePath = `${fs.dirs.DocumentDir}/restore.zip`
    const restoreDirectoryPath = `${fs.dirs.DocumentDir}/restoreDirectory`
    let walletFilePath = `${restoreDirectoryPath}/${WALLET_FILE_NAME}.wallet`
    let restoreSaltPath = `${restoreDirectoryPath}/salt.json`
    yield call(unzip, restoreZipFilePath, restoreDirectoryPath)
    let restoreSalt = ''
    try {
      restoreSalt = yield call(fs.readFile, restoreSaltPath, 'utf8')
    } catch (e) {
      let fileName = yield select(getRestoreFileName)
      let restorePath = `${restoreDirectoryPath}/${fileName.split('.zip')[0]}`

      walletFilePath = `${restorePath}/${WALLET_FILE_NAME}.wallet`
      restoreSaltPath = `${restorePath}/salt.json`

      restoreSalt = yield call(fs.readFile, restoreSaltPath, 'utf8')
    }

    const parsedRestoreSalt = JSON.parse(restoreSalt)
    const hashedPassphrase = yield call(
      generateKey,
      passphrase,
      parsedRestoreSalt.salt
    )

    yield call(decryptWalletFile, walletFilePath, hashedPassphrase)

    yield put(restoreStatus(RestoreStatus.FILE_DECRYPT_SUCCESS))

    // since we have decrypted file successfully, now we restore data from wallet
    // Need to set this here manually, because in normal flow this flag
    // will be set when user sets pin code. However, since user is importing
    // wallet file, we know that user has already enabled pin code
    // so we set this flag manually
    yield call(safeSet, PIN_ENABLED_KEY, 'true')
    yield call(safeSet, IN_RECOVERY, 'true')
    yield* hydrate()

    const salt = yield call(generateSalt, false)
    yield call(walletSet, PASSPHRASE_SALT_STORAGE_KEY, salt)
    yield put(
      generateRecoveryPhraseSuccess({
        phrase: passphrase,
        salt: salt,
        hash: hashedPassphrase,
      })
    )
    // hydrate data in secure storage which is not put in store by hydrate saga
    yield fork(hydrateNonReduxData)

    try {
      //Push Notification permissions are asked when we do our first connection
      //but in this case if connections are imported from backup then that case is missed
      //since connection is already there
      // so after push token update
      // we need to do requestPermission or else push notifications won't come
      const requestPushNotificationPermission = () => {
        messaging().requestPermission()
      }
      yield call(requestPushNotificationPermission)
      yield put(pushNotificationPermissionAction(true))
    } catch (e) {
      // even if we user does not give permission for push notification
      // we should not be stopping from restore success event
      customLogger.log(
        'Push notification permission failed while restoring backup'
      )
    }
    yield put(restoreStatus(RestoreStatus.RESTORE_DATA_STORE_SUCCESS))
  } catch (e) {
    captureError(e)
    yield put(errorRestore(DECRYPT_FAILED_MESSAGE(e.message)))
  }
}

export function* saveZipFile(
  action: SaveFiletoAppDirectoryAction
): Generator<*, *, *> {
  try {
    yield put(restoreStatus(RestoreStatus.ZIP_FILE_SELECTED))
    const { uri } = action.data
    const { fs } = RNFetchBlob
    let destPath = fs.dirs.DocumentDir + '/restore.zip'
    let tempUri = uri
    //For android emulators the content uri is like "content://com.android.providers.downloads.documents/document/raw%3A%2Fstorage%2Femulated%2F0%2FDownload%2Fbackup.zip"
    //so it needs to be decoded and split from "/raw:" to get the real path
    //For android device the content uri is of form "Content://com.android.providers.downloads.documents/document/223" which can be used directly
    //For IOS device uri is like "file:///private/var/mobile/Containers/Data/Application/A80FE508-BCED-4950-B9D0-8F1AA1E967B6/tmp/com.evernym.connectme.callcenter-Inbox/backup.zip"
    // which we need to split from /private to get the real path

    //TODO move the copy logic for android to RNLayer
    if (Platform.OS === 'android') {
      copyToPath(tempUri, destPath)
      yield put(restoreStatus(RestoreStatus.FILE_SAVED_TO_APP_DIRECTORY))
    } else if (Platform.OS === 'ios') {
      tempUri = uri.substr('file://'.length)

      let sourceFileExists =
        tempUri != null ? yield call(fs.exists, tempUri) : false

      if (sourceFileExists) {
        const destFileExists = yield call(fs.exists, destPath)
        if (destFileExists) {
          yield call(fs.unlink, destPath)
        }

        yield call(fs.cp, tempUri, destPath)
      }
      yield put(restoreStatus(RestoreStatus.FILE_SAVED_TO_APP_DIRECTORY))
    } else {
      yield put(restoreStatus(RestoreStatus.FILE_SAVE_ERROR))
      yield put(
        errorRestore(FILE_SAVE_ERROR_MESSAGE('source file does not exist'))
      )
    }
  } catch (e) {
    captureError(e)
    yield put(restoreStatus(RestoreStatus.FILE_SAVE_ERROR))
    yield put(errorRestore(FILE_SAVE_ERROR_MESSAGE(e.message)))
  }
}

export function* restoreSaga(): any {
  yield takeLatest(SAVE_FILE_TO_APP_DIRECTORY, saveZipFile)
}

export function* watchSubmitPassphrase(): any {
  yield takeLatest(RESTORE_SUBMIT_PASSPHRASE, restoreFileDecrypt)
}

export function* watchRestore(): any {
  yield all([restoreSaga(), watchSubmitPassphrase()])
}

export default function restoreReducer(
  state: RestoreStore = initialState,
  action: RestoreActions
) {
  switch (action.type) {
    case SAVE_FILE_TO_APP_DIRECTORY:
      return {
        ...state,
        status: RestoreStatus.none,
        error: null,
        restoreFile: action.data,
      }
    case RESTORE_SUBMIT_PASSPHRASE:
      return {
        ...state,
        error: null,
        passphrase: action.passphrase,
      }
    case ERROR_RESTORE:
      return {
        ...state,
        error: action.error,
        status: RestoreStatus.RESTORE_FAILED,
      }
    case RESTORE_STATUS:
      return {
        ...state,
        status: action.status,
        error: null,
      }
    default:
      return state
  }
}
