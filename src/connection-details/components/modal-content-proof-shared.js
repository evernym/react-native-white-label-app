// @flow
import React, { useCallback, useMemo, useState } from 'react'
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
import { CustomSharedProofModal, proofRequestHeadline} from '../../external-imports'
import { checkProofForEmptyFields, showMissingField, showToggleMenu } from '../utils/checkForEmptyAttributes'

type ProofRequestModalProps = {} & ReactNavigation

const ProofRequestModal = ({
                             navigation,
                             route,
                           }: ProofRequestModalProps) => {
  const { data, colorBackground } = route.params

  const claimMap = useSelector(getClaimMap)
  const { hasEmpty, allEmpty } = useMemo(() => checkProofForEmptyFields(data), [data])
  const [isMissingFieldsShowing, toggleMissingFields] = useState(showMissingField(hasEmpty, allEmpty))
  const isToggleMenuShowing = showToggleMenu(hasEmpty, allEmpty)

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
          {...{
            isMissingFieldsShowing,
            toggleMissingFields,
            showToggleMenu: isToggleMenuShowing,
          }}
        />
        <View style={styles.outerModalWrapper}>
          <View style={styles.innerModalWrapper}>
            <CustomListProofRequest
              items={data}
              claimMap={claimMap}
              isMissingFieldsShowing={isMissingFieldsShowing}
            />
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

const screen =
  CustomSharedProofModal && CustomSharedProofModal.screen ||
  ProofRequestModal

const navigationOptions =
  CustomSharedProofModal && CustomSharedProofModal.navigationOptions ||
  modalOptions(proofRequestHeadline, 'CloseIcon')

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
