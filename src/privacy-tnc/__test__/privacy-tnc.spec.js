// @flow
import 'react-native'
import React from 'react'
import renderer from 'react-test-renderer'
import { PrivacyTNC } from '../privacy-tnc-screen'
import { getNavigation } from '../../../__mocks__/static-data'

describe('Privacy and TNC screen', () => {
  const navigation = getNavigation({
    url: PrivacyTNC.INFO_TYPE.PRIVACY,
  })

  const route = {
    params: {
      title: PrivacyTNC.INFO_TYPE.PRIVACY.title,
      url: PrivacyTNC.INFO_TYPE.PRIVACY.url,
    },
  }

  it('should render properly and snapshot should match', () => {
    const tree = renderer
      .create(<PrivacyTNC navigation={navigation} route={route} />)
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
