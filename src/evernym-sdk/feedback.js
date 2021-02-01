// @flow
import { Platform } from 'react-native'

/*
 * Here is you can set credentials for Apptentive.
 * */

export const APPTENTIVE_CREDENTIALS = Platform.select({
  ios: {
    apptentiveKey: '-',
    apptentiveSignature: '-',
  },
  android: {
    apptentiveKey: '-',
    apptentiveSignature: '-',
  },
})
