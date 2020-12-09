// @flow
import React from 'react'
import renderer from 'react-test-renderer'
import { CloudBackup } from '../cloud-backup'
import { getNavigation } from '../../../__mocks__/static-data'
import { cloudBackupRoute } from '../../common'

describe('<CloudBackup />', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  const navigation = getNavigation({
    initialRoute: cloudBackupRoute,
  })

  const restoreStore = {
    status: 'ZIP_FILE_SELECTED',
    error: {
      code: 'Error Code',
      message: 'Error Message',
    },
    restoreFile: {
      fileName: 'File Name',
      fileSize: 100,
      type: 'File Type',
      uri: 'uri',
    },
  }

  function props() {
    return {
      navigation: navigation,
      resetCloudBackupStatus: jest.fn(),
      cloudBackup: jest.fn(),
      cloudBackupStatus: jest.fn(),
      error: 'error message',
      message: 'message',
      restore: restoreStore,
      route: 'restoreWaitRoute',
      isCloudBackupEnabled: false,
      cloudBackupStart: jest.fn(),
      saveFileToAppDirectory: jest.fn(),
      setAutoCloudBackupEnabled: jest.fn(),
      updateStatusBarTheme: jest.fn(),
      connectionHistoryBackedUp: jest.fn(),
    }
  }

  it('should match snapshot', () => {
    const tree = renderer.create(<CloudBackup {...props()} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
