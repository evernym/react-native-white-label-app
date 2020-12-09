// @flow
import { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import type { PushNotificationNavigatorProps } from './type-push-notification'
import {
  updatePayloadToRelevantStoreAndRedirect,
  clearNavigateToRoutePN,
} from './push-notification-store'

export class PushNotificationNavigator extends PureComponent<
  PushNotificationNavigatorProps,
  void
> {
  UNSAFE_componentWillReceiveProps(nextProps: PushNotificationNavigatorProps) {
    if (
      nextProps.pushNotification.notification &&
      nextProps.pushNotification.notification !==
        this.props.pushNotification.notification
    ) {
      this.props.updatePayloadToRelevantStoreAndRedirect(
        nextProps.pushNotification.notification
      )
    }
    if (
      nextProps.pushNotification.navigateRoute &&
      nextProps.pushNotification.navigateRoute !==
        this.props.pushNotification.navigateRoute
    ) {
      const { routeName, params } = nextProps.pushNotification.navigateRoute
      this.props.clearNavigateToRoutePN()
      this.props.navigateToRoute(routeName, params)
    }
  }

  render() {
    return null
  }
}

const mapStateToProps = ({ pushNotification }) => ({
  pushNotification,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updatePayloadToRelevantStoreAndRedirect,
      clearNavigateToRoutePN,
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PushNotificationNavigator)
