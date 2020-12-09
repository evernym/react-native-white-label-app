// @flow

import React from 'react'
import renderer from 'react-test-renderer'
import { GenerateRecoveryPhrase } from '../generate-phrase'
import { settingsRoute } from '../../common'
import { BACKUP_STORE_STATUS } from '../type-backup'

describe('<GenerateRecoveryPhrase />', () => {
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

  it('should match snapshot', () => {
    const tree = renderer.create(
      <GenerateRecoveryPhrase
        recoveryPassphrase={{
          phrase: recoveryPassphrase,
          salt: 'salt',
          hash: 'hash',
        }}
        generateRecoveryPhrase={jest.fn()}
        hydrateCloudBackup={jest.fn()}
        recoveryStatus={BACKUP_STORE_STATUS.GENERATE_PHRASE_SUCCESS}
        navigation={navigation}
        route={route}
      />
    )
    tree.getInstance().setState({
      chatBubbleDimensions: {
        width: 360,
        height: 199,
        x: 0,
        y: 0,
      },
    })
    expect(tree.toJSON()).toMatchSnapshot()
  })
  it('should match snapshot for loading state', () => {
    const tree = renderer.create(
      <GenerateRecoveryPhrase
        recoveryPassphrase={{
          phrase: recoveryPassphrase,
          salt: 'salt',
          hash: 'hash',
        }}
        generateRecoveryPhrase={jest.fn()}
        hydrateCloudBackup={jest.fn()}
        recoveryStatus={BACKUP_STORE_STATUS.GENERATE_PHRASE_LOADING}
        navigation={navigation}
        route={route}
      />
    )
    expect(tree.toJSON()).toMatchSnapshot()
  })
  it('should match snapshot for error state', () => {
    const tree = renderer.create(
      <GenerateRecoveryPhrase
        recoveryPassphrase={{
          phrase: recoveryPassphrase,
          salt: 'salt',
          hash: 'hash',
        }}
        generateRecoveryPhrase={jest.fn()}
        hydrateCloudBackup={jest.fn()}
        recoveryStatus={BACKUP_STORE_STATUS.GENERATE_PHRASE_FAILURE}
        navigation={navigation}
        route={route}
      />
    )
    tree.getInstance().setState({
      chatBubbleDimensions: {
        width: 360,
        height: 199,
        x: 0,
        y: 0,
      },
    })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
