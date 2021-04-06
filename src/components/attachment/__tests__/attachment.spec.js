// @flow
import React from 'react'
import 'react-native'
import { Text } from 'react-native'
import renderer from 'react-test-renderer'

import { RenderAttachmentIcon } from '../attachment'
import { DataRenderer } from '../data-renderer'

const setup = (props) => {
  const component = renderer.create(<DataRenderer {...props}></DataRenderer>)
  const instance = component.getInstance()

  return { props, component, instance }
}

describe('Render attachment icon snapshots', () => {
  it('should match snapshot', () => {
    const component = RenderAttachmentIcon(
      'label',
      'data',
      'remotePairwiseDID',
      'uid'
    )
    expect(component).toMatchSnapshot()
  })
  it('should match snapshot with icon', () => {
    const component = RenderAttachmentIcon(
      'label_link',
      '{"mime-type": "text/csv", "extension": "csv", "name": "my_csv.csv","data": { "base64": "VXNNtaXRoCgo="}}',
      'remotePairwiseDID',
      'uid'
    )
    expect(component).toMatchSnapshot()
  })
})

describe('Data renderer snapshots', () => {
  it('should match snapshot', () => {
    const { component } = setup({
      label: 'label',
      data: 'data',
      remotePairwiseDID: 'remotePairwiseDID',
      uid: 'uid',
    })
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
  it('should match snapshot with empty data', () => {
    const { component } = setup({
      label: 'label',
      data: '',
      remotePairwiseDID: 'remotePairwiseDID',
      uid: 'uid',
    })
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()
    expect(component).toMatchSnapshot()
  })
  it('should match snapshot with icon', () => {
    const { component } = setup({
      label: 'label',
      data: 'data',
      remotePairwiseDID:
        '{"mime-type": "text/csv", "extension": "csv", "name": "my_csv.csv","data": { "base64": "VXNNtaXRoCgo="}}',
      uid: 'uid',
    })
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})
