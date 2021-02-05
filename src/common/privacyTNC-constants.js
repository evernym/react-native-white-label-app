// @flow

import { Platform } from 'react-native'

import {
  PRIVACY_POLICY_URL,
  ANDROID_PRIVACY_POLICY_LOCAL,
  IOS_PRIVACY_POLICY_LOCAL,
  TERMS_AND_CONDITIONS_TITLE,
  PRIVACY_POLICY_TITLE,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../../../../app/evernym-sdk/eula'

const isAndroid = Platform.OS === 'android'
export { EULA_URL as TermsAndConditionUrl } from '../eula/type-eula'
export const TermsAndConditionsTitle = TERMS_AND_CONDITIONS_TITLE || 'Terms and Conditions'

export const PrivacyPolicyUrl = PRIVACY_POLICY_URL || 'https://www.connect.me/privacy.html'
export const localPrivacyPolicySource = isAndroid
  ? ANDROID_PRIVACY_POLICY_LOCAL
  : IOS_PRIVACY_POLICY_LOCAL
export const PrivacyPolicyTitle = PRIVACY_POLICY_TITLE || 'Privacy Policy'
