// @flow
import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect, useSelector } from 'react-redux'
import type { MyCredentialsProps, CredentialItem } from './type-my-credentials'
import type { ClaimOfferPayload } from '../claim-offer/type-claim-offer'

import { HomeHeader, CameraButton } from '../components'
import { CredentialsCards } from './cards/credentials-cards'
import { myCredentialsRoute, qrCodeScannerTabRoute } from '../common'
import { colors } from '../common/styles/constant'
import { CLAIM_REQUEST_STATUS } from '../claim-offer/type-claim-offer'
import { deleteClaim } from '../claim/claim-store'
import { getClaimOffers } from '../store/store-selector'
import { EmptyState } from '../home/empty-state'
import {
  credentialsHeadline,
  credentialsShowCameraButton,
  CustomMyCredentialsScreen,
  MyCredentialsViewEmptyState,
} from '../external-exports'

const headline = credentialsHeadline || 'MY Credentials'
const showCameraButton = typeof credentialsShowCameraButton === 'boolean' ? credentialsShowCameraButton : true

const MyCredentialsScreen = ({
                                  route,
                                  navigation,
                                }: MyCredentialsProps) => {
  const claimOffer = useSelector(getClaimOffers)

  const credentials = useMemo(() => {
    const {
      vcxSerializedClaimOffers: serializedOffers,
      ...offers
    } = claimOffer

    const credentials: Array<CredentialItem> = []

    Object.keys(offers).forEach((uid) => {
      const offer: ClaimOfferPayload = offers[uid]
      if (
        offer.claimRequestStatus === CLAIM_REQUEST_STATUS.CLAIM_REQUEST_SUCCESS
      ) {
        credentials.push({
          claimOfferUuid: offer.uid,
          credentialName: offer.data.name,
          issuerName: offer.issuer.name,
          date: offer.issueDate,
          attributes: offer.data.revealedAttributes,
          logoUrl: offer.senderLogoUrl,
          remoteDid: offer.remotePairwiseDID,
          uid: uid,
        })
      }
    })

    credentials.sort((a, b) => a.credentialName.localeCompare(b.credentialName))

    return credentials
  }, [claimOffer])

  const hasNoCredentials = useMemo(() => credentials.length === 0, [credentials])

  return (
    <View style={styles.outerContainer}>
      <HomeHeader
        headline={headline}
        navigation={navigation}
        route={route}
      />
      <View
        style={styles.container}
      >
        {hasNoCredentials && (
          MyCredentialsViewEmptyState ? <MyCredentialsViewEmptyState /> : <EmptyState />
        )}
        {!hasNoCredentials && (
          <CredentialsCards
            credentials={credentials}
            deleteClaim={deleteClaim}
            navigation={navigation}
            route={route}
          />
        )}
      </View>

      {
        showCameraButton &&
        <CameraButton
          onPress={() => navigation.navigate(qrCodeScannerTabRoute)}
        />
      }
    </View>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ deleteClaim }, dispatch)

const screen = CustomMyCredentialsScreen || MyCredentialsScreen

export const MyCredentials = connect(
  null,
  mapDispatchToProps,
)(screen)

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
