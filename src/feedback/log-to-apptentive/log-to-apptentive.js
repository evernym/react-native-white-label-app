// @flow
import { Apptentive } from 'apptentive-react-native'

import { isDevEnvironment } from '../../store/config-store'
import { customLogger } from '../../store/custom-logger'
import { setupApptentive } from '../../feedback/'
import { apptentiveCredentials } from '../../external-imports'

export const isLogToApptentive = !isDevEnvironment && apptentiveCredentials

export const setupApptentiveWithCredentials = () => {
  if (apptentiveCredentials) {
    setupApptentive().catch((e) => {
      customLogger.log(e)
    })
  }
}

export const logsToApptentive = (event: string) => {
  try {
    Apptentive.engage(event).then((engaged) =>
      console.log(`Event engaged: ${!engaged}`)
    )
    customLogger.log('<===== Log to Apptentive event: ', event, ' =====>')
  } catch (e) {
    customLogger.log('Failed log to Apptentive', e)
  }
}

