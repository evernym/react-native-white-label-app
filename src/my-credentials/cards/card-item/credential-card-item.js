// @flow
import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useDispatch } from 'react-redux'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import dayjs from 'dayjs'
import { useNavigation } from '@react-navigation/native'
import Animated, {
  add,
  call,
  cond,
  eq,
  set,
  useCode,
} from 'react-native-reanimated'
import {
  PanGestureHandler,
  State,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import {
  min,
  mix,
  snapPoint,
  timing,
  usePanGestureHandler,
  useTransition,
  useValue,
} from 'react-native-redash/lib/module/v1'

import { colors, fontFamily, fontSizes } from '../../../common/styles/constant'
import { Avatar } from '../../../components/avatar/avatar'
import { DefaultLogo } from '../../../components/default-logo/default-logo'
import { credentialDetailsRoute } from '../../../common'
import type {
  CredentialCardProps,
  CredentialItem,
} from '../../type-my-credentials'
import {
  MESSAGE_DELETE_CLAIM_DESCRIPTION,
  MESSAGE_DELETE_CLAIM_TITLE,
} from '../../type-my-credentials'
import { DELETE_ICON, EvaIcon } from '../../../common/icons'
import { deleteClaim } from '../../../claim/claim-store'
import {
  CARD_HEIGHT,
  CARD_MARGIN,
  CARD_OFFSET,
  CARD_TOTAL_HEIGHT,
  TRANSITION_DURATION,
  WHITE_TEXT_BRIGHTNESS_LIMIT,
} from '../credentials-constants'
import { brightnessByColor } from '../utils'

import { TAPPING_ON_A_CREDENTIAL } from '../../../feedback/log-to-apptentive'

const textColor = colors.white

const CredentialCard = ({
  item,
  isExpanded,
  setActiveStack,
  isHidden,
  elevation,
  enabled,
  isNeedMargin,
}: CredentialCardProps) => {
  const {
    logoUrl,
    date,
    credentialName,
    issuerName,
    attributes,
    claimOfferUuid,
    colorTheme,
  } = item
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRemove, setShouldRemove] = useState(false)
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const offsetX = useValue(0)
  const translateX = useValue(0)

  const collapseTransition = useTransition(isHidden || shouldRemove, {
    duration: TRANSITION_DURATION,
  })
  const {
    gestureHandler,
    translation,
    state,
    velocity,
  } = usePanGestureHandler()

  const snapPoints = [0, CARD_OFFSET]
  const to = snapPoint(translateX, velocity.x, snapPoints)
  const hiddenHight = mix(collapseTransition, CARD_TOTAL_HEIGHT, 0)
  const hiddenOpacity = mix(collapseTransition, 1, 0)

  // Manage animations and gesture handler
  useCode(
    () => [
      cond(
        isExpanded,
        [
          cond(eq(state, State.ACTIVE), [
            set(translateX, add(offsetX, min(translation.x, 0))),
          ]),
          cond(eq(state, State.END), [
            set(translateX, timing({ from: translateX, to })),
            set(offsetX, translateX),
            cond(
              eq(to, CARD_OFFSET),
              call([], () => setIsOpen(true)),
              call([], () => setIsOpen(false))
            ),
          ]),
        ],
        [
          set(translateX, timing({ from: translateX, to: 0 })),
          set(offsetX, translateX),
        ]
      ),
    ],
    [isExpanded]
  )

  const getTextColor = useCallback(() => {
    const brightness = brightnessByColor(colorTheme)
    return brightness > WHITE_TEXT_BRIGHTNESS_LIMIT
      ? colors.gray0
      : colors.white
  }, [colorTheme])

  const onPress = () => {
    if (isExpanded) {
      if (isOpen) {
        // Look for a way to close
      } else {
        navigation.navigate(credentialDetailsRoute, {
          credentialName,
          issuerName,
          date,
          attributes,
          logoUrl,
          claimOfferUuid,
        })

        dispatch(TAPPING_ON_A_CREDENTIAL)
      }
    } else {
      if (setActiveStack !== undefined) {
        setActiveStack(credentialName)
      }
    }
  }

  const onDelete = (item: CredentialItem) => {
    setTimeout(() => {
      Alert.alert(
        MESSAGE_DELETE_CLAIM_TITLE,
        MESSAGE_DELETE_CLAIM_DESCRIPTION,
        [
          {
            text: 'Cancel',
          },
          {
            text: 'Delete',
            onPress: () => {
              setShouldRemove(true)
              setTimeout(() => {
                dispatch(deleteClaim(item.claimOfferUuid))
              }, TRANSITION_DURATION)
            },
          },
        ],
        { cancelable: false }
      )
    }, 300)
  }

  return (
    <Animated.View
      style={{
        height: hiddenHight,
        overflow: 'hidden',
        opacity: hiddenOpacity,
        marginTop: isNeedMargin ? -CARD_MARGIN : 0,
      }}
    >
      <View style={styles.background}>
        <TouchableOpacity
          style={styles.deleteSection}
          onPress={() => onDelete(item)}
        >
          <EvaIcon
            name={DELETE_ICON}
            width={moderateScale(32)}
            height={moderateScale(32)}
          />
          <Text style={{ color: colors.gray2 }}>Delete</Text>
        </TouchableOpacity>
      </View>

      <PanGestureHandler
        {...gestureHandler}
        activeOffsetX={enabled ? [-10, 0] : 1000}
        activeOffsetY={500}
      >
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableWithoutFeedback
            style={[styles.container, { elevation: elevation }]}
            onPress={onPress}
            accessible={false}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colorTheme,
                },
              ]}
            >
              <View style={styles.ovalEffect} />
              <View style={styles.content} accessible={false}>
                <View style={styles.upperContent}>
                  {date && (
                    <Text style={[styles.date, { color: getTextColor() }]}>
                      {dayjs(date * 1000).format('D MMMM YYYY')}
                    </Text>
                  )}
                  <View style={styles.avatarSection}>
                    {typeof logoUrl === 'string' ? (
                      <Avatar
                        radius={16}
                        src={{ uri: logoUrl }}
                        testID={`${credentialName}-avatar`}
                      />
                    ) : (
                      issuerName && (
                        <DefaultLogo
                          text={issuerName}
                          size={32}
                          fontSize={17}
                        />
                      )
                    )}
                  </View>
                </View>
                <View>
                  <Text
                    style={[styles.credentialName, { color: getTextColor() }]}
                    numberOfLines={2}
                    testID={`${credentialName}-title`}
                  >
                    {credentialName}
                  </Text>
                  <Text style={[styles.attributes, { color: getTextColor() }]}>
                    {attributes.length}{' '}
                    {attributes.length === 1 ? 'Attribute' : 'Attributes'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  )
}

CredentialCard.defaultProps = {
  elevation: 1,
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    margin: CARD_MARGIN,
    borderRadius: moderateScale(16),
    shadowRadius: 6,
    shadowOpacity: 0.2,
    shadowOffset: { height: 6 },
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  ovalEffect: {
    position: 'absolute',
    alignSelf: 'center',
    height: CARD_HEIGHT,
    width: CARD_HEIGHT,
    backgroundColor: colors.white,
    opacity: 0.1,
    borderRadius: CARD_HEIGHT / 2,
    transform: [{ scaleX: 2.3 }, { translateY: -CARD_HEIGHT / 1.8 }],
  },
  content: {
    padding: moderateScale(16),
    flex: 1,
    justifyContent: 'space-between',
  },
  upperContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: textColor,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  avatarSection: {
    height: '100%',
    width: moderateScale(64),
    alignItems: 'flex-end',
  },
  credentialName: {
    color: textColor,
    fontSize: verticalScale(fontSizes.size2),
    fontWeight: '700',
    fontFamily: fontFamily,
    marginBottom: 8,
  },
  attributes: {
    color: textColor,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    margin: CARD_MARGIN,
  },
  deleteSection: {
    width: moderateScale(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default CredentialCard
