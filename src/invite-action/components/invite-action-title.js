// @flow
import React from 'react'

// components
import { CustomView } from '../../components/layout'
import { ActionText } from './action-text'

export const InviteActionTitle = ({
  inviteActionTitle,
  inviteActionTitleStyles,
}: {
  inviteActionTitle: string,
  inviteActionTitleStyles: any,
}) => {
  const maxLength = 500

  let title =
    inviteActionTitle.length < maxLength
      ? inviteActionTitle
      : `${inviteActionTitle.substring(0, maxLength)}...`
  return (
    <CustomView style={inviteActionTitleStyles}>
      <ActionText size="h3b">{title}</ActionText>
    </CustomView>
  )
}
