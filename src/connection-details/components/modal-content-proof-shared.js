// @flow
import React, { useCallback } from 'react'
import { View, StyleSheet, StatusBar, ScrollView } from 'react-native'
import { useSelector } from 'react-redux'

import { CustomListProofRequest } from '../../components'
import { ModalHeader } from './modal-header'
import { ModalButton } from '../../components/connection-details/modal-button'
import { getClaimMap } from '../../store/store-selector'
import { modalContentProofShared } from '../../common/route-constants'
import { moderateScale } from 'react-native-size-matters'
import { colors } from '../../common/styles/constant'
import type { ReactNavigation } from '../../common/type-common'
import { modalOptions } from '../utils/modalOptions'

// $FlowExpectedError[cannot-resolve-module] external file
import { HEADLINE, CustomSharedProofModal } from '../../../../../../app/evernym-sdk/proof-request'

type ProofRequestModalProps = {} & ReactNavigation

const ProofRequestModal = ({
                             navigation,
                             route,
                           }: ProofRequestModalProps) => {
  const { data, colorBackground } = route.params

  const claimMap = useSelector(getClaimMap)

  const hideModal = useCallback(() => {
    navigation.goBack(null)
  }, [])

  return (
    <View style={styles.modalWrapper}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <StatusBar backgroundColor={colors.black} barStyle={'light-content'}/>
        <ModalHeader
          institutionalName={data.senderName}
          credentialName={data.name}
          credentialText={'You shared this information'}
          imageUrl={data.senderLogoUrl}
          colorBackground={colorBackground}
        />
        <View style={styles.outerModalWrapper}>
          <View style={styles.innerModalWrapper}>
            <CustomListProofRequest items={data.data} claimMap={claimMap}/>
          </View>
        </View>
      </ScrollView>
      <ModalButton
        onClose={hideModal}
        colorBackground={colorBackground}
      />
    </View>
  )
}

const headline = HEADLINE || 'Proof Request'
const screen = CustomSharedProofModal || ProofRequestModal
const navigationOptions =
  CustomSharedProofModal ?
    null :
    modalOptions(headline, 'Arrow')

export const proofScreen = {
  routeName: modalContentProofShared,
  screen,
}

proofScreen.screen.navigationOptions = navigationOptions

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
