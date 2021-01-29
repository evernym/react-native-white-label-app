// @flow

/*
 * Here is you can set information used for logs gathering.
 * */

// email to send logs
export const SEND_LOGS_EMAIL = 'cmsupport@evernym.com'

// key to use for encrypting logs
export let CUSTOM_LOG_UTILS = {
  publicKeyUrl: 'https://connect.me/sendlogs.public.encryption.key.txt',
  encryptionKey: '',
}
