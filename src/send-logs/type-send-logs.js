// @flow
import type { ReactNavigation } from '../common/type-common'

export type SendLogsProps = {
  logIsEncrypted: boolean,
} & ReactNavigation

export type SendLogsStore = {
  encryptLogStatus: boolean,
}

export const UPDATE_LOG_ISENCRYPTED = 'UPDATE_LOG_ISENCRYPTED'
export type LogIsEncryptedAction = {
  type: typeof UPDATE_LOG_ISENCRYPTED,
  logIsEncrypted: boolean,
}

export const ENCRYPT_LOG_FILE = 'ENCRYPT_LOG_FILE'
export type EncryptLogFileAction = {
  type: typeof ENCRYPT_LOG_FILE,
}

export type SendLogsStoreAction = LogIsEncryptedAction | EncryptLogFileAction
