// @flow
import React from 'react'
import { Image } from 'react-native'

import type { ImageURISource } from 'react-native/Libraries/Image/ImageSource'

import { CustomView } from '../../../components/layout'
import QuestionScreenText from './question-screen-text'
import { DefaultLogo } from '../../../components/default-logo/default-logo'

const QuestionSenderDetail = (props: {
  source?: null | number | ImageURISource,
  senderName: string,
  questionStyles: any,
}) => {
  return (
    <CustomView
      row={false}
      style={props.questionStyles.questionSenderContainer}
      center
    >
      {props.source && props.source.uri ? (
        <Image
          style={[props.questionStyles.questionSenderLogo]}
          source={props.source}
          resizeMode="cover"
        />
      ) : (
        <DefaultLogo
          text={props.senderName}
          size={props.questionStyles.placeholderIfNoImage.width}
          fontSize={props.questionStyles.placeholderIfNoImage.fontSize}
        />
      )}
      <QuestionScreenText size="h4b" numberOfLines={2} color={'#A5A5A5'}>
        {props.senderName}
      </QuestionScreenText>
    </CustomView>
  )
}

export default QuestionSenderDetail
