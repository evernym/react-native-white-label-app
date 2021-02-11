// @flow

import {
  Apptentive,
  ApptentiveConfiguration as apptentiveCredentials,
  ApptentiveConfiguration,
} from 'apptentive-react-native'
import { customLogger } from '../store/custom-logger'

let apptentivePromise = null

export function setupApptentive() {
  if (apptentivePromise) {
    return apptentivePromise
  }

  const configuration = new ApptentiveConfiguration(
    apptentiveCredentials.apptentiveKey,
    apptentiveCredentials.apptentiveSignature
  )
  if (__DEV__) configuration.logLevel = 'verbose'

  apptentivePromise = Apptentive.register(configuration)
    .then(() => {
      Apptentive.onAuthenticationFailed = (reason) => {
        if (__DEV__) {
          customLogger.log('Error', `Authentication failed:\n${reason}`)
        }
      }
    })
    .catch((error) => {
      apptentivePromise = null
      if (__DEV__) {
        customLogger.log(
          'Error',
          `Can't register Apptentive:\n${error.message}`
        )
      }
    })

  return apptentivePromise
}
