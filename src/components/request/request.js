// @flow
import React, { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

import type { RequestProps } from './type-request'

import { Container } from '../layout/container'
import RequestDetail from './request-detail'
import { ModalButtons } from '../buttons/modal-buttons'
import { colors } from '../../common/styles'
import { CONNECT, DENY } from '../../common'
import { StyleSheet } from 'react-native'
import { moderateScale } from 'react-native-size-matters'
import { useSelector } from 'react-redux'
import { getOfflineStatus } from '../../store/store-selector'

export const Request = ({
  title,
  onAction,
  invitationError,
  message,
  senderLogoUrl,
  senderName,
  testID,
}: RequestProps) => {
  const isOffline = useSelector(getOfflineStatus)

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
        colorBackground={colors.main}
        secondColorBackground={colors.main}
        denyButtonText={DENY}
        acceptBtnText={CONNECT}
        disableDeny={disableActions}
        disableAccept={disableActions || isOffline}
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
    paddingBottom:
      Platform.OS === 'ios' ? moderateScale(30) : moderateScale(10),
  },
})
