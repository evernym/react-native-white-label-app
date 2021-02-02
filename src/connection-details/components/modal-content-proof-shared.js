// @flow
import React, { useCallback } from 'react'
import { View, StyleSheet, StatusBar, ScrollView } from 'react-native'
import { connect } from 'react-redux'

import type { Store } from '../../store/type-store'
import type { ClaimProofNavigation } from '../../claim-offer/type-claim-offer'

import { CustomListProofRequest } from '../../components'
import { ModalHeader } from './modal-header'
import { ModalButton } from '../../components/connection-details/modal-button'
import {
  getConnectionLogoUrl,
  getConnectionTheme,
} from '../../store/store-selector'
import { modalContentProofShared } from '../../common/route-constants'
import { moderateScale } from 'react-native-size-matters'
import { colors } from '../../common/styles/constant'
import { ModalHeaderBar } from '../../components/modal-header-bar/modal-header-bar'

// TODO: Fix any type
const ProofRequestModal = (props: any) => {
  const hideModal = useCallback(() => {
    props.navigation.goBack(null)
  }, [])

  const { data, claimMap } = props.route.params

  return (
    <View style={styles.modalWrapper}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <StatusBar backgroundColor={colors.black} barStyle={'light-content'}/>
        <ModalHeader
          institutionalName={props.name}
          credentialName={props.data.name}
          credentialText={'You shared this information'}
          imageUrl={props.logoUrl}
          colorBackground={props.claimThemePrimary}
        />
        <View style={styles.outerModalWrapper}>
          <View style={styles.innerModalWrapper}>
            <CustomListProofRequest items={data} claimMap={claimMap}/>
          </View>
        </View>
      </ScrollView>
      <ModalButton
        onClose={hideModal}
        colorBackground={props.claimThemePrimary}
      />
    </View>
  )
}

const mapStateToProps = (state: Store, props: ClaimProofNavigation) => {
  const { proofRequest } = state
  const { uid } = props.route.params
  const proofRequestData = proofRequest[uid] || {}
  const { data, requester = {}, remotePairwiseDID } = proofRequestData
  const { name } = requester
  const logoUrl = getConnectionLogoUrl(state, remotePairwiseDID)
  const themeForLogo = getConnectionTheme(state, logoUrl)

  return {
    claimThemePrimary: themeForLogo.primary,
    data,
    logoUrl,
    name,
    uid,
    claimMap: state.claim.claimMap,
  }
}

export const proofScreen = {
  routeName: modalContentProofShared,
  screen: connect(mapStateToProps, null)(ProofRequestModal),
}

proofScreen.screen.navigationOptions = ({
                                          navigation: { goBack, isFocused },
                                        }) => ({
  safeAreaInsets: { top: 85 },
  cardStyle: {
    marginLeft: '2.5%',
    marginRight: '2.5%',
    marginBottom: '4%',
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  cardOverlay: () => (
    <ModalHeaderBar
      headerTitle={isFocused() ? 'Proof Request' : ''}
      dismissIconType={isFocused() ? 'Arrow' : null}
      onPress={() => goBack(null)}
    />
  ),
})

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  outerModalWrapper: {
    width: '100%',
    flex: 1,
  },
  innerModalWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: moderateScale(5),
  },
})
