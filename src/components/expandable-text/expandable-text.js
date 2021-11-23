// @flow
import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors } from '../../common/styles/constant'

export function ExpandableText({
  text,
  style,
  lines,
  ...rest
}: {
  text: string,
  style: Object,
  lines?: number,
  testID?: string,
  accessible?: boolean,
  accessibilityLabel?: string,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showToggleMarker, setShowToggleMarker] = useState(false)
  const [toggleTitle, setToggleTitle] = useState('more')

  const numLines = lines || 2

  const toggleText = useCallback(() => {
    setExpanded(!expanded)
    setToggleTitle(toggleTitle === 'more' ? 'collapse' : 'more')
  }, [expanded])

  const onTextLayout = useCallback(
    (e) => {
      setShowToggleMarker(e.nativeEvent.lines.length > numLines)
    },
    [numLines]
  )

  const renderExpandMarker = useCallback(
    () => (
      <TouchableWithoutFeedback hitSlop={hitSlop} onPress={toggleText}>
        <View style={styles.moreTextContainer}>
          <Text
            style={[
              styles.moreText,
              { textAlign: style.textAlign, fontFamily: style.fontFamily },
            ]}
          >
            {toggleTitle}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    ),
    [toggleTitle]
  )

  return (
    <>
      {expanded ? (
        <Text style={style} onTextLayout={onTextLayout} {...rest}>
          {text}
        </Text>
      ) : (
        <Text
          style={style}
          onTextLayout={onTextLayout}
          numberOfLines={numLines}
          ellipsizeMode="tail"
          {...rest}
        >
          {text}
        </Text>
      )}
      {showToggleMarker && renderExpandMarker()}
    </>
  )
}

const touchArea = moderateScale(10)
const hitSlop = {
  top: touchArea,
  left: touchArea,
  bottom: touchArea,
  right: touchArea,
}

const styles = StyleSheet.create({
  moreText: {
    fontSize: verticalScale(12),
    fontWeight: '300',
    color: colors.main,
    padding: 0,
    margin: 0,
  },
  moreTextContainer: {
    padding: touchArea,
    margin: -touchArea,
  },
})
