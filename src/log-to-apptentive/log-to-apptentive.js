// @flow
import { Apptentive, ApptentiveConfiguration } from 'apptentive-react-native'

import { customLogger } from '../store/custom-logger'
import { setupApptentive } from '../feedback/'
import {
  apptentiveCredentials,
} from '../external-imports'

export const EVENTS = {
  ACCEPT_CONNECTION: 'ACCEPT CONNECTION',
  DENY_CONNECTION: 'DENY CONNECTION',

  ACCEPT_CREDENTIAL: 'ACCEPT CREDENTIAL',
  DENY_CREDENTIAL: 'DENY CREDENTIAL',

  SHARE_PROOF: 'SHARE PROOF',
  DENY_PROOF: 'DENY PROOF',
}

export const setupApptentiveWithCredentials = () => {
  if (apptentiveCredentials) {
    setupApptentive().catch((e) => {
      customLogger.log(e)
    })
  }
}

export const logsToApptentive = (event: string) => {
  try {
    setupApptentiveWithCredentials()
    if (apptentiveCredentials) {
      Apptentive.engage(event).then((engaged) => console.log(`Event engaged: ${!engaged}`))
      customLogger.log('Log to Apptentive event: ', event)
    }
  } catch (e) {
    customLogger.log('Failed log to Apptentive', e)
  }
}
