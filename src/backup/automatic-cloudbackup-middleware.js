// @flow

import {
  RECORD_HISTORY_EVENT,
  DELETE_HISTORY_EVENT,
} from '../connection-history/type-connection-history'
import { DELETE_CONNECTION_SUCCESS } from '../store/type-connection-store'
import { WALLET_ADDRESSES_REFRESHED } from '../wallet/type-wallet'
import {
  startAutomaticCloudBackup,
  setCloudBackupPending,
} from './backup-store'
import { BACKUP_STORE_STATUS } from './type-backup'
import { showUserBackupAlert } from '../connection-history/connection-history-store'
import { STORE_STATUS } from '../common/type-common'

const actionToRecord = [
  RECORD_HISTORY_EVENT,
  DELETE_HISTORY_EVENT,
  DELETE_CONNECTION_SUCCESS,
  WALLET_ADDRESSES_REFRESHED,
]

// TODO:KS Fix any type using `redux` provided Generic Types
const automaticCloudBackup = (store: any) => (next: any) => (action: any) => {
  const state = store.getState()
  // pass on the action first to other middleware in line
  const nextAction = next(action)

  // now dispatch action to backup wallet to the cloud
  if (actionToRecord.indexOf(action.type) > -1) {
    // NOTE: we got an action that requires backing up the wallet to the cloud
    // dispatch an action, that starts from beginning of middleware chain
    // we are dispatching a new action here
    if (state.backup.autoCloudBackupEnabled) {
      if (action.type === WALLET_ADDRESSES_REFRESHED) {
        if (
          state.wallet.walletAddresses.data.length === 0 &&
          state.wallet.walletAddresses.status === STORE_STATUS.IN_PROGRESS &&
          nextAction.walletAddresses.status === STORE_STATUS.SUCCESS
        ) {
          if (
            state.backup.cloudBackupStatus ===
              BACKUP_STORE_STATUS.CLOUD_BACKUP_LOADING ||
            state.backup.cloudBackupStatus ===
              BACKUP_STORE_STATUS.CLOUD_BACKUP_WAITING
          ) {
            store.dispatch(setCloudBackupPending(true))
          } else {
            store.dispatch(startAutomaticCloudBackup(action))
          }
        }
      } else {
        if (
          state.backup.cloudBackupStatus ===
            BACKUP_STORE_STATUS.CLOUD_BACKUP_LOADING ||
          state.backup.cloudBackupStatus ===
            BACKUP_STORE_STATUS.CLOUD_BACKUP_WAITING
        ) {
          store.dispatch(setCloudBackupPending(true))
        } else {
          store.dispatch(startAutomaticCloudBackup(action))
        }
      }
    } else {
      if (action.type === WALLET_ADDRESSES_REFRESHED) {
        if (
          state.wallet.walletAddresses.data.length === 0 &&
          state.wallet.walletAddresses.status === STORE_STATUS.IN_PROGRESS &&
          nextAction.walletAddresses.status === STORE_STATUS.SUCCESS
        ) {
          //NOTE: set state to indicate that a backup is really needed now
          store.dispatch(showUserBackupAlert(action))
        }
      }
    }
  }

  return nextAction
}

export default automaticCloudBackup
