// @flow
// packages
import React from 'react'
import { View, StyleSheet } from 'react-native'

// components
import { InviteActionDetailsHeader } from './invite-action-details-header'
import { InviteActionTitle } from './invite-action-title'
import { InviteActionBody } from './invite-action-body'

// types
import type { InviteActionDetailsHeaderProps } from '../type-invite-action'

export const InviteActionDetails = ({
  institutionalName,
  inviteActionTitle,
  inviteActionDetails,
  imageUrl,
}: InviteActionDetailsHeaderProps) => {
  const { inviteActionTitleStyles } = styles
  return (
    <View>
      <InviteActionDetailsHeader
        {...{
          institutionalName,
          imageUrl,
        }}
      />
      <InviteActionTitle {...{ inviteActionTitle, inviteActionTitleStyles }} />
      <InviteActionBody {...{ inviteActionDetails }} />
    </View>
  )
}

const styles = StyleSheet.create({
  inviteActionTitleStyles: {
    marginBottom: 10,
    fontWeight: '700',
  },
})
