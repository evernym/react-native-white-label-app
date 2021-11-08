// @flow
import React from 'react'
import { StyleSheet } from 'react-native'

import { CustomView } from '../../../components/layout'
import { ExpandableText } from '../../../components/expandable-text/expandable-text'
import { color, fontSizes as fonts } from '../../../common/styles'

const QuestionTitle = (props: { title: string, questionStyles: any }) => {
  const maxLength = 500
  let title =
    props.title.length < maxLength
      ? props.title
      : `${props.title.substring(0, maxLength)}...`
  return (
    <CustomView
      style={props.questionStyles.questionTitle}
      testID={`question-title`}
      accessible={true}
      accessibilityLabel={`question-title`}
    >
      <ExpandableText
        text={title}
        style={styles.text} />
    </CustomView>
  )
}

const styles = StyleSheet.create({
  text: {
    color: color.bg.tertiary.font.seventh,
    fontSize: fonts.size2,
    fontWeight: 'bold'
  }
})

export default QuestionTitle
