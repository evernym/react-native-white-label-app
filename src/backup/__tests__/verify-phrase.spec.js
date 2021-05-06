// @flow

import React from 'react'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'
import { VerifyRecoveryPhrase } from '../verify-phrase'
import { getStore } from '../../../__mocks__/static-data'
import { settingsRoute } from '../../common'

jest.mock('react-native-keyboard-aware-scroll-view')


describe('<VerifyRecoveryPhrase />', () => {
  const recoveryPassphrase = 'hello some passphrase'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
  }
  const route = {
    params: {
      recoveryPassphrase,
      initialRoute: settingsRoute,
      navigateBack: jest.fn(),
    },
  }

  const mockStoreData = getStore()

  it('should match snapshot', () => {
    const tree = renderer
      .create(
        <Provider store={mockStoreData}>
          <VerifyRecoveryPhrase
            recoveryPassphrase={{
              phrase: recoveryPassphrase,
              salt: 'salt',
              hash: 'hash',
            }}
            navigation={navigation}
            route={route}
            hydrateCloudBackup={jest.fn()}
            submitPassphrase={() => {}}
            restoreStatus={() => {}}
            resetError={() => {}}
            error={false}
            status="none"
            isCloudBackupEnabled={false}
            generateBackupFile={() => {}}
            hasVerifiedRecoveryPhrase={() => {}}
          />
        </Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
