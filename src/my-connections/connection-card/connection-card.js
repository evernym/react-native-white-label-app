// @flow
import React, { useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import { moderateScale } from 'react-native-size-matters'

import { colors } from '../../common/styles/constant'
import { EvaIcon, ERROR_ICON } from '../../common/icons'
import type { ConnectionCardProps } from './type-connection-card'
import { styles } from './styles'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { UnreadMessagesBadge } from '../../components'
import { isNewEvent } from '../../store/store-utils'
import { CONNECTION_FAIL } from '../../store/type-connection-store'
import { INVITATION_ACCEPTED } from '../../invitation/type-invitation'

const ConnectionCard = (props: ConnectionCardProps) => {
  const onButtonPress = useCallback(() => {
    {
      props.onPress()
      props.onNewConnectionSeen(props.senderDID)
    }
  }, [props])

  // eslint-disable-next-line no-unused-vars
  const renderUnreadMessagesBadge = () => {
    let numberOfNewMessages = 0
    props.events.forEach((message) => {
      if (isNewEvent(message.status, message.showBadge)) {
        numberOfNewMessages++
      }
    })

    if (numberOfNewMessages > 0) {
      return (
        <UnreadMessagesBadge
          customContainerStyle={styles.customGreenBadgeContainer}
          numberOfNewMessages={numberOfNewMessages}
        />
      )
    } else {
      return <View />
    }
  }

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={onButtonPress}
      accessible={false}
    >
      {/*{*/}
      {/*  renderUnreadMessagesBadge()*/}
      {/*}*/}
      {props.status === CONNECTION_FAIL && (
        <View style={styles.errorImage}>
          <EvaIcon
            name={ERROR_ICON}
            width={moderateScale(24)}
            height={moderateScale(24)}
            color={colors.red}
          />
        </View>
      )}

      <View style={styles.avatarSection}>
        {props.status === INVITATION_ACCEPTED && (
          <View style={styles.loader}>
            <ActivityIndicator type="dark" size="large" />
          </View>
        )}
        {typeof props.image === 'string' ? (
          <Image
            source={{ uri: props.image }}
            style={styles.avatarStyle}
            testID={`${props.senderName}-avatar`}
            accessible={true}
            accessibilityLabel={`${props.senderName}-logo`}
          />
        ) : (
          <DefaultLogo text={props.senderName} size={72} fontSize={40} />
        )}
      </View>
      <Text
        style={styles.companyNameText}
        numberOfLines={2}
        ellipsizeMode="tail"
        testID={`${props.senderName}-title`}
        accessible={true}
        accessibilityLabel={`${props.senderName}-title`}
      >
        {props.senderName}
      </Text>
    </TouchableOpacity>
  )
}

export { ConnectionCard }
