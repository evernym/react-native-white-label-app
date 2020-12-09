// @flow
import React from 'react'
import renderer from 'react-test-renderer'
import { SelectRecoveryMethod } from '../select-recovery-method'
import { selectRecoveryMethodRoute } from '../../common'

describe('<SelectRecoveryMethod />', () => {
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
      initialRoute: selectRecoveryMethodRoute,
      navigateBack: jest.fn(),
    },
  }

  it('should match snapshot', () => {
    const tree = renderer
      .create(
        <SelectRecoveryMethod
          navigation={navigation}
          route={route}
          hydrateCloudBackup={jest.fn()}
          hasVerifiedRecoveryPhrase={jest.fn()}
          generateBackupFile={jest.fn()}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
