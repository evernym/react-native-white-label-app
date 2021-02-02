// @flow
import React, { Component } from 'react'
import { LayoutAnimation, FlatList, SafeAreaView } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import QuestionDetails from './components/atoms/question-details'
import QuestionScreenText from './components/atoms/question-screen-text'
import QuestionSenderDetail from './components/atoms/question-sender-details'
import { ModalHeaderBar } from '../components/modal-header-bar/modal-header-bar'
import {
  QuestionError,
  QuestionLoader,
  QuestionSuccess,
} from './components/atoms/question-status-object'

import type {
  QuestionScreenProps,
  QuestionResponse,
  QuestionScreenState,
  QuestionStoreMessage,
  QuestionScreenNavigation,
} from './type-question'
import type { Store } from '../store/type-store'
import type { ComponentStatus, CustomError } from '../common/type-common'
import type { Connection } from '../store/type-connection-store'

import { CustomView } from '../components'
import { homeDrawerRoute, homeRoute, questionRoute } from '../common/route-constants'
import { colors } from '../common/styles/constant'
import { QUESTION_STATUS } from './type-question'
import {
  updateQuestionStatus,
  sendAnswerToQuestion,
  getScreenStatus,
  getQuestionValidity,
} from './question-store'
import { questionStyles as defaultQuestionStyles } from './question-screen-style'
import { getConnection } from '../store/store-selector'
import { QuestionActions } from './components/question-screen-actions'
import { checkIfAnimationToUse } from '../bridge/react-native-cxs/RNCxs'
import { customLogger } from '../store/custom-logger'

export class Question extends Component<
  QuestionScreenProps,
  QuestionScreenState
  > {
  state = {
    response: null,
  }

  render() {
    const { question } = this.props

    let questionStyles = this.props.questionStyles
    if (!questionStyles) {
      questionStyles = defaultQuestionStyles
    }

    const { success, loading }: ComponentStatus = getScreenStatus(
      question ? question.status : undefined
    )

    const keyExtractor = (item) => item
    const validationError: null | CustomError = getQuestionValidity(
      question && question.payload
    )
    return (
      <SafeAreaView style={questionStyles.listContainer}>
        <FlatList
          data={this.populateListData(question, validationError)}
          style={questionStyles.listStyle}
          renderItem={this.renderQuestionSection}
          keyExtractor={keyExtractor}
        />
        {/* We need to show action buttons all the time except when screen
            is in loading state */}
        {!loading && !validationError && !success && (
          <QuestionActions
            selectedResponse={this.state.response}
            onSubmit={this.onSubmit}
            onCancel={this.onCancel}
            onSelectResponseAndSubmit={this.onSelectResponseAndSubmit}
            question={this.props.question}
          />
        )}
      </SafeAreaView>
    )
  }

  populateListData = (
    question?: QuestionStoreMessage,
    validationError?: null | CustomError
  ) => {
    const { success, error, loading, idle }: ComponentStatus = getScreenStatus(
      question ? question.status : undefined
    )
    let data = []
    // if (validationError == null) {
    data.push('header')
    // }
    if (error) {
      data.push('error')
    }
    if (success) {
      data.push('success')
    }
    if (loading) {
      data.push('loading')
    }
    if (idle) {
      data.push('idle')
    }
    /* if we get validation error then render validation error code and nothing else should be rendered */
    if (validationError != null) {
      data.push('invalidData')
    }
    return data
  }

  renderQuestionSection = ({ item }: { item: string }) => {
    const { question } = this.props
    const validationError: null | CustomError = getQuestionValidity(
      question && question.payload
    )
    switch (item) {
      case 'header':
        return (
          <QuestionSenderDetail
            source={this.props.senderLogoUrl}
            senderName={this.props.senderName}
            questionStyles={defaultQuestionStyles}
          />
        )

      case 'invalidData':
        let { code = '' } = validationError || {}
        return (
          <CustomView center style={[defaultQuestionStyles.screenContainer]}>
            <QuestionScreenText size="h5">
              {`Invalid data. Validation error code: ${code}`}
            </QuestionScreenText>
          </CustomView>
        )

      case 'error':
        return <QuestionError questionStyles={defaultQuestionStyles} />

      case 'success':
        return (
          <QuestionSuccess
            afterSuccessShown={this.afterSuccessShown}
            questionStyles={defaultQuestionStyles}
          />
        )

      case 'loading':
        return <QuestionLoader questionStyles={defaultQuestionStyles} />

      case 'idle':
        return (
          <QuestionDetails
            question={question}
            selectedResponse={this.state.response}
            onResponseSelect={this.onResponseSelect}
            questionStyles={defaultQuestionStyles}
          />
        )

      default:
        return null
    }
  }

  componentDidMount() {
    if (this.props.question) {
      this.props.updateQuestionStatus(
        this.props.question.payload.uid,
        QUESTION_STATUS.SEEN
      )
    }
  }

  onResponseSelect = (responseIndex: number) => {
    if (
      !this.props.question ||
      !this.props.question.payload.valid_responses ||
      this.props.question.payload.valid_responses.length === 0
    ) {
      return
    }

    this.setState({
      response: this.props.question.payload.valid_responses[responseIndex],
    })
  }

  navigateOnSuccess = () => {
    const redirectBack = this.props.route.params?.redirectBack
    if (redirectBack) {
      this.props.navigation.goBack(null)
    } else {
      this.props.navigation.navigate(homeRoute, {
        screen: homeDrawerRoute,
      })
    }
  }

  onSubmit = () => {
    if (!this.props.question) {
      return
    }

    // if user is already in success state, then just close screen
    const { success }: ComponentStatus = getScreenStatus(
      this.props.question.status
    )
    if (success) {
      this.navigateOnSuccess()
      return
    }

    // since height of screen would be changed because view would move
    // from idle state, to loading which would have lesser height
    // and from loading to success or error which would have more height
    // we don't want abrupt jumps and want smooth animation for
    // whole question screen height changes
    if (!checkIfAnimationToUse()) {
      // there are some old devices which just does not have RAM and cpu
      // to support animations, so we disable animation for those old devices
      // so that at least app doesn't get stuck and functions smoothly
      // without any lag to user input and navigation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }

    if (
      this.props.question &&
      this.props.question.payload.uid &&
      this.state.response
    ) {
      this.props.sendAnswerToQuestion(
        this.props.question.payload.uid,
        this.state.response
      )
    } else {
      customLogger.log(
        'called onSubmit for question response without either uid or selecting response'
      )
    }
  }

  onSelectResponseAndSubmit = (response: QuestionResponse) => {
    this.setState(
      {
        response,
      },
      () => {
        this.onSubmit()
      }
    )
  }

  onCancel = () => {
    this.onGoBack()
  }

  onGoBack = () => {
    this.props.navigation.goBack(null)
  }

  noop = () => {
    // this function is supposed to do nothing
  }

  afterSuccessShown = () => {
    // auto close after success is shown to user
    this.onCancel()
  }
}

const mapStateToProps = (state: Store, { route }: QuestionScreenNavigation) => {
  const uid: ?string = route.params?.uid || null
  if (!uid) {
    return {}
  }

  const question: QuestionStoreMessage = state.question.data[uid]
  const connection: Array<Connection> = getConnection(
    state,
    question.payload.from_did
  )
  const senderLogoUrl =
    connection.length > 0 ? { uri: connection[0].logoUrl } : { uri: '' }
  const senderName = connection.length > 0 ? connection[0].senderName : ''

  return {
    question,
    senderLogoUrl,
    senderName,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updateQuestionStatus,
      sendAnswerToQuestion,
    },
    dispatch
  )

export const questionScreen = {
  routeName: questionRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(Question),
}

questionScreen.screen.navigationOptions = ({
                                             navigation: { goBack, isFocused },
                                           }) => ({
  safeAreaInsets: { top: 85 },
  cardStyle: {
    marginLeft: '2.5%',
    marginRight: '2.5%',
    marginBottom: '4%',
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  cardOverlay: () => (
    <ModalHeaderBar
      headerTitle={isFocused() ? 'Question' : ''}
      dismissIconType={isFocused() ? 'CloseIcon' : null}
      onPress={() => goBack(null)}
    />
  ),
})
