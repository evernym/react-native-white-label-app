// @flow
import type {
  SaveFiletoAppDirectoryAction,
  ErrorRestoreAction,
  RestoreStatusAction,
} from '../restore/type-restore'

export const CloudRestoreStatus = {
  DECRYPTION_START: 'DECRYPTION_START',
  DECRYPTION_SUCCESS: 'DECRYPTION_SUCCESS',
  LOCATING_BACKUP_START: 'LOCATING_BACKUP_START',
  LOCATING_BACKUP_SUCCESS: 'LOCATING_BACKUP_SUCCESS',
  RESTORE_DATA_STORE_START: 'RESTORE_DATA_STORE_START',
  CLOUD_BACKUP_LOCATE_SUCCESS: 'CLOUD_BACKUP_LOCATE_SUCCESS',
  CLOUD_BACKUP_LOCATE_ERROR: 'CLOUD_BACKUP_LOCATE_ERROR',
  DOWNLOADING_BACKUP_START: 'DOWNLOADING_BACKUP_START',
  DOWNLOADING_BACKUP_SUCCESS: 'DOWNLOADING_BACKUP_SUCCESS',
  RESTORE_SUCCESS: 'RESTORE_SUCCESS',
  RESTORE_FAILED: 'RESTORE_FAILED',
  none: 'none',
}

export const SOME_CLOUD_RESTORE_START_ACTION = 'SOME_CLOUD_RESTORE_START_ACTION'
export const RESTORE_CLOUD_SUBMIT_PASSPHRASE = 'RESTORE_CLOUD_SUBMIT_PASSPHRASE'
export const SET_CLOUD_RESTORE_MESSAGE = 'SET_CLOUD_RESTORE_MESSAGE'
export const ERROR_RESTORE = 'ERROR_RESTORE'
export const RESET_ERROR = 'RESET_ERROR '
export const RESTORE_RESET = 'RESTORE_RESET'

export const initialState = {
  status: CloudRestoreStatus.none,
  passphrase: '',
  error: null,
}

export type ResetRestoreAction = {
  type: typeof RESTORE_RESET,
}

export type RestoreCloudSubmitPassphraseAction = {
  type: typeof RESTORE_CLOUD_SUBMIT_PASSPHRASE,
  passphrase: string,
}

export type CloudRestoreActions =
  | SaveFiletoAppDirectoryAction
  | ErrorRestoreAction
  | RestoreStatusAction
  | RestoreCloudSubmitPassphraseAction
  | ResetRestoreAction
