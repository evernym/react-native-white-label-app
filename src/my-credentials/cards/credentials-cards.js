// @flow
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { moderateScale } from 'react-native-size-matters'
import CredentialCard from './card-item/credential-card-item'

import type { CredentialsCardsProps } from '../type-my-credentials'
import { colors, fontFamily } from '../../common/styles'
import CardStack from './card-stack'
import { ScrollView } from 'react-native-gesture-handler'
import { CARD_HEIGHT } from './credentials-constants'

export const CredentialsCards = (props: CredentialsCardsProps) => {
  const { credentials } = props
  const [activeStack, setActiveStack] = useState(null)
  const [isScrolling, setIsScrolling] = useState(true)
  const [yPosition, setYPosition] = useState(0)
  const scrollViewRef = useRef<any>(null)

  const updateActiveStack = (stackName, animate = true) => {
    setActiveStack(stackName)
    if (stackName === null && scrollViewRef !== null) {
      const y = yPosition - CARD_HEIGHT / 2
      scrollViewRef.current.scrollTo({ x: 0, y, animated: true })
      return
    }
    if (scrollViewRef !== null) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: animate })
    }
  }

  const groupedCredentials = credentials.reduce((acc: Object, credential) => {
    if (acc[credential.claimDefinitionId]) {
      acc[credential.claimDefinitionId].push(credential)
    } else {
      acc[credential.claimDefinitionId] = [credential]
    }
    return acc
  }, {})

  const credentialsData = Object.keys(groupedCredentials).map(
    (key) => groupedCredentials[key]
  )

  useEffect(() => {
    if (
      activeStack !== null &&
      groupedCredentials?.[activeStack]?.length === 1
    ) {
      setActiveStack(null, false)
    }
  }, [groupedCredentials, activeStack])

  const _onScrollBeginDrag = () => setIsScrolling(true)

  const _onScrollEndDrag = ({ nativeEvent }) => {
    setIsScrolling(false)
    setYPosition(nativeEvent.contentOffset.y)
  }

  return (
    <ScrollView
      scrollEnabled
      ref={scrollViewRef}
      onScrollBeginDrag={_onScrollBeginDrag}
      onScrollEndDrag={_onScrollEndDrag}
    >
      {credentialsData.length > 0 &&
        credentialsData.map((credentialGroup, index) => {
          const stackCredential = credentialGroup[0].claimDefinitionId
          const isHidden =
            stackCredential !== activeStack && activeStack !== null

          if (credentialGroup.length === 1) {
            return (
              <CredentialCard
                item={credentialGroup[0]}
                key={credentialGroup[0].claimOfferUuid}
                isExpanded={true}
                isHidden={isHidden}
                enabled={!isScrolling}
                isNeedMargin={index !== 0}
              />
            )
          } else {
            const isExpanded = stackCredential === activeStack

            return (
              <CardStack
                credentials={credentialGroup}
                key={credentialGroup[0].claimOfferUuid}
                isExpanded={isExpanded}
                setActiveStack={updateActiveStack}
                stackCredentialName={stackCredential}
                isHidden={isHidden}
                isNeedMargin={index === 0}
              />
            )
          }
        })}
    </ScrollView>
  )
}

export const styles = StyleSheet.create({
  flatListInnerContainer: {
    paddingBottom: moderateScale(20, 0.25),
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteSection: {
    width: moderateScale(100),
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: fontFamily,
    fontWeight: 'bold',
    color: colors.gray1,
  },
})
