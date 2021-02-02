// @flow

import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import { onfidoRoute } from '../../../common'
import {
  registerCloudAgentWithToken,
  previousChoiceStorageKey,
} from '../cloud-agent'
import {
  agencyUrl,
  agencyDID,
  agencyVerificationKey,
  poolConfig,
  paymentMethod,
  userOneTimeInfo,
} from '../../../../__mocks__/static-data'
import {
  getProvisionToken,
  createOneTimeInfoWithToken,
} from '../../../bridge/react-native-cxs/RNCxs'
import { safeDelete } from '../../../services/storage'

describe('cloud-agent:saga', () => {
  const agencyConfig = {
    agencyUrl: agencyUrl,
    agencyDID: agencyDID,
    agencyVerificationKey: agencyVerificationKey,
    poolConfig,
    paymentMethod,
  }
  const unlockedState = {
    route: {
      currentScreen: onfidoRoute,
    },
    lock: {
      isAppLocked: false,
    },
    offline: {
      offline: false,
    },
  }

  it('should return success, and ask to allow push permission only on specific routes', () => {
    return expectSaga(registerCloudAgentWithToken, agencyConfig)
      .withState(unlockedState)
      .provide([
        [matchers.call.fn(getProvisionToken), [null, 'token']],
        [matchers.call.fn(createOneTimeInfoWithToken), [null, userOneTimeInfo]],
      ])
      .returns([null, userOneTimeInfo])
      .run()
  })

  beforeEach(async () => {
    try {
      await safeDelete(previousChoiceStorageKey)
    } catch (e) {}
  })
})
