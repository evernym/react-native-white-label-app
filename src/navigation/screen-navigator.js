// @flow
import { bindActionCreators } from 'redux'
import { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'

import { clearNavigateToRoutePN } from '../push-notification/push-notification-store'
import { getNavigateToRoute } from '../store/store-selector'
import type { NavigationParams } from '../common/type-common'

export type MessageNavigatorProps = {
  navigateToRoute: (name: string, params: NavigationParams) => {},
  clearNavigateToRoutePN: typeof clearNavigateToRoutePN,
}

export const ScreenNavigator = ({
                                   navigateToRoute,
                                   clearNavigateToRoutePN,
                                 }: MessageNavigatorProps) => {
  const targetRoute = useSelector(getNavigateToRoute)

  useEffect(() => {
    if (targetRoute) {
      const { routeName, params } = targetRoute
      clearNavigateToRoutePN()
      navigateToRoute(routeName, params)
    }
  }, [targetRoute])

  return null
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      clearNavigateToRoutePN,
    },
    dispatch,
  )

export default connect(null, mapDispatchToProps)(ScreenNavigator)
