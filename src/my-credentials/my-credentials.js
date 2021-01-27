// @flow
import React, { Component } from 'react'
import { View, StyleSheet, ImageBackground } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// $FlowExpectedError[cannot-resolve-module] external file
import { navigationOptions } from '../../../../../app/evernym-sdk/navigator'

// $FlowExpectedError[cannot-resolve-module] external file
import { MyCredentialsViewEmptyState } from '../../../../../app/evernym-sdk/my-credentials'

import type { Store } from '../store/type-store'
import type { MyCredentialsProps, CredentialItem } from './type-my-credentials'
import type { ClaimOfferPayload } from '../claim-offer/type-claim-offer'

import { HomeHeader, CameraButton } from '../components'
import { CredentialsCards } from './cards/credentials-cards'
import { myCredentialsRoute, qrCodeScannerTabRoute } from '../common'
import { colors } from '../common/styles/constant'
import { getEnvironmentName } from '../store/config-store'
import { CLAIM_REQUEST_STATUS } from '../claim-offer/type-claim-offer'
import { deleteClaim } from '../claim/claim-store'

class MyCredentialsComponent extends Component<MyCredentialsProps, void> {
  render() {
    const { offers } = this.props
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

    const hasNoCredentials = credentials.length == 0

    return (
      <View style={styles.outerContainer}>
        <HomeHeader
          headline={navigationOptions.credentials?.label ?? 'My Credentials'}
          navigation={this.props.navigation}
          route={this.props.route}
        />
        <View
          style={styles.container}
        >
          {hasNoCredentials && (
            <ImageBackground
              source={require('../images/connection-items-placeholder.png')}
              style={styles.backgroundImage}
            >
              {MyCredentialsViewEmptyState ? (<MyCredentialsViewEmptyState/>) : (<View/>)}
            </ImageBackground>
          )}
          {!hasNoCredentials && (
            <CredentialsCards
              credentials={credentials}
              deleteClaim={this.props.deleteClaim}
              navigation={this.props.navigation}
              route={this.props.route}
            />
          )}
        </View>
      </View>
    )
  }
}

const mapStateToProps = (state: Store) => {
  const {
    vcxSerializedClaimOffers: serializedOffers,
    ...offers
  } = state.claimOffer

  return {
    offers,
    environmentName: getEnvironmentName(state.config),
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ deleteClaim }, dispatch)

export const MyCredentials = connect(
  mapStateToProps,
  mapDispatchToProps
)(MyCredentialsComponent)

export const myCredentialsScreen = {
  routeName: myCredentialsRoute,
  screen: MyCredentials,
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
