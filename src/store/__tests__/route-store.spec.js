// @flow
import routeReducer, { handleRouteUpdate } from '../route-store'
import { initialTestAction } from '../../common/type-common'
import { homeRoute } from '../../common'

describe('route should update properly', () => {
  function setup() {
    return {
      initialState: routeReducer(undefined, initialTestAction()),
    }
  }

  it('should update current screen route', () => {
    const { initialState } = setup()
    const expectedState = {
      currentScreen: homeRoute,
    }
    const actualState = routeReducer(initialState, handleRouteUpdate(homeRoute))
    expect(actualState).toMatchObject(expectedState)
  })
})
