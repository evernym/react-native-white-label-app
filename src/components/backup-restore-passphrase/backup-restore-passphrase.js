// @flow
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Image, Keyboard, StyleSheet, TextInput, Platform } from 'react-native'
import { Container, CustomView, CustomText, Header } from '../index'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { color, colors } from '../../common/styles/constant'
import {
  isBiggerThanShortDevice,
  inputBoxVerifyPassphraseHeight,
  dangerBannerHeight,
} from '../../common/styles/constant'
import type { BackupRestorePassphraseProps } from './type-backup-restore-passphrase'
import ErrorBanner from '../banner/banner-danger'
import { baseUrls, changeEnvironment } from '../../store/config-store'
import { verticalScale } from 'react-native-size-matters';

export class BackupRestorePassphrase extends Component<
  BackupRestorePassphraseProps,
  void
> {

  submitPhrase = (event: any) => {
    // IMPORTANT: Because of the way that event.nativeEvent works, the nativeEvent property
    // of event will be null if you invoke event.nativeEvent after any await calls
    let passphrase = event.nativeEvent.text.trim()
    //////////////////////////////////////////////////////////////////////////////////////////////

    if (passphrase.startsWith('::')) {
      // NOTE: The reason for doing this is ONLY for dev/testing purposes.
      // It allows us to prepend the string ::DEVTEAM2:: or ::QATEST1::
      // to the front of the passphrase and switch to that environment to
      // find the cloud backup. Our list of clouds to search for PROD is only
      // PROD,DEMO,STAGING and so if you are using DEVTEAM2 or QATEST1 to
      // test the mobile app then you cannot get access to your cloud backup.
      const passphraseParts = passphrase.split('::')
      const selectedEnv = passphraseParts[1]
      passphrase = passphraseParts[2]

      this.props.changeEnvironment(
        baseUrls[selectedEnv].agencyUrl,
        baseUrls[selectedEnv].agencyDID,
        baseUrls[selectedEnv].agencyVerificationKey,
        baseUrls[selectedEnv].poolConfig,
        baseUrls[selectedEnv].paymentMethod
      )
    }
    this.props.onSubmit(passphrase)
  }

  render() {
    const {
      isCloudRestoreAttempt,
      filename,
      testID,
      placeholder,
      errorState,
    } = this.props
    return (
      <Container
        testID={`${testID}-container`}
        style={[styles.verifyMainContainer]}
        onPress={Keyboard.dismiss}
        safeArea
      >
        <Image
          source={require('../../images/transparentBands2.png')}
          style={[styles.backgroundImageVerify]}
        />
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          extraHeight={50}
          extraScrollHeight={100}
        >
          <Container testID={`${testID}-inputbox`}>
            <Header
              transparent={true}
              navigation={this.props.navigation}
              color={colors.white}
            />
            <CustomView center>
              {filename || isCloudRestoreAttempt ? (
                <CustomView center>
                  <Image
                    source={require('../../images/encryptedFileGreen.png')}
                  />
                  <CustomText center transparentBg h5 style={[styles.filename]}>
                    {filename}
                  </CustomText>
                </CustomView>
              ) : (
                <CustomText transparentBg center style={[styles.title]}>
                  Verify your Recovery Phrase
                </CustomText>
              )}
            </CustomView>
            <CustomView center>
              <CustomText
                center
                transparentBg
                h5
                style={[styles.verifyMainText]}
              >
                {filename || isCloudRestoreAttempt
                  ? 'Enter the Recovery Phrase you used to create this backup.'
                  : 'To verify that you have copied down your recovery phrase correctly, please enter it below.'}
              </CustomText>
            </CustomView>
            {errorState ? (
              <ErrorBanner
                bannerTitle={'Recovery Phrase does not match!'}
                bannerSubtext={'Try entering it again or go back and verify'}
                style={styles.dangerBannerBox}
                testID={'verify-passphrase-error-banner'}
              />
            ) : null}
            <TextInput
              autoCapitalize="none"
              testID={`${testID}-text-input`}
              accessible={true}
              accessibilityLabel={`${testID}-text-input`}
              autoFocus={true}
              onSubmitEditing={this.submitPhrase}
              style={[styles.inputBox]}
              placeholder={placeholder}
              placeholderTextColor="white"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              multiline={Platform.OS === 'ios' ? true : false}
              clearButtonMode="always"
              returnKeyType="done"
              returnKeyLabel="done"
              numberOfLines={1}
            />
          </Container>
        </KeyboardAwareScrollView>
      </Container>
    )
  }
}

const styles = StyleSheet.create({
  verifyMainContainer: {
    flex: 1,
    backgroundColor: color.bg.twelfth.color,
  },
  backgroundImageVerify: {
    flex: 1,
    position: 'absolute',
  },
  filename: {
    fontWeight: 'bold',
  },
  title: {
    fontWeight: '600',
    lineHeight: 27,
    fontSize: 22,
    marginBottom: 20,
    width: '100%',
  },
  verifyMainText: {
    paddingHorizontal: 20,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: isBiggerThanShortDevice ? 40 : 20,
    marginBottom: isBiggerThanShortDevice ? 40 : 20,
  },
  inputBox: {
    marginBottom: 24,
    marginRight: 20,
    marginLeft: 20,
    height: inputBoxVerifyPassphraseHeight,
    backgroundColor: 'rgba(0,0,0,0.33)',
    color: colors.white,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 20,
    fontStyle: 'italic',
  },
  dangerBannerBox: {
    marginLeft: 20,
    marginRight: 20,
    height: dangerBannerHeight,
  },
  header: {
    flex:1,
    marginTop: verticalScale(8),
  }
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      changeEnvironment,
    },
    dispatch
  )

export default connect(null, mapDispatchToProps)(BackupRestorePassphrase)
