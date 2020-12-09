// @flow
import React, { useCallback, useEffect, useState } from 'react'

import type { RequestProps } from './type-request'

import { Container } from '../layout/container'
import RequestDetail from './request-detail'
import { ModalButtons } from '../buttons/modal-buttons'
import { colors } from '../../common/styles'
import { CONNECT, DENY } from '../../common'
import { StyleSheet } from 'react-native'
import { moderateScale } from 'react-native-size-matters'

export const Request = ({
  title,
  onAction,
  invitationError,
  message,
  senderLogoUrl,
  senderName,
  testID,
}: RequestProps) => {
  const [disableActions, setDisableActions] = useState(false)

  const onAccept = useCallback(() => {
    setDisableActions(true)
    // Move these values to enum, we are not doing it now because of TODO in type file
    onAction('accepted')
  }, [])

  const onDecline = useCallback(() => {
    setDisableActions(true)
    // Move these values to enum, we are not doing it now because of TODO in type file
    onAction('rejected')
  }, [])

  useEffect(() => {
    // When Accept invitation errors out we are re-enabling accept button. Giving user the option to retry.
    if (invitationError) {
      setDisableActions(false)
    }
  }, [invitationError])

  return (
    <Container>
      <Container fifth>
        <RequestDetail
          title={title}
          message={message}
          senderLogoUrl={senderLogoUrl}
          senderName={senderName}
          testID={testID}
        />
      </Container>
      <ModalButtons
        onPress={onAccept}
        onIgnore={onDecline}
        colorBackground={colors.cmGreen1}
        secondColorBackground={colors.cmGreen1}
        topBtnText={DENY}
        bottomBtnText={CONNECT}
        disableDeny={disableActions}
        disableAccept={disableActions}
        topTestID={`${testID}-deny`}
        bottomTestID={`${testID}-accept`}
        containerStyles={styles.container}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(15),
    paddingBottom: moderateScale(10),
  },
})
