// @flow
import React from 'react'
import { Alert, StyleSheet, TouchableOpacity } from 'react-native'

import { colors } from '../common/styles'
import { ALERT_ICON, EvaIcon } from '../common/icons'
import {
  MESSAGE_ATTRIBUTE_RESTRICTIONS_MISMATCH_DESCRIPTION,
  MESSAGE_ATTRIBUTE_RESTRICTIONS_MISMATCH_TITLE,
} from '../proof-request/type-proof-request'
import { verticalScale } from 'react-native-size-matters'

type MismatchRestrictionsIconProps = {
  sender: string,
}

export const MismatchRestrictionsIcon = (props: MismatchRestrictionsIconProps) => {
  const showNetworkMismatchModal = () => {
    Alert.alert(
      MESSAGE_ATTRIBUTE_RESTRICTIONS_MISMATCH_TITLE,
      MESSAGE_ATTRIBUTE_RESTRICTIONS_MISMATCH_DESCRIPTION(props.sender),
      [
        {
          text: 'OK',
        },
      ],
    )
  }

  return (
    <TouchableOpacity
      style={styles.iconWrapper}
      onPress={showNetworkMismatchModal}
    >
      <EvaIcon name={ALERT_ICON} color={colors.red}/>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  iconWrapper: {
    marginTop: verticalScale(8),
  },
})
