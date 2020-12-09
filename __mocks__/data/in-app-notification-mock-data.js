// @flow

import { MESSAGE_TYPE } from '../../src/api/api-constants'

export const inAppNotificationMockData = {
  notification: {
    senderName: 'Anonymous',
    senderImage: 'https://localhost/image.png',
    senderDID: 'senderDID1',
    identifier: 'receiverPairwiseDID1',
    title: 'You received a PROOF REQUEST',
    text: 'Test wants you to share Address',
    messageType: MESSAGE_TYPE.PROOF_REQUEST,
    messageId: 'messageId1',
  },
}

export const inAppNotificationEmptyMockData = {
  notification: null,
}
