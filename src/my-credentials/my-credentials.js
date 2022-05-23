// @flow
import React, { useMemo, useCallback, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect, useSelector, useDispatch } from 'react-redux'
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
import { remoteLog } from '../store/remote-debug-log'

export const headlineForCredentialRoute =
  credentialsHeadline || 'MY Credentials'
const showCameraButton =
  typeof credentialsShowCameraButton === 'boolean'
    ? credentialsShowCameraButton
    : true

const MyCredentialsScreen = ({ route, navigation }: MyCredentialsProps) => {
  const receivedCredentials = useSelector(getReceivedCredentials)
  const dispatch = useDispatch()
  const deleteCredential = useCallback(
    (uuid: string) => dispatch(deleteClaim(uuid)),
    [dispatch]
  )

  useEffect(() => {
    remoteLog('on my credentials')
  }, [])

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

    credentials.sort((a, b) =>
      a.credentialName
        .toLowerCase()
        .localeCompare(b.credentialName.toLowerCase())
    )

    return credentials
  }, [receivedCredentials])

  const hasNoCredentials = credentials.length === 0

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
            deleteClaim={deleteCredential}
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

export const MyCredentials = CustomMyCredentialsScreen || MyCredentialsScreen

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
