// @flow
import React, { useCallback } from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { connect } from 'react-redux'

// store
import type { Store } from '../../store/type-store'

import {
  getConnectionLogoUrl,
  getConnectionTheme,
} from '../../store/store-selector'

// types
import type { ClaimProofNavigation } from '../../claim-offer/type-claim-offer'

// constants
import { proofRequestRoute } from '../../common/route-constants'

// components
import ModalContentProof from './modal-content-proof'

// styles
import { colors } from '../../common/styles/constant'

// $FlowExpectedError[cannot-resolve-module] external file
import { modalOptions } from '../utils/modalOptions'
import {CustomProofRequestModal, proofRequestHeadline} from '../../external-exports'

// TODO: Fix any type
const ProofRequestModal = (props: any) => {
  const hideModal = useCallback(() => {
    if (props.backRedirectRoute) {
      props.navigation.navigate(props.backRedirectRoute)
    } else {
      props.navigation.goBack(null)
    }
  }, [])

  return props && props.data ? (
    <View style={styles.modalWrapper}>
      <StatusBar backgroundColor={colors.black} barStyle={'light-content'} />
      <ModalContentProof
        uid={props.uid}
        invitationPayload={props.invitationPayload}
        attachedRequest={props.attachedRequest}
        colorBackground={props.claimThemePrimary}
        secondColorBackground={props.claimThemeSecondary}
        hideModal={hideModal}
        institutionalName={props.name}
        credentialName={props.data.name}
        credentialText={'Requested by'}
        imageUrl={props.logoUrl}
        navigation={props.navigation}
        route={props.route}
      />
    </View>
  ) : (
    <View />
  )
}

const mapStateToProps = (state: Store, props: ClaimProofNavigation) => {
  const { proofRequest } = state

  const {
    uid,
    invitationPayload,
    attachedRequest,
    backRedirectRoute,
    senderName,
  } = props.route.params
  const proofRequestData = proofRequest[uid] || {}
  const {
    data,
    requester = {},
    remotePairwiseDID,
    senderLogoUrl,
  } = proofRequestData
  const { name } = requester

  const logo = senderLogoUrl || getConnectionLogoUrl(state, remotePairwiseDID)
  const themeForLogo = getConnectionTheme(state, logo)

  return {
    claimThemePrimary: themeForLogo.primary,
    claimThemeSecondary: themeForLogo.secondary,
    data,
    logoUrl: logo,
    name: senderName || name,
    uid,
    invitationPayload,
    attachedRequest,
    backRedirectRoute,
  }
}

const screen =
  CustomProofRequestModal && CustomProofRequestModal.screen ||
  ProofRequestModal

const navigationOptions =
  CustomProofRequestModal && CustomProofRequestModal.navigationOptions ||
  modalOptions(proofRequestHeadline, 'CloseIcon')

export const proofRequestScreen = {
  routeName: proofRequestRoute,
  screen: connect(mapStateToProps)(screen),
}

proofRequestScreen.screen.navigationOptions = navigationOptions

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
  },
})
