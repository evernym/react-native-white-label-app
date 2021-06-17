// @flow
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import branch from 'react-native-branch'
import { useDebouncedCallback } from "use-debounce";
import type { DeepLinkProps, DeepLinkBundle } from './type-deep-link'
import { deepLinkData, deepLinkEmpty, deepLinkError } from './deep-link-store'
import { waitForInvitationRoute } from '../common'
import { addPendingRedirection } from '../lock/lock-store'
import { deepLinkAddress } from '../external-imports'
import { isValidUrl } from '../components/qr-scanner/qr-code-types/qr-url'

export const DeepLink = (props: DeepLinkProps) => {
  const redirect = (props: DeepLinkProps, route: string, params?: any) => {
    if (props.isAppLocked === false) {
      props.navigateToRoute(route, params)
    } else {
      props.addPendingRedirection([{ routeName: route, params }])
    }
  }

  const handleDeepLinkToken = (token?: string) => {
    if (token){
      redirect(props, waitForInvitationRoute, { token })
    }
  }

  const handleDeepLink = (url?: string) => {
    if (url){
      redirect(props, waitForInvitationRoute, { url })
    }
  }

  const onDeepLinkData = useDebouncedCallback(
    async (bundle: DeepLinkBundle) => {
      if (bundle.error) {
        props.deepLinkError(bundle.error)
      } else if (bundle.params) {
        if (bundle.params['+clicked_branch_link'] === true) {
          // update store with deep link params
          props.deepLinkData(bundle.params.t)
          handleDeepLinkToken(bundle.params?.t)
        } else if (typeof bundle.params['+non_branch_link'] === 'string' && isValidUrl(bundle.params['+non_branch_link'])) {
          const nonBranchLink = bundle.params['+non_branch_link'].toLowerCase()
          if (nonBranchLink.startsWith(`${deepLinkAddress}?t=`)) {
            const token = nonBranchLink.split('=').slice(-1)[0]
            props.deepLinkData(token)
            handleDeepLinkToken(token)
          } else {
            const link = bundle.params['+non_branch_link']
            props.deepLinkData(link)
            handleDeepLink(link)
          }
        } else if (bundle.uri) {
          props.deepLinkData(bundle.uri)
          handleDeepLink(bundle.uri)
        } else {
          // update store that deep link was not clicked
          Object.keys(props.tokens).length === 0 &&
          props.deepLinkEmpty()
        }
      } else if (bundle.uri) {
        props.deepLinkData(bundle.uri)
        handleDeepLink(bundle.uri)
      } else {
        Object.keys(props.tokens).length === 0 && props.deepLinkEmpty()
      }
    },
    500
  );

  // Branch only caches a deeplink for 5 seconds by default, if app loads slower it is deleted before used.
  // This causes branch to cache deeplink for 10 seconds instead.
  branch.initSessionTtl = 10000
  branch.subscribe(onDeepLinkData)
  return null
}

const mapStateToProps = (state) => ({
  tokens: state.deepLink.tokens,
  isAppLocked: state.lock.isAppLocked,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      deepLinkData,
      deepLinkEmpty,
      deepLinkError,
      addPendingRedirection,
    },
    dispatch,
  )

const DeepLinkConnected = connect(mapStateToProps, mapDispatchToProps)(DeepLink)

export default DeepLinkConnected
