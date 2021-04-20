// @flow

import {
  put,
  takeLatest,
  call,
  all,
  select,
  fork,
  take,
  race,
} from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import { zip } from 'react-native-zip-archive'
import {
  GENERATE_RECOVERY_PHRASE_SUCCESS,
  GENERATE_BACKUP_FILE_SUCCESS,
  GENERATE_BACKUP_FILE_FAILURE,
  EXPORT_BACKUP_SUCCESS,
  EXPORT_BACKUP_FAILURE,
  BACKUP_COMPLETE,
  BACKUP_STORE_STATUS,
  BACKUP_WALLET_FAIL,
  PROMPT_WALLET_BACKUP_BANNER,
  GENERATE_RECOVERY_PHRASE_FAILURE,
  GENERATE_RECOVERY_PHRASE_LOADING,
  GENERATE_BACKUP_FILE_LOADING,
  PREPARE_BACKUP_LOADING,
  PREPARE_BACKUP_SUCCESS,
  PREPARE_BACKUP_FAILURE,
  EXPORT_BACKUP_LOADING,
  ERROR_EXPORT_BACKUP,
  ERROR_GENERATE_RECOVERY_PHRASE,
  ERROR_GENERATE_BACKUP_FILE,
  ERROR_HYDRATING_BACKUP,
  HYDRATE_BACKUP,
  HYDRATE_CLOUD_BACKUP,
  HYDRATE_AUTO_CLOUD_BACKUP_ENABLED,
  HYDRATE_BACKUP_FAILURE,
  EXPORT_BACKUP_NO_SHARE,
  WALLET_FILE_NAME,
  PREPARE_BACK_IDLE,
  RESET_CLOUD_BACKUP_LOADING,
  CLOUD_BACKUP_IDLE,
  CLOUD_BACKUP_START,
  CLOUD_BACKUP_LOADING,
  SET_CLOUD_BACKUP_PENDING,
  CLOUD_BACKUP_WAITING,
  CLOUD_BACKUP_SUCCESS,
  CLOUD_BACKUP_FAILURE,
  SET_AUTO_CLOUD_BACKUP_ENABLED,
  AUTO_CLOUD_BACKUP_ENABLED,
  SET_WALLET_HANDLE,
  START_AUTOMATIC_CLOUD_BACKUP,
  HAS_VERIFIED_RECOVERY_PHRASE,
  HYDRATE_HAS_VERIFIED_RECOVERY_PHRASE,
  RESET_BACKUP_PATH,
  WALLET_BACKUP_FAILURE,
  VIEWED_WALLET_ERROR,
} from './type-backup'
import type {
  PromptBackupBannerAction,
  BackupStore,
  BackupStoreAction,
  Passphrase,
  PrepareBackupLoadingAction,
  ExportBackupLoadingAction,
  GenerateRecoveryPhraseLoadingAction,
  GenerateBackupFileLoadingAction,
  PrepareBackupStatus,
} from './type-backup'
import RNFetchBlob from 'rn-fetch-blob'
import { Platform } from 'react-native'
import Share from 'react-native-share'
import {
  secureSet,
  secureGet,
  secureGetAll,
  secureDelete,
  safeSet,
  safeGet,
  walletSet,
  walletGet,
  getHydrationSafeItem,
} from '../services/storage'
import type { CustomError } from '../common/type-common'
import {
  LAST_SUCCESSFUL_BACKUP,
  LAST_SUCCESSFUL_CLOUD_BACKUP,
  PASSPHRASE_SALT_STORAGE_KEY,
  PASSPHRASE_STORAGE_KEY,
  WALLET_KEY,
} from '../common/secure-storage-constants'
import {
  encryptWallet,
  createWalletBackup,
} from '../bridge/react-native-cxs/RNCxs'
import {
  getSalt,
  getBackupPassphrase,
  getBackupWalletPath,
  getPrepareBackupStatus,
  getCloudBackupPending,
} from '../store/store-selector'
import { STORAGE_KEY_SHOW_BANNER } from '../components/banner/banner-constants'
import { getWords } from './secure-passphrase'
import { ensureVcxInitSuccess } from '../store/route-store'
import { VCX_INIT_SUCCESS, __uniqueId } from '../store/type-config-store'
import { pinHash as generateKey, generateSalt } from '../lock/pin-hash'
import moment from 'moment'
import { captureError } from '../services/error/error-handler'
import { enablePushNotificationsSaga, } from '../push-notification/push-notification-store'
import { connectionHistoryBackedUp } from '../connection-history/connection-history-store'
import { cloudBackupFailure } from './backup-actions'

const initialState = {
  passphrase: { phrase: '', salt: 's', hash: 'h' },
  status: BACKUP_STORE_STATUS.IDLE,
  error: null,
  showBanner: false,
  lastSuccessfulBackup: '',
  backupWalletPath: '',
  prepareBackupStatus: PREPARE_BACK_IDLE,
  cloudBackupStatus: CLOUD_BACKUP_IDLE,
  cloudBackupPending: false,
  cloudBackupError: null,
  lastSuccessfulCloudBackup: '',
  prepareCloudBackupStatus: PREPARE_BACK_IDLE,
  autoCloudBackupEnabled: false,
  encryptedFileLocation: '',
  hasVerifiedRecoveryPhrase: false,
  hasViewedWalletError: false,
}

export function* cloudBackupSaga(
  action: GenerateBackupFileLoadingAction
): Generator<*, *, *> {
  try {
    yield put(cloudBackupLoading())

    yield call(enablePushNotificationsSaga)

    let passphrase = yield call(secureGet, PASSPHRASE_STORAGE_KEY)
    let passphraseSalt = yield call(generateSalt, false)

    // NOTE: check if this is needed it might not actual should ever excute
    // becaue if it does it would mean a new passPhrase is getting generated
    if (!passphrase) {
      const words: string[] = yield call(getWords, 8, 5)
      passphrase = words.join(' ')
    }

    const hashedPassphrase = yield call(generateKey, passphrase, passphraseSalt)

    yield put(prepareBackup())
    // check status for prepare backup, with status of prepare backup
    // we would know whether we have moved all of data inside wallet or not
    // only when we are sure that we have moved data inside of wallet
    // we will go ahead and get a backup of wallet
    const prepareBackupStatus: PrepareBackupStatus = yield select(
      getPrepareBackupStatus
    )
    if (prepareBackupStatus !== PREPARE_BACKUP_SUCCESS) {
      // prepare backup can only be in 3 states, loading, success, failure
      // if it is not success, then we check for failure
      if (prepareBackupStatus === PREPARE_BACKUP_FAILURE) {
        throw new Error('Failed to write data back to wallet')
      }
      // if status is neither success nor failure, then we wait for it to success

      // we will wait for 1 minutes for data to go into wallet
      // and then we will timeout
      const { timeout } = yield race({
        prepareBackupSuccess: take(PREPARE_BACKUP_SUCCESS),
        timeout: call(delay, 60000),
      })
      if (timeout) {
        throw new Error('Could not write data back to wallet in 1 minutes')
      }
    }

    // NOTE: CLOUD-BACKUP-STEP-1. createWalletBackup(sourceID: string)
    const { walletHandle, walletHandleTimeout } = yield race({
      walletHandle: yield call(
        createWalletBackup,
        'sourceID',
        hashedPassphrase
      ),
      walletHandleTimeout: call(delay, 60000),
    })
    if (walletHandleTimeout) {
      throw new Error('Could not download wallet in one minute')
    }
    yield put(setWalletHandle(walletHandle))

    // NOTE: wait/timer for steps in pushNotification to complete
    const { timeout } = yield race({
      cloudBackupSuccess: take(CLOUD_BACKUP_SUCCESS),
      cloudBackupError: take(CLOUD_BACKUP_FAILURE),
      timeout: call(delay, 60000),
    })
    if (timeout) {
      throw new Error('Timed out in push notifications')
    }

    const cloudBackupPending: boolean = yield select(getCloudBackupPending)
    if (cloudBackupPending) {
      // NOTE: Both calls to setCloudBackupPending are needed.
      // They are not duplicate calls!!
      yield put(setCloudBackupPending(false, CLOUD_BACKUP_WAITING))
      // NOTE: We just finished doing a backup of the wallet
      // and we are being requested to do another one, so, we
      // are going to wait some time before we kick off the backup again
      yield call(delay, 30000)
      yield put(setCloudBackupPending(false, CLOUD_BACKUP_WAITING))
      yield put(cloudBackupStart())
    }
  } catch (error) {
    yield put(cloudBackupFailure('Failed to create backup: ' + error.message))
    return
  }
}

export function* generateBackupSaga(
  action: GenerateBackupFileLoadingAction
): Generator<*, *, *> {
  // WALLET BACKUP ZIP FLOW
  yield put(resetBackupPath())
  const recoveryPassphrase: Passphrase = yield select(getBackupPassphrase)
  const { fs } = RNFetchBlob
  try {
    yield put(prepareBackup())

    const documentDirectory: string = fs.dirs.DocumentDir
    const backupTimeStamp = moment().format('YYYY-MM-DD-HH-mm-ss')
    const zipupDirectory: string = `${documentDirectory}/Backup-${backupTimeStamp}`

    // delete zip up directory if it already exists
    const destFileExists = yield call(fs.exists, zipupDirectory)
    if (destFileExists) {
      yield call(fs.unlink, zipupDirectory)
    }

    // create a new zip up directory
    yield call(fs.mkdir, zipupDirectory)
    const destinationZipPath: string = `${documentDirectory}/${WALLET_FILE_NAME}-${backupTimeStamp}.zip`
    const encryptedFileName: string = `${WALLET_FILE_NAME}.wallet`
    const encryptedFileLocation: string = `${zipupDirectory}/${encryptedFileName}`

    // create a file which contains salt needed to decrypt the wallet inside of zip up directory
    const saltValue = yield select(getSalt)
    const saltFileContents = JSON.stringify({ salt: saltValue })
    const saltFileName = `${zipupDirectory}/salt.json`

    yield call(fs.createFile, saltFileName, saltFileContents, 'utf8')

    // check status for prepare backup, with status of prepare backup
    // we would know whether we have moved all of data inside wallet or not
    // only when we are sure that we have moved data inside of wallet
    // we will go ahead and get a backup of wallet
    const prepareBackupStatus: PrepareBackupStatus = yield select(
      getPrepareBackupStatus
    )
    if (prepareBackupStatus !== PREPARE_BACKUP_SUCCESS) {
      // prepare backup can only be in 3 states, loading, success, failure
      // if it is not success, then we check for failure
      if (prepareBackupStatus === PREPARE_BACKUP_FAILURE) {
        throw new Error('Failed to write data back to wallet')
      }
      // if status is neither success nor failure, then we wait for it to success

      // we will wait for 2 minutes for data to go into wallet
      // and then we will timeout
      const { timeout } = yield race({
        prepareBackupSuccess: take(PREPARE_BACKUP_SUCCESS),
        timeout: call(delay, 120000),
      })
      if (timeout) {
        throw new Error('Could not write data back to wallet in 2 minutes')
      }
    }

    // call VCX method to encrypt wallet. Given path to store it, file name, & key to encrypt it
    yield call(encryptWallet, {
      encryptedFileLocation,
      recoveryPassphrase,
    })

    // create zip file of zip up directory contents to be used as backup
    const backupZipFile = yield call(zip, zipupDirectory, destinationZipPath)
    yield put(generateBackupFileSuccess(backupZipFile))

    yield put(connectionHistoryBackedUp())
  } catch (e) {
    captureError(e)
    yield put(
      generateBackupFileFail({
        ...ERROR_GENERATE_BACKUP_FILE,
        message: `${ERROR_GENERATE_BACKUP_FILE.message} ${e.message}`,
      })
    )
  }
}

const resolvedPromise = () => Promise.resolve()

export function* prepareBackupSaga(
  action: PrepareBackupLoadingAction
): Generator<*, *, *> {
  const skipItems = [
    __uniqueId,
    WALLET_KEY,
    HAS_VERIFIED_RECOVERY_PHRASE,
    AUTO_CLOUD_BACKUP_ENABLED,
  ]

  try {
    // get all items saved in secure storage
    const secureStorage = yield call(secureGetAll)
    // for Android secureGetAll returns an object
    // while for ios it returns an array of array
    if (!secureStorage?.length) {
      if (secureStorage) {
        yield all(
          Object.keys(secureStorage).map((key) => {
            if (skipItems.indexOf(key) === -1) {
              return call(walletSet, key, secureStorage[key])
            }

            return call(resolvedPromise)
          })
        )
      }
    } else {
      if (secureStorage && secureStorage.length > 0) {
        yield all(
          secureStorage[0].map((item) => {
            const { key, value } = item
            // check for things we don't want stored in the wallet
            if (skipItems.indexOf(key) === -1) {
              // store items into wallet
              return call(walletSet, key, value)
            }

            return call(resolvedPromise)
          })
        )
      }
    }

    yield put(prepareBackupSuccess())
  } catch (e) {
    yield put(
      prepareBackupFail({
        ...ERROR_GENERATE_BACKUP_FILE,
        message: `${ERROR_GENERATE_BACKUP_FILE.message} ${e.message}`,
      })
    )
  }
}

export function* exportBackupSaga(
  action: ExportBackupLoadingAction
): Generator<*, *, *> {
  try {
    const backupWalletPath: string = yield select(getBackupWalletPath)
    const title: string = `Export ${backupWalletPath.split('/').pop()}`
    Platform.OS === 'android'
      ? yield call(Share.open, {
          title,
          url: `file://${backupWalletPath}`,
          type: 'application/zip',
        })
      : yield call(Share.open, {
          title,
          url: backupWalletPath,
          type: 'application/zip',
        })
    const lastSuccessfulBackup = moment().format()
    yield put(exportBackupSuccess(lastSuccessfulBackup))
    yield put(promptBackupBanner(false))
    yield call(safeSet, LAST_SUCCESSFUL_BACKUP, lastSuccessfulBackup)
  } catch (e) {
    if (e.message === 'User did not share') {
      yield put(exportBackupNoShare())
    } else {
      captureError(new Error(`${ERROR_EXPORT_BACKUP.message} ${e.message}`))
      yield put(
        exportBackupFail({
          ...ERROR_EXPORT_BACKUP,
          message: `${ERROR_EXPORT_BACKUP.message} ${e.message}`,
        })
      )
    }
  }
}

export function* deletePersistedPassphrase(): Generator<*, *, *> {
  yield all([
    call(secureDelete, PASSPHRASE_STORAGE_KEY),
    call(secureDelete, PASSPHRASE_SALT_STORAGE_KEY),
  ])
}

export function* hydratePassphraseFromWallet(): Generator<*, *, *> {
  try {
    const [passphrase, passphraseSalt] = yield all([
      call(walletGet, PASSPHRASE_STORAGE_KEY),
      call(walletGet, PASSPHRASE_SALT_STORAGE_KEY),
    ])
    yield all([
      call(secureSet, PASSPHRASE_STORAGE_KEY, passphrase),
      call(secureSet, PASSPHRASE_SALT_STORAGE_KEY, passphraseSalt),
    ])
  } catch (e) {
    // not sure what to do if we don't get passphrase data
    // user would see new passphrase next time user is generating a backup
  }
}

export function* generateRecoveryPhraseSaga(
  action: GenerateRecoveryPhraseLoadingAction
): Generator<*, *, *> {
  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    yield take(VCX_INIT_SUCCESS)
  }

  // If it failed then we'll retry it a few times
  let retryCount = 0
  // QUESTION: Is the below line better to have here now that we know it is not causing the cloud restore to hang?
  //yield put(resetBackupPath())
  while (retryCount < 4) {
    try {
      let passphrase = yield call(secureGet, PASSPHRASE_STORAGE_KEY)
      let passphraseSalt = yield call(secureGet, PASSPHRASE_SALT_STORAGE_KEY)
      if (!passphrase) {
        const words: string[] = yield call(getWords, 8, 5)
        passphrase = words.join(' ')
        passphraseSalt = yield call(generateSalt, false)
      }
      const hashedPassphrase = yield call(
        generateKey,
        passphrase,
        passphraseSalt
      )
      yield call(secureSet, PASSPHRASE_STORAGE_KEY, passphrase)
      yield call(secureSet, PASSPHRASE_SALT_STORAGE_KEY, passphraseSalt)
      yield put(
        generateRecoveryPhraseSuccess({
          phrase: passphrase,
          salt: passphraseSalt,
          hash: hashedPassphrase,
        })
      )

      yield put(generateBackupFile())
      break
    } catch (e) {
      retryCount++
    }
  }
  if (retryCount > 3) {
    captureError(new Error(`${ERROR_GENERATE_RECOVERY_PHRASE.message}`))
    yield put(
      generateRecoveryPhraseFail({
        ...ERROR_GENERATE_RECOVERY_PHRASE,
        message: `${ERROR_GENERATE_RECOVERY_PHRASE.message}`,
      })
    )
  }
}

export const prepareBackupSuccess = () => ({
  type: PREPARE_BACKUP_SUCCESS,
  status: BACKUP_STORE_STATUS.PREPARE_BACKUP_SUCCESS,
})

export const prepareBackupFail = (error: CustomError) => ({
  type: PREPARE_BACKUP_FAILURE,
  status: BACKUP_STORE_STATUS.PREPARE_BACKUP_FAILURE,
  error,
})

export const generateBackupFileSuccess = (backupWalletPath: string) => ({
  type: GENERATE_BACKUP_FILE_SUCCESS,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_SUCCESS,
  backupWalletPath,
})

export const resetBackupPath = () => ({
  type: RESET_BACKUP_PATH,
})

export const generateBackupFileFail = (error: CustomError) => ({
  type: GENERATE_BACKUP_FILE_FAILURE,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_FAILURE,
  error,
})

export const hydrateBackupFail = (error: CustomError) => ({
  type: HYDRATE_BACKUP_FAILURE,
  error,
})

export const generateBackupFile = () => ({
  type: GENERATE_BACKUP_FILE_LOADING,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_LOADING,
})

function* watchBackupStart(): any {
  yield takeLatest(GENERATE_BACKUP_FILE_LOADING, generateBackupSaga)
}

function* watchPrepareBackup(): any {
  yield takeLatest(PREPARE_BACKUP_LOADING, prepareBackupSaga)
}

function* watchExportBackup(): any {
  yield takeLatest(EXPORT_BACKUP_LOADING, exportBackupSaga)
}

function* watchCloudBackup(): any {
  yield takeLatest(
    [CLOUD_BACKUP_START, START_AUTOMATIC_CLOUD_BACKUP],
    cloudBackupSaga
  )
}

function* watchGenerateRecoveryPhrase(): any {
  yield takeLatest(GENERATE_RECOVERY_PHRASE_LOADING, generateRecoveryPhraseSaga)
}

export function* watchBackup(): any {
  yield all([
    watchBackupStart(),
    watchPrepareBackup(),
    watchGenerateRecoveryPhrase(),
    watchExportBackup(),
    watchBackupBannerPrompt(),
    watchCloudBackup(),
  ])
}

export function* watchBackupBannerPrompt(): any {
  yield takeLatest(PROMPT_WALLET_BACKUP_BANNER, persistBackupBannerStatusSaga)
}

export function* hydrateBackupSaga(): Generator<*, *, *> {
  // We run two hydrations that are needed by this store in single saga
  // we could have merged these two into single hydration and followed
  // one hydration per reducer, for now we are just moving ahead with two
  // Also, these two hydrations runs in parallel, and even if one hydration fails
  // other hydration will continue
  // reason for not using "all" effect of redux-saga is that in all if one saga fails
  // then whole "all" effect is cancelled and other saga are not run to completion
  yield fork(hydrateLastSuccessfulBackupSaga)
  yield fork(hydrateLastSuccessfulCloudBackupSaga)
  yield fork(hydrateAutomaticCloudBackupEnabledSaga)
  yield fork(hydrateBackupBannerStatusSaga)
  yield fork(hydrateHasVerifiedRecoveryPhraseSaga)
}

export function* hydrateLastSuccessfulBackupSaga(): Generator<*, *, *> {
  try {
    let lastSuccessfulBackup = yield call(safeGet, LAST_SUCCESSFUL_BACKUP)
    if (lastSuccessfulBackup != null) {
      yield put(hydrateBackup(lastSuccessfulBackup))
    }
  } catch (e) {
    captureError(e)
    yield put(
      hydrateBackupFail({
        ...ERROR_HYDRATING_BACKUP,
        message: `${ERROR_HYDRATING_BACKUP.message} ${e.message}`,
      })
    )
  }
}

export function* hydrateLastSuccessfulCloudBackupSaga(): Generator<*, *, *> {
  try {
    let lastSuccessfulCloudBackup = yield call(
      safeGet,
      LAST_SUCCESSFUL_CLOUD_BACKUP
    )
    let hasCloudBackupError = yield call(safeGet, WALLET_BACKUP_FAILURE)
    if (lastSuccessfulCloudBackup != null) {
      yield put(hydrateCloudBackup(lastSuccessfulCloudBackup))
    }
    if (hasCloudBackupError) {
      yield put(cloudBackupFailure(WALLET_BACKUP_FAILURE))
    }
  } catch (e) {
    captureError(e)
    yield put(
      hydrateBackupFail({
        ...ERROR_HYDRATING_BACKUP,
        message: `${ERROR_HYDRATING_BACKUP.message} ${e.message}`,
      })
    )
  }
}

export function* hydrateAutomaticCloudBackupEnabledSaga(): Generator<*, *, *> {
  try {
    const autoCloudBackupEnabled: string = yield call(
      getHydrationSafeItem,
      AUTO_CLOUD_BACKUP_ENABLED
    )
    if (autoCloudBackupEnabled) {
      yield put(
        hydrateAutoCloudBackupEnabled(autoCloudBackupEnabled === 'true')
      )
    } else {
      yield put(hydrateAutoCloudBackupEnabled(false))
    }
  } catch (e) {
    captureError(e)
    yield put(
      hydrateBackupFail({
        ...ERROR_HYDRATING_BACKUP,
        message: `${ERROR_HYDRATING_BACKUP.message} ${e.message}`,
      })
    )
  }
}

export function* hydrateHasVerifiedRecoveryPhraseSaga(): Generator<*, *, *> {
  try {
    const hasVerifiedRecoveryPhrase: string = yield call(
      getHydrationSafeItem,
      HAS_VERIFIED_RECOVERY_PHRASE
    )
    if (hasVerifiedRecoveryPhrase) {
      yield put(
        hydrateHasVerifiedRecoveryPhrase(hasVerifiedRecoveryPhrase === 'true')
      )
    } else {
      yield put(hydrateHasVerifiedRecoveryPhrase(false))
    }
  } catch (e) {
    captureError(e)
    yield put(
      hydrateBackupFail({
        ...ERROR_HYDRATING_BACKUP,
        message: `${ERROR_HYDRATING_BACKUP.message} ${e.message}`,
      })
    )
  }
}

export function* hydrateBackupBannerStatusSaga(): Generator<*, *, *> {
  try {
    const backupBannerStatus = yield call(safeGet, STORAGE_KEY_SHOW_BANNER)
    if (backupBannerStatus) {
      yield put(promptBackupBanner(JSON.parse(backupBannerStatus)))
    }
  } catch (e) {
    captureError(e)
    yield put(
      hydrateBackupFail({
        ...ERROR_HYDRATING_BACKUP,
        message: `${ERROR_HYDRATING_BACKUP.message} ${e.message}`,
      })
    )
  }
}

export function* persistBackupBannerStatusSaga(
  action: PromptBackupBannerAction
): Generator<*, *, *> {
  const { showBanner } = action
  try {
    yield call(safeSet, STORAGE_KEY_SHOW_BANNER, JSON.stringify(showBanner))
  } catch (e) {
    yield put(promptBackupBanner(showBanner))
  }
}

export const hydrateBackup = (lastSuccessfulBackup: string) => ({
  type: HYDRATE_BACKUP,
  lastSuccessfulBackup,
})

export const hydrateCloudBackup = (lastSuccessfulCloudBackup: string) => ({
  type: HYDRATE_CLOUD_BACKUP,
  lastSuccessfulCloudBackup,
})

export const hydrateAutoCloudBackupEnabled = (
  autoCloudBackupEnabled: boolean
) => ({
  type: HYDRATE_AUTO_CLOUD_BACKUP_ENABLED,
  autoCloudBackupEnabled,
})

export const hydrateHasVerifiedRecoveryPhrase = (
  hasVerifiedRecoveryPhrase: boolean
) => ({
  type: HYDRATE_HAS_VERIFIED_RECOVERY_PHRASE,
  hasVerifiedRecoveryPhrase,
})

export const promptBackupBanner = (
  showBanner: boolean
): PromptBackupBannerAction => ({
  type: PROMPT_WALLET_BACKUP_BANNER,
  showBanner,
})

export const generateRecoveryPhrase = () => ({
  type: GENERATE_RECOVERY_PHRASE_LOADING,
  status: BACKUP_STORE_STATUS.GENERATE_PHRASE_LOADING,
})

export const generateRecoveryPhraseSuccess = (passphrase: Passphrase) => ({
  type: GENERATE_RECOVERY_PHRASE_SUCCESS,
  status: BACKUP_STORE_STATUS.GENERATE_PHRASE_SUCCESS,
  passphrase: passphrase,
})

export const generateRecoveryPhraseFail = (error: CustomError) => ({
  type: GENERATE_RECOVERY_PHRASE_FAILURE,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_FAILURE,
  error,
})

export const prepareBackup = () => ({
  type: PREPARE_BACKUP_LOADING,
  status: BACKUP_STORE_STATUS.PREPARE_BACKUP_LOADING,
})

export const exportBackup = () => ({
  type: EXPORT_BACKUP_LOADING,
  status: BACKUP_STORE_STATUS.EXPORT_BACKUP_LOADING,
})

export const exportBackupFail = (error: CustomError) => ({
  type: EXPORT_BACKUP_FAILURE,
  error,
  status: BACKUP_STORE_STATUS.EXPORT_BACKUP_FAILURE,
})

export const exportBackupSuccess = (lastSuccessfulBackup: string) => ({
  type: EXPORT_BACKUP_SUCCESS,
  status: BACKUP_COMPLETE,
  lastSuccessfulBackup,
})

export const exportBackupNoShare = () => ({
  type: EXPORT_BACKUP_NO_SHARE,
  status: BACKUP_STORE_STATUS.EXPORT_BACKUP_NO_SHARE,
})

export const resetCloudBackupStatus = () => ({
  type: RESET_CLOUD_BACKUP_LOADING,
  cloudBackupStatus: CLOUD_BACKUP_IDLE,
})

export const cloudBackupLoading = () => ({
  type: CLOUD_BACKUP_LOADING,
  cloudBackupStatus: BACKUP_STORE_STATUS.CLOUD_BACKUP_LOADING,
})

export const setCloudBackupPending = (pending: boolean, status?: string) => ({
  type: SET_CLOUD_BACKUP_PENDING,
  cloudBackupPending: pending,
  cloudBackupStatus: status,
})

export const cloudBackupStart = () => ({
  type: CLOUD_BACKUP_START,
})

export const startAutomaticCloudBackup = (action: any) => ({
  type: START_AUTOMATIC_CLOUD_BACKUP,
  action,
})

export const setWalletHandle = (walletHandle: number) => ({
  type: SET_WALLET_HANDLE,
  walletHandle,
})

export const hasVerifiedRecoveryPhrase = () => ({
  type: HAS_VERIFIED_RECOVERY_PHRASE,
})

export default function backupReducer(
  state: BackupStore = initialState,
  action: BackupStoreAction
) {
  switch (action.type) {
    case GENERATE_RECOVERY_PHRASE_LOADING: {
      return {
        ...state,
        status: action.status,
        error: null,
      }
    }
    case GENERATE_RECOVERY_PHRASE_SUCCESS: {
      return {
        ...state,
        status: action.status,
        error: action.error,
        passphrase: {
          phrase: action.passphrase.phrase,
          salt: action.passphrase.salt,
          hash: action.passphrase.hash,
        },
      }
    }
    case GENERATE_RECOVERY_PHRASE_FAILURE: {
      return {
        ...state,
        status: action.status,
        error: action.error,
      }
    }
    case GENERATE_BACKUP_FILE_LOADING: {
      return {
        ...state,
        status: action.status,
        error: null,
      }
    }
    case GENERATE_BACKUP_FILE_SUCCESS: {
      return {
        ...state,
        status: action.status,
        error: null,
        backupWalletPath: action.backupWalletPath,
      }
    }
    case RESET_BACKUP_PATH: {
      return {
        ...state,
        backupWalletPath: '',
      }
    }
    case GENERATE_BACKUP_FILE_FAILURE: {
      return {
        ...state,
        status: action.status,
        error: action.error,
      }
    }
    case EXPORT_BACKUP_LOADING: {
      return {
        ...state,
        status: action.status,
        error: null,
      }
    }
    case EXPORT_BACKUP_NO_SHARE: {
      return {
        ...state,
        status: action.status,
        error: null,
      }
    }
    case EXPORT_BACKUP_SUCCESS: {
      return {
        ...state,
        error: null,
        status: action.status,
        lastSuccessfulBackup: action.lastSuccessfulBackup,
      }
    }
    case EXPORT_BACKUP_FAILURE: {
      return {
        ...state,
        status: action.status,
        error: action.error,
      }
    }
    case RESET_CLOUD_BACKUP_LOADING: {
      return {
        ...state,
        cloudBackupStatus: action.cloudBackupStatus,
        error: null,
      }
    }
    case CLOUD_BACKUP_LOADING: {
      return {
        ...state,
        cloudBackupStatus: action.cloudBackupStatus,
        error: null,
      }
    }
    case SET_CLOUD_BACKUP_PENDING: {
      return {
        ...state,
        cloudBackupPending: action.cloudBackupPending,
        cloudBackupStatus: action.cloudBackupStatus
          ? action.cloudBackupStatus
          : state.cloudBackupStatus,
      }
    }
    case CLOUD_BACKUP_SUCCESS: {
      return {
        ...state,
        error: null,
        cloudBackupStatus: action.cloudBackupStatus,
        lastSuccessfulCloudBackup: action.lastSuccessfulCloudBackup,
      }
    }
    case SET_AUTO_CLOUD_BACKUP_ENABLED: {
      return {
        ...state,
        autoCloudBackupEnabled: action.autoCloudBackupEnabled,
      }
    }
    case CLOUD_BACKUP_FAILURE: {
      return {
        ...state,
        cloudBackupStatus: action.cloudBackupStatus,
        cloudBackupError: action.cloudBackupError,
      }
    }
    case PROMPT_WALLET_BACKUP_BANNER: {
      return {
        ...state,
        showBanner: action.showBanner,
      }
    }
    case BACKUP_WALLET_FAIL: {
      return {
        ...state,
        error: action.error,
      }
    }
    case HAS_VERIFIED_RECOVERY_PHRASE: {
      return {
        ...state,
        hasVerifiedRecoveryPhrase: true,
      }
    }

    case HYDRATE_BACKUP:
      return {
        ...initialState,
        lastSuccessfulBackup: action.lastSuccessfulBackup,
        showBanner: state.showBanner,
        lastSuccessfulCloudBackup: state.lastSuccessfulCloudBackup,
        autoCloudBackupEnabled: state.autoCloudBackupEnabled,
        hasVerifiedRecoveryPhrase: state.hasVerifiedRecoveryPhrase,
      }
    case HYDRATE_CLOUD_BACKUP:
      return {
        ...initialState,
        lastSuccessfulCloudBackup: action.lastSuccessfulCloudBackup,
        cloudBackupError: state.cloudBackupError,
        lastSuccessfulBackup: state.lastSuccessfulBackup,
        autoCloudBackupEnabled: state.autoCloudBackupEnabled,
        hasVerifiedRecoveryPhrase: state.hasVerifiedRecoveryPhrase,
        showBanner: state.showBanner,
      }
    case HYDRATE_AUTO_CLOUD_BACKUP_ENABLED:
      return {
        ...initialState,
        autoCloudBackupEnabled: action.autoCloudBackupEnabled,
        showBanner: state.showBanner,
        cloudBackupError: state.cloudBackupError,
        lastSuccessfulCloudBackup: state.lastSuccessfulCloudBackup,
        lastSuccessfulBackup: state.lastSuccessfulBackup,
        hasVerifiedRecoveryPhrase: state.hasVerifiedRecoveryPhrase,
      }
    case HYDRATE_HAS_VERIFIED_RECOVERY_PHRASE:
      return {
        ...initialState,
        autoCloudBackupEnabled: state.autoCloudBackupEnabled,
        showBanner: state.showBanner,
        cloudBackupError: state.cloudBackupError,
        lastSuccessfulCloudBackup: state.lastSuccessfulCloudBackup,
        lastSuccessfulBackup: state.lastSuccessfulBackup,
        hasVerifiedRecoveryPhrase: action.hasVerifiedRecoveryPhrase,
      }
    case HYDRATE_BACKUP_FAILURE:
      return {
        ...state,
        error: action.error,
      }
    case PREPARE_BACKUP_LOADING:
    case PREPARE_BACKUP_SUCCESS:
    case PREPARE_BACKUP_FAILURE:
      return {
        ...state,
        cloudBackupError:
          state.cloudBackupError === WALLET_BACKUP_FAILURE
            ? WALLET_BACKUP_FAILURE
            : null,
        prepareBackupStatus: action.status,
      }
    case SET_WALLET_HANDLE:
      return {
        ...state,
        walletHandle: action.walletHandle,
      }
    case VIEWED_WALLET_ERROR:
      return {
        ...state,
        hasViewedWalletError: action.viewedWalletError,
      }
    default:
      return state
  }
}
