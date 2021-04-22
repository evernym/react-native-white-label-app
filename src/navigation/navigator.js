// @flow
import * as React from 'react'
import { Dimensions, Image, Text, View } from 'react-native'
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { createDrawerNavigator, DrawerItemList } from '@react-navigation/drawer'
import { enableScreens } from 'react-native-screens'
import VersionNumber from 'react-native-version-number'

import {
  headerOptionForDrawerStack,
} from './navigation-header-config'

import { aboutAppScreen } from '../about-app/about-app'
import { homeScreen, headlineForHomeRoute } from '../home/home'
import {
  myCredentialsScreen,
  headlineForCredentialRoute,
} from '../my-credentials/my-credentials'
import {
  MyConnectionsScreen,
  headlineForConnectionRoute,
} from '../my-connections/my-connections'
import { splashScreenScreen } from '../start-up/splash-screen'
import { SettingsScreen, headlineForSettingRoute } from '../settings/settings'
import { expiredTokenScreen } from '../expired-token/expired-token'
import { qrCodeScannerScreen } from '../qr-code/qr-code'
import { lockSelectionScreen } from '../lock/lock-selection'
import { sendLogsScreen } from '../send-logs/send-logs'
import { questionScreen } from '../question/question-screen'
import { txnAuthorAgreementScreen } from '../txn-author-agreement/txn-author-agreement-screen'
import { lockEnterPinScreen } from '../lock/lock-enter-pin-code'
import { lockTouchIdSetupScreen } from '../lock/lock-fingerprint-setup'
import { lockPinSetupScreen } from '../lock/lock-pin-code-setup'
import { lockSetupSuccessScreen } from '../lock/lock-setup-success'
import { lockEnterFingerprintScreen, lockEnterFingerprintOptions } from '../lock/lock-enter-fingerprint'
import { claimOfferScreen } from '../connection-details/components/claim-offer-modal'
import { proofRequestScreen } from '../connection-details/components/proof-request-modal'
import { fulfilledMessageScreen } from '../connection-details/components/modal'
import { proofScreen } from '../connection-details/components/modal-content-proof-shared'
import { invitationScreen } from '../invitation/invitation'
import { switchEnvironmentScreen } from '../switch-environment/switch-environment'
import { lockAuthorizationScreen } from '../lock/lock-authorization'
import { waitForInvitationScreen } from '../invitation/wait-for-invitation'
import { walletScreen } from '../wallet/wallet'
import { generateRecoveryPhraseScreen } from '../backup/generate-phrase'
import { verifyRecoveryPhraseScreen } from '../backup/verify-phrase'
import { exportBackupFileScreen } from '../backup/export-backup'
import { selectRecoveryMethodScreen } from '../backup/select-recovery-method'
import { cloudBackupScreen } from '../backup/cloud-backup'
import { backupCompleteScreen } from '../backup/backup-complete'
import { backupErrorScreen } from '../backup/backup-error'
import { selectRestoreMethodScreen } from '../restore/select-restore-method'
import { cloudRestoreModalScreen } from '../cloud-restore/cloud-restore-modal'
import { cloudRestoreScreen } from '../cloud-restore/cloud-restore'
import { restoreStartScreen } from '../restore/restore'
import { eulaScreen } from '../eula/eula'
import { restoreWaitRouteScreen } from '../restore/restore-wait'
import { openIdConnectScreen } from '../open-id-connect/open-id-connect-screen'
import { designStyleGuideScreen } from '../design-styleguide/design-styleguide'
import { onfidoScreen } from '../onfido/onfido'
import { restorePassphraseScreen } from '../restore/restore-passphrase'
import {
  privacyTNCScreen,
  options as privacyTNCScreenOptions
} from '../privacy-tnc/privacy-tnc-screen'
import { connectionHistoryScreen } from '../connection-details/connection-details'
import { credentialDetailsScreen } from '../credential-details/credential-details'
import { pushNotificationPermissionScreen } from '../push-notification/components/push-notification-permission-screen'
import {
  connectionsDrawerRoute,
  credentialsDrawerRoute,
  homeDrawerRoute,
  homeRoute,
  settingsDrawerRoute,
  splashScreenRoute,
} from '../common'
import { walletTabsScreen } from '../wallet/wallet-tab-send-details'
import { checkIfAnimationToUse } from '../bridge/react-native-cxs/RNCxs'
import SvgCustomIcon from '../components/svg-custom-icon'
import {
  CONNECTIONS_ICON,
  EvaIcon,
  HOME_ICON,
  SETTINGS_ICON,
} from '../common/icons'
import { colors } from '../common/styles/constant'
import { UnreadMessagesBadge } from '../components'
import { moderateScale, verticalScale } from 'react-native-size-matters'
import { startUpScreen } from '../start-up/start-up-screen'
import useBackHandler from '../hooks/use-back-handler'
import { CustomValuesScreen } from '../connection-details/components/custom-values'
import { AttributeValuesScreen } from '../connection-details/components/attribute-values'
import { AttributesValuesScreen } from '../connection-details/components/attributes-values'
import { SafeAreaView } from 'react-native-safe-area-context'
import { renderUserAvatar } from '../components/user-avatar/user-avatar'
import {
  CONNECTIONS,
  CONNECTIONS_LABEL,
  CREDENTIALS,
  CREDENTIALS_LABEL,
  DRAWER_ICON_HEIGHT,
  DRAWER_ICON_WIDTH,
  SETTINGS,
  SETTINGS_LABEL,
} from './navigator-constants'
import { styles } from './navigator-styles'
import {
  appIcon,
  companyName,
  CustomDrawerFooterContent,
  CustomDrawerHeaderContent,
  customMenuNavigationOptions,
  customExtraModals,
  customExtraScreens,
  usePushNotifications,
} from '../external-imports'
import { inviteActionScreen } from '../invite-action/invite-action-screen'
import { ShowCredentialScreen } from "../show-credential/show-credential-modal";
import { ProofProposalModal } from "../verifier/proof-proposal-modal";
import { ReceivedProofScreen } from '../verifier/received-proof-modal'

enableScreens()

const { width } = Dimensions.get('screen')

const footerIcon = appIcon
const builtBy = companyName

const drawerComponent = (props: Object) => (
  <SafeAreaView
    style={styles.drawerOuterContainer}
    testID="menu-container"
    accessible={false}
    accessibilityLabel="menu-container"
  >
    <View style={styles.drawerHeader}>
      {CustomDrawerHeaderContent ? (
        <CustomDrawerHeaderContent />
      ) : (
        <Image
          source={require('../images/powered_by_logo.png')}
          resizeMode="contain"
        />
      )}
      {renderUserAvatar({
        size: 'medium',
        userCanChange: true,
        testID: 'user-avatar',
      })}
    </View>
    <DrawerItemList {...props} />
    <View style={styles.drawerFooterContainer}>
      <View style={styles.drawerFooter}>
        {CustomDrawerFooterContent ? (
          <CustomDrawerFooterContent />
        ) : (
          <>
            <Image source={footerIcon} style={styles.companyIconImage} />
            <View style={styles.companyIconTextContainer}>
              <View style={styles.companyIconLogoText}>
                <Text style={styles.text}>built by {builtBy}</Text>
              </View>
              <View style={styles.companyIconBuildText}>
                <Text style={styles.text}>
                  Version {VersionNumber.appVersion}.
                  {VersionNumber.buildVersion}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  </SafeAreaView>
)

const Drawer = createDrawerNavigator()
const drawerContentOptions = {
  activeTintColor: colors.main,
  inactiveTintColor: colors.gray2,
}
const drawerStyle = {
  width: 0.75 * width,
  backgroundColor: 'transparent',
}

const drawerIcon = (icon: any) => ({ color }) => (
  <View style={styles.drawerIconWrapper}>{icon ? icon(color) : null}</View>
)

const drawerEvaIcon = (title: string) => ({ color }) => (
  <EvaIcon
    name={title}
    color={color}
    width={moderateScale(DRAWER_ICON_WIDTH)}
    height={verticalScale(DRAWER_ICON_HEIGHT)}
  />
)

const drawerSvgIcon = (title: string) => ({ color }) => (
  <SvgCustomIcon
    name={title}
    width={verticalScale(DRAWER_ICON_WIDTH)}
    height={verticalScale(DRAWER_ICON_HEIGHT)}
    fill={color}
  />
)

const drawerItemLabel = (
  title: string,
  extraComponent?: React.Node = null
) => ({ focused }) => (
  <View style={styles.labelContainer}>
    <Text style={[styles.labelText, focused && styles.labelTextFocusedColor]}>
      {title}
    </Text>
    {extraComponent}
  </View>
)

const homeDrawerItemOptions = {
  drawerIcon: drawerIcon(drawerEvaIcon(HOME_ICON)),
  drawerLabel: drawerItemLabel(
    'Home',
    <UnreadMessagesBadge
      customContainerStyle={styles.customGreenBadgeContainer}
    />
  ),
}

const defaultDrawerItemOptions = {
  [CONNECTIONS]: {
    route: connectionsDrawerRoute,
    component: MyConnectionsScreen,
    icon: drawerEvaIcon(CONNECTIONS_ICON),
    label: CONNECTIONS_LABEL,
    headline: headlineForConnectionRoute,
  },
  [CREDENTIALS]: {
    route: credentialsDrawerRoute,
    component: myCredentialsScreen.screen,
    icon: drawerSvgIcon('Credentials'),
    label: CREDENTIALS_LABEL,
    headline: headlineForCredentialRoute,
  },
  [SETTINGS]: {
    route: settingsDrawerRoute,
    component: SettingsScreen,
    icon: drawerEvaIcon(SETTINGS_ICON),
    label: SETTINGS_LABEL,
    headline: headlineForSettingRoute,
  },
}

const menuNavigationOptions = customMenuNavigationOptions || [
  { name: CONNECTIONS },
  { name: CREDENTIALS },
  { name: SETTINGS },
]
const extraScreens = customExtraScreens || []
const extraModals = customExtraModals || []

function AppDrawer(navigation) {
  const tabs = menuNavigationOptions.map((option) => {
    const defaultOption = defaultDrawerItemOptions[option.name] || {}

    return (
      <Drawer.Screen
        key={option.route || defaultOption.route}
        name={option.route || defaultOption.route}
        component={option.component || defaultOption.component}
        options={{
          drawerIcon: drawerIcon(option.icon || defaultOption.icon),
          drawerLabel: drawerItemLabel(option.label || defaultOption.label),
          ...headerOptionForDrawerStack({
            navigation,
            headline: defaultOption.headline,
          }),
        }}
      />
    )
  })

  return (
    <Drawer.Navigator
      drawerContent={drawerComponent}
      drawerContentOptions={drawerContentOptions}
      drawerStyle={drawerStyle}
      initialRouteName={homeDrawerRoute}
    >
      <Drawer.Screen
        name={homeDrawerRoute}
        component={homeScreen.screen}
        options={{
          ...homeDrawerItemOptions,
          ...headerOptionForDrawerStack({
            navigation,
            headline: headlineForHomeRoute,
          }),
        }}
      />
      {tabs}
    </Drawer.Navigator>
  )
}

const CardStack = createNativeStackNavigator()
const cardStackOptions = {
  // we are using headerShown property instead of headerMode: 'none'
  // to hide header from screen
  // because, headerShown does not remove header altogether
  // and we can customize headers inside screens that needs it
  // and we won't need to make any nested stack navigator
  // this would give us performance benefit that we won't need too many
  // nested navigators and simple screen should be able to work
  // if we want to have inside any of the screens added above
  // then we can add headerShown true in the options of screen
  // and add header using header: () => <Header /> property
  // of menuNavigationOptions
  headerShown: false,
}

function CardStackScreen() {
  // Back button press listening needs to be initialized on a screen inside of a navigator.
  // This is highest screen in the stack that we can put this hook in.
  useBackHandler()
  return (
    <CardStack.Navigator
      initialRouteName={splashScreenRoute}
      screenOptions={cardStackOptions}
    >
      <CardStack.Screen
        name={homeRoute}
        component={AppDrawer}
        options={{ gestureEnabled: false }}
      />
      <CardStack.Screen
        name={privacyTNCScreen.routeName}
        component={privacyTNCScreen.screen}
        options={privacyTNCScreenOptions}
      />
      <CardStack.Screen
        name={designStyleGuideScreen.routeName}
        component={designStyleGuideScreen.screen}
        options={designStyleGuideScreen.options}
      />
      <CardStack.Screen
        name={restoreWaitRouteScreen.routeName}
        component={restoreWaitRouteScreen.screen}
      />
      <CardStack.Screen
        name={restoreStartScreen.routeName}
        component={restoreStartScreen.screen}
      />
      <CardStack.Screen
        name={waitForInvitationScreen.routeName}
        component={waitForInvitationScreen.screen}
      />
      <CardStack.Screen
        name={switchEnvironmentScreen.routeName}
        component={switchEnvironmentScreen.screen}
      />
      <CardStack.Screen
        name={lockEnterFingerprintScreen.routeName}
        component={lockEnterFingerprintScreen.screen}
        options={lockEnterFingerprintOptions}
      />
      <CardStack.Screen
        name={lockAuthorizationScreen.routeName}
        component={lockAuthorizationScreen.screen}
        options={lockAuthorizationScreen.options}
      />
      <CardStack.Screen
        name={lockSetupSuccessScreen.routeName}
        component={lockSetupSuccessScreen.screen}
      />
      <CardStack.Screen
        name={lockTouchIdSetupScreen.routeName}
        component={lockTouchIdSetupScreen.screen}
      />
      <CardStack.Screen
        name={invitationScreen.routeName}
        component={invitationScreen.screen}
      />
      <CardStack.Screen
        name={lockSelectionScreen.routeName}
        component={lockSelectionScreen.screen}
        options={lockSelectionScreen.options}
      />
      <CardStack.Screen
        name={startUpScreen.routeName}
        component={startUpScreen.screen}
      />
      <CardStack.Screen
        name={expiredTokenScreen.routeName}
        component={expiredTokenScreen.screen}
      />
      <CardStack.Screen
        name={splashScreenScreen.routeName}
        component={splashScreenScreen.screen}
      />
      <CardStack.Screen
        name={qrCodeScannerScreen.routeName}
        component={qrCodeScannerScreen.screen}
      />
      <CardStack.Screen
        name={lockPinSetupScreen.routeName}
        component={lockPinSetupScreen.screen}
        options={lockPinSetupScreen.options}
      />
      <CardStack.Screen
        name={aboutAppScreen.routeName}
        component={aboutAppScreen.screen}
        options={aboutAppScreen.options}
      />
      <CardStack.Screen
        name={onfidoScreen.routeName}
        component={onfidoScreen.screen}
        options={onfidoScreen.options}
      />
      <CardStack.Screen
        name={backupCompleteScreen.routeName}
        component={backupCompleteScreen.screen}
      />
      <CardStack.Screen
        name={backupErrorScreen.routeName}
        component={backupErrorScreen.screen}
      />
      <CardStack.Screen
        name={exportBackupFileScreen.routeName}
        component={exportBackupFileScreen.screen}
        options={exportBackupFileScreen.options}
      />
      <CardStack.Screen
        name={generateRecoveryPhraseScreen.routeName}
        component={generateRecoveryPhraseScreen.screen}
        options={generateRecoveryPhraseScreen.options}
      />
      <CardStack.Screen
        name={selectRecoveryMethodScreen.routeName}
        component={selectRecoveryMethodScreen.screen}
      />
      <CardStack.Screen
        name={verifyRecoveryPhraseScreen.routeName}
        component={verifyRecoveryPhraseScreen.screen}
      />
      <CardStack.Screen
        name={cloudRestoreScreen.routeName}
        component={cloudRestoreScreen.screen}
      />
      <CardStack.Screen
        name={connectionHistoryScreen.routeName}
        component={connectionHistoryScreen.screen}
        options={connectionHistoryScreen.screen.navigationOptions}
      />
      <CardStack.Screen
        name={eulaScreen.routeName}
        component={eulaScreen.screen}
      />
      <CardStack.Screen
        name={lockEnterPinScreen.routeName}
        component={lockEnterPinScreen.screen}
        options={lockEnterPinScreen.options}
      />
      <CardStack.Screen
        name={restorePassphraseScreen.routeName}
        component={restorePassphraseScreen.screen}
      />
      <CardStack.Screen
        name={selectRestoreMethodScreen.routeName}
        component={selectRestoreMethodScreen.screen}
        options={selectRestoreMethodScreen.options}
      />
      <CardStack.Screen
        name={sendLogsScreen.routeName}
        component={sendLogsScreen.screen}
        options={sendLogsScreen.options}
      />
      <CardStack.Screen
        name={credentialDetailsScreen.routeName}
        component={credentialDetailsScreen.screen}
        options={credentialDetailsScreen.screen.navigationOptions}
      />
      {extraScreens.map((screen) => (
        <CardStack.Screen
          key={screen.route}
          name={screen.route}
          component={screen.component}
          options={screen.navigationOptions}
        />
      ))}
    </CardStack.Navigator>
  )
}

const ModalStack = createStackNavigator()
const modalStackOptions = {
  headerShown: false,
  gestureEnabled: true,
  cardOverlayEnabled: true,
  safeAreaInsets: { top: 1250 },
  animationEnabled: !checkIfAnimationToUse(),
  ...TransitionPresets.ModalPresentationIOS,
}

export function MSDKAppNavigator() {
  return (
    <ModalStack.Navigator
      mode="modal"
      screenOptions={modalStackOptions}
      detachInactiveScreens={false}
    >
      <ModalStack.Screen name="CardStack" component={CardStackScreen} />
      <ModalStack.Screen
        name={claimOfferScreen.routeName}
        component={claimOfferScreen.screen}
        options={claimOfferScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={cloudBackupScreen.routeName}
        component={cloudBackupScreen.screen}
        options={{ safeAreaInsets: { top: 0 } }}
      />
      <ModalStack.Screen
        name={cloudRestoreModalScreen.routeName}
        component={cloudRestoreModalScreen.screen}
        options={{ safeAreaInsets: { top: 0 } }}
      />
      <ModalStack.Screen
        name={proofScreen.routeName}
        component={proofScreen.screen}
        options={proofScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={fulfilledMessageScreen.routeName}
        component={fulfilledMessageScreen.screen}
        options={fulfilledMessageScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={openIdConnectScreen.routeName}
        component={openIdConnectScreen.screen}
        options={{ safeAreaInsets: { top: 0 } }}
      />
      <ModalStack.Screen
        name={proofRequestScreen.routeName}
        component={proofRequestScreen.screen}
        options={proofRequestScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={questionScreen.routeName}
        component={questionScreen.screen}
        options={questionScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={txnAuthorAgreementScreen.routeName}
        component={txnAuthorAgreementScreen.screen}
        options={{ safeAreaInsets: { top: 0 } }}
      />
      <ModalStack.Screen
        name={walletScreen.routeName}
        component={walletScreen.screen}
        options={{ safeAreaInsets: { top: 0 } }}
      />
      <ModalStack.Screen
        name={walletTabsScreen.routeName}
        component={walletTabsScreen.screen}
        options={{ safeAreaInsets: { top: 0 } }}
      />
      <ModalStack.Screen
        name={CustomValuesScreen.routeName}
        component={CustomValuesScreen.screen}
        options={CustomValuesScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={AttributeValuesScreen.routeName}
        component={AttributeValuesScreen.screen}
        options={AttributeValuesScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={AttributesValuesScreen.routeName}
        component={AttributesValuesScreen.screen}
        options={AttributesValuesScreen.screen.navigationOptions}
      />
      <ModalStack.Screen
        name={inviteActionScreen.routeName}
        component={inviteActionScreen.screen}
        options={inviteActionScreen.screen.navigationOptions}
      />
      <CardStack.Screen
        name={ShowCredentialScreen.routeName}
        component={ShowCredentialScreen.screen}
        options={ShowCredentialScreen.screen.navigationOptions}
      />
      <CardStack.Screen
        name={ProofProposalModal.routeName}
        component={ProofProposalModal.screen}
        options={ProofProposalModal.screen.navigationOptions}
      />
      <CardStack.Screen
        name={ReceivedProofScreen.routeName}
        component={ReceivedProofScreen.screen}
        options={ReceivedProofScreen.screen.navigationOptions}
      />

      {usePushNotifications && (
        <ModalStack.Screen
          name={pushNotificationPermissionScreen.routeName}
          component={pushNotificationPermissionScreen.screen}
          options={pushNotificationPermissionScreen.screen.navigationOptions}
        />
      )}
      {extraModals.map((screen) => (
        <CardStack.Screen
          key={screen.route}
          name={screen.route}
          component={screen.component}
          options={screen.navigationOptions}
        />
      ))}
    </ModalStack.Navigator>
  )
}
