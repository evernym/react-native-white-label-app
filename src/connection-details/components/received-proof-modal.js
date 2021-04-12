// @flow
import React, { useCallback, useMemo } from 'react'
import { View, StyleSheet, StatusBar, ScrollView, FlatList } from 'react-native'
import { ModalHeader } from './modal-header'
import { ModalButton } from '../../components/connection-details/modal-button'
import { receivedProofRoute } from '../../common'
import { moderateScale } from 'react-native-size-matters'
import { colors } from '../../common/styles'
import type { ReactNavigation } from '../../common/type-common'
import { modalOptions } from '../utils/modalOptions'
import { proofRequestHeadline } from '../../external-imports'
import type { RevealedAttribute, RevealedAttributeGroup } from '../../verifier/type-verifier'
import { RenderAttachmentIcon } from '../../components/attachment/attachment'

const ReceivedProofModal = ({
                              navigation,
                              route,
                            }: ReactNavigation) => {
  const { data, colorBackground } = route.params

  const hideModal = useCallback(() => navigation.goBack(null), [navigation])

  const revealedAttrs: any = useMemo(() =>
    data.data && data.data.revealed_attrs && Object.values(data.data.revealed_attrs) || [],
    [data])

  const revealedAttrGroups: any = useMemo(() =>
    data.data && data.data.revealed_attr_groups && Object.values(data.data.revealed_attr_groups) || [],
    [data])

  const keyExtractor = (item: any, index: number) => index.toString()

  const renderRevealedAttribute = (item: RevealedAttribute) => {
    return (
      <View style={styles.attributeWrapper}>
        {RenderAttachmentIcon(item.attribute, item.raw)}
      </View>
    )
  }

  const renderRevealedAttributesGroup = (item: RevealedAttributeGroup) => {
    const views = Object.keys(item.values || {})
      .map((label) =>
        RenderAttachmentIcon(label, item.values[label].raw),
      )

    return <View style={styles.attributeWrapper}>{views}</View>
  }

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
        {revealedAttrs &&
        <FlatList
          data={revealedAttrs}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => renderRevealedAttribute(item)}
        />
        }
        {revealedAttrGroups &&
        <FlatList
          data={revealedAttrGroups}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => renderRevealedAttributesGroup(item)}
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

const navigationOptions = modalOptions(proofRequestHeadline, 'CloseIcon')

export const ReceivedProofScreen =
  {
    routeName: receivedProofRoute,
    screen: ReceivedProofModal,
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
