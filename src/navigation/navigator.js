// @flow
import * as React from 'react'
import { View, StyleSheet, Dimensions, Text } from 'react-native'
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack'
import { createDrawerNavigator, DrawerItemList } from '@react-navigation/drawer'
import { enableScreens } from 'react-native-screens'
// $FlowFixMe Not sure how this can be fixed. Maybe we can add type definition
import { createNativeStackNavigator } from 'react-native-screens/native-stack'

// $FlowExpectedError[cannot-resolve-module] external file
import { AppSvgIcon } from '../../../../../app/evernym-sdk/app-icon'
import {
  DrawerFooterContent,
  navigationOptions,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../../../../app/evernym-sdk/navigator'

import type { ImageSource } from '../common/type-common'

import { aboutAppScreen } from '../about-app/about-app'
import { homeScreen } from '../home/home'
import { myCredentialsScreen } from '../my-credentials/my-credentials'
import { MyConnectionsScreen } from '../my-connections/my-connections'
import { splashScreenScreen } from '../start-up/splash-screen'
import { SettingsScreen } from '../settings/settings'
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
import { lockEnterFingerprintScreen } from '../lock/lock-enter-fingerprint'
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
import { privacyTNCScreen } from '../privacy-tnc/privacy-tnc-screen'
import { connectionHistoryScreen } from '../connection-details/connection-details'
import { credentialDetailsScreen } from '../credential-details/credential-details'
import { pushNotificationPermissionScreen } from '../push-notification/components/push-notification-permission-screen'
import {
  splashScreenRoute,
  homeRoute,
  connectionsDrawerRoute,
  credentialsDrawerRoute,
  homeDrawerRoute,
  settingsDrawerRoute,
} from '../common'
import { walletTabsScreen } from '../wallet/wallet-tab-send-details'
import { checkIfAnimationToUse } from '../bridge/react-native-cxs/RNCxs'
import SvgCustomIcon from '../components/svg-custom-icon'
import {
  EvaIcon,
  HOME_ICON,
  CONNECTIONS_ICON,
  SETTINGS_ICON,
} from '../common/icons'
import { colors, fontFamily } from '../common/styles/constant'
import { UserAvatar, Avatar, UnreadMessagesBadge } from '../components'
import { unreadMessageContainerCommonStyle } from '../components/unread-messages-badge/unread-messages-badge'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { startUpScreen } from '../start-up/start-up-screen'
import useBackHandler from '../hooks/use-back-handler'
import { CustomValuesScreen } from '../connection-details/components/custom-values'
import { AttributeValuesScreen } from '../connection-details/components/attribute-values'
import { AttributesValuesScreen } from '../connection-details/components/attributes-values'
import { SafeAreaView } from 'react-native-safe-area-context'

enableScreens()

const { width } = Dimensions.get('screen')

export const styles = StyleSheet.create({
  icon: {
    marginBottom: verticalScale(2),
  },
  drawerOuterContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopRightRadius: verticalScale(14),
    borderBottomRightRadius: verticalScale(14),
  },
  drawerHeader: {
    width: '100%',
    height: moderateScale(180),
    justifyContent: 'space-evenly',
    paddingLeft: moderateScale(20),
    marginTop: moderateScale(20),
  },
  drawerFooterContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerFooter: {
    width: '100%',
    height: moderateScale(50),
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamily,
    fontSize: verticalScale(10),
    color: colors.cmGray3,
    fontWeight: 'bold',
  },
  labelContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  labelText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(15),
    fontWeight: '500',
    color: colors.cmGray3,
  },
  labelTextFocusedColor: {
    color: colors.cmGreen1,
  },
  customGreenBadgeContainer: {
    ...unreadMessageContainerCommonStyle,
    marginRight: '30%',
  },
})

const renderAvatarWithSource = (avatarSource: number | ImageSource) => {
  return <Avatar medium round src={avatarSource} />
}

const drawerComponent = (props: Object) => (
  <SafeAreaView
    style={styles.drawerOuterContainer}
    testID="menu-container"
    accessible={false}
    accessibilityLabel="menu-container"
  >
    <View style={styles.drawerHeader}>
      <AppSvgIcon
        width={verticalScale(136)}
        height={verticalScale(18)}
        fill={colors.cmGray3}
      />
      <UserAvatar userCanChange testID={'user-avatar'}>
        {renderAvatarWithSource}
      </UserAvatar>
    </View>
    <DrawerItemList {...props} />
    <View style={styles.drawerFooterContainer}>
      <View style={styles.drawerFooter}>
        <DrawerFooterContent />
      </View>
    </View>
  </SafeAreaView>
)

const Drawer = createDrawerNavigator()
const drawerContentOptions = {
  activeTintColor: colors.cmGreen1,
  inactiveTintColor: colors.cmGray2,
}
const drawerStyle = {
  width: verticalScale(0.75 * width),
  backgroundColor: 'transparent',
}

const drawerEvaIcon = (title: string) => ({ color }) => (
  <EvaIcon name={title} color={color} />
)

const drawerItemIcon = (title: string) => ({ color }) => (
  <SvgCustomIcon
    name={title}
    width={verticalScale(22)}
    height={verticalScale(22)}
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
  drawerIcon: drawerEvaIcon(HOME_ICON),
  drawerLabel: drawerItemLabel(
    'Home',
    <UnreadMessagesBadge
      customContainerStyle={styles.customGreenBadgeContainer}
    />
  ),
}
const connectionDrawerItemOptions = {
  drawerIcon: drawerEvaIcon(CONNECTIONS_ICON),
  drawerLabel: drawerItemLabel(
    navigationOptions.connections?.label ?? 'My Connections'
  ),
}
const credentialsDrawerItemOptions = {
  // TODO: DA replace credentials icon
  drawerIcon: drawerItemIcon('Credentials'),
  drawerLabel: drawerItemLabel(
    navigationOptions.credentials?.label ?? 'My Credentials'
  ),
}
const settingsDrawerItemOptions = {
  drawerIcon: drawerEvaIcon(SETTINGS_ICON),
  drawerLabel: drawerItemLabel('Settings'),
}
function AppDrawer() {
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
        options={homeDrawerItemOptions}
      />
      {navigationOptions.connections ? (
        <Drawer.Screen
          name={connectionsDrawerRoute}
          component={MyConnectionsScreen}
          options={connectionDrawerItemOptions}
        />
      ) : null}
      {navigationOptions.credentials ? (
        <Drawer.Screen
          name={credentialsDrawerRoute}
          component={myCredentialsScreen.screen}
          options={credentialsDrawerItemOptions}
        />
      ) : null}
      <Drawer.Screen
        name={settingsDrawerRoute}
        component={SettingsScreen}
        options={settingsDrawerItemOptions}
      />
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
  // of navigationOptions
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
      />
      <CardStack.Screen
        name={lockAuthorizationScreen.routeName}
        component={lockAuthorizationScreen.screen}
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
      />
      <CardStack.Screen
        name={startUpScreen.routeName}
        component={startUpScreen.screen}
        options={startUpScreen.options}
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
      />
      <CardStack.Screen
        name={aboutAppScreen.routeName}
        component={aboutAppScreen.screen}
      />
      <CardStack.Screen
        name={onfidoScreen.routeName}
        component={onfidoScreen.screen}
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
      />
      <CardStack.Screen
        name={generateRecoveryPhraseScreen.routeName}
        component={generateRecoveryPhraseScreen.screen}
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
      />
      <CardStack.Screen
        name={eulaScreen.routeName}
        component={eulaScreen.screen}
      />
      <CardStack.Screen
        name={lockEnterPinScreen.routeName}
        component={lockEnterPinScreen.screen}
      />
      <CardStack.Screen
        name={restorePassphraseScreen.routeName}
        component={restorePassphraseScreen.screen}
      />
      <CardStack.Screen
        name={selectRestoreMethodScreen.routeName}
        component={selectRestoreMethodScreen.screen}
      />
      <CardStack.Screen
        name={sendLogsScreen.routeName}
        component={sendLogsScreen.screen}
        options={sendLogsScreen.options}
      />
      <CardStack.Screen
        name={credentialDetailsScreen.routeName}
        component={credentialDetailsScreen.screen}
      />
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

export function ConnectMeAppNavigator() {
  return (
    <ModalStack.Navigator mode="modal" screenOptions={modalStackOptions}>
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
        name={pushNotificationPermissionScreen.routeName}
        component={pushNotificationPermissionScreen.screen}
        options={pushNotificationPermissionScreen.screen.navigationOptions}
      />
    </ModalStack.Navigator>
  )
}
