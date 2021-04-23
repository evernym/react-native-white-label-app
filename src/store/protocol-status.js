// @flow
import type { CustomError } from '../common/type-common'
import { ensureVcxInitSuccess } from './route-store'
import { call, put, select, take } from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import { getUnacknowledgedMessages, showSnackError } from './config-store'
import { GET_MESSAGES_SUCCESS } from './type-config-store'

/*
* Helper to track the completion of active protocols.
* If the user accepted some invitation we can need to check that
* it is completed after some time.
*
* Steps:
* 1. Wait for VCX get initialized
* 2. Wait 5 minutes before check
* 3. Check state of target object
* 4. If it's not finished - manual download messages and wait till processing get finished
* 5. Check state of target object
* 6. Raise failed action if action is still not finished
* */

export type CheckProtocolStatusParams = {
  identifier: string,
  getObjectFunc: any,
  isCompletedFunc: (object: any) => boolean,
  error: CustomError,
  onErrorEvent: any
}

export function* checkProtocolStatus({
                                       identifier,
                                       getObjectFunc,
                                       isCompletedFunc,
                                       error,
                                       onErrorEvent,
                                     }: CheckProtocolStatusParams): Generator<*, *, *> {
  // wait for VCX get initialized
  const vcxResult = yield* ensureVcxInitSuccess()
  if (vcxResult && vcxResult.fail) {
    return
  }

  // wait 5 minutes before check
  yield call(delay, 5 * 60000)

  // get target object
  let object = yield select(getObjectFunc, identifier)

  if (!object) {
    return
  }

  // it action has been completed - exit
  if (isCompletedFunc(object)) {
    return
  }

  // trigger download message saga and wait for it get finished
  yield put(getUnacknowledgedMessages())
  yield take(GET_MESSAGES_SUCCESS)

  // get new state of target object
  object = yield select(getObjectFunc, identifier)

  if (!object) {
    return
  }

  // if action has not been completed - raise failed action
  if (!isCompletedFunc(object)) {
    yield put(onErrorEvent)
    yield call(showSnackError, error.message)
  }
}
