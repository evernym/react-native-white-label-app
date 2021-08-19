// @flow

import { put, call } from 'redux-saga/effects'
import uniqueId from 'react-native-unique-id'

import type { UserOneTimeInfo } from './type-user-store'

import { flattenAsync } from '../../common/flatten-async'
import {
  getProvisionToken,
  createOneTimeInfoWithToken,
  createOneTimeInfo,
  vcxShutdown,
} from '../../bridge/react-native-cxs/RNCxs'

import { sponsorId, getProvisionTokenFunc } from '../../external-imports'

export function* registerCloudAgentWithToken(
  agencyConfig: *
): Generator<*, *, *> {
  // When trying to register cloud agent with agency
  // we need unique id per app installation
  // get unique device id
  const [uniqueIdError, id] = yield call(flattenAsync(uniqueId))
  if (uniqueIdError) {
    return [
      `CS-004::Could not get unique Id while trying to register cloud agent. ${uniqueIdError}`,
      null,
    ]
  }
  yield put({ type: 'REGISTER_CLOUD_AGENT_UNIQUE_ID_SUCCESS' })

  let provisionTokenError, provisionToken

  // get provision Token
  if (getProvisionTokenFunc) {
    ;[provisionTokenError, provisionToken] = yield call(getProvisionTokenFunc)
  } else {
    // call function to get token
    for (let i = 0; i < 2; i++) {
      // default function to get provision token twice
      ;[provisionTokenError, provisionToken] = yield call(
        getProvisionToken,
        agencyConfig,
        id,
        sponsorId
      )
      if (provisionToken) {
        provisionTokenError = null
        break
      }
    }
  }

  // Since in previous vcx API call, we used wallet
  // we need to close wallet and other open handles
  yield call(flattenAsync(vcxShutdown), true)

  if (provisionTokenError || !provisionToken) {
    return [
      `CS-007::Error calling getProvisionToken vcx API call ${
        provisionTokenError || ''
      }`,
      null,
    ]
  }

  // Now, we have provision token which can be used to register/provision cloud agent
  const [createOneTimeInfoError, userOneTimeInfo]: [
    null | string,
    null | UserOneTimeInfo
  ] = yield call(createOneTimeInfoWithToken, agencyConfig, provisionToken)
  if (createOneTimeInfoError) {
    return [
      `CS-008::Error calling createOneTimeInfoWithToken: ${createOneTimeInfoError}`,
      null,
    ]
  }

  return [null, userOneTimeInfo]
}

export function* registerCloudAgentWithoutToken(
  agencyConfig: *
): Generator<*, *, *> {
  const oneTimeInfoResult = yield call(createOneTimeInfo, agencyConfig)

  return oneTimeInfoResult
}

export const previousChoiceStorageKey = 'previousChoiceResult'
