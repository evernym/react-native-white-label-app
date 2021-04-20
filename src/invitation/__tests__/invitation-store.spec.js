// @flow

import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import invitationReducer, {
  invitationReceived,
  sendInvitationResponse,
  invitationSuccess,
  invitationRejected,
  invitationFail,
  sendResponse,
  invitationAccepted,
} from '../invitation-store'
import { initialTestAction } from '../../common/type-common'
import { ResponseType } from '../../components/request/type-request'
import { saveNewPendingConnection } from '../../store/connections-store'
import {
  createConnectionWithInvite,
  acceptInvitationVcx,
  serializeConnection,
} from '../../bridge/react-native-cxs/RNCxs'
import {
  getTestInvitationPayload,
  successConnectionData,
  myPairWiseConnectionDetails,
  vcxSerializedConnection,
  pendingConnectionData,
} from '../../../__mocks__/static-data'
import { VCX_INIT_SUCCESS } from '../../store/type-config-store'
import { connectionSuccess } from '../../store/type-connection-store'

describe('Invitation Store', () => {
  let initialState
  let afterOneInvitationState
  let propsGenerator
  let firstInvitation

  function fail() {
    // we can use this function if we specifically want to fail a test
    expect(1).toBe(2)
  }

  beforeEach(() => {
    initialState = invitationReducer(undefined, initialTestAction())
    propsGenerator = getTestInvitationPayload()
    firstInvitation = propsGenerator.next().value
    if (firstInvitation) {
      afterOneInvitationState = invitationReducer(
        initialState,
        invitationReceived(firstInvitation)
      )
    } else {
      fail()
    }
  })

  it('one invitation is received', () => {
    expect(afterOneInvitationState).toMatchSnapshot()
  })

  it('multiple invitations are received', () => {
    const nextInvitation = propsGenerator.next().value
    if (nextInvitation) {
      const nextState = invitationReducer(
        afterOneInvitationState,
        invitationReceived(nextInvitation)
      )
      expect(nextState).toMatchSnapshot()
    } else {
      fail()
    }
  })

  it('invitation response is sent', () => {
    if (firstInvitation) {
      const data = {
        senderDID: firstInvitation.payload.senderDID,
        response: ResponseType.accepted,
      }
      const state = invitationReducer(
        afterOneInvitationState,
        sendInvitationResponse(data)
      )
      expect(state).toMatchSnapshot()
    }
  })

  it('invitation response is sent successfully', () => {
    if (firstInvitation) {
      const state = invitationReducer(
        afterOneInvitationState,
        invitationSuccess(firstInvitation.payload.senderDID)
      )
      expect(!Object.keys(state).includes(firstInvitation.payload.senderDID))
    }
  })

  it('invitation response sending failed', () => {
    if (firstInvitation) {
      const error = {
        code: 'TEST-INVITATION-FAIL',
        message: 'Invitation sending failed from test',
      }
      const state = invitationReducer(
        afterOneInvitationState,
        invitationFail(error, firstInvitation.payload.senderDID)
      )
      expect(state).toMatchSnapshot()
    }
  })

  it('invitation is rejected', () => {
    if (firstInvitation) {
      const state = invitationReducer(
        afterOneInvitationState,
        invitationRejected(firstInvitation.payload.senderDID)
      )
      expect(!Object.keys(state).includes(firstInvitation.payload.senderDID))
    }
  })

  it('should reset invitation store, if RESET action is raised', () => {
    expect(
      invitationReducer(afterOneInvitationState, { type: 'RESET' })
    ).toMatchSnapshot()
  })

  it('saga:sendResponseVcx', () => {
    if (firstInvitation) {
      const { payload } = firstInvitation
      const { senderDID } = payload
      const data = {
        senderDID,
        response: ResponseType.accepted,
      }
      const vcxInitSuccessWithInvitationState = {
        config: {
          vcxInitializationState: VCX_INIT_SUCCESS,
        },
        invitation: {
          [senderDID]: {
            payload,
          },
        },
        connections: {},
      }
      const connectionHandle = 1

      return expectSaga(sendResponse, sendInvitationResponse(data))
        .withState(vcxInitSuccessWithInvitationState)
        .put(invitationAccepted(senderDID, payload))
        .put(saveNewPendingConnection(pendingConnectionData))
        .provide([
          [
            matchers.call.fn(createConnectionWithInvite, payload),
            connectionHandle,
          ],
          [
            matchers.call.fn(acceptInvitationVcx, connectionHandle),
            {
              connection: myPairWiseConnectionDetails,
              serializedConnection: vcxSerializedConnection
            },
          ],
          [
            matchers.call.fn(serializeConnection, connectionHandle),
            vcxSerializedConnection,
          ],
        ])
        .put(invitationSuccess(senderDID))
        .put(
          connectionSuccess(
            successConnectionData.newConnection.identifier,
            senderDID
          )
        )
        .run()
    }
  })
})
