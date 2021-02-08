// @flow
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { colors, fontFamily } from '../../common/styles/constant'

import type { Store } from '../../store/type-store'
import type { UnreadMessagesBadgeProps } from './type-unread-messages-badge'
import { verticalScale, moderateScale } from 'react-native-size-matters'

import { getNewMessagesCount } from '../../store/store-selector'

export const UnreadMessagesBadge = ({
  customContainerStyle,
  numberOfNewMessages = 0,
  absolutePosition,
}: UnreadMessagesBadgeProps) => {
  if (numberOfNewMessages <= 0) {
    return null
  }

  const containerStyle = customContainerStyle
    ? customContainerStyle
    : absolutePosition
    ? styles.containerAbsolute
    : styles.container

  return (
    <View style={containerStyle}>
      <Text style={styles.numberText}>
        {numberOfNewMessages > 9 ? '9+' : numberOfNewMessages}
      </Text>
    </View>
  )
}

const mapStateToProps = (state: Store, props: UnreadMessagesBadgeProps) => {
  const numberOfNewMessages = props.numberOfNewMessages
    ? props.numberOfNewMessages
    : getNewMessagesCount(state)

  return {
    numberOfNewMessages,
  }
}

export default connect(mapStateToProps)(UnreadMessagesBadge)

export const unreadMessageContainerCommonStyle = {
  width: moderateScale(22),
  height: moderateScale(22),
  borderRadius: moderateScale(22) / 2,
  backgroundColor: colors.main,
  alignItems: 'center',
  justifyContent: 'center',
}
const styles = StyleSheet.create({
  container: {
    ...unreadMessageContainerCommonStyle,
    marginTop: verticalScale(2),
    marginLeft: moderateScale(5),
  },
  containerAbsolute: {
    ...unreadMessageContainerCommonStyle,
  },
  numberText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.white,
  },
})
