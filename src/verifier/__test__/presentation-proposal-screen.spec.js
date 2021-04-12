// @flow

import React from 'react'
import { Provider } from 'react-redux'
import 'react-native'
import renderer from 'react-test-renderer'

import {
  getNavigation,
  defaultUUID,
  getStore,
} from '../../../__mocks__/static-data'
import merge from 'lodash.merge'
import { PresentationProposalComponent } from '../presentation-proposal-screen'

const getProps = () => {
  return {
    navigation: {
      ...getNavigation(),
    },
    route: {
      params: {
        uid: defaultUUID,
        invitationPayload: {},
        attachedRequest: {},
        senderName: 'Test',
      },
    },
  }
}

const getState = () => {
  const currentState = getStore().getState()
  return {
    ...getStore(),
    getState() {
      return merge(
        {},
        {
          ...currentState,
          verifier: {
            [defaultUUID]: {
              presentationProposal: {
                "@type": "https://didcomm.org/present-proof/1.0/propose-presentation",
                "@id": "uuid",
                "comment": "some comment",
                "presentation_proposal": {
                  "@type": "https://didcomm.org/present-proof/1.0/presentation-preview",
                  "attributes": [
                    {
                      "name": "First Name",
                    },
                    {
                      "name": "Last Name",
                    },
                  ]
                }
              },
              senderLogoUrl: '',
            }
          }
        }
      )
    },
  }
}

const setup = (currentStore) => {
  const props = getProps()
  const component = renderer.create(
    <Provider store={currentStore}>
      <PresentationProposalComponent {...props}/>
    </Provider>
  )
  const instance = component.getInstance()

  return { props, component, instance }
}

describe('<PresentationProposalComponent />', () => {
  it('should match snapshot', () => {
    const { component } = setup(getState())
    expect(component.toJSON()).toMatchSnapshot()
  })
})
