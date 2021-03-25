// @flow
import React from 'react'

// components
import { ActionText } from './action-text'

export const InviteActionBody = ({
  inviteActionDetails,
}: {
  inviteActionDetails: ?string,
}) => {
  if (!inviteActionDetails) {
    return null
  }

  return (
    <ActionText bold={false} size="h5">
      {inviteActionDetails}
    </ActionText>
  )
}
