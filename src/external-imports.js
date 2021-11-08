import {
  APP_LOGO,
  APP_ICON,
  APP_NAME,
  COMPANY_NAME,
  COMPANY_LOGO,
  DEFAULT_USER_AVATAR,
  USE_PUSH_NOTIFICATION,
  STORAGE_KEY,
  DEEP_LINK,
  PUSH_NOTIFICATION_PERMISSION_SCREEN_IMAGE_IOS,
  POOLING_INTERVALS,
} from '../../../../app/evernym-sdk/app'

export {
  SPONSOR_ID as sponsorId,
  VCX_PUSH_TYPE as vcxPushType,
  GET_PROVISION_TOKEN_FUNC as getProvisionTokenFunc,
  SERVER_ENVIRONMENTS as serverEnvironments,
  DEFAULT_SERVER_ENVIRONMENT as defaultServerEnvironment,
} from '../../../../app/evernym-sdk/provision'

export {
  HEADLINE as credentialOfferHeadline,
  ACCEPT_BUTTON_TEXT as credentialOfferAcceptButtonText,
  DENY_BUTTON_TEXT as credentialOfferDenyButtonText,
  CustomCredentialOfferModal,
  CustomCredentialModal,
} from '../../../../app/evernym-sdk/credential-offer'

export {
  HEADLINE as proofRequestHeadline,
  ACCEPT_BUTTON_TEXT as proofRequestAcceptButtonText,
  DENY_BUTTON_TEXT as proofRequestDenyButtonText,
  CustomEnterAttributeValueModal,
  CustomSelectAttributeValueModal,
  CustomSelectAttributesValuesModal,
  CustomProofRequestModal,
} from '../../../../app/evernym-sdk/proof-request'

export {
  COLORS as customColors,
} from '../../../../app/evernym-sdk/colors'

export {
  FONT_FAMILY as customFontFamily,
  FONT_SIZES as customFontSizes,
} from '../../../../app/evernym-sdk/font'

export {
  PRIVACY_POLICY_URL as privacyPolicyUrl,
  ANDROID_PRIVACY_POLICY_LOCAL as androidPrivacyPolicyLocal,
  IOS_PRIVACY_POLICY_LOCAL as iosPrivacyPolicyLocal,
  TERMS_AND_CONDITIONS_TITLE as termsAndConditionsTitle,
  PRIVACY_POLICY_TITLE as privacyPolicyTitle,
  ANDROID_EULA_LOCAL as androidEulaLocal,
  ANDROID_EULA_URL as androidEulaUrl,
  IOS_EULA_LOCAL as iosEulaLocal,
  IOS_EULA_URL as iosEulaUrl,
  CustomEulaScreen,
} from '../../../../app/evernym-sdk/eula'

export {
  SEND_LOGS_EMAIL as sendLogsEmail,
  CUSTOM_LOG_UTILS as CustomLogUtils,
} from '../../../../app/evernym-sdk/logs'

export {
  BACKGROUND_IMAGE as startupBackgroundImage,
  CustomStartUpScreen,
  ANDROID_DEVICE_CHECK_API_KEY as androidDeviceCheckApiKey,
  deviceSecurityCheckFailedMessage,
  devicePlayServiceUpdateRequiredMessage,
  devicePlayServiceRequiredMessage,

} from '../../../../app/evernym-sdk/startup'

export {
  CustomSettingsScreen,
  HEADLINE as settingsHeadline,
  SETTINGS_OPTIONS as customSettingsOptions,
  SHOW_CAMERA_BUTTON as settingsShowCameraButton,
} from '../../../../app/evernym-sdk/settings'

export {
  INFO as aboutAppInfo,
  AdditionalInfo,
  CustomAboutAppScreen,
} from '../../../../app/evernym-sdk/about'

export {
  APPTENTIVE_CREDENTIALS as apptentiveCredentials,
} from '../../../../app/evernym-sdk/feedback'

export {
  HEADLINE as connectionsHeadline,
  SHOW_CAMERA_BUTTON as connectionsShowCameraButton,
  MyConnectionsViewEmptyState as CustomConnectionEmptyState,
  CustomMyConnectionsScreen,
} from '../../../../app/evernym-sdk/connections'

export {
  DrawerFooterContent as CustomDrawerFooterContent,
  DrawerHeaderContent as CustomDrawerHeaderContent,
  EXTRA_MODALS as customExtraModals,
  EXTRA_SCREENS as customExtraScreens,
  MENU_NAVIGATION_OPTIONS as customMenuNavigationOptions,
} from '../../../../app/evernym-sdk/navigator'

export {
  CustomConnectionDetailsScreen,
} from '../../../../app/evernym-sdk/connections'

export {
  LockHeader,
} from '../../../../app/evernym-sdk/lock'

export {
  HEADLINE as homeHeadline,
  SHOW_EVENTS_HISTORY as homeShowHistoryEvents,
  SHOW_CAMERA_BUTTON as homeShowCameraButton,
  CustomHomeScreen,
  HomeViewEmptyState,
} from '../../../../app/evernym-sdk/home'

export {
  HEADLINE as credentialsHeadline,
  SHOW_CAMERA_BUTTON as credentialsShowCameraButton,
  MyCredentialsViewEmptyState,
  CustomMyCredentialsScreen,
  SHOW_CREDENTIAL as showCredential,
  AUTO_ACCEPT_CREDENTIAL_PRESENTATION_REQUEST as autoAcceptCredentialPresentationRequest,
  SHOW_CREDENTIAL_HEADLINE as showCredentialHeadline,
  CustomShowCredentialModal,
} from '../../../../app/evernym-sdk/credentials'

export {
  HEADLINE as questionHeadline,
  CustomQuestionModal,
} from '../../../../app/evernym-sdk/question-dialog'

export {
  CustomCredentialDetailsScreen,
} from '../../../../app/evernym-sdk/credentials'

export {
  HEADLINE as inviteActionHeadline,
  ACCEPT_BUTTON_TEXT as inviteActionAcceptButtonText,
  DENY_BUTTON_TEXT as inviteActionDenyButtonText,
  CustomInviteActionModal,
} from '../../../../app/evernym-sdk/invite-action'

export {
  RECEIVED_PROOF_HEADLINE as receivedProofHeadline,
  CustomReceivedProofModal,
  SHARED_PROOF_HEADLINE as sharedProofHeadline,
  CustomSharedProofModal,
} from '../../../../app/evernym-sdk/proof'

export {
  HEADLINE as proofProposalHeadline,
  ACCEPT_BUTTON_TEXT as proofProposalAcceptButtonText,
  DENY_BUTTON_TEXT as proofProposalDenyButtonText,
  CustomProofProposalModal,
} from '../../../../app/evernym-sdk/proof-proposal'

export const appName = APP_NAME || 'appName'
export const appLogo = APP_LOGO
export const defaultUserAvatar = DEFAULT_USER_AVATAR || require('./images/noImage.png')
export const appIcon = APP_ICON || require('./images/app_icon.png')
export const companyName = COMPANY_NAME || 'Your Company'
export const companyLogo = COMPANY_LOGO
export const usePushNotifications = !!USE_PUSH_NOTIFICATION || false
export const storageKey = STORAGE_KEY || '@msdkDefaults'
export const deepLinkAddress = DEEP_LINK || null
export const pushNotificationPermissionImage = PUSH_NOTIFICATION_PERMISSION_SCREEN_IMAGE_IOS || require('./images/iphoneX.png')
export const pollingIntervals = POOLING_INTERVALS || {
  short: 2000,
  medium: 3000,
  long: 15000,
}
