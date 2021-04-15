// @flow
import React, { useCallback } from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { connect } from 'react-redux'
import { useNavigation } from '@react-navigation/native'

import type { ReduxConnect } from '../../common/type-common'
import { colors } from '../../common/styles/constant'

import { ModalContent } from './modal-content'
import { ModalButton } from '../../components/connection-details/modal-button'
import { modalScreenRoute } from '../../common/route-constants'
import { modalOptions } from '../utils/modalOptions'
import { CustomCredentialModal } from '../../external-imports'

type CredentialReceivedProps = {
  route: {
    params: {
      colorBackground: string,
      institutionalName: string,
      imageUrl: string,
      secondColorBackground: string,
      data: any,
    },
  },
} & ReduxConnect

const CredentialModal = (props: CredentialReceivedProps) => {
  const {
    data,
    institutionalName,
    imageUrl,
    colorBackground,
  } = props.route.params
  const navigation = useNavigation()
  const hideModal = useCallback(() => {
    navigation.goBack(null)
  }, [])

  return (
    <View style={styles.modalWrapper}>
      <StatusBar backgroundColor={colors.black} barStyle={'light-content'} />
      <ModalContent
        content={data.data}
        imageUrl={imageUrl}
        uid={data.originalPayload.messageId}
        remotePairwiseDID={data.remoteDid}
        institutionalName={institutionalName}
        credentialName={data.name}
        credentialText="Accepted Credential"
        colorBackground={colorBackground}
      />
      <ModalButton onClose={hideModal} colorBackground={colorBackground} />
    </View>
  )
}

const headline = 'My Credential'
const screen = CustomCredentialModal || CredentialModal
const navigationOptions = CustomCredentialModal
  ? null
  : modalOptions(headline, 'Arrow')

export const fulfilledMessageScreen = {
  routeName: modalScreenRoute,
  screen: connect()(screen),
}

fulfilledMessageScreen.screen.navigationOptions = navigationOptions

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
  },
})
