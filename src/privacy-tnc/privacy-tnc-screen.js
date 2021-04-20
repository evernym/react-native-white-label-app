// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, View } from 'react-native'
import WebView from 'react-native-webview'

import type { PrivacyTNCProps, PrivacyTNCState } from './type-privacy-tnc'
import type { CustomError } from '../common/type-common'

import { headerDefaultOptions } from '../navigation/navigation-header-config'
import {
  TermsAndConditionsTitle,
  TermsAndConditionUrl,
  PrivacyPolicyTitle,
  PrivacyPolicyUrl,
  localPrivacyPolicySource,
} from '../common/privacyTNC-constants'
import { OrangeLoader } from '../components/loader-gif/loader-gif'
import { localEulaSource } from '../eula/type-eula'
import { privacyTNCRoute } from '../common'

export let options = undefined

export class PrivacyTNC extends PureComponent<
  PrivacyTNCProps,
  PrivacyTNCState
> {
  static INFO_TYPE = {
    PRIVACY: { url: PrivacyPolicyUrl, title: PrivacyPolicyTitle },
    TNC: { url: TermsAndConditionUrl, title: TermsAndConditionsTitle },
  }

  componentDidMount() {
    options = headerDefaultOptions({
      headline: this.props.route.params.title,
      headerHideShadow: true,
      transparent: false,
    })
  }

  componentWillUnmount() {
    options = undefined
  }

  state = {
    error: null,
  }

  onError = (error: CustomError) => {
    this.setState({ error })
  }

  render() {
    const { url } = this.props.route.params
    let webViewUri = url ?? PrivacyTNC.INFO_TYPE.PRIVACY.url
    const isTNC = webViewUri === PrivacyTNC.INFO_TYPE.TNC.url

    if (this.state.error) {
      webViewUri = isTNC ? localEulaSource : localPrivacyPolicySource
    }

    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: webViewUri }}
          startInLoadingState={true}
          renderLoading={renderLoader}
          onError={this.onError}
          renderError={renderError}
          androidHardwareAccelerationDisabled={true}
        />
      </View>
    )
  }
}

function renderLoader() {
  return <View style={styles.container}>{OrangeLoader}</View>
}

function renderError() {
  return <View />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export const privacyTNCScreen = {
  routeName: privacyTNCRoute,
  screen: PrivacyTNC,
}
