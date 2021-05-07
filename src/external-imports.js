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
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/app'

import {
  SPONSOR_ID,
  VCX_PUSH_TYPE,
  GET_PROVISION_TOKEN_FUNC,
  SERVER_ENVIRONMENTS,
  DEFAULT_SERVER_ENVIRONMENT,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/provision'

import {
  HEADLINE as CREDENTIAL_OFFER_HEADLINE,
  ACCEPT_BUTTON_TEXT as CREDENTIAL_OFFER_ACCEPT_BUTTON_TEXT,
  DENY_BUTTON_TEXT as CREDENTIAL_OFFER_DENY_BUTTON_TEXT,
  CustomCredentialOfferModal as iCustomCredentialOfferModal,
  CustomCredentialModal as iCustomCredentialModal,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/credential-offer'

import {
  HEADLINE as PROOF_REQUEST_HEADLINE,
  ACCEPT_BUTTON_TEXT as PROOF_REQUEST_ACCEPT_BUTTON_TEXT,
  DENY_BUTTON_TEXT as PROOF_REQUEST_DENY_BUTTON_TEXT,
  CustomEnterAttributeValueModal as iCustomEnterAttributeValueModal,
  CustomSelectAttributeValueModal as iCustomSelectAttributeValueModal,
  CustomSelectAttributesValuesModal as iCustomSelectAttributesValuesModal,
  CustomProofRequestModal as iCustomProofRequestModal,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/proof-request'

// $FlowExpectedError[cannot-resolve-module] external file
import { COLORS } from '../../memberpass/app/evernym-sdk/colors'

// $FlowExpectedError[cannot-resolve-module] external file
import { FONT_FAMILY, FONT_SIZES } from '../../memberpass/app/evernym-sdk/font'

import {
  PRIVACY_POLICY_URL,
  ANDROID_PRIVACY_POLICY_LOCAL,
  IOS_PRIVACY_POLICY_LOCAL,
  TERMS_AND_CONDITIONS_TITLE,
  PRIVACY_POLICY_TITLE,
  ANDROID_EULA_LOCAL,
  ANDROID_EULA_URL,
  IOS_EULA_LOCAL,
  IOS_EULA_URL,
  CustomEulaScreen as iCustomEulaScreen,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/eula'

import {
  SEND_LOGS_EMAIL,
  CUSTOM_LOG_UTILS,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/logs'

import {
  BACKGROUND_IMAGE,
  CustomStartUpScreen as iCustomStartUpScreen,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/startup'

import {
  CustomSettingsScreen as iCustomSettingsScreen,
  HEADLINE as SETTINGS_HEADLINE,
  SETTINGS_OPTIONS,
  SHOW_CAMERA_BUTTON as SETTINGS_SHOW_CAMERA_BUTTON,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/settings'

import {
  INFO,
  AdditionalInfo as iAdditionalInfo,
  CustomAboutAppScreen as iCustomAboutAppScreen,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/about'

// $FlowExpectedError[cannot-resolve-module] external file
import { APPTENTIVE_CREDENTIALS } from '../../memberpass/app/evernym-sdk/feedback'

import {
  HEADLINE as CONNECTIONS_HEADLINE,
  SHOW_CAMERA_BUTTON as CONNECTIONS_SHOW_CAMERA_BUTTON,
  MyConnectionsViewEmptyState as iMyConnectionsViewEmptyState,
  CustomMyConnectionsScreen as iCustomMyConnectionsScreen,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/connections'

import {
  DrawerFooterContent as iDrawerFooterContent,
  DrawerHeaderContent as iDrawerHeaderContent,
  EXTRA_MODALS,
  EXTRA_SCREENS,
  MENU_NAVIGATION_OPTIONS,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/navigator'

import {
  CustomConnectionDetailsScreen as iCustomConnectionDetailsScreen,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/connections'

// $FlowExpectedError[cannot-resolve-module] external file
import { LockHeader as iLockHeader } from '../../memberpass/app/evernym-sdk/lock'

import {
  HEADLINE as HOME_HEADLINE,
  SHOW_EVENTS_HISTORY,
  SHOW_CAMERA_BUTTON as HOME_SHOW_CAMERA_BUTTON,
  CustomHomeScreen as iCustomHomeScreen,
  HomeViewEmptyState as iHomeViewEmptyState,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/home'

import {
  HEADLINE as CREDENTIALS_HEADLINE,
  SHOW_CAMERA_BUTTON as CREDENTIALS_SHOW_CAMERA_BUTTON,
  MyCredentialsViewEmptyState as iMyCredentialsViewEmptyState,
  CustomMyCredentialsScreen as iCustomMyCredentialsScreen,
  SHOW_CREDENTIAL,
  AUTO_ACCEPT_CREDENTIAL_PRESENTATION_REQUEST,
  SHOW_CREDENTIAL_HEADLINE,
  CustomShowCredentialModal as iCustomShowCredentialModal,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/credentials'

import {
  HEADLINE as QUESTION_HEADLINE,
  CustomQuestionModal as iCustomQuestionModal,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/question-dialog'

import {
  CustomCredentialDetailsScreen as iCustomCredentialDetailsScreen,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/credentials'

import {
  HEADLINE as INVITE_ACTION_HEADLINE,
  ACCEPT_BUTTON_TEXT as INVITE_ACTION_ACCEPT_BUTTON_TEXT,
  DENY_BUTTON_TEXT as INVITE_ACTION_DENY_BUTTON_TEXT,
  CustomInviteActionModal as iCustomInviteActionModal,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/invite-action'

import {
  RECEIVED_PROOF_HEADLINE,
  CustomReceivedProofModal as iCustomReceivedProofModal,
  SHARED_PROOF_HEADLINE,
  CustomSharedProofModal as iCustomSharedProofModal,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/proof'

import {
  HEADLINE as PROOF_PROPOSAL_HEADLINE,
  ACCEPT_BUTTON_TEXT as PROOF_PROPOSAL_ACCEPT_BUTTON_TEXT,
  DENY_BUTTON_TEXT as PROOF_PROPOSAL_DENY_BUTTON_TEXT,
  CustomProofProposalModal as iCustomProofProposalModal,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../memberpass/app/evernym-sdk/proof-proposal'

export const appName = APP_NAME || 'appName'
export const appLogo = APP_LOGO
export const defaultUserAvatar =
  DEFAULT_USER_AVATAR || require('./images/noImage.png')
export const appIcon = APP_ICON || require('./images/app_icon.png')
export const companyName = COMPANY_NAME || 'Your Company'
export const companyLogo = COMPANY_LOGO
export const usePushNotifications = !!USE_PUSH_NOTIFICATION || false
export const storageKey = STORAGE_KEY || '@msdkDefaults'
export const deepLinkAddress = DEEP_LINK || null

export const sponsorId = SPONSOR_ID
export const vcxPushType = VCX_PUSH_TYPE
export const getProvisionTokenFunc = GET_PROVISION_TOKEN_FUNC
export const serverEnvironments = SERVER_ENVIRONMENTS || {}
export const defaultServerEnvironment = DEFAULT_SERVER_ENVIRONMENT

export const credentialOfferHeadline =
  CREDENTIAL_OFFER_HEADLINE || 'Credential Offer'
export const credentialOfferAcceptButtonText = CREDENTIAL_OFFER_ACCEPT_BUTTON_TEXT
export const credentialOfferDenyButtonText = CREDENTIAL_OFFER_DENY_BUTTON_TEXT
export const CustomCredentialOfferModal = iCustomCredentialOfferModal
export const CustomCredentialModal = iCustomCredentialModal

export const CustomEnterAttributeValueModal = iCustomEnterAttributeValueModal
export const CustomSelectAttributeValueModal = iCustomSelectAttributeValueModal
export const CustomSelectAttributesValuesModal = iCustomSelectAttributesValuesModal
export const CustomProofRequestModal = iCustomProofRequestModal
export const sharedProofHeadline = SHARED_PROOF_HEADLINE || 'Proof'
export const CustomSharedProofModal = iCustomSharedProofModal
export const proofRequestHeadline = PROOF_REQUEST_HEADLINE || 'Proof Request'
export const proofRequestAcceptButtonText = PROOF_REQUEST_ACCEPT_BUTTON_TEXT
export const proofRequestDenyButtonText = PROOF_REQUEST_DENY_BUTTON_TEXT

export { COLORS as customColors } from '../../memberpass/app/evernym-sdk/colors'
export { FONT_FAMILY as customFontFamily } from '../../memberpass/app/evernym-sdk/font'
export { FONT_SIZES as customFontSizes } from '../../memberpass/app/evernym-sdk/font'

export const androidEulaLocal = ANDROID_EULA_LOCAL
export const androidEulaUrl =
  ANDROID_EULA_URL || 'https://www.connect.me/google.html'
export const iosEulaLocal = IOS_EULA_LOCAL
export const iosEulaUrl = IOS_EULA_URL || 'https://www.connect.me/ios_eula.html'
export const privacyPolicyUrl =
  PRIVACY_POLICY_URL || 'https://www.connect.me/privacy.html'
export const androidPrivacyPolicyLocal = ANDROID_PRIVACY_POLICY_LOCAL
export const iosPrivacyPolicyLocal = IOS_PRIVACY_POLICY_LOCAL
export const termsAndConditionsTitle =
  TERMS_AND_CONDITIONS_TITLE || 'Terms and Conditions'
export const privacyPolicyTitle = PRIVACY_POLICY_TITLE || 'Privacy Policy'
export const CustomEulaScreen = iCustomEulaScreen

export const sendLogsEmail = SEND_LOGS_EMAIL
export const CustomLogUtils = CUSTOM_LOG_UTILS

export const startupBackgroundImage = BACKGROUND_IMAGE
export const CustomStartUpScreen = iCustomStartUpScreen

export const aboutAppInfo = INFO
export const AdditionalInfo = iAdditionalInfo
export const CustomAboutAppScreen = iCustomAboutAppScreen

export const apptentiveCredentials = APPTENTIVE_CREDENTIALS

export const CustomSettingsScreen = iCustomSettingsScreen
export const settingsHeadline = SETTINGS_HEADLINE
export const customSettingsOptions = SETTINGS_OPTIONS
export const settingsShowCameraButton = SETTINGS_SHOW_CAMERA_BUTTON

export const connectionsHeadline = CONNECTIONS_HEADLINE
export const CustomConnectionEmptyState = iMyConnectionsViewEmptyState
export const connectionsShowCameraButton = CONNECTIONS_SHOW_CAMERA_BUTTON
export const CustomMyConnectionsScreen = iCustomMyConnectionsScreen

export const CustomDrawerFooterContent = iDrawerFooterContent
export const CustomDrawerHeaderContent = iDrawerHeaderContent
export const customMenuNavigationOptions = MENU_NAVIGATION_OPTIONS
export const customExtraScreens = EXTRA_SCREENS
export const customExtraModals = EXTRA_MODALS

export const CustomConnectionDetailsScreen = iCustomConnectionDetailsScreen

export const LockHeader = iLockHeader

export const homeHeadline = HOME_HEADLINE
export const homeShowHistoryEvents = SHOW_EVENTS_HISTORY
export const homeShowCameraButton = HOME_SHOW_CAMERA_BUTTON
export const HomeViewEmptyState = iHomeViewEmptyState
export const CustomHomeScreen = iCustomHomeScreen

export const credentialsHeadline = CREDENTIALS_HEADLINE
export const credentialsShowCameraButton = CREDENTIALS_SHOW_CAMERA_BUTTON
export const MyCredentialsViewEmptyState = iMyCredentialsViewEmptyState
export const CustomMyCredentialsScreen = iCustomMyCredentialsScreen

export const questionHeadline = QUESTION_HEADLINE
export const CustomQuestionModal = iCustomQuestionModal

export const CustomCredentialDetailsScreen = iCustomCredentialDetailsScreen

export const inviteActionHeadline = INVITE_ACTION_HEADLINE || 'New Message'
export const inviteActionAcceptButtonText = INVITE_ACTION_ACCEPT_BUTTON_TEXT
export const inviteActionDenyButtonText = INVITE_ACTION_DENY_BUTTON_TEXT
export const CustomInviteActionModal = iCustomInviteActionModal

export const receivedProofHeadline = RECEIVED_PROOF_HEADLINE || 'Proof'
export const CustomReceivedProofModal = iCustomReceivedProofModal

export const proofProposalHeadline = PROOF_PROPOSAL_HEADLINE || 'Proof Proposal'
export const proofProposalAcceptButtonText = PROOF_PROPOSAL_ACCEPT_BUTTON_TEXT
export const proofProposalDenyButtonText = PROOF_PROPOSAL_DENY_BUTTON_TEXT
export const CustomProofProposalModal = iCustomProofProposalModal

export const showCredential = SHOW_CREDENTIAL || true
export const autoAcceptCredentialPresentationRequest = AUTO_ACCEPT_CREDENTIAL_PRESENTATION_REQUEST || false
export const showCredentialHeadline = SHOW_CREDENTIAL_HEADLINE || 'Show Credential'
export const CustomShowCredentialModal = iCustomShowCredentialModal
