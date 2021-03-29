// @flow

import { Platform } from 'react-native'
import {
  androidPrivacyPolicyLocal,
  iosPrivacyPolicyLocal,
  privacyPolicyTitle,
  privacyPolicyUrl,
  termsAndConditionsTitle,
} from '../external-imports'

const isAndroid = Platform.OS === 'android'
export { EULA_URL as TermsAndConditionUrl } from '../eula/type-eula'
export const TermsAndConditionsTitle = termsAndConditionsTitle

export const PrivacyPolicyUrl = privacyPolicyUrl
export const localPrivacyPolicySource = isAndroid
  ? androidPrivacyPolicyLocal
  : iosPrivacyPolicyLocal
export const PrivacyPolicyTitle = privacyPolicyTitle
