// @flow
import React from 'react'
import { StyleSheet } from 'react-native'
import { Container, Loader } from '../components'
import { OFFSET_3X } from '../common/styles'
import {
  expiredTokenRoute,
  waitForInvitationRoute,
} from '../common'
import type { ReactNavigation } from '../common/type-common'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { TOKEN_EXPIRED_CODE } from '../api/api-constants'
import { TOKEN_EXPIRED, TOKEN_UNRESOLVED } from '../expired-invitation/type-expired-invitation'
import { handleInvitation } from './invitation-store'
import { deepLinkProcessed } from '../deep-link/deep-link-store'
import {
  getDeepLinkStatus,
  getSmsPendingInvitationError,
  getSmsPendingInvitationPayload,
} from '../store/store-selector'
import { getSmsPendingInvitation } from '../sms-pending-invitation/sms-pending-invitation-store'
import { DEEP_LINK_STATUS } from '../deep-link/type-deep-link'

const WaitForInvitation = (props: ReactNavigation) => {
  const { navigation, route } = props
  const identifier = route.params.token || route.params.url

  const dispatch = useDispatch()

  const payload = useSelector(state => getSmsPendingInvitationPayload(state, identifier))
  const error = useSelector(state => getSmsPendingInvitationError(state, identifier))
  const status = useSelector(state => getDeepLinkStatus(state, identifier))

  useEffect(() => {
    dispatch(getSmsPendingInvitation(identifier))
  }, [route])

  useEffect(() => {
    if (error && status !== DEEP_LINK_STATUS.PROCESSED) {
      dispatch(deepLinkProcessed(identifier))
      if (error.code === TOKEN_EXPIRED_CODE) {
        navigation.navigate(expiredTokenRoute, { reason: TOKEN_EXPIRED })
      } else {
        navigation.navigate(expiredTokenRoute, { reason: TOKEN_UNRESOLVED })
      }
    }
  })

  useEffect(() => {
    if (payload && status !== DEEP_LINK_STATUS.PROCESSED) {
      dispatch(handleInvitation(payload, identifier))
    }
  })

  return (
    <Container center style={[styles.container]}>
      <Loader/>
    </Container>
  )
}

export const waitForInvitationScreen = {
  routeName: waitForInvitationRoute,
  screen: WaitForInvitation,
}

const styles = StyleSheet.create({
  container: {
    paddingTop: OFFSET_3X,
  },
})
