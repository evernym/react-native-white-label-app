// @flow
import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'

import { getStore } from '../../../__mocks__/static-data'
import offlineReducer, { offline } from '../offline-store'

describe('Offline-store', () => {

  it('action: Offline, value: False', () => {
    expect(offlineReducer(undefined, offline(false))).toMatchSnapshot()
  })

  it('action: Offline, value: True', () => {
    expect(offlineReducer(undefined, offline(true))).toMatchSnapshot()
  })
})