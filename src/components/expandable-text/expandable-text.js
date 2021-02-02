// @flow
import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableWithoutFeedback } from 'react-native'
import { colors, fontSizes } from '../../common/styles'
import { verticalScale } from 'react-native-size-matters'

export function ExpandableText({ text, style, lines, ...rest }: {
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
    setToggleTitle(toggleTitle === 'more' ? 'collapse': 'more')
  }, [expanded])

  const onTextLayout = useCallback(e => {
    setShowToggleMarker(e.nativeEvent.lines.length > numLines)
  }, [numLines])

  const renderExpandMarker = useCallback(() => (
    <TouchableWithoutFeedback onPress={toggleText}>
      <Text style={[styles.moreText, {textAlign: style.textAlign, fontFamily: style.fontFamily}]}>
        {toggleTitle}
      </Text>
    </TouchableWithoutFeedback>
  ), [toggleTitle])

  return (
    <>
      {
        expanded ?
          <Text style={style} onTextLayout={onTextLayout} {...rest} >{text}</Text> :
          <Text style={style} onTextLayout={onTextLayout} numberOfLines={numLines} ellipsizeMode="tail" {...rest}>
            {text}
          </Text>
      }
      {showToggleMarker && renderExpandMarker()}
    </>
  )
}

const styles = StyleSheet.create({
  moreText: {
    fontSize: verticalScale(fontSizes.size7),
    fontWeight: '300',
    color: colors.blue,
    padding: 0,
    margin: 0,
  },
})
