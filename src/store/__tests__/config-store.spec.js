// @flow
import 'react-native'
import { Alert } from 'react-native'
import { put, take, call, select } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import configReducer, {
  watchSwitchErrorAlerts,
  toggleErrorAlerts,
  vcxInitReset,
  vcxInitSuccess,
  vcxInitFail,
  initVcx,
  resetStore,
  reset,
  getMessagesSaga,
  getMessagesLoading,
  getMessagesSuccess,
  getMessagesFail,
  processMessages,
  acknowledgeServer,
  acknowledgeMessagesFail,
  updateMessageStatus,
  vcxInitPoolFail,
  vcxInitPoolSuccess,
} from '../config-store'
import {
  vcxInitStart,
  ensureVcxInitSuccess,
  vcxInitPoolStart,
} from '../route-store'
import {
  STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL,
  ERROR_VCX_INIT_FAIL,
  HYDRATED,
  ERROR_VCX_PROVISION_FAIL,
  VCX_INIT_NOT_STARTED,
  VCX_INIT_SUCCESS,
  VCX_INIT_START,
  MESSAGE_RESPONSE_CODE,
  ERROR_HYDRATE_SWITCH_ENVIRONMENT,
  ERROR_SAVE_SWITCH_ENVIRONMENT,
  VCX_INIT_POOL_SUCCESS,
  VCX_INIT_POOL_START,
} from '../type-config-store'
import {
  agencyDID,
  agencyUrl,
  agencyVerificationKey,
  poolConfig,
  paymentMethod,
  validQrCodeEnvironmentSwitchUrl,
  userOneTimeInfo,
  getStore,
} from '../../../__mocks__/static-data'
import { downloadEnvironmentDetails } from '../../api/api'
import {
  resetVcx as resetNative,
  createOneTimeInfo,
  vcxShutdown,
  downloadMessages,
  init,
  serializeClaimOffer,
  getClaimOfferState,
  getClaimHandleBySerializedClaimOffer,
  getHandleBySerializedConnection,
  proofDeserialize,
  updateMessages,
  getProvisionToken,
  createOneTimeInfoWithToken,
} from '../../bridge/react-native-cxs/RNCxs'
import { updatePushToken } from '../../push-notification/push-notification-store'
import { getPushToken, getAgencyUrl } from '../../store/store-selector'
import { connectRegisterCreateAgentDone } from '../user/user-store'
import {
  splashScreenRoute,
  invitationRoute,
} from '../../common/route-constants'
import { secureSet, getHydrationItem } from '../../services/storage'
import * as errorHandler from './../../services/error/error-handler'
import { addSerializedClaimOffer } from './../../claim-offer/claim-offer-store'
import { claimReceivedVcx } from './../../claim/claim-store'
import { NativeModules } from 'react-native'
import { FETCH_ADDITIONAL_DATA, PUSH_NOTIFICATION_PERMISSION } from '../../push-notification/type-push-notification'
import AlertAsync from 'react-native-alert-async'
import {
  baseUrls,




} from '../../environment'
import {
  changeEnvironment, changeEnvironmentUrl,
  changeServerEnvironment, getEnvironmentName,
  hydrateSwitchedEnvironmentDetailFail,
  hydrateSwitchedEnvironmentDetails, onChangeEnvironmentUrl,
  onEnvironmentSwitch,
  saveSwitchedEnvironmentDetailFail, watchChangeEnvironmentUrl,
  watchSwitchEnvironment,
} from '../../switch-environment/switсh-environment-store'
import { SERVER_ENVIRONMENT, SWITCH_ERROR_ALERTS } from '../../switch-environment/type-switch-environment'

const getConfigStoreInitialState = () =>
  configReducer(undefined, { type: 'INITIAL_TEST_ACTION' })

describe('server environment should change', () => {
  let initialConfig = null
  const serializedEnvironmentDetail = JSON.stringify({
    poolConfig,
    agencyDID,
    agencyVerificationKey,
    agencyUrl,
    paymentMethod,
  })

  beforeEach(() => {
    initialConfig = getConfigStoreInitialState()
  })

  it('initial app should always point to PROD', () => {
    if (initialConfig) {
      expect(initialConfig.agencyUrl).toBe(baseUrls.PROD.agencyUrl)
    }
  })

  it('to demo if previously it was set to sandbox', () => {
    const expectedConfig = {
      ...initialConfig,
      ...baseUrls[SERVER_ENVIRONMENT.DEMO],
    }

    if (initialConfig) {
      expect(
        configReducer(
          initialConfig,
          changeServerEnvironment(SERVER_ENVIRONMENT.DEMO)
        )
      ).toEqual(expectedConfig)
    } else {
      // we fail the test if we don't get any initial state
      expect(1).toBe(2)
    }
  })

  it('toggle showErrorAlerts if action is raised more than 3 times', () => {
    const gen = watchSwitchErrorAlerts()
    for (let i = 0; i < 4; i++) {
      expect(gen.next().value).toEqual(take(SWITCH_ERROR_ALERTS))
    }

    // after 3 times, it should raise an action to toggle showErrorAlerts
    gen.next()
    expect(gen.next().value).toEqual(put(toggleErrorAlerts(true)))
  })

  it('should store switched environment details', () => {
    const gen = onEnvironmentSwitch(
      changeEnvironment(
        agencyUrl,
        agencyDID,
        agencyVerificationKey,
        poolConfig,
        paymentMethod
      )
    )
    let switchedEnvironmentDetails = {
      poolConfig,
      agencyDID,
      agencyVerificationKey,
      agencyUrl,
      paymentMethod,
    }
    expect(gen.next().value).toEqual(
      call(
        secureSet,
        STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL,
        JSON.stringify(switchedEnvironmentDetails)
      )
    )
    expect(gen.next().done).toBe(true)
  })
  it('should throw error if saving switched environment details fails', () => {
    const errorMessage = 'save switch environment error'
    const failSaveError = new Error(errorMessage)

    const environmentDetails = {
      agencyDID,
      agencyUrl,
      agencyVerificationKey,
      poolConfig,
      paymentMethod,
    }
    return expectSaga(watchSwitchEnvironment)
      .dispatch(
        changeEnvironment(
          environmentDetails.agencyUrl,
          environmentDetails.agencyDID,
          environmentDetails.agencyVerificationKey,
          environmentDetails.poolConfig,
          environmentDetails.paymentMethod
        )
      )
      .provide([
        [
          matchers.call.fn(secureSet, STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL),
          throwError(failSaveError),
        ],
      ])
      .put(
        saveSwitchedEnvironmentDetailFail({
          code: ERROR_SAVE_SWITCH_ENVIRONMENT.code,
          message: `${ERROR_SAVE_SWITCH_ENVIRONMENT.message}${errorMessage}`,
        })
      )
      .run()
  })

  it('should throw error if hydrate switched environment details fails', () => {
    const errorMessage = 'hydrate switch environment error'
    const failHydrateError = new Error(errorMessage)

    const environmentDetails = {
      agencyDID,
      agencyUrl,
      agencyVerificationKey,
      poolConfig,
      paymentMethod,
    }
    return expectSaga(hydrateSwitchedEnvironmentDetails)
      .dispatch(
        changeEnvironment(
          environmentDetails.agencyUrl,
          environmentDetails.agencyDID,
          environmentDetails.agencyVerificationKey,
          environmentDetails.poolConfig,
          environmentDetails.paymentMethod
        )
      )
      .provide([
        [
          matchers.call.fn(
            getHydrationItem,
            STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL
          ),
          throwError(failHydrateError),
        ],
      ])
      .put(
        hydrateSwitchedEnvironmentDetailFail({
          code: ERROR_HYDRATE_SWITCH_ENVIRONMENT.code,
          message: `${ERROR_HYDRATE_SWITCH_ENVIRONMENT.message}${errorMessage}`,
        })
      )
      .run()
  })

  it('should hydrate switched environment details', () => {
    const gen = hydrateSwitchedEnvironmentDetails()
    expect(gen.next().value).toEqual(
      call(getHydrationItem, STORAGE_KEY_SWITCHED_ENVIRONMENT_DETAIL)
    )
    expect(gen.next(serializedEnvironmentDetail).value).toEqual(
      select(getAgencyUrl)
    )
    const currentAgencyUrl = 'some-other-environment'
    expect(gen.next(currentAgencyUrl).value).toEqual(
      put(
        changeEnvironment(
          agencyUrl,
          agencyDID,
          agencyVerificationKey,
          poolConfig,
          paymentMethod
        )
      )
    )
  })

  // Below test is written for switching environment with scanning QR code
  // we are not using this feature as of now, we will come to this feature later
  // when we add this with vcx, and then we will un-skip this test
  xit('should change environment via url, show success alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    const gen = onChangeEnvironmentUrl(
      changeEnvironmentUrl(validQrCodeEnvironmentSwitchUrl)
    )

    expect(gen.next().value).toEqual(
      call(downloadEnvironmentDetails, validQrCodeEnvironmentSwitchUrl)
    )

    const environmentDetails = {
      agencyDID,
      agencyUrl,
      agencyVerificationKey,
      poolConfig,
      paymentMethod,
    }
    // delete stored data, not interested in actual calls
    // those tests are being taken care in other test
    // TODO: Change index value to constant that better describes what the number represents
    // for (let index = 0; index < 6; index++) {
    //   gen.next()
    // }

    // expect(gen.next().value).toEqual(
    //   put({ type: REMOVE_SERIALIZED_CLAIM_OFFERS_SUCCESS })
    // )
    // gen.next()
    expect(gen.next(environmentDetails).value).toEqual(put(reset()))
    expect(gen.next().value).toEqual(
      put(
        changeEnvironment(
          agencyUrl,
          agencyDID,
          agencyVerificationKey,
          poolConfig,
          paymentMethod
        )
      )
    )
    expect(gen.next().value).toEqual(select(getPushToken))
    const pushToken = 'token'
    expect(gen.next(pushToken).value).toEqual(put(updatePushToken(pushToken)))
    expect(gen.next().value).toEqual(call(resetNative, true))
    expect(gen.next().value).toEqual(put(vcxInitReset()))

    expect(gen.next().done).toBe(true)

    expect(alertSpy).toHaveBeenCalledTimes(1)

    alertSpy.mockReset()
    alertSpy.mockRestore()
  })

  it('should not change environment via url if downloaded data is not correct', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    const gen = onChangeEnvironmentUrl(
      changeEnvironmentUrl(validQrCodeEnvironmentSwitchUrl)
    )

    expect(gen.next().value).toEqual(
      call(downloadEnvironmentDetails, validQrCodeEnvironmentSwitchUrl)
    )
    const invalidEnvironmentDetails = {
      agencyDID,
      agencyUrl,
      agencyVerificationKey,
    }

    expect(gen.next(invalidEnvironmentDetails).done).toBe(true)

    expect(alertSpy).toHaveBeenCalledTimes(1)

    alertSpy.mockReset()
    alertSpy.mockRestore()
  })

  it('should show alert with error message if any error occurs', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    const gen = onChangeEnvironmentUrl(
      changeEnvironmentUrl(validQrCodeEnvironmentSwitchUrl)
    )

    expect(gen.next().value).toEqual(
      call(downloadEnvironmentDetails, validQrCodeEnvironmentSwitchUrl)
    )

    gen.throw(new Error('Some error'))

    expect(alertSpy).toHaveBeenCalledTimes(1)

    alertSpy.mockReset()
    alertSpy.mockRestore()
  })

  it('should change environment via url', () => {
    const environmentDetails = {
      agencyDID,
      agencyUrl,
      agencyVerificationKey,
      poolConfig,
      paymentMethod,
    }
    const pushToken = 'token'
    return expectSaga(watchChangeEnvironmentUrl)
      .withState({
        pushNotification: { pushToken },
      })
      .provide([
        [
          matchers.call.fn(
            downloadEnvironmentDetails,
            validQrCodeEnvironmentSwitchUrl
          ),
          environmentDetails,
        ],
      ])
      .dispatch(changeEnvironmentUrl(validQrCodeEnvironmentSwitchUrl))
      .put(reset())
      .put(
        changeEnvironment(
          environmentDetails.agencyUrl,
          environmentDetails.agencyDID,
          environmentDetails.agencyVerificationKey,
          environmentDetails.poolConfig,
          environmentDetails.paymentMethod
        )
      )
      // .put(updatePushToken(pushToken))
      .put(vcxInitReset())
      .run()
  })
})

describe('reducer:config', () => {
  it('action:VCX_INIT_NOT_STARTED', () => {
    const initialState = getConfigStoreInitialState()
    expect(configReducer(initialState, vcxInitReset())).toMatchSnapshot()
  })

  it('action:VCX_INIT_START', () => {
    const initialState = getConfigStoreInitialState()
    expect(configReducer(initialState, vcxInitStart())).toMatchSnapshot()
  })

  it('action:VCX_INIT_SUCCESS', () => {
    const initialState = getConfigStoreInitialState()
    expect(configReducer(initialState, vcxInitSuccess())).toMatchSnapshot()
  })

  it('action:VCX_INIT_FAIL', () => {
    const initialState = getConfigStoreInitialState()
    const error = ERROR_VCX_INIT_FAIL('error from test')
    expect(configReducer(initialState, vcxInitFail(error))).toMatchSnapshot()
  })

  it('action:VCX_INIT_POOL_START', () => {
    const initialState = getConfigStoreInitialState()
    expect(configReducer(initialState, vcxInitPoolStart())).toMatchSnapshot()
  })

  it('action:VCX_INIT_POOL_SUCCESS', () => {
    const initialState = getConfigStoreInitialState()
    expect(configReducer(initialState, vcxInitPoolSuccess())).toMatchSnapshot()
  })

  it('action:VCX_INIT_POOL_FAIL', () => {
    const initialState = getConfigStoreInitialState()
    const error = ERROR_VCX_INIT_FAIL('error from test')
    expect(
      configReducer(initialState, vcxInitPoolFail(error))
    ).toMatchSnapshot()
  })
})

describe('config-store:saga', () => {
  const notHydratedNoOneTimeInfoState = {
    config: {
      isHydrated: false,
      vcxInitializationState: VCX_INIT_NOT_STARTED,
    },
    user: {},
    route: {
      currentScreen: invitationRoute,
    },
    pushNotification: {
      ...getStore().getState().pushNotification,
      pushToken: 'some push token',
    },
    lock: {
      isAppLocked: false,
    },
    offline: {
      offline: false,
    },
  }
  const agencyConfig = {
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
    paymentMethod,
  }

  it('initVcx, success', () => {
    return expectSaga(initVcx)
      .withState(notHydratedNoOneTimeInfoState)
      .dispatch({ type: HYDRATED })
      .dispatch({
        type: PUSH_NOTIFICATION_PERMISSION,
        isAllowed: true,
      })
      .provide([
        [
          matchers.call.fn(createOneTimeInfo, agencyConfig),
          [null, userOneTimeInfo],
        ],
        [matchers.call.fn(init, { ...userOneTimeInfo, ...agencyConfig }), true],
        [matchers.call.fn(getProvisionToken), [null, true]],
        [matchers.call.fn(createOneTimeInfoWithToken), [null, userOneTimeInfo]],
        [matchers.call.fn(AlertAsync), 'Allow'],
      ])
      .dispatch({
        type: FETCH_ADDITIONAL_DATA,
        notificationPayload: {
          msg: 'token-msg',
        },
      })
      .put(connectRegisterCreateAgentDone(userOneTimeInfo))
      .put(vcxInitSuccess())
      .run()
  })

  it('initVcx, fail provision', () => {
    const errorMessage = 'test provision fail error'
    const failProvisionError = new Error(errorMessage)

    return expectSaga(initVcx)
      .withState(notHydratedNoOneTimeInfoState)
      .dispatch({ type: HYDRATED })
      .dispatch({
        type: PUSH_NOTIFICATION_PERMISSION,
        isAllowed: true,
      })
      .provide([
        [
          matchers.call.fn(createOneTimeInfo, agencyConfig),
          throwError(failProvisionError),
        ],
        [matchers.call.fn(AlertAsync), 'Allow'],
        [matchers.call.fn(getProvisionToken), ['error', null]],
        [matchers.call.fn(vcxShutdown, false), true],
      ])
      .put(vcxInitFail(ERROR_VCX_PROVISION_FAIL(errorMessage)))
      .run()
  })

  it('initVcx, fail init', () => {
    const errorMessage = 'test init fail error'
    const failInitError = new Error(errorMessage)

    return expectSaga(initVcx)
      .withState(notHydratedNoOneTimeInfoState)
      .dispatch({ type: HYDRATED })
      .dispatch({
        type: PUSH_NOTIFICATION_PERMISSION,
        isAllowed: true,
      })
      .provide([
        [matchers.call.fn(getProvisionToken), ['error', null]],
        [
          matchers.call.fn(createOneTimeInfo, agencyConfig),
          [null, userOneTimeInfo],
        ],
        [
          matchers.call.fn(init, { ...userOneTimeInfo, ...agencyConfig }),
          throwError(failInitError),
        ],
        [matchers.call.fn(AlertAsync), 'Allow'],
      ])
      .put(connectRegisterCreateAgentDone(userOneTimeInfo))
      .put(vcxInitFail(ERROR_VCX_INIT_FAIL(errorMessage)))
      .run()
  })

  it('ensureVcxInitSuccess, not initialized', () => {
    return expectSaga(ensureVcxInitSuccess)
      .withState(notHydratedNoOneTimeInfoState)
      .dispatch({ type: VCX_INIT_SUCCESS })
      .put(vcxInitStart())
      .run()
  })

  it('ensureVcxInitSuccess, already started', () => {
    return expectSaga(ensureVcxInitSuccess)
      .withState({
        config: {
          vcxInitializationState: VCX_INIT_START,
        },
      })
      .dispatch({ type: VCX_INIT_SUCCESS })
      .not.put(vcxInitStart())
      .run()
  })

  it('ensureVcxInitSuccess, already initialized', () => {
    return expectSaga(ensureVcxInitSuccess)
      .withState({
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
        },
      })
      .not.take(VCX_INIT_SUCCESS)
      .run()
  })

  it('fn:getEnvironmentName', () => {
    expect(getEnvironmentName(getConfigStoreInitialState())).toMatchSnapshot()
  })

  it('resetStore, should fire RESET action', () => {
    return expectSaga(resetStore).put(reset()).run()
  })

  it("poolconfig should not have '\\n' after calling changeEnvironment", () => {
    const { poolConfig } = changeEnvironment(
      agencyUrl,
      agencyDID,
      agencyVerificationKey,
      'this is pool config with ' + '\\n' + ' charecter',
      paymentMethod
    )
    expect(poolConfig).toBe('this is pool config with ' + '\n' + ' charecter')
  })

  it("if we got the agency url that ends to with '/' then we save it after removing that slash", () => {
    const { agencyUrl: updtedAgencyUrl } = changeEnvironment(
      agencyUrl + '/',
      agencyDID,
      agencyVerificationKey,
      poolConfig,
      paymentMethod
    )
    expect(updtedAgencyUrl).toBe(agencyUrl)
  })

  it('should wait  for SAFE_TO_DOWNLOAD_SMS_INVITATION action if ', () => {
    const errorMessage = 'test init fail error'
    return expectSaga(initVcx)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        route: { currentScreen: splashScreenRoute },
      })
      .dispatch({ type: HYDRATED })
      .provide([
        [
          matchers.call.fn(createOneTimeInfo, agencyConfig),
          [null, userOneTimeInfo],
        ],
        [matchers.call.fn(init, { ...userOneTimeInfo, ...agencyConfig }), true],
      ])
      .not.put(vcxInitSuccess())
      .not.put(connectRegisterCreateAgentDone(userOneTimeInfo))
      .not.put(vcxInitFail(ERROR_VCX_INIT_FAIL(errorMessage)))
      .run()
  })

  it('getMessagesSaga when no data', () => {
    return expectSaga(getMessagesSaga)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            userDid1: {
              myPairwiseDid: 'myPairwiseDid1',
            },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
          vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
        },
      })
      .provide([
        [
          matchers.call.fn(
            downloadMessages,
            MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
            null,
            'myPairwiseDid1,myPairwiseDid2,myPairwiseDid3'
          ),
          null,
        ],
      ])
      .dispatch({ type: VCX_INIT_SUCCESS })
      .dispatch({ type: VCX_INIT_POOL_SUCCESS })
      .dispatch({ type: HYDRATED })

      .put(getMessagesLoading())
      .put(getMessagesSuccess())
      .run()
  })

  it('getMessagesSaga should wait for VCX_INIT_SUCCESS if vcx init fails', () => {
    const errorMessage = 'test init fail error'
    const failInitError = new Error(errorMessage)
    return expectSaga(getMessagesSaga)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            userDid1: {
              myPairwiseDid: 'myPairwiseDid1',
            },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_START,
          vcxPoolInitializationState: VCX_INIT_POOL_START,
        },
      })
      .provide([
        [
          matchers.call.fn(
            downloadMessages,
            MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
            null,
            'myPairwiseDid1,myPairwiseDid2,myPairwiseDid3'
          ),
          null,
        ],
        [
          matchers.call.fn(init, { ...userOneTimeInfo, ...agencyConfig }),
          throwError(failInitError),
        ],
      ])

      .dispatch({ type: HYDRATED })
      .dispatch({ type: VCX_INIT_SUCCESS })
      .dispatch({ type: VCX_INIT_POOL_SUCCESS })

      .put(getMessagesLoading())
      .put(getMessagesSuccess())
      .run()
  })

  it('getMessagesSaga: should raise action get Messages Fail if download messagesapi returns error', () => {
    const errorMessage = 'test init fail error'
    const failInitError = new Error(errorMessage)
    return expectSaga(getMessagesSaga)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            userDid1: {
              myPairwiseDid: 'myPairwiseDid1',
            },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_START,
          vcxPoolInitializationState: VCX_INIT_POOL_START,
        },
      })
      .provide([
        [
          matchers.call.fn(
            downloadMessages,
            MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
            null,
            'myPairwiseDid1,myPairwiseDid2,myPairwiseDid3'
          ),
          throwError(failInitError),
        ],
      ])

      .dispatch({ type: HYDRATED })
      .dispatch({ type: VCX_INIT_SUCCESS })
      .dispatch({ type: VCX_INIT_POOL_SUCCESS })

      .put(getMessagesLoading())
      .put(getMessagesFail())
      .run()
  })

  it('getMessagesSaga: should call download messages success if we get empty array', () => {
    expectSaga(getMessagesSaga)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            userDid1: { myPairwiseDid: 'myPairwiseDid1' },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
          vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
        },
        pushNotification: { pendingFetchAdditionalDataKey: null },
      })
      .provide([
        [
          matchers.call.fn(
            downloadMessages,
            MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
            null,
            'myPairwiseDid1,myPairwiseDid2,myPairwiseDid3'
          ),
          '[]',
        ],
      ])
      .dispatch({ type: HYDRATED })

      .put(getMessagesLoading())
      .put(getMessagesSuccess())

      .run()
  })

  it('getMessagesSaga: should capture error if the data downloaded is not an parsable stringified json', () => {
    const captureErrorSpy = jest.spyOn(errorHandler, 'captureError')
    expectSaga(getMessagesSaga)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            userDid1: { myPairwiseDid: 'myPairwiseDid1' },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
          vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
        },
        pushNotification: { pendingFetchAdditionalDataKey: null },
      })
      .provide([
        [
          matchers.call.fn(
            downloadMessages,
            MESSAGE_RESPONSE_CODE.MESSAGE_PENDING,
            null,
            'myPairwiseDid1,myPairwiseDid2,myPairwiseDid3'
          ),
          'some string but not array or object',
        ],
      ])
      .dispatch({ type: HYDRATED })

      .put(getMessagesLoading())
      .put(getMessagesSuccess())

      .run()
    expect(captureErrorSpy).toHaveBeenCalled()
    captureErrorSpy.mockReset()
    captureErrorSpy.mockRestore()
  })

  it('processMessages: should process claim offer message', () => {
    const messagesData = [
      {
        pairwiseDID: 'EaH2Dc1tSgqiBHohivzz2y',
        msgs: [
          {
            statusCode: 'MS-104',
            payload: null,
            senderDID: 'WJrmbqhrKvNSK62Kxvwise',
            uid: 'mmziymm',
            type: 'credOffer',
            refMsgId: 'ntdkoti',
            deliveryDetails: [],
            decryptedPayload:
              '{"@msg":"[{\\"payment_addr\\":\\"pay:sov:2KX71SUrWQ42cWxJaUX1sXNAzVvJgY3JT1ZHJfvpBEQLyBc13w\\",\\"payment_required\\":\\"one-time\\",\\"price\\":0},{\\"claim_id\\":\\"1\\",\\"claim_name\\":\\"credential_name\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\",\\"credential_attrs\\":{\\"address1\\":[\\"123 Main St\\"],\\"address2\\":[\\"Suite 3\\"],\\"city\\":[\\"Draper\\"],\\"state\\":[\\"UT\\"],\\"zip\\":[\\"84000\\"]},\\"from_did\\":\\"WJrmbqhrKvNSK62Kxvwise\\",\\"libindy_offer\\":\\"{\\\\\\"schema_id\\\\\\":\\\\\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\\\\\",\\\\\\"cred_def_id\\\\\\":\\\\\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\\\\\",\\\\\\"key_correctness_proof\\\\\\":{\\\\\\"c\\\\\\":\\\\\\"74550619103371687797763764700205930230890568811056747072593972925352623129502\\\\\\",\\\\\\"xz_cap\\\\\\":\\\\\\"1404765782617903840127154500280775685496226377180952089898883657286446017520671516232763936141909098520932515345383846273476101761614980290600734872026926026570093100706536512220388568588507789838996534499447500560757857677663971914089505900782114151822804144730563930338968963609008603290701823471247823633966969873959439541785167035483278906971153394042236500725847117867529930805490602879732665811865821616790834149877526495280770227831413136321455185205554694214919286394770110391362165524342215866961351199143323110916698403954545535078077876037061366642585298264393328467722952331028996430109838903907046605910460180206862889124019092320811459651452730977550727646975787232680516023106810\\\\\\",\\\\\\"xr_cap\\\\\\":[[\\\\\\"address2\\\\\\",\\\\\\"791213356082057576336510766089722875446788348829129230243161861746188095155604133739643872512248764772490655442505683292653310452806138625055697098953153864485221267611102800448720925732310961914940352821331502102977170367516551903187975244938118708284964209212323765086701879704567421362418087448075325170815606993892500995503198929394885529823002028902128406891029146039675159248050288821258767213475014498643044113213892174805516907181037066575446362497593214971407024208782692588772815079245773464790363500006527465489056567627411154740500834342157625733779899951048756842382476794282063591870985281965004463427087782360150822762607817911724174221711199560882601887331402520275003446407092\\\\\\"],[\\\\\\"zip\\\\\\",\\\\\\"112821405317800600807380586081107884160602797549429854356238304253191026825154149166755865191498028036689534777477569187682178531404847328777700951254650359743371627790400564027545598104185363103275093215819969384876304999755456937372424545761089929698137619199491341833004076018744341797806835456664356004178687707997483841825000236246247064369743447254879282020208713734449888373499665809198807559927502263283079547057320668298800333476115011749111864396225592452745526676782948237004911609457058708709532810109991199294437202485631367450859051825931405399947879365465681387876469985147317362029924384065022522073315856107371931169173149054167733272537913909424100177596197720629606348445974\\\\\\"],[\\\\\\"state\\\\\\",\\\\\\"946328015384375692887906674857324774182421106552325991473897093046368418180004203940981346655870713547391132892058614754319750544372047596327293306815771353438251925394452279981794745900685664065575647745347361021107137893433261440843434567751281559352528785062247261873577413451008134645361750577821602289021537142862548700052197935387643792617175529309581912566856194191859418772673366216858837739314841873171638462134642530765424099641097107005295657982139041326497061579778139664282894433125721147247714494552635149340837786460603794249112841158063003712643831093307075435060753091696228351106819956262074079346146066501887816961192627298600410873632501548610573829503952725395667417434293\\\\\\"],[\\\\\\"master_secret\\\\\\",\\\\\\"1542572350986618111762616728783980946239646773996575726163534833970259504512805598589072591571890379458180502524332435740572277601317923705363648745612327645070468722757891454570868841601327848137709240575480415815029305137287348562850184409831915594627806174130248666702567291123121249287273029802422859102781184487151959577054739031917563621801286798426030296479708507345830743697720933861277551988807410373305902151298665886553841514823525733304126870802845968196534009435026907063298790208637730670938239103218281300357581146392404466541026109967146653731202581348344222040524380506500852300487823075803203838613204941791128597658313365344203236852365353151544791035931349102244196205633656\\\\\\"],[\\\\\\"city\\\\\\",\\\\\\"1020483469214090560408467169346586194065127775939814734613414710583338857303571240538833860115398754312078373151530922724666498269805702983481589926236583690692862218168287053059106528892182350861815186590839345737990889599569791703841888005300667006647709872210917463127273804009570280155400509133227556423887568227033996739475946906706998454204124350120633668277023327443298360417852535172977622432636081570189757555162354630070709136078196278039436420166896461654274170896163193554646513831728820968279697486412129766085218983090720049666035594356684295163145709018160316293231980435465804333170152622819123352115792407169621891330566405023440960392987830942455155667560757571709972045330523\\\\\\"],[\\\\\\"address1\\\\\\",\\\\\\"649986387068836299295377174644913782932848527976546374116733965180515818993965481067351444037375115616127115266930877886921359016479468739105025796782683815732042669793154354348496423293390153148894169676074581632931974275779308581869887252750933889376316860677853829461366073982307223419880983464922697622177113699756813278288000079611584664040870500818162688343517203657101536063671096236949402071322842625244097840340293383093182459881177856092710677368282897600767944811264847788981885631242375609223957941688862276985702496084121927186819566136480851993305437517796140334717417900499643079475756175416148058103672539460971753964578999596190117535875478873410219854339163418097484102973044\\\\\\"]]},\\\\\\"nonce\\\\\\":\\\\\\"716612024741477532392031\\\\\\"}\\",\\"msg_ref_id\\":null,\\"msg_type\\":\\"CRED_OFFER\\",\\"schema_seq_no\\":0,\\"to_did\\":\\"WJrmbqhrKvNSK62Kxvwise\\",\\"version\\":\\"0.1\\"}]","@type":{"fmt":"json","name":"CRED_OFFER","ver":"1.0"}}',
          },
        ],
      },
    ]
    const claimHandle = 12,
      connectionHandle = 10
    const testConnectionDetails = {
      identifier: 'WJrmbqhrKvNSK62Kxvwise',
      vcxSerializedConnection: 'vcxSerializedConnection',
      logoUrl: 'senderLogoUrl',
      senderName: 'senderName',
      myPairwiseDid: 'EaH2Dc1tSgqiBHohivzz2y',
      senderDID: 'WJrmbqhrKvNSK62Kxvwise',
    }
    expectSaga(processMessages, messagesData)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            WJrmbqhrKvNSK62Kxvwise: { ...testConnectionDetails },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
          vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
        },
        claimOffer: {
          vcxSerializedClaimOffers: [],
        },
        pushNotification: { pendingFetchAdditionalDataKey: null },
      })
      .provide([
        [
          matchers.call.fn(serializeClaimOffer, claimHandle),
          'serializedClaimOffer',
        ],
        [matchers.call.fn(getClaimOfferState, claimHandle), 0],
        [
          matchers.call.fn(
            getClaimHandleBySerializedClaimOffer,
            'convertedSerializedClaimOffer'
          ),
          claimHandle,
        ],
        [
          matchers.call.fn(
            getHandleBySerializedConnection,
            testConnectionDetails.vcxSerializedConnection
          ),
          connectionHandle,
        ],
      ])
      .put(
        addSerializedClaimOffer(
          'serializedClaimOffer',
          'WJrmbqhrKvNSK62Kxvwise',
          'mmziymm',
          0
        )
      )
      .run()
  })

  it('processMessages: should process claim message', () => {
    const messagesData = [
      {
        pairwiseDID: 'EaH2Dc1tSgqiBHohivzz2y',
        msgs: [
          {
            statusCode: 'MS-104',
            payload: null,
            senderDID: 'WJrmbqhrKvNSK62Kxvwise',
            uid: 'mmziymm',
            type: 'cred',
            refMsgId: 'ntdkoti',
            deliveryDetails: [],
            decryptedPayload:
              '{"@msg":"[{\\"payment_addr\\":\\"pay:sov:2KX71SUrWQ42cWxJaUX1sXNAzVvJgY3JT1ZHJfvpBEQLyBc13w\\",\\"payment_required\\":\\"one-time\\",\\"price\\":0},{\\"claim_id\\":\\"1\\",\\"claim_name\\":\\"credential_name\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\",\\"credential_attrs\\":{\\"address1\\":[\\"123 Main St\\"],\\"address2\\":[\\"Suite 3\\"],\\"city\\":[\\"Draper\\"],\\"state\\":[\\"UT\\"],\\"zip\\":[\\"84000\\"]},\\"from_did\\":\\"WJrmbqhrKvNSK62Kxvwise\\",\\"libindy_offer\\":\\"{\\\\\\"schema_id\\\\\\":\\\\\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\\\\\",\\\\\\"cred_def_id\\\\\\":\\\\\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\\\\\",\\\\\\"key_correctness_proof\\\\\\":{\\\\\\"c\\\\\\":\\\\\\"74550619103371687797763764700205930230890568811056747072593972925352623129502\\\\\\",\\\\\\"xz_cap\\\\\\":\\\\\\"1404765782617903840127154500280775685496226377180952089898883657286446017520671516232763936141909098520932515345383846273476101761614980290600734872026926026570093100706536512220388568588507789838996534499447500560757857677663971914089505900782114151822804144730563930338968963609008603290701823471247823633966969873959439541785167035483278906971153394042236500725847117867529930805490602879732665811865821616790834149877526495280770227831413136321455185205554694214919286394770110391362165524342215866961351199143323110916698403954545535078077876037061366642585298264393328467722952331028996430109838903907046605910460180206862889124019092320811459651452730977550727646975787232680516023106810\\\\\\",\\\\\\"xr_cap\\\\\\":[[\\\\\\"address2\\\\\\",\\\\\\"791213356082057576336510766089722875446788348829129230243161861746188095155604133739643872512248764772490655442505683292653310452806138625055697098953153864485221267611102800448720925732310961914940352821331502102977170367516551903187975244938118708284964209212323765086701879704567421362418087448075325170815606993892500995503198929394885529823002028902128406891029146039675159248050288821258767213475014498643044113213892174805516907181037066575446362497593214971407024208782692588772815079245773464790363500006527465489056567627411154740500834342157625733779899951048756842382476794282063591870985281965004463427087782360150822762607817911724174221711199560882601887331402520275003446407092\\\\\\"],[\\\\\\"zip\\\\\\",\\\\\\"112821405317800600807380586081107884160602797549429854356238304253191026825154149166755865191498028036689534777477569187682178531404847328777700951254650359743371627790400564027545598104185363103275093215819969384876304999755456937372424545761089929698137619199491341833004076018744341797806835456664356004178687707997483841825000236246247064369743447254879282020208713734449888373499665809198807559927502263283079547057320668298800333476115011749111864396225592452745526676782948237004911609457058708709532810109991199294437202485631367450859051825931405399947879365465681387876469985147317362029924384065022522073315856107371931169173149054167733272537913909424100177596197720629606348445974\\\\\\"],[\\\\\\"state\\\\\\",\\\\\\"946328015384375692887906674857324774182421106552325991473897093046368418180004203940981346655870713547391132892058614754319750544372047596327293306815771353438251925394452279981794745900685664065575647745347361021107137893433261440843434567751281559352528785062247261873577413451008134645361750577821602289021537142862548700052197935387643792617175529309581912566856194191859418772673366216858837739314841873171638462134642530765424099641097107005295657982139041326497061579778139664282894433125721147247714494552635149340837786460603794249112841158063003712643831093307075435060753091696228351106819956262074079346146066501887816961192627298600410873632501548610573829503952725395667417434293\\\\\\"],[\\\\\\"master_secret\\\\\\",\\\\\\"1542572350986618111762616728783980946239646773996575726163534833970259504512805598589072591571890379458180502524332435740572277601317923705363648745612327645070468722757891454570868841601327848137709240575480415815029305137287348562850184409831915594627806174130248666702567291123121249287273029802422859102781184487151959577054739031917563621801286798426030296479708507345830743697720933861277551988807410373305902151298665886553841514823525733304126870802845968196534009435026907063298790208637730670938239103218281300357581146392404466541026109967146653731202581348344222040524380506500852300487823075803203838613204941791128597658313365344203236852365353151544791035931349102244196205633656\\\\\\"],[\\\\\\"city\\\\\\",\\\\\\"1020483469214090560408467169346586194065127775939814734613414710583338857303571240538833860115398754312078373151530922724666498269805702983481589926236583690692862218168287053059106528892182350861815186590839345737990889599569791703841888005300667006647709872210917463127273804009570280155400509133227556423887568227033996739475946906706998454204124350120633668277023327443298360417852535172977622432636081570189757555162354630070709136078196278039436420166896461654274170896163193554646513831728820968279697486412129766085218983090720049666035594356684295163145709018160316293231980435465804333170152622819123352115792407169621891330566405023440960392987830942455155667560757571709972045330523\\\\\\"],[\\\\\\"address1\\\\\\",\\\\\\"649986387068836299295377174644913782932848527976546374116733965180515818993965481067351444037375115616127115266930877886921359016479468739105025796782683815732042669793154354348496423293390153148894169676074581632931974275779308581869887252750933889376316860677853829461366073982307223419880983464922697622177113699756813278288000079611584664040870500818162688343517203657101536063671096236949402071322842625244097840340293383093182459881177856092710677368282897600767944811264847788981885631242375609223957941688862276985702496084121927186819566136480851993305437517796140334717417900499643079475756175416148058103672539460971753964578999596190117535875478873410219854339163418097484102973044\\\\\\"]]},\\\\\\"nonce\\\\\\":\\\\\\"716612024741477532392031\\\\\\"}\\",\\"msg_ref_id\\":null,\\"msg_type\\":\\"CRED_OFFER\\",\\"schema_seq_no\\":0,\\"to_did\\":\\"WJrmbqhrKvNSK62Kxvwise\\",\\"version\\":\\"0.1\\"}]","@type":{"fmt":"json","name":"CRED_OFFER","ver":"1.0"}}',
          },
        ],
      },
    ]
    const connectionHandle = 10
    const testConnectionDetails = {
      identifier: 'WJrmbqhrKvNSK62Kxvwise',
      vcxSerializedConnection: 'vcxSerializedConnection',
      logoUrl: 'senderLogoUrl',
      senderName: 'senderName',
      myPairwiseDid: 'EaH2Dc1tSgqiBHohivzz2y',
      senderDID: 'WJrmbqhrKvNSK62Kxvwise',
    }
    expectSaga(processMessages, messagesData)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            WJrmbqhrKvNSK62Kxvwise: { ...testConnectionDetails },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
          vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
        },
        claimOffer: {
          vcxSerializedClaimOffers: [],
        },
        pushNotification: { pendingFetchAdditionalDataKey: null },
      })
      .provide([
        [
          matchers.call.fn(
            getHandleBySerializedConnection,
            testConnectionDetails.vcxSerializedConnection
          ),
          connectionHandle,
        ],
      ])
      .put(
        claimReceivedVcx({
          connectionHandle: connectionHandle,
          uid: 'mmziymm',
          type: 'cred',
          forDID: testConnectionDetails.identifier,
          remotePairwiseDID: testConnectionDetails.senderDID,
        })
      )
      .run()
  })

  it('processMessages: should process proof request message', () => {
    const messagesData = [
      {
        pairwiseDID: 'EaH2Dc1tSgqiBHohivzz2y',
        msgs: [
          {
            statusCode: 'MS-103',
            payload: null,
            senderDID: 'LnKZwUaST94Bj5YzRRDsVqz',
            uid: 'odiwmdf',
            type: 'proofReq',
            refMsgId: null,
            deliveryDetails: [],
            decryptedPayload:
              '{"@msg":"{\\"@type\\":{\\"name\\":\\"PROOF_REQUEST\\",\\"version\\":\\"1.0\\"},\\"@topic\\":{\\"mid\\":9,\\"tid\\":1},\\"proof_request_data\\":{\\"nonce\\":\\"381386458956561976448383\\",\\"name\\":\\"name\\",\\"version\\":\\"0.1\\",\\"requested_attributes\\":{\\"zip\\":{\\"name\\":\\"zip\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"address1\\":{\\"name\\":\\"address1\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"address2\\":{\\"name\\":\\"address2\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"city\\":{\\"name\\":\\"city\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"state\\":{\\"name\\":\\"state\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]}},\\"requested_predicates\\":{}},\\"msg_ref_id\\":null}","@type":{"fmt":"json","name":"PROOF_REQUEST","ver":"1.0"}}',
          },
        ],
      },
    ]
    const proofHandle = 13,
      connectionHandle = 10
    const testConnectionDetails = {
      identifier: 'LnKZwUaST94Bj5YzRRDsVqz',
      vcxSerializedConnection: 'vcxSerializedConnection',
      logoUrl: 'senderLogoUrl',
      senderName: 'senderName',
      myPairwiseDid: 'EaH2Dc1tSgqiBHohivzz2y',
      senderDID: 'LnKZwUaST94Bj5YzRRDsVqz',
    }
    expectSaga(processMessages, messagesData)
      .withState({
        ...notHydratedNoOneTimeInfoState,
        connections: {
          data: {
            LnKZwUaST94Bj5YzRRDsVqz: { ...testConnectionDetails },
            userDid2: { myPairwiseDid: 'myPairwiseDid2' },
            userDid3: { myPairwiseDid: 'myPairwiseDid3' },
          },
        },
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
          vcxPoolInitializationState: VCX_INIT_POOL_SUCCESS,
        },
        claimOffer: {
          vcxSerializedClaimOffers: [],
        },
        pushNotification: { pendingFetchAdditionalDataKey: null },
      })
      .provide([
        [
          matchers.call.fn(
            getHandleBySerializedConnection,
            testConnectionDetails.vcxSerializedConnection
          ),
          connectionHandle,
        ],
        [matchers.call.fn(proofDeserialize, 'serializedProof'), proofHandle],
      ])
      .put(
        claimReceivedVcx({
          connectionHandle: connectionHandle,
          uid: 'mmziymm',
          type: 'cred',
          forDID: testConnectionDetails.identifier,
          remotePairwiseDID: testConnectionDetails.senderDID,
        })
      )
      .run()
  })

  it('acknowledgeServer: should acknowledge message', () => {
    const messagesData = [
      {
        pairwiseDID: 'EaH2Dc1tSgqiBHohivzz2y',
        msgs: [
          {
            statusCode: 'MS-103',
            payload: null,
            senderDID: 'LnKZwUaST94Bj5YzRRDsVqz',
            uid: 'odiwmdf',
            type: 'proofReq',
            refMsgId: null,
            deliveryDetails: [],
            decryptedPayload:
              '{"@msg":"{\\"@type\\":{\\"name\\":\\"PROOF_REQUEST\\",\\"version\\":\\"1.0\\"},\\"@topic\\":{\\"mid\\":9,\\"tid\\":1},\\"proof_request_data\\":{\\"nonce\\":\\"381386458956561976448383\\",\\"name\\":\\"name\\",\\"version\\":\\"0.1\\",\\"requested_attributes\\":{\\"zip\\":{\\"name\\":\\"zip\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"address1\\":{\\"name\\":\\"address1\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"address2\\":{\\"name\\":\\"address2\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"city\\":{\\"name\\":\\"city\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]},\\"state\\":{\\"name\\":\\"state\\",\\"restrictions\\":[{\\"schema_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:2:IhBIqiWID4uSgC7sMlnzYnzyC:1544551912.3230041175\\",\\"schema_issuer_did\\":null,\\"schema_name\\":\\"Home Address\\",\\"schema_version\\":null,\\"issuer_did\\":\\"V4SGRU86Z58d6TV7PBUe6f\\",\\"cred_def_id\\":\\"V4SGRU86Z58d6TV7PBUe6f:3:CL:1720:tag1\\"}]}},\\"requested_predicates\\":{}},\\"msg_ref_id\\":null}","@type":{"fmt":"json","name":"PROOF_REQUEST","ver":"1.0"}}',
          },
        ],
      },
    ]

    expectSaga(acknowledgeServer, messagesData)
      .call(updateMessages, 'MS-106', 'acknowledgeServerData')
      .run()
  })
  it('updateMessageStatus: should throw error', () => {
    const { RNIndy } = NativeModules
    const errorMessage = 'update message status fail'
    const updateMessagesSpy = jest.spyOn(RNIndy, 'updateMessages')
    updateMessagesSpy.mockImplementation(() =>
      Promise.reject({ message: errorMessage })
    )

    expectSaga(updateMessageStatus, [])
      .put(
        acknowledgeMessagesFail(`failed at updateMessages api, ${errorMessage}`)
      )
      .run()

    updateMessagesSpy.mockReset()
    updateMessagesSpy.mockRestore()
  })
  it('updateMessageStatus:should dispatch acknowledgeMessagesFail action', () => {
    expectSaga(updateMessageStatus, 'not an array')
      .put(acknowledgeMessagesFail("'Empty Array'"))
      .run()
  })
})
