// @flow
import React from 'react'
import { StyleSheet } from 'react-native'
import { Container, Loader } from '../components'
import { OFFSET_3X } from '../common/styles'
import { waitForInvitationRoute } from '../common'

const WaitForInvitation = () => {
  return (
    <Container center style={[styles.expiredTokenContainer]}>
      <Loader />
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
