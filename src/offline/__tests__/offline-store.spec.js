// @flow
import 'react-native'

import offlineReducer, { offline } from '../offline-store'

describe('Offline-store', () => {

  it('action: Offline, value: False', () => {
    expect(offlineReducer(undefined, offline(false))).toMatchSnapshot()
  })

  it('action: Offline, value: True', () => {
    expect(offlineReducer(undefined, offline(true))).toMatchSnapshot()
  })
})
