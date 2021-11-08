// @flow
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { color, fontSizes as fonts } from '../../../common/styles'
import { ExpandableText }  from '../../../components/expandable-text/expandable-text'
import { moderateScale } from 'react-native-size-matters'

const QuestionText = (props: { text: ?string, questionStyles: any }) => {
  if (!props.text) {
    return null
  }

  return (
    <View style={styles.textContainer}>
      <ExpandableText
        text={props.text}
        style={styles.text}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  text: {
    color: color.bg.tertiary.font.seventh,
    fontSize: fonts.size4,
  },
  textContainer: {
    marginBottom: moderateScale(10)
  }
})


export default QuestionText
