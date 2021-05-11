// @flow
import React, { useCallback } from 'react'
import { View, StyleSheet, StatusBar, ScrollView, FlatList } from 'react-native'
import { ModalHeader } from '../connection-details/components/modal-header'
import { ModalButton } from '../components/connection-details/modal-button'
import { receivedProofRoute } from '../common'
import { moderateScale } from 'react-native-size-matters'
import { colors } from '../common/styles'
import type { ReactNavigation } from '../common/type-common'
import { modalOptions } from '../connection-details/utils/modalOptions'
import {
  CustomReceivedProofModal,
  receivedProofHeadline,
} from '../external-imports'
import type { RevealedAttribute, RevealedAttributeGroup } from './type-verifier'
import { RenderAttachmentIcon } from '../components/attachment/attachment'

const RevealedAttributeComponent = ({ item }: { item: RevealedAttribute }) => {
  return (
    <View style={styles.attributeWrapper}>
      {RenderAttachmentIcon(item.attribute, item.raw)}
    </View>
  )
}

const RevealedAttributesGroupComponent = ({ item }: { item: RevealedAttributeGroup }) => {
  const views = Object.keys(item.values || {})
    .map((label) =>
      RenderAttachmentIcon(label, item.values[label].raw),
    )

  return <View style={styles.attributeWrapper}>{views}</View>
}

const keyExtractor = (item: any, index: number) => index.toString()

const ReceivedProofComponent = ({
                                  navigation,
                                  route,
                                }: ReactNavigation) => {
  const { data, colorBackground } = route.params

  const hideModal = useCallback(() => navigation.goBack(null), [navigation])

  return (
    <View style={styles.modalWrapper}>
      <ScrollView style={styles.contentWrapper} showsVerticalScrollIndicator={false}>
        <StatusBar backgroundColor={colors.black} barStyle={'light-content'}/>
        <ModalHeader
          institutionalName={data.senderName}
          credentialName={data.name}
          credentialText={'You received proof containing this information'}
          imageUrl={data.senderLogoUrl}
        />
        {data.data && data.data.revealed_attrs &&
        <FlatList
          data={data.data.revealed_attrs}
          keyExtractor={keyExtractor}
          renderItem={props => <RevealedAttributeComponent {...props}/>}
        />
        }
        {data.data && data.data.revealed_attr_groups &&
        <FlatList
          data={data.data.revealed_attr_groups}
          keyExtractor={keyExtractor}
          renderItem={props => <RevealedAttributesGroupComponent {...props}/>}
        />
        }
      </ScrollView>
      <ModalButton
        onClose={hideModal}
        colorBackground={colorBackground}
      />
    </View>
  )
}

const screen =
  CustomReceivedProofModal && CustomReceivedProofModal.screen ||
  ReceivedProofComponent

const headline = receivedProofHeadline || 'Proof'

const navigationOptions =
  CustomReceivedProofModal && CustomReceivedProofModal.navigationOptions ||
  modalOptions(headline, 'CloseIcon')

export const ReceivedProofScreen = {
  routeName: receivedProofRoute,
  screen,
}

ReceivedProofScreen.screen.navigationOptions = navigationOptions

const styles = StyleSheet.create(
  {
    modalWrapper: {
      flex: 1,
    },
    contentWrapper: {
      paddingLeft: '5%',
      paddingRight: '5%',
    },
    attributeWrapper: {
      paddingTop: moderateScale(12),
      borderBottomColor: colors.gray3,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
  },
)
