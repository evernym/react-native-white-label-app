// @flow
import React, { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { View, StyleSheet, StatusBar, ScrollView, FlatList } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { homeDrawerRoute, homeRoute, proofProposalRoute } from '../common'
import type { ReactNavigation } from '../common/type-common'
import { colors, fontSizes, fontFamily } from '../common/styles'
import { ExpandableText } from '../components/expandable-text/expandable-text'
import { modalOptions } from '../connection-details/utils/modalOptions'
import { getLockStore, getVerifier } from '../store/store-selector'
import { Loader } from '../components'
import type { InvitationPayload } from '../invitation/type-invitation'
import type { AriesPresentationPreviewAttribute } from '../proof-request/type-proof-request'
import { ModalButtons } from '../components/buttons/modal-buttons'
import { ModalHeader } from '../connection-details/components/modal-header'
import { CONNECTION_INVITE_TYPES } from '../invitation/type-invitation'
import { acceptOutOfBandInvitation } from '../invitation/invitation-store'
import { proofProposalAccepted } from './verifier-store'
import { authForAction } from '../lock/lock-auth-for-action'
import {
  CustomProofProposalModal,
  proofProposalHeadline,
  proofProposalAcceptButtonText,
  proofProposalDenyButtonText,
} from '../external-imports'
import { unlockApp } from '../lock/lock-store'

export type ProofProposalProps = {
  backRedirectRoute?: string | null,
  uid: string,
  invitationPayload: InvitationPayload,
  senderName: string,
}

export const ProofProposalComponent = ({
  navigation,
  route: { params },
}: ReactNavigation) => {
  const {
    uid,
    backRedirectRoute,
    senderName,
    invitationPayload,
  }: ProofProposalProps = params

  const dispatch = useDispatch()

  const verifier = useSelector((state) => getVerifier(state, uid))
  const lock = useSelector(getLockStore)

  const presentationProposal = useMemo(() => verifier.presentationProposal, [
    verifier,
  ])

  const onAcceptAuthSuccess = useCallback(() => {
    if (invitationPayload.type === CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND) {
      dispatch(acceptOutOfBandInvitation(invitationPayload))
    } else {
      dispatch(proofProposalAccepted(uid))
    }
    navigation.navigate(homeRoute, {
      screen: homeDrawerRoute,
      params: undefined,
    })
  }, [uid, invitationPayload])

  const onAccept = useCallback(() => {
    authForAction({
      lock,
      navigation,
      onSuccess: onAcceptAuthSuccess,
      unlockApp: () => dispatch(unlockApp()),
    })
  }, [onAcceptAuthSuccess])

  const onDeny = useCallback(() => {
    if (backRedirectRoute) {
      navigation.navigate(backRedirectRoute)
    } else {
      navigation.goBack(null)
    }
  }, [backRedirectRoute])

  const keyExtractor = (_: any, index: number) => index.toString()

  const renderItem = (attribute: AriesPresentationPreviewAttribute) => (
    <View style={styles.attributeWrapper}>
      <ExpandableText text={attribute.name} style={styles.attribute} />
    </View>
  )

  const acceptBtnText = proofProposalAcceptButtonText || 'Accept'
  const denyButtonText = proofProposalDenyButtonText || 'Cancel'

  return !presentationProposal ? (
    <Loader />
  ) : (
    <>
      <View style={styles.contentWrapper}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <StatusBar
            backgroundColor={colors.black}
            barStyle={'light-content'}
          />
          <ModalHeader
            institutionalName={senderName}
            credentialName={presentationProposal.comment || 'Proof Proposal'}
            credentialText={'Offers you to present data'}
            imageUrl={verifier.senderLogoUrl}
          />
          <FlatList
            data={presentationProposal.presentation_proposal.attributes}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => renderItem(item)}
          />
        </ScrollView>
      </View>
      <ModalButtons
        onPress={onAccept}
        onIgnore={onDeny}
        acceptBtnText={acceptBtnText}
        denyButtonText={denyButtonText}
        colorBackground={colors.main}
        secondColorBackground={colors.red}
      />
    </>
  )
}

const screen =
  (CustomProofProposalModal && CustomProofProposalModal.screen) ||
  ProofProposalComponent

const headline = proofProposalHeadline || 'Proof Proposal'

const navigationOptions =
  (CustomProofProposalModal && CustomProofProposalModal.navigationOptions) ||
  modalOptions(headline, 'CloseIcon')

export const ProofProposalModal = {
  routeName: proofProposalRoute,
  screen,
}

ProofProposalModal.screen.navigationOptions = navigationOptions

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  attributeWrapper: {
    paddingTop: moderateScale(12),
    borderBottomColor: colors.gray4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: moderateScale(10),
  },
  attribute: {
    fontSize: verticalScale(fontSizes.size5),
    color: colors.black,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    fontWeight: '700',
    marginBottom: moderateScale(2),
  },
})
