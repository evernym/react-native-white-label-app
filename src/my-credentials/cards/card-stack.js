import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Animated from 'react-native-reanimated'
import { mix, useTransition } from 'react-native-redash/lib/module/v1'
import { verticalScale } from 'react-native-size-matters'
import { EvaIcon, CLOSE_ICON } from '../../common/icons'
import { CardStackProps } from '../type-my-credentials'
import CredentialCard from './card-item/credential-card-item'
import {
  CARD_HEIGHT,
  CARD_MARGIN,
  CARD_TOTAL_HEIGHT,
  HIDE_ICON_HIGHT,
  HIDE_ICON_TOTAL_HIGHT,
  TRANSITION_DURATION,
} from './credentials-constants'
import { colors } from '../../common/styles/constant'

const CardStack = (props: CardStackProps) => {
  const {
    credentials,
    isExpanded,
    setActiveStack,
    isHidden,
    enabledCardGesture,
    isNeedMargin,
  } = props
  const credsToDisplay = isExpanded ? credentials : credentials.slice(0, 3)
  const credCount = credsToDisplay.length
  const hasMoreCreds = !isExpanded && credentials.length > credsToDisplay.length

  const expandedTransition = useTransition(isExpanded, {
    duration: TRANSITION_DURATION,
  })
  const hiddenTransition = useTransition(isHidden, {
    duration: TRANSITION_DURATION,
  })
  const moreTextTransition = useTransition(hasMoreCreds, {
    duration: TRANSITION_DURATION,
  })

  const openCredsSize = CARD_TOTAL_HEIGHT * credentials.length
  const expandedStack = openCredsSize + HIDE_ICON_TOTAL_HIGHT
  const collapsedStack = CARD_HEIGHT + CARD_MARGIN * credCount

  const height = mix(expandedTransition, collapsedStack, expandedStack)
  const hiddenHeight = mix(hiddenTransition, height, 0)
  const hiddenOpacity = mix(hiddenTransition, 1, 0)
  const hideBtnOpacity = mix(isExpanded, 0, 1)
  const moreTextOpacity = mix(hasMoreCreds, 0, 1)
  const extraMargin = mix(moreTextTransition, 0, CARD_MARGIN)

  return (
    <Animated.View
      style={{
        height: hiddenHeight,
        opacity: hiddenOpacity,
        marginBottom: extraMargin,
        marginTop: isNeedMargin ? CARD_MARGIN : 0,
      }}
    >
      <>
        <Animated.View style={{ height }}>
          {credentials.map((cred, index) => {
            const margin = index >= 3 ? CARD_MARGIN * 2 : CARD_MARGIN
            const translateY = mix(
              expandedTransition,
              -(CARD_HEIGHT + margin) * index,
              0
            )
            const scaleX = mix(expandedTransition, 0.9 ** index, 1)

            if (!isExpanded && index > 2) {
              return null
            }

            const marginTopDefault = index === 0 ? -CARD_MARGIN : 0

            return (
              <Animated.View
                key={cred.claimOfferUuid}
                style={{
                  zIndex: credCount - index,
                  transform: [{ scaleX }, { translateY }],
                  marginTop: isExpanded ? CARD_MARGIN : marginTopDefault,
                  marginBottom: isExpanded ? -CARD_MARGIN : undefined,
                }}
              >
                <CredentialCard
                  item={cred}
                  isExpanded={isExpanded}
                  setActiveStack={setActiveStack}
                  elevation={credCount - index}
                  enabled={enabledCardGesture}
                  isNeedMargin={isExpanded && index !== 0}
                />
              </Animated.View>
            )
          })}

          <Animated.View
            style={[styles.hideBtnRow, { opacity: hideBtnOpacity }]}
          >
            <TouchableOpacity
              style={styles.hideBtn}
              onPress={() => setActiveStack(null)}
            >
              <EvaIcon
                name={CLOSE_ICON}
                width={HIDE_ICON_HIGHT * 0.65}
                height={HIDE_ICON_HIGHT * 0.65}
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.moreTextRow,
            {
              opacity: moreTextOpacity,
            },
          ]}
        >
          <Text style={styles.moreText}>
            + {credentials.length - credsToDisplay.length} more
          </Text>
        </Animated.View>
      </>
    </Animated.View>
  )
}

export default CardStack

const styles = StyleSheet.create({
  hideBtnRow: {
    alignItems: 'center',
    marginVertical: CARD_MARGIN * 2,
  },

  hideBtn: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: HIDE_ICON_HIGHT,
    height: HIDE_ICON_HIGHT,
    backgroundColor: '#fff',
    borderRadius: HIDE_ICON_HIGHT / 2,
  },
  moreTextRow: { alignItems: 'center', marginTop: -CARD_MARGIN },
  moreText: { fontSize: verticalScale(14), color: colors.gray2 },
})
