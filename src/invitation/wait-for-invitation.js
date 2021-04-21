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
import { TOKEN_EXPIRED, TOKEN_UNRESOLVED } from '../expired-token/type-expired-token'
import { handleInvitation } from './invitation-store'
import { deepLinkProcessed } from '../deep-link/deep-link-store'
import {
  getSmsPendingInvitationError,
  getSmsPendingInvitationPayload,
} from '../store/store-selector'
import { getSmsPendingInvitation } from '../sms-pending-invitation/sms-pending-invitation-store'

const WaitForInvitation = (props: ReactNavigation) => {
  const { navigation, route } = props
  const dispatch = useDispatch()

  const payload = useSelector(state => getSmsPendingInvitationPayload(state, route.params.smsToken))
  const error = useSelector(state => getSmsPendingInvitationError(state, route.params.smsToken))

  useEffect(() => {
    dispatch(getSmsPendingInvitation(route.params.smsToken))
  }, [route.params.smsToken])

  useEffect(() => {
    if (error) {
      dispatch(deepLinkProcessed(route.params.smsToken))
      if (error.code === TOKEN_EXPIRED_CODE) {
        navigation.navigate(expiredTokenRoute, { reason: TOKEN_EXPIRED })
      } else {
        navigation.navigate(expiredTokenRoute, { reason: TOKEN_UNRESOLVED })
      }
    }
  })

  useEffect(() => {
    if (payload) {
      dispatch(handleInvitation(payload, route.params.smsToken))
    }
  })

  return (
    <Container center style={[styles.expiredTokenContainer]}>
      <Loader/>
    </Container>
  )
}

export const waitForInvitationScreen = {
  routeName: waitForInvitationRoute,
  screen: WaitForInvitation,
}

const styles = StyleSheet.create({
  expiredTokenContainer: {
    paddingTop: OFFSET_3X,
  },
})
