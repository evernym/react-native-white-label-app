// @flow
import React, { useCallback } from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { moderateScale } from 'react-native-size-matters'
import type { HeaderProps } from '../type-header'
import { useDispatch } from 'react-redux'

import { EvaIcon, HOME_MENU_ICON } from '../../../common/icons'
import UnreadMessagesBadge from '../../unread-messages-badge/unread-messages-badge'
import {
  SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_MENU,
  SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_TITLE,
  styles,
} from '../type-header'

import { SIDE_MENU_BUTTON } from '../../../feedback/log-to-apptentive'

export const HeaderWithMenu = ({
  headline,
  showUnreadMessagesBadge,
}: HeaderProps) => {
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const toggleDrawer = useCallback(() => {
    navigation.toggleDrawer()

    dispatch(SIDE_MENU_BUTTON)
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.iconSection}>
        <TouchableOpacity testID="burger-menu" onPress={toggleDrawer}>
          <EvaIcon
            name={HOME_MENU_ICON}
            width={moderateScale(32)}
            height={moderateScale(32)}
            style={styles.menuIcon}
            accessible={true}
            accessibilityLabel="burger-menu"
          />
        </TouchableOpacity>
        {showUnreadMessagesBadge ===
          SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_MENU && (
          <UnreadMessagesBadge absolutePosition={true} />
        )}
      </View>
      <View style={styles.labelSection}>
        <Text style={styles.label}>{headline}</Text>
        {showUnreadMessagesBadge ===
          SHOW_UNREAD_MESSAGES_BADGE_NEAR_WITH_TITLE && <UnreadMessagesBadge />}
      </View>
    </View>
  )
}
