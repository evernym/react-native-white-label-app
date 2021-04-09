// @flow
import React, { useCallback, useMemo, useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { homeDrawerRoute, homeRoute, presentationProposalRoute } from '../common/route-constants'
import type { ReactNavigation } from '../common/type-common'
import { colors, fontSizes, fontFamily } from '../common/styles/constant'
import { ExpandableText } from '../components/expandable-text/expandable-text'
import { modalOptions } from '../connection-details/utils/modalOptions'
import { getVerifier } from '../store/store-selector'
import { Loader } from '../components'
import type { InvitationPayload } from "../invitation/type-invitation";
import type { AriesPresentationPreviewAttribute, AriesPresentationProposal } from "../proof-request/type-proof-request";
import { ModalButtons } from "../components/buttons/modal-buttons";
import { ModalHeader } from "../connection-details/components/modal-header";
import { CONNECTION_INVITE_TYPES } from "../invitation/type-invitation";
import { acceptOutOfBandInvitation } from "../invitation/invitation-store";
import { presentationProposalAccepted } from "./verifier-store";

export type PresentationProposalProps = {
  backRedirectRoute?: string | null,
  uid: string,
  invitationPayload: InvitationPayload,
  attachedRequest: AriesPresentationProposal,
  senderName: string,
}

export const PresentationProposalComponent = ( {
                                                 navigation,
                                                 route: { params },
                                               }: ReactNavigation ) => {
  const { uid, backRedirectRoute, senderName, invitationPayload, attachedRequest } = params

  const dispatch = useDispatch()

  const verifier = useSelector(state => getVerifier(state, uid))
  console.log('verifier.senderLogoUrl')
  console.log(verifier.senderLogoUrl)

  const presentationProposal = useMemo(() => verifier.presentationProposal, [verifier])

  const onAccept = useCallback(() => {
    if (invitationPayload.type && invitationPayload.type === CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND){
      dispatch(acceptOutOfBandInvitation(invitationPayload, attachedRequest))
    } else {
      dispatch(presentationProposalAccepted(uid))
    }
    navigation.navigate(homeRoute, {
      screen: homeDrawerRoute,
      params: undefined,
    })
  }, [uid])

  const onDeny = useCallback(() => {
    if (backRedirectRoute) {
      navigation.navigate(backRedirectRoute)

    } else {
      navigation.goBack(null)
    }
  }, [backRedirectRoute])

  const keyExtractor = (attribute: AriesPresentationPreviewAttribute, index: number) =>
    `${attribute.name}-${index}`

  const renderItem = (attribute: AriesPresentationPreviewAttribute) =>
    <View style={styles.attributeWrapper}>
      <ExpandableText text={attribute.name} style={styles.attribute} />
    </View>

  return !presentationProposal ?
    <Loader/> :
    <>
      <View style={styles.modalWrapper}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <StatusBar backgroundColor={colors.black} barStyle={'light-content'} />
          <ModalHeader
            institutionalName={senderName}
            credentialName={presentationProposal.comment || 'Presentation Proposal'}
            credentialText={'Offers you to present data'}
            imageUrl={verifier.senderLogoUrl}
          />
          <FlatList
            data={presentationProposal.presentation_proposal.attributes}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => renderItem(item)}
          />
        </ScrollView>
        <ModalButtons
          onPress={onAccept}
          onIgnore={onDeny}
          acceptBtnText={'Accept'}
          denyButtonText={'Deny'}
          colorBackground={colors.green1}
          secondColorBackground={colors.red}
        />
      </View>
    </>
}

export const PresentationProposalScreen = {
  routeName: presentationProposalRoute,
  screen: PresentationProposalComponent,
}

PresentationProposalScreen.screen.navigationOptions =
  modalOptions('Presentation Proposal', 'CloseIcon')

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  attributeWrapper: {
    backgroundColor: colors.white,
    position: 'relative',
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
