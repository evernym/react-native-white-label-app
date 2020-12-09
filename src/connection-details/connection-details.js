// @flow
import * as React from 'react'
import { Component } from 'react'
import { View, FlatList, Dimensions, Animated, StyleSheet } from 'react-native'
import { ConnectionDetailsHeader } from '../components'
import { CredentialCard } from '../components/connection-details/credential-card'
import { ConnectionCard } from '../components/connection-details/connection-card'
import MoreOptions from './components/more-options'
import { ConnectionPending } from '../components/connection-details/connection-pending'
import {
  updateStatusBarTheme,
  sendConnectionRedirect,
  sendConnectionReuse,
} from '../store/connections-store'
import { newConnectionSeen } from '../connection-history/connection-history-store'
import { connect } from 'react-redux'
import moment from 'moment'
import { bindActionCreators } from 'redux'
import { QuestionCard } from '../components/connection-details/question-card'
import { QuestionViewCard } from '../components/connection-details/question-view-card'
import type { Store } from '../store/type-store'
import type {
  ConnectionHistoryProps,
  ConnectionHistoryState,
  ConnectionHistoryEvent,
  ConnectionHistoryNavigation,
} from './type-connection-details'
import { getConnectionTheme } from '../store/store-selector'
import { colors } from '../common/styles/constant'
import {
  DENY_PROOF_REQUEST_SUCCESS,
  DENY_PROOF_REQUEST_FAIL,
  DENY_PROOF_REQUEST,
  PROOF_REQUEST_ACCEPTED,
  ATTRIBUTE_TYPE,
} from '../proof-request/type-proof-request'
import { connectionHistRoute } from '../common'
import {
  CLAIM_OFFER_ACCEPTED,
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  DENY_CLAIM_OFFER,
  DENY_CLAIM_OFFER_FAIL,
  DENY_CLAIM_OFFER_SUCCESS,
} from '../claim-offer/type-claim-offer'
import { UPDATE_ATTRIBUTE_CLAIM, ERROR_SEND_PROOF } from '../proof/type-proof'
import { INVITATION_ACCEPTED } from '../invitation/type-invitation'
import { CONNECTION_FAIL } from '../store/type-connection-store'

let ScreenWidth = Dimensions.get('window').width

export class ConnectionDetails extends Component<
  ConnectionHistoryProps,
  ConnectionHistoryState
> {
  state = {
    hideMoreOptions: true,
    moveMoreOptions: new Animated.Value(ScreenWidth),
    newMessageLine: false,
  }

  flatList = React.createRef<FlatList<any>>()

  componentDidMount() {
    this.props.updateStatusBarTheme(this.props.activeConnectionThemePrimary)

    // NOTE: This logic is moved to Home screen and commented out here to be available should we
    // want to revert back quickly.

    // since componentDidMount is always getting called when navigating to this screen
    // the check if snack bar should be displayed can be done in componentDidMount
    // if (this.props.route.params.showExistingConnectionSnack) {
    //   this.showSnackBar()

    //   const invite = this.props.route.params.qrCodeInvitationPayload

    //   if (invite.type === CONNECTION_INVITE_TYPES.ARIES_V1_QR) {
    //     this.props.sendConnectionRedirect(invite, {
    //       senderDID: this.props.route.params.senderDID,
    //       identifier: this.props.route.params.identifier,
    //     })
    //   } else if (invite.type === CONNECTION_INVITE_TYPES.ARIES_OUT_OF_BAND) {
    //     if (!invite.originalObject) {
    //       return
    //     }

    //     this.props.sendConnectionReuse(
    //       ((invite.originalObject: any): AriesOutOfBandInvite),
    //       {
    //         senderDID: this.props.route.params.senderDID,
    //       }
    //     )
    //   }
    // }
  }

  keyExtractor = (item: Object) => item.timestamp

  renderItem = ({ item }: { item: Object }) => {
    const formattedDate = moment(item.timestamp)
      .format('DD MMM YYYY')
      .toUpperCase()
    const formattedTime =
      formattedDate + ' | ' + moment(item.timestamp).format('h:mm A')

    if (item.action === 'CONNECTED') {
      return (
        <CredentialCard
          messageDate={formattedTime}
          messageTitle={'Added Connection'}
          messageContent={'You added ' + item.name + ' as a Connection'}
          showButtons={false}
        />
      )
    } else if (item.action === ERROR_SEND_PROOF) {
      return (
        <ConnectionCard
          messageDate={formattedTime}
          headerText={item.name}
          infoType={'FAILED TO SEND'}
          infoDate={formattedTime}
          noOfAttributes={item.data.length}
          buttonText={'RETRY'}
          showBadge={false}
          colorBackground={colors.cmRed}
          uid={item.originalPayload.uid}
          proof={true}
          navigation={this.props.navigation}
          claimMap={this.props.claimMap}
          data={item}
          type={item.action}
        />
      )
    } else if (item.action === 'SHARED') {
      return (
        <ConnectionCard
          messageDate={formattedTime}
          headerText={item.name}
          infoType={'SHARED'}
          infoDate={formattedTime}
          noOfAttributes={item.data.length}
          buttonText={'VIEW REQUEST DETAILS'}
          showBadge={false}
          colorBackground={this.props.activeConnectionThemePrimary}
          uid={item.originalPayload.uid}
          proof={true}
          navigation={this.props.navigation}
          claimMap={this.props.claimMap}
          data={item.data}
          type={item.action}
        />
      )
    } else if (item.action === 'PROOF RECEIVED') {
      if (item.showBadge === false) {
        return <View/>
      }
      let attributesText = ''
      item.data.map((dataItem, attrIndex) => {
        const label = dataItem.type === ATTRIBUTE_TYPE.FILLED_PREDICATE ?
          `${dataItem.label} ${dataItem.p_type} ${dataItem.p_value}` :
          dataItem.label

        attributesText +=
          label + (attrIndex < item.data.length - 1 ? ', ' : '')
      })
      return (
        <CredentialCard
          messageDate={formattedTime}
          uid={item.originalPayload.payloadInfo.uid}
          messageTitle={
            item.originalPayload.payload.requester.name +
            ' wants you to share the following:'
          }
          messageContent={attributesText}
          showButtons={true}
          navigation={this.props.navigation}
          proof={true}
          colorBackground={this.props.activeConnectionThemePrimary}
        />
      )
    } else if (item.action === UPDATE_ATTRIBUTE_CLAIM) {
      return (
        <ConnectionPending
          date={formattedTime}
          title={item.name}
          content={'SENDING - PLEASE WAIT'}
        />
      )
    } else if (
      item.action === 'PENDING' ||
      item.action === CLAIM_OFFER_ACCEPTED
    ) {
      return (
        <ConnectionPending
          date={formattedTime}
          title={item.name}
          content={'ISSUING - PLEASE WAIT'}
        />
      )
    } else if (
      item.action === SEND_CLAIM_REQUEST_FAIL ||
      item.action === PAID_CREDENTIAL_REQUEST_FAIL
    ) {
      return (
        <ConnectionCard
          messageDate={formattedTime}
          headerText={item.name}
          infoType={'FAILED TO ACCEPT'}
          infoDate={formattedDate}
          noOfAttributes={item.data.length}
          buttonText={'RETRY'}
          showBadge={false}
          colorBackground={colors.cmRed}
          navigation={this.props.navigation}
          received={true}
          data={item}
          imageUrl={this.props.route.params.image}
          institutionalName={this.props.route.params.senderName}
          colorBackground={colors.cmRed}
          secondColorBackground={colors.cmRed}
        />
      )
    } else if (item.action === 'RECEIVED') {
      return (
        <ConnectionCard
          messageDate={formattedTime}
          headerText={item.name}
          infoType={'ACCEPTED CREDENTIAL'}
          infoDate={formattedDate}
          noOfAttributes={item.data.length}
          buttonText={'VIEW CREDENTIAL'}
          showBadge={true}
          colorBackground={this.props.activeConnectionThemePrimary}
          navigation={this.props.navigation}
          received={true}
          data={item}
          imageUrl={this.props.route.params.image}
          institutionalName={this.props.route.params.senderName}
          secondColorBackground={this.props.activeConnectionThemeSecondary}
        />
      )
    } else if (item.action === 'QUESTION_RECEIVED') {
      return (
        <QuestionCard
          messageDate={formattedTime}
          uid={item.data.uid}
          messageTitle={item.data.messageTitle}
          messageContent={item.data.messageText}
          navigation={this.props.navigation}
          colorBackground={this.props.activeConnectionThemePrimary}
        />
      )
    } else if (item.action === 'UPDATE_QUESTION_ANSWER') {
      return (
        <QuestionViewCard
          messageDate={formattedTime}
          uid={item.data.uid}
          requestStatus={'YOU ANSWERED'}
          requestAction={'"' + item.data.answer.text + '"'}
        />
      )
    } else if (item.action === 'CLAIM OFFER RECEIVED') {
      if (item.showBadge === false) {
        return <View/>
      }
      return (
        <CredentialCard
          messageDate={formattedTime}
          messageTitle={'New Credential Offer'}
          messageContent={item.name}
          showButtons={true}
          uid={item.originalPayload.payloadInfo.uid}
          navigation={this.props.navigation}
          colorBackground={this.props.activeConnectionThemePrimary}
        />
      )
    } else if (
      item.action === 'PROOF ACCEPTED' ||
      item.action === PROOF_REQUEST_ACCEPTED
    ) {
      return (
        <ConnectionPending
          date={formattedTime}
          title={item.name}
          content={'PREPARING PROOF - PLEASE WAIT'}
        />
      )
    } else if (
      item.action === DENY_PROOF_REQUEST_SUCCESS ||
      item.action === DENY_CLAIM_OFFER_SUCCESS
    ) {
      return (
        <QuestionViewCard
          messageDate={formattedTime}
          uid={item.data.uid}
          requestStatus={'YOU REJECTED'}
          requestAction={'"' + item.name + '"'}
          navigation={this.props.navigation}
        />
      )
    } else if (
      item.action === DENY_PROOF_REQUEST ||
      item.action === DENY_CLAIM_OFFER
    ) {
      return (
        <ConnectionPending
          date={formattedTime}
          title={item.name}
          content={'REJECTING - PLEASE WAIT'}
        />
      )
    } else if (
      item.action === DENY_PROOF_REQUEST_FAIL ||
      item.action === DENY_CLAIM_OFFER_FAIL
    ) {
      return (
        <ConnectionCard
          messageDate={formattedTime}
          headerText={item.name}
          infoType={'FAILED TO REJECT'}
          infoDate={formattedDate}
          buttonText={'RETRY'}
          showBadge={false}
          colorBackground={colors.cmRed}
          navigation={this.props.navigation}
          received={true}
          data={item}
          imageUrl={this.props.navigation.state.params.image}
          institutialName={this.props.navigation.state.params.senderName}
          colorBackground={colors.cmRed}
          secondColorBackground={colors.cmRed}
        />
      )
    } else if (item.action === 'DELETED') {
      return (
        <CredentialCard
          messageDate={formattedTime}
          messageTitle={'Deleted Credential'}
          messageContent={'You deleted the credential "' + item.name + '"'}
          showButtons={false}
        />
      )
    } else if (item.action === INVITATION_ACCEPTED) {
      return (
        <ConnectionPending
          date={formattedTime}
          title={item.name}
          content={'CONNECTING - PLEASE WAIT'}
        />
      )
    } else if (item.action === CONNECTION_FAIL) {
      return (
        <ConnectionCard
          messageDate={formattedTime}
          headerText={item.name}
          infoType={'FAILED TO CONNECT'}
          infoDate={formattedDate}
          buttonText={'RETRY'}
          showBadge={false}
          colorBackground={colors.cmRed}
          received={true}
          data={item}
          repeatable={true}
          navigation={this.props.navigation}
        />
      )
    }

    return null
  }

  moreOptionsClose = () => {
    Animated.timing(this.state.moveMoreOptions, {
      toValue: ScreenWidth,
      duration: 1,
      useNativeDriver: true,
    }).start(() => {
      this.setState({ hideMoreOptions: true })
    })
  }

  moreOptionsOpen = () => {
    this.setState(
      { hideMoreOptions: false },
      Animated.timing(this.state.moveMoreOptions, {
        toValue: 0,
        duration: 1,
        useNativeDriver: true,
      }).start()
    )
  }

  scrollToEnd = () => {
    setTimeout(() => {
      this.flatList.current &&
        this.flatList.current.scrollToEnd({ animated: true })
    }, 300)
  }

  render() {
    if (this.props.route) {
      const { activeConnectionThemePrimary, connectionHistory } = this.props

      return (
        <View style={styles.container}>
          <ConnectionDetailsHeader
            newConnectionSeen={this.props.newConnectionSeen}
            navigation={this.props.navigation}
            moreOptionsOpen={this.moreOptionsOpen}
            colorBackground={activeConnectionThemePrimary}
            route={this.props.route}
          />
          <Animated.View
            style={[
              styles.moreOptionsWrapper,
              { transform: [{ translateX: this.state.moveMoreOptions }] },
            ]}
          >
            {!this.state.hideMoreOptions && (
              <MoreOptions
                navigation={this.props.navigation}
                moreOptionsClose={this.moreOptionsClose}
                route={this.props.route}
              />
            )}
          </Animated.View>
          <FlatList
            ref={this.flatList}
            keyExtractor={this.keyExtractor}
            style={styles.flatListContainer}
            data={connectionHistory}
            renderItem={this.renderItem}
            onContentSizeChange={this.scrollToEnd}
          />
        </View>
      )
    } else {
      return null
    }
  }
}

const mapStateToProps = (state: Store, props: ConnectionHistoryNavigation) => {
  const connection: any =
    state.connections && state.connections.data
      ? Object.values(state.connections.data).find(
          (connection: any) =>
            connection.senderDID === props.route.params.senderDID
        )
      : undefined

  const timestamp = connection ? connection.timestamp : null

  let connectionHistory: ConnectionHistoryEvent[] =
    state.history &&
    state.history.data &&
    state.history.data.connections &&
    props.route
      ? state.history.data.connections[props.route.params.senderDID].data
      : []

  connectionHistory = timestamp
    ? connectionHistory.filter(
        (event) => new Date(event.timestamp) >= new Date(timestamp)
      )
    : connectionHistory.slice()

  const themeForLogo = getConnectionTheme(
    state,
    props.route ? props.route.params.image : ''
  )

  return {
    activeConnectionThemePrimary: themeForLogo.primary,
    activeConnectionThemeSecondary: themeForLogo.secondary,
    connectionHistory: connectionHistory,
    claimMap: state.claim.claimMap,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updateStatusBarTheme,
      newConnectionSeen,
      sendConnectionRedirect,
      sendConnectionReuse,
    },
    dispatch
  )

export const connectionHistoryScreen = {
  routeName: connectionHistRoute,
  screen: connect(mapStateToProps, mapDispatchToProps)(ConnectionDetails),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cmWhite,
  },
  flatListContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
  },
  moreOptionsWrapper: {
    position: 'absolute',
    width: ScreenWidth,
    zIndex: 999,
    elevation: 8,
    height: Dimensions.get('screen').height,
  },
})
