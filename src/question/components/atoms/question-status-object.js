// @flow
import React from 'react'
import LottieView from 'lottie-react-native'
import { Loader } from '../../../components'
import { CustomView } from '../../../components/layout'
import QuestionScreenText from './question-screen-text'

const QuestionError = (props: { questionStyles: any }) => {
  const { questionStyles } = props
  return (
    <CustomView
      bg="tertiary"
      center
      style={[questionStyles.questionErrorContainer]}
    >
      <CustomView>
        <LottieView
          source={require('../../../images/red-cross-lottie.json')}
          autoPlay
          loop={false}
          style={questionStyles.feedbackIcon}
        />
      </CustomView>
      <QuestionScreenText size="h4" bold={false}>
        Error occurred
      </QuestionScreenText>
    </CustomView>
  )
}

const QuestionLoader = (props: { questionStyles: any }) => {
  const { questionStyles } = props
  return (
    <CustomView bg="tertiary" style={[questionStyles.questionLoaderContainer]}>
      <Loader type="dark" showMessage={true} message={'Sending...'} />
    </CustomView>
  )
}

function QuestionSuccess(props: {
  afterSuccessShown: () => void,
  questionStyles: any,
}) {
  const { questionStyles } = props
  return (
    <CustomView
      bg="tertiary"
      center
      style={[questionStyles.questionSuccessContainer]}
    >
      <CustomView>
        <LottieView
          source={require('../../../images/green-tick-lottie.json')}
          autoPlay
          loop={false}
          style={questionStyles.feedbackIcon}
          onAnimationFinish={props.afterSuccessShown}
          speed={1.5}
        />
      </CustomView>
      <QuestionScreenText size="h4" bold={false}>
        Sent
      </QuestionScreenText>
    </CustomView>
  )
}

export { QuestionError, QuestionLoader, QuestionSuccess }
