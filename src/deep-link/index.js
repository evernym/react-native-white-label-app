// @flow
import { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import branch from 'react-native-branch'

import type { DeepLinkProps, DeepLinkBundle } from './type-deep-link'

import { deepLinkData, deepLinkEmpty, deepLinkError } from './deep-link-store'

export class DeepLink extends PureComponent<DeepLinkProps, void> {
  onDeepLinkData = (bundle: DeepLinkBundle) => {
    if (bundle.error) {
      this.props.deepLinkError(bundle.error)
    } else if (bundle.params) {
      if (bundle.params['+clicked_branch_link'] === true) {
        // update store with deep link params
        this.props.deepLinkData(bundle.params.t)
      } else if (typeof bundle.params['+non_branch_link'] === 'string') {
        const nonBranchLink = bundle.params['+non_branch_link'].toLowerCase()
        if (nonBranchLink.startsWith('https://link.comect.me/?t=')) {
          const invitationToken = nonBranchLink.split('=').slice(-1)[0]
          this.props.deepLinkData(invitationToken)
        }
      } else {
        // update store that deep link was not clicked
        Object.keys(this.props.tokens).length === 0 &&
          this.props.deepLinkEmpty()
      }
    } else {
      Object.keys(this.props.tokens).length === 0 && this.props.deepLinkEmpty()
    }
  }

  componentDidMount() {
    // Branch only caches a deeplink for 5 seconds by default, if app loads slower it is deleted before used.
    // This causes branch to cache deeplink for 10 seconds instead.
    branch.initSessionTtl = 10000
    branch.subscribe(this.onDeepLinkData)
  }

  render() {
    return null
  }
}

const mapStateToProps = (state) => ({
  tokens: state.deepLink.tokens,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      deepLinkData,
      deepLinkEmpty,
      deepLinkError,
    },
    dispatch
  )

const DeepLinkConnected = connect(mapStateToProps, mapDispatchToProps)(DeepLink)

export default DeepLinkConnected
