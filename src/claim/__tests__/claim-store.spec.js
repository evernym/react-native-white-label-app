// @flow

import { initialTestAction } from '../../common/type-common'
import claimReducer, {
  claimReceived,
  claimStorageFail,
  claimStorageSuccess,
} from '../claim-store'
import { CLAIM_STORAGE_ERROR } from '../../services/error/error-code'
import { claim, claimOfferIssueDate } from '../../../__mocks__/static-data'

describe('Claim Store', () => {
  let initialState = { claimMap: {} }
  let afterClaimReceived

  beforeEach(() => {
    initialState = claimReducer(undefined, initialTestAction())
    afterClaimReceived = claimReducer(initialState, claimReceived(claim))
  })

  it('should match snapshot for claim received action', () => {
    expect(afterClaimReceived).toMatchSnapshot()
  })

  it('should match snapshot when claim storage fails', () => {
    const nextState = claimReducer(
      afterClaimReceived,
      claimStorageFail(claim.messageId, CLAIM_STORAGE_ERROR())
    )
    expect(nextState).toMatchSnapshot()
  })

  it('should match snapshot when claim storage is success', () => {
    const nextState = claimReducer(
      afterClaimReceived,
      claimStorageSuccess(claim.messageId, claimOfferIssueDate)
    )
    expect(nextState).toMatchSnapshot()
  })

  it('should reset claim store, if RESET action is raised', () => {
    expect(
      claimReducer(afterClaimReceived, { type: 'RESET' })
    ).toMatchSnapshot()
  })
})
