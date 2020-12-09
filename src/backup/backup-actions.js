// @flow

import {
  CLOUD_BACKUP_SUCCESS,
  CLOUD_BACKUP_FAILURE,
  CLOUD_BACKUP_COMPLETE,
  VIEWED_WALLET_ERROR,
  SET_AUTO_CLOUD_BACKUP_ENABLED,
} from './type-backup'

export const cloudBackupSuccess = (lastSuccessfulCloudBackup: string) => ({
  type: CLOUD_BACKUP_SUCCESS,
  cloudBackupStatus: CLOUD_BACKUP_COMPLETE,
  lastSuccessfulCloudBackup,
})

export const cloudBackupFailure = (cloudBackupError: string) => ({
  type: CLOUD_BACKUP_FAILURE,
  cloudBackupStatus: CLOUD_BACKUP_FAILURE,
  cloudBackupError,
})

export const viewedWalletError = (viewedWalletError: boolean) => ({
  type: VIEWED_WALLET_ERROR,
  viewedWalletError,
})

export const setAutoCloudBackupEnabled = (autoCloudBackupEnabled: boolean) => ({
  type: SET_AUTO_CLOUD_BACKUP_ENABLED,
  autoCloudBackupEnabled,
})
