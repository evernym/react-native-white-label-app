// @flow

import React, { Component } from 'react'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import type { Store } from '../store/type-store'
import { Container, CustomView, CustomText, Loader, Header } from '../components'
import { colors, fontSizes } from '../common/styles'
import {
  genRecoveryPhraseRoute,
  verifyRecoveryPhraseRoute,
  settingsRoute,
} from '../common'
import { color } from '../common/styles'
import type {
  GenerateRecoveryPhraseProps,
  GenerateRecoveryPhraseState,
  Passphrase,
  ChatBubbleDimensions,
  PassphraseTextProps,
  PassphraseErrorProps,
} from './type-backup'
import { BACKUP_STORE_STATUS } from './type-backup'
import { generateRecoveryPhrase } from './backup-store'
import {
  SHOW_RECOVERY_PHRASE_TEST_ID,
  SUBMIT_RECOVERY_PHRASE_TEST_ID,
  SUBMIT_RECOVERY_PHRASE_BUTTON_TITLE,
} from './backup-constants'
import styles, { chatBubbleTextOffset } from './styles'
import { getBackupPassphrase, getBackupStatus } from '../store/store-selector'
import { PASSPHRASE_GENERATION_ERROR } from '../common'
import { withStatusBar } from '../components/status-bar/status-bar'
import { Button } from '../components/buttons/button'

const transparentBands = require('../images/transparentBands.png')
const textBubble = require('../images/textBubble.png')

const PassphraseLoader = () => {
  return (
    <CustomView style={[styles.genRecoveryPhraseLoadingContainer]}>
      <Loader delay={10} showMessage={false} />
    </CustomView>
  )
}

const PassphraseError = (props: PassphraseErrorProps) => {
  return (
    <CustomView
      style={[
        styles.genRecoveryPhraseContainer,
        {
          width:
            props.chatBubbleDimensions && props.chatBubbleDimensions.width
              ? props.chatBubbleDimensions.width - chatBubbleTextOffset
              : null,
        },
      ]}
    >
      <CustomText transparentBg darkgray center>
        {PASSPHRASE_GENERATION_ERROR}
      </CustomText>
    </CustomView>
  )
}

const PassphraseText = (props: PassphraseTextProps) => {
  return (
    <CustomView
      style={[
        styles.genRecoveryPhraseContainer,
        {
          //width of textContainer is chatBubbleDimensions width minus chatBubbleTextOffset
          //so that passPhrase text is not cutting beyond the chatBubble
          width:
            props.chatBubbleDimensions && props.chatBubbleDimensions.width
              ? props.chatBubbleDimensions.width - chatBubbleTextOffset
              : null,
        },
      ]}
    >
      <CustomText
        transparentBg
        style={[styles.genRecoveryPhrase]}
        testID={SHOW_RECOVERY_PHRASE_TEST_ID}
      >
        {props.recoveryPassphrase.phrase}
      </CustomText>
    </CustomView>
  )
}

export class GenerateRecoveryPhrase extends Component<
  GenerateRecoveryPhraseProps,
  GenerateRecoveryPhraseState
> {
  state = {
    chatBubbleDimensions: {
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    },
  }

  componentDidMount() {
    this.props.generateRecoveryPhrase()
  }

  verifyRecoveryPhrase = () => {
    const {
      navigation: { navigate },
      route,
    } = this.props

    navigate(verifyRecoveryPhraseRoute, {
      recoveryPassphrase: this.props.recoveryPassphrase.hash,
      initialRoute: route.params.initialRoute,
    })
  }
  backToSettings = () => {
    const {
      navigation: { navigate },
    } = this.props
    navigate(settingsRoute)
  }
  onRecoveryPhraseGoBack = () => {
    const {
      navigation: { goBack },
    } = this.props
    goBack(null)
  }

  //TODO fix refactor UI
  //first the image should be used as a ImageBackground component
  ImageContents = (
    recoveryStatus: string,
    recoveryPassphrase: Passphrase,
    chatBubbleDimensions: ChatBubbleDimensions
  ) => {
    if (recoveryStatus === BACKUP_STORE_STATUS.GENERATE_PHRASE_LOADING) {
      return <PassphraseLoader />
    }

    if (
      recoveryStatus === BACKUP_STORE_STATUS.GENERATE_PHRASE_FAILURE ||
      recoveryStatus === BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_FAILURE
    ) {
      // This block is where we need to try handling passphrase generation differently
      return <PassphraseError chatBubbleDimensions={chatBubbleDimensions} />
    }
    return (
      <PassphraseText
        recoveryPassphrase={recoveryPassphrase}
        chatBubbleDimensions={chatBubbleDimensions}
      />
    )
  }

  setChatBubbleDimensions = (chatBubbleDimensions: ChatBubbleDimensions) => {
    this.setState({
      chatBubbleDimensions,
    })
  }

  render() {
    // for viewRecover mode
    const viewOnlyMode = this.props.route.params.viewOnlyMode ? true : false
    const { recoveryPassphrase, recoveryStatus } = this.props
    const disableButton =
      recoveryStatus === BACKUP_STORE_STATUS.GENERATE_PHRASE_FAILURE ||
      recoveryStatus === BACKUP_STORE_STATUS.GENERATE_PHRASE_LOADING ||
      recoveryStatus === BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_FAILURE

    return (
      <Container style={[styles.genRecovery]} safeArea>
        <Image source={transparentBands} style={[styles.backgroundImage]} />
        <Header
          transparent={true}
          navigation={this.props.navigation}
          color={colors.white}
        />
        <Container>
          <CustomView>
            <CustomText
              transparentBg
              numberOfLines={1}
              style={[styles.genRecoveryText]}
            >
              {viewOnlyMode
                ? 'Your Recovery Phrase'
                : 'Recovery Phrase generated'}
            </CustomText>
          </CustomView>
          <CustomView center>
            <CustomText
              center
              transparentBg
              style={[styles.genRecoveryMessage]}
            >
              This is your Recovery Phrase. Write it down, and don't share it
              with anyone.
            </CustomText>
          </CustomView>
          <CustomView center>
            <Image
              source={textBubble}
              style={[styles.imageIcon]}
              onLayout={(event) =>
                this.setChatBubbleDimensions(event.nativeEvent.layout)
              }
            />
            {this.ImageContents(
              recoveryStatus,
              recoveryPassphrase,
              this.state.chatBubbleDimensions
            )}
          </CustomView>
          <CustomView center>
            <CustomText
              center
              transparentBg
              style={[styles.genRecoverySecondMessage]}
            >
              You will need this Recovery Phrase to restore from a backup. Keep
              it safe.
            </CustomText>
          </CustomView>
        </Container>

        {viewOnlyMode && (
          <CustomView>
            <CustomView center />
            <Button
              buttonStyle={[styles.submitButton]}
              label={'Got It'}
              onPress={this.backToSettings}
              testID={SUBMIT_RECOVERY_PHRASE_TEST_ID}
              labelStyle={{
                color: color.bg.eleventh.color,
                fontWeight: '600',
                fontSize: fontSizes.size3,
              }}
            />
          </CustomView>
        )}
        {!viewOnlyMode && (
          <CustomView>
            <CustomView center>
              <CustomText
                transparentBg
                center
                style={[styles.genRecoverySmallMessage]}
              >
                Are you sure you wrote it down?
              </CustomText>
            </CustomView>
            <Button
              onPress={this.verifyRecoveryPhrase}
              label={SUBMIT_RECOVERY_PHRASE_BUTTON_TITLE}
              disabled={disableButton}
              buttonStyle={styles.submitButton}
              labelStyle={{
                color: color.bg.eleventh.color,
                fontWeight: '600',
                fontSize: 18,
              }}
              testID={SUBMIT_RECOVERY_PHRASE_TEST_ID}
            />
          </CustomView>
        )}
      </Container>
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    recoveryPassphrase: getBackupPassphrase(state),
    recoveryStatus: getBackupStatus(state),
  }
}
const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ generateRecoveryPhrase }, dispatch)

export const generateRecoveryPhraseScreen = {
  routeName: genRecoveryPhraseRoute,
  screen: withStatusBar({ color: color.bg.eleventh.color })(
    connect(mapStateToProps, mapDispatchToProps)(GenerateRecoveryPhrase)
  ),
}
