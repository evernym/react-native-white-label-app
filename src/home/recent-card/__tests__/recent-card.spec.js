// @flow
import React from 'react'
import renderer from 'react-test-renderer'
import 'react-native'
import { Provider } from 'react-redux'

import { RecentCard } from '../recent-card'
import { getStore } from '../../../../__mocks__/static-data'

describe('<RecentCard />', () => {
  const store = getStore()
  it('should render RecentCard component and match snapshot', () => {
    const component = renderer
      .create(
        <Provider store={store}>
          <RecentCard
            timestamp="2020-03-15T15:57:54+01:00"
            statusMessage="You have been issued a 'Name'."
            issuerName="Evernym QA-RC"
            logoUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjimxZbcvZzPcPvHd_y7f0tc5d8QoC9DOPecb8JTOChmS1IoDq"
            status="CONNECTED"
            item={store.getState().history.data.connections.senderDID3.data[0]}
          />
        </Provider>
      )
      .toJSON()
    expect(component).toMatchSnapshot()
  })
})
