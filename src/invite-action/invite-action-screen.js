// @flow
// packages
import React, { useMemo } from 'react'
import { FlatList, SafeAreaView, StatusBar } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

// selectors
import { getConnection } from '../store/store-selector'

// store
import {
  initiateFinalizedAction,
  updateInviteActionStatus,
} from './invite-action-store'

// components
import { InviteActionDetails } from './components/invite-action-details'

// types
import type { Store } from '../store/type-store'
import type { InviteActionScreenProps } from '../invite-action/type-invite-action'

// actions
import { INVITE_ACTION_RESPONSES } from './type-invite-action'

// constants
import { inviteActionRoute } from '../common/route-constants'
import { colors } from '../common/styles/constant'
import { homeDrawerRoute } from '../common'

// styles
import { inviteActionStyles } from './invite-action-styles'
import {
  CustomInviteActionModal,
  inviteActionAcceptButtonText,
  inviteActionDenyButtonText,
  inviteActionHeadline,
} from '../external-exports'
import { modalOptions } from '../connection-details/utils/modalOptions'
import {ModalButtons} from "../components/buttons/modal-buttons";

export const InviteActionComponent = ({
                                        inviteAction,
                                        senderLogoUrl,
                                        initiateFinalizedAction,
                                        navigation,
                                      }: InviteActionScreenProps) => {
  const handleInviteAction = (args: string) => {
    initiateFinalizedAction(inviteAction.payload.uid, args)
    navigation.navigate(homeDrawerRoute)
  }

  const keyExtractor = (_: any, index: number) => `${index}`

  const renderInviteActionSection = (data) => (
    <InviteActionDetails
      imageUrl={senderLogoUrl || ''}
      inviteActionTitle={data.item.inviteActionTitle}
      inviteActionDetails={data.item.inviteActionDetails}
      institutionalName={data.item.remoteName}
    />
  )

  const buttonAcceptText = useMemo(
    () =>
      inviteActionAcceptButtonText ||
      inviteAction.payload.acceptText ||
      'Accept',
    [inviteAction]
  )

  const buttonDenyText = useMemo(
    () => inviteActionDenyButtonText || inviteAction.payload.denyText || 'Deny',
    [inviteAction]
  )

  return (
    <SafeAreaView style={inviteActionStyles.listContainer}>
      <StatusBar backgroundColor={colors.black} barStyle={'light-content'} />
      <>
        <FlatList
          data={[inviteAction.payload]}
          style={inviteActionStyles.listStyle}
          renderItem={renderInviteActionSection}
          {...{ keyExtractor }}
        />
        <ModalButtons
          onPress={() => handleInviteAction(INVITE_ACTION_RESPONSES.ACCEPTED)}
          onIgnore={() => handleInviteAction(INVITE_ACTION_RESPONSES.REJECTED)}
          denyButtonText={buttonDenyText}
          acceptBtnText={buttonAcceptText}
          colorBackground={colors.green1}
          secondColorBackground={colors.red}
        />
      </>
    </SafeAreaView>
  )
}

const mapStateToProps = (state: Store, { route }: any) => {
  const uid: ?string = route?.params?.uid || null
  if (!uid) {
    return {}
  }

  const inviteAction: any = state?.inviteAction?.data[uid]
  const connection: Array<any> = getConnection(
    state,
    inviteAction?.payload?.from_did
  )
  const senderLogoUrl = connection?.length > 0 ? connection[0]?.logoUrl : ''
  const senderName = connection?.length > 0 ? connection[0]?.senderName : ''

  return {
    inviteAction,
    senderLogoUrl,
    senderName,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      initiateFinalizedAction,
      updateInviteActionStatus,
    },
    dispatch
  )

const screen = CustomInviteActionModal || InviteActionComponent
const navigationOptions = CustomInviteActionModal
  ? null
  : modalOptions(inviteActionHeadline, 'CloseIcon')

export const inviteActionScreen = {
  routeName: inviteActionRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(screen),
}

inviteActionScreen.screen.navigationOptions = navigationOptions
