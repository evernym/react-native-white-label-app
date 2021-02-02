// @flow

import React, { Component } from 'react'
import { StyleSheet, Platform, Alert, PermissionsAndroid } from 'react-native'
import { connect } from 'react-redux'

// $FlowExpectedError[cannot-resolve-module] external file
import { APP_NAME } from '../../../../../app/evernym-sdk/app'
// $FlowExpectedError[cannot-resolve-module] external file
import { SEND_LOGS_EMAIL } from '../../../../../app/evernym-sdk/logs'

import type { SendLogsProps } from './type-send-logs'
import type { Store } from '../store/type-store'
import type { ReactNavigation } from '../common/type-common'

import { Container, CustomView, CustomText, CustomButton } from '../components'
import { atlantis } from '../common/styles'
import { sendLogsRoute } from '../common/route-constants'
import Mailer from 'react-native-mail'
import { customLogger } from '../store/custom-logger'
import { Loader } from '../components'
import { getLogEncryptionStatus } from '../store/store-selector'
import {
  UPDATE_LOG_ISENCRYPTED,
  ENCRYPT_LOG_FILE,
} from '../send-logs/type-send-logs'
import store from '../store'
import { BackButton } from '../components/back-button/back-button'
import { headerNavigationOptions } from '../navigation/navigation-header-config'

export class SendLogs extends Component<SendLogsProps, any> {
  constructor(props: SendLogsProps) {
    super(props)
  }
  state = {
    deniedPermission: false,
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      )
        .then((granted) => {
          if (granted) {
            store.dispatch({
              type: ENCRYPT_LOG_FILE,
            })
            this.setState({ deniedPermission: false })
          } else {
            this.setState({ deniedPermission: true })
          }
        })
        .catch((error) => {
          this.setState({ deniedPermission: true })
          console.log(error)
        })
    } else {
      store.dispatch({
        type: ENCRYPT_LOG_FILE,
      })
      this.setState({ deniedPermission: false })
    }
  }

  setPermission = () => {
    this.setState({ deniedPermission: false })
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    )
      .then((granted) => {
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          store.dispatch({
            type: ENCRYPT_LOG_FILE,
          })
        } else {
          this.setState({ deniedPermission: true })
        }
      })
      .catch((error) => {
        this.setState({ deniedPermission: true })
        console.log('error', error)
      })
  }

  //static emailMessageBody = ''

  static handleEmail = () => {
    const logFile = customLogger.getEncryptedVcxLogFile()
    Mailer.mail(
      {
        subject: `${APP_NAME} Application Log: ${logFile}`,
        recipients: [SEND_LOGS_EMAIL || 'cmsupport@evernym.com'],
        body: '',
        isHTML: false,
        attachment: {
          path: logFile, // The absolute path of the file from which to read data.
          type: 'text', // Mime Type: jpg, png, doc, ppt, html, pdf, csv, vcard, json, zip, text, mp3, wav, aiff, flac, ogg, xls
          name: logFile, // Optional: Custom filename for attachment
        },
      },
      (error, event) => {
        const sentButton = {
          text: 'OK',
          onPress: () => {
            //customLogger.log('SENT: MSDK Logs via Email')
          },
        }
        const cancelButton = {
          text: 'OK',
          onPress: () => {
            //customLogger.log('CANCELLED: MSDK Logs NOT sent via Email')
          },
        }
        const notAvailableMsg =
          'Unable to send error report. Sending error logs requires you to be signed into at least one email account on the default mail app which came with the phone out of the factory (the "native" mail app). Please sign into an email account from the default email app that came with the phone out of the factory and try again.'
        const cancelSendMsg = 'You did not send error logs to Evernym.'
        let alertMsg = event
        let alertButton = cancelButton
        if ('not_available' === error) {
          alertMsg = notAvailableMsg
        } else if ('cancelled' === event) {
          alertMsg = cancelSendMsg
        } else if ('sent' === event) {
          alertMsg = 'Sent'
          alertButton = sentButton
        }

        Alert.alert('', alertMsg, [alertButton], { cancelable: true })
      }
    )
  }

  static goBack(navigation: $PropertyType<ReactNavigation, 'navigation'>) {
    //Alert.alert('NOT sending logs')
    navigation.goBack(null)
    setTimeout(() => {
      store.dispatch({
        type: UPDATE_LOG_ISENCRYPTED,
        logIsEncrypted: false,
      })
    }, 300)
  }

  static sendLogs(navigation: $PropertyType<ReactNavigation, 'navigation'>) {
    //Alert.alert('sending logs from file: ' + String(customLogger.getVcxLogFile()))
    SendLogs.handleEmail()
    SendLogs.goBack(navigation)
  }

  render() {
    return this.props.logIsEncrypted ? (
      <Container tertiary center>
        <CustomView pad center>
          <CustomText bg="secondary" secondary transparentBg semiBold>
            Send error logs to {SEND_LOGS_EMAIL}?
          </CustomText>
        </CustomView>
        <CustomView center style={[styles.buttonContainer]}>
          <CustomButton
            title="Send Logs"
            style={[styles.startTutorialButton]}
            customColor={buttonColor}
            onPress={() => SendLogs.sendLogs(this.props.navigation)}
          />
        </CustomView>
      </Container>
    ) : this.state.deniedPermission ? (
      <Container tertiary>
        <CustomView pad center>
          <CustomText bg="secondary" secondary transparentBg semiBold>
            {APP_NAME} needs permission to write to the file system in order to
            send logs.
          </CustomText>
        </CustomView>
        <CustomView center style={[styles.buttonContainer]}>
          <CustomButton
            title="Enable Access"
            style={[styles.startTutorialButton]}
            customColor={buttonColor}
            onPress={() => this.setPermission()}
          />
        </CustomView>
      </Container>
    ) : (
      // Show spinner until the log file is encrypted...
      <Container center>
        <Loader message="Encrypting log..." />
      </Container>
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    logIsEncrypted: getLogEncryptionStatus(state),
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
  },
  startTutorialButton: {
    borderRadius: 5,
    color: 'white',
    marginHorizontal: '6%',
  },
})

const buttonColor = {
  fontWeight: '600',
  fontSize: 18,
  backgroundColor: atlantis,
}

export const sendLogsScreen = {
  routeName: sendLogsRoute,
  screen: connect(mapStateToProps)(SendLogs),
  options() {
    return headerNavigationOptions({
      title: 'Send logs',
      headerLeft: () => {
        return <BackButton onPress={SendLogs.goBack} />
      },
      headerStyle: {
        borderBottomWidth: 0,
      },
    })
  },
}
