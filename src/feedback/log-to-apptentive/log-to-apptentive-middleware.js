// @flow

import {
  credentialDetailsRoute,
  connectionHistRoute,
} from '../../common/route-constants'
import { APPTENTIVE_EVENTS } from './event-types'
import { logsToApptentive } from './log-to-apptentive'

const logToApptentiveMiddleware = (store: any) => (next: any) => (
  action: any
) => {
  const nextState = next(action)
  let event = undefined

  if (action.route === connectionHistRoute || action.route === credentialDetailsRoute) {
    event = APPTENTIVE_EVENTS[action.type + `_${action.route}`] 
  } else {
    event = APPTENTIVE_EVENTS[action.type]
  }

  if (event) {
    logsToApptentive(event)
  }

  return nextState
}

export default logToApptentiveMiddleware
