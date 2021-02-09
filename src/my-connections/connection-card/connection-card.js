// @flow
import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import type { ConnectionCardProps } from './type-connection-card'
import { styles } from './styles'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { UnreadMessagesBadge } from '../../components'
import { isNewConnection } from '../../store/store-utils'

const ConnectionCard = (props: ConnectionCardProps) => {
  const onButtonPress = useCallback(() => {
    {
      props.onPress(props.senderName, props.image, props.senderDID)
      props.onNewConnectionSeen(props.senderDID)
    }
  }, [props])

  // eslint-disable-next-line no-unused-vars
  const renderUnreadMessagesBadge = () => {
    let numberOfNewMessages = 0
    props.events.forEach((message) => {
      if (isNewConnection(message.status, message.showBadge)) {
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
    <TouchableOpacity style={styles.itemContainer} onPress={onButtonPress} accessible={false}>
      {/*{*/}
      {/*  renderUnreadMessagesBadge()*/}
      {/*}*/}
      <View style={styles.avatarSection}>
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
        numberOfLines={3}
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
