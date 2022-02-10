// @flow
import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect, useSelector } from 'react-redux'
import type { MyCredentialsProps, CredentialItem } from './type-my-credentials'

import { CameraButton } from '../components'
import { CredentialsCards } from './cards/credentials-cards'
import { myCredentialsRoute, qrCodeScannerTabRoute } from '../common'
import { colors } from '../common/styles/constant'
import { getReceivedCredentials } from '../store/store-selector'
import { EmptyState } from '../home/empty-state'
import {
  credentialsHeadline,
  credentialsShowCameraButton,
  CustomMyCredentialsScreen,
  MyCredentialsViewEmptyState,
} from '../external-imports'
import { deleteClaim } from '../claim-offer/claim-offer-store'
import { customLogger } from '../store/custom-logger'

export const headlineForCredentialRoute =
  credentialsHeadline || 'MY Credentials'
const showCameraButton =
  typeof credentialsShowCameraButton === 'boolean'
    ? credentialsShowCameraButton
    : true

const MyCredentialsScreen = ({ route, navigation }: MyCredentialsProps) => {
  const receivedCredentials = useSelector(getReceivedCredentials)

  customLogger.log('ReceivedCredentials', receivedCredentials)

  const credentials = useMemo(() => {
    const credentials: Array<CredentialItem> = receivedCredentials.map(
      (credential) => ({
        claimOfferUuid: credential.uid,
        credentialName: credential.data.name,
        issuerName: credential.issuer.name,
        date: credential.issueDate,
        attributes: credential.data.revealedAttributes,
        logoUrl: credential.senderLogoUrl,
        remoteDid: credential.remotePairwiseDID,
        colorTheme: credential.colorTheme,
        claimDefinitionId: credential.data.claimDefinitionId,
      })
    )

    credentials.sort((a, b) => a.credentialName.localeCompare(b.credentialName))

    return credentials
  }, [receivedCredentials])

  const hasNoCredentials = useMemo(() => credentials.length === 0, [
    credentials,
  ])

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {hasNoCredentials &&
          (MyCredentialsViewEmptyState ? (
            <MyCredentialsViewEmptyState />
          ) : (
            <EmptyState />
          ))}
        {!hasNoCredentials && (
          <CredentialsCards
            credentials={credentials}
            deleteClaim={deleteClaim}
            navigation={navigation}
            route={route}
          />
        )}
      </View>

      {showCameraButton && (
        <CameraButton
          onPress={() => navigation.navigate(qrCodeScannerTabRoute)}
        />
      )}
    </View>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ deleteClaim }, dispatch)

const screen = CustomMyCredentialsScreen || MyCredentialsScreen

export const MyCredentials = connect(null, mapDispatchToProps)(screen)

export const myCredentialsScreen = {
  routeName: myCredentialsRoute,
  screen: MyCredentials,
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
