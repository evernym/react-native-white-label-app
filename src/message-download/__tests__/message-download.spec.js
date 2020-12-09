// @flow

import { take } from 'redux-saga/effects'
import delay from '@redux-saga/delay-p'
import { testSaga } from 'redux-saga-test-plan'

import { infiniteDownloadSaga } from '../message-download'
import { getUnacknowledgedMessages } from '../../store/config-store'
import {
  GET_MESSAGES_SUCCESS,
  GET_MESSAGES_FAIL,
} from '../../store/type-config-store'
import { CLAIM_OFFER_RECEIVED } from '../../claim-offer/type-claim-offer'
import { PROOF_REQUEST_RECEIVED } from '../../proof-request/type-proof-request'
import { QUESTION_RECEIVED } from '../../question/type-question'

describe('saga: infiniteDownloadSaga', () => {
  it('should not run more than limit passed to download saga', () => {
    const limit = 3
    const saga = testSaga(infiniteDownloadSaga, {
      type: 'TRIGGER_AUTOMATIC_DOWNLOAD',
      limit,
    })
    let i = 0
    while (i < limit) {
      saga
        .next()
        .put(getUnacknowledgedMessages())
        .next()
        .race({
          success: take(GET_MESSAGES_SUCCESS),
          fail: take(GET_MESSAGES_FAIL),
          receivedMessage: take([
            CLAIM_OFFER_RECEIVED,
            PROOF_REQUEST_RECEIVED,
            QUESTION_RECEIVED,
          ]),
        })
        .next({ fail: 'GET_MESSAGES_FAIL' })
        .call(delay, 30000 * (i + 2))
      i++
    }
    saga.next().isDone()
  })

  it('should trigger more than limit if no limit is passed or passed 0', async () => {
    const limit = 0
    const saga = testSaga(infiniteDownloadSaga, {
      type: 'TRIGGER_AUTOMATIC_DOWNLOAD',
      limit,
    })
    let i = 0
    while (i < 10) {
      saga
        .next()
        .put(getUnacknowledgedMessages())
        .next()
        .race({
          success: take(GET_MESSAGES_SUCCESS),
          fail: take(GET_MESSAGES_FAIL),
          receivedMessage: take([
            CLAIM_OFFER_RECEIVED,
            PROOF_REQUEST_RECEIVED,
            QUESTION_RECEIVED,
          ]),
        })
        .next({ success: 'GET_MESSAGES_SUCCESS' })
        .call(delay, 30000)
      i++
    }
  })
})
