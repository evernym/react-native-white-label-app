// @flow
import * as matchers from 'redux-saga-test-plan/matchers'
import { expectSaga } from 'redux-saga-test-plan'

import connectionReducer, {
  saveNewConnection,
  connectionMapper,
  deleteConnectionSuccess,
  deleteConnectionOccurredSaga,
  deleteConnectionAction,
  persistThemes,
  hydrateThemes,
  removePersistedThemes,
  hydrateConnectionThemes,
  saveNewPendingConnection,
} from '../connections-store'
import { bubbleSize } from '../../common/styles'
import {
  successConnectionData,
  connections,
  userOneTimeInfo,
  configStoreNotHydratedInstalledVcxInit,
  getStore,
  connectionThemes,
} from '../../../__mocks__/static-data'
import { secureSet, secureGet } from '../../services/storage'
import { CONNECTIONS } from '../../common'
import { deleteConnection } from '../../bridge/react-native-cxs/RNCxs'
import {
  connectionFail,
  connectionSuccess,
  STORAGE_KEY_THEMES,
} from '../type-connection-store'

describe('Mapper', () => {
  it('connectionMapper should return proper object', () => {
    const connection = {
      identifier: '3nj819kkjywdppuje79',
      logoUrl: 'https://test-agengy.com/logo',
      size: bubbleSize.XL,
      name: 'test',
      senderDID: '123819kkjywdppuj987',
      senderEndpoint: 'https://test-endpoint.com',
      remoteConnectionId: '5iZiu2aLYrQXSdon123456',
    }
    const tree = connectionMapper(connection)
    expect(tree).toMatchSnapshot()
  })
})

describe('connections should update correctly', () => {
  let initialState = {
    data: null,
  }
  const newConnection = {
    identifier: '6789012345678906789012',
    name: 'test',
    senderDID: '2345454326654392659265',
  }
  const newPendingConnection = {
    identifier: '2345454326654392659265',
    name: 'test',
    senderDID: '2345454326654392659265',
  }

  beforeAll(() => {
    // get initial state without any action
    initialState = connectionReducer(undefined, { type: 'NO_ACTION' })
  })

  it('should receive new connection request', () => {
    const expectedState = {
      ...initialState,
      data: {
        [newPendingConnection.identifier]: {
          ...newPendingConnection,
          isFetching: true,
          isCompleted: false,
        },
      },
    }
    const actualState = connectionReducer(
      initialState,
      saveNewPendingConnection(newPendingConnection)
    )
    expect(actualState).toMatchObject(expectedState)
  })

  it('match delete connection success', () => {
    const connection = successConnectionData.newConnection
    expect(
      connectionReducer(initialState, deleteConnectionSuccess(connections, connection.senderDID))
    ).toMatchSnapshot()
  })

  it('saga:deleteConnectionOccurredSaga, success', () => {
    const connection = successConnectionData.newConnection
    const stateWithConnection = {
      connections: {
        data: {
          [connection.identifier]: connection,
        },
      },
      user: {
        userOneTimeInfo,
      },
      config: configStoreNotHydratedInstalledVcxInit,
    }

    return expectSaga(
      deleteConnectionOccurredSaga,
      deleteConnectionAction(connection.senderDID)
    )
      .withState(stateWithConnection)
      .provide([
        [matchers.call.fn(secureSet, CONNECTIONS, '{}'), true],
        [matchers.call.like({ fn: deleteConnection }), true],
      ])
      .call(secureSet, CONNECTIONS, '{}')
      .call.like({ fn: deleteConnection })
      .put(deleteConnectionSuccess({}, connection.senderDID))
      .run()
  })

  it('should update connections and store new connection properly', () => {
    const expectedState = {
      ...initialState,
      isFetching: false,
      data: {
        ...initialState.data,
        [newConnection.identifier]: {
          isCompleted: true,
        },
      },
    }
    const actualState = connectionReducer(
      initialState,
      connectionSuccess(newConnection.identifier, newConnection.senderDID)
    )
    expect(actualState).toMatchObject(expectedState)
  })

  it('should fail if new connection is not stored', () => {
    const error = { code: '1234', message: 'new connection failed' },
      expectedState = {
        ...initialState,
        data: {
          [newPendingConnection.identifier]: {
            ...newPendingConnection,
            isFetching: false,
            isCompleted: false,
            error,
          },
        },
      }
    const state = connectionReducer(
      initialState,
      saveNewPendingConnection(newPendingConnection)
    )
    const actualState = connectionReducer(
      state,
      connectionFail(error, newPendingConnection.senderDID)
    )
    expect(actualState).toMatchObject(expectedState)
  })

  it('should reset connection store, if RESET action is raised', () => {
    const afterNewConnection = connectionReducer(
      initialState,
      saveNewConnection(newConnection)
    )
    expect(
      connectionReducer(afterNewConnection, { type: 'RESET' })
    ).toMatchSnapshot()
  })

  it('saga:persistThemes, success', async () => {
    const stateWithThemes = getStore().getState()
    const result = await expectSaga(persistThemes)
      .withState(stateWithThemes)
      .provide([[matchers.call.like({ fn: secureSet }), true]])
      .run()
    expect(result).toMatchSnapshot()
  })

  it('saga:hydrateThemes, success', async () => {
    const result = await expectSaga(hydrateThemes)
      .provide([
        [
          matchers.call.fn(secureGet, STORAGE_KEY_THEMES),
          JSON.stringify(connectionThemes),
        ],
      ])
      .run()
    expect(result).toMatchSnapshot()
  })

  it('saga:removePersistedThemes, success', async () => {
    const result = await expectSaga(removePersistedThemes).run()
    expect(result).toMatchSnapshot()
  })

  it('ACTION:HYDRATE_CONNECTION_THEMES', () => {
    const afterThemeHydrationState = connectionReducer(
      initialState,
      hydrateConnectionThemes(connectionThemes)
    )
    expect(afterThemeHydrationState).toMatchSnapshot()
  })
})
