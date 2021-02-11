// @flow
import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { HeaderWithDeletion } from '../components'
import { CredentialCard } from '../components/connection-details/credential-card'
import { ConnectionCard } from '../components/connection-details/connection-card'
import { ConnectionPending } from '../components/connection-details/connection-pending'
import {
  updateStatusBarTheme,
  sendConnectionRedirect,
  sendConnectionReuse,
} from '../../src/store/connections-store'
import { newConnectionSeen } from '../../src/connection-history/connection-history-store'
import { connect, useSelector } from 'react-redux'
import moment from 'moment'
import { bindActionCreators } from 'redux'
import { QuestionCard } from '../components/connection-details/question-card'
import { QuestionViewCard } from '../components/connection-details/question-view-card'
import type { ConnectionHistoryProps, } from './type-connection-details'
import { getAllConnection, getConnectionTheme, getHistory } from '../store/store-selector'
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
import { deleteConnectionAction, getConnections } from '../store/connections-store'
import type { ConnectionHistoryEvent } from '../connection-history/type-connection-history'
import { CustomConnectionDetailsScreen } from '../external-exports'

const keyExtractor = (item: Object) => item.timestamp

const ConnectionDetails = ({
                             route,
                             navigation,
                             deleteConnectionAction,
                             newConnectionSeen,
                           }: ConnectionHistoryProps) => {
  const flatList = React.createRef<FlatList<any>>()

  const allConnections = useSelector(getAllConnection)
  const history = useSelector(getHistory)
  const themeForLogo = useSelector((store) => getConnectionTheme(store, route ? route.params.image : ''))

  const connectionHistory = useMemo(() => {
    const connection: any =
      getConnections(allConnections).find(
        (connection: any) => connection.senderDID === route.params.senderDID,
      )

    let connectionHistory: ConnectionHistoryEvent[] =
      history && history.connections && route ?
        history.connections[route.params.senderDID].data
        : []

    const timestamp = connection ? connection.timestamp : null

    connectionHistory = timestamp
      ? connectionHistory.filter(
        (event) => new Date(event.timestamp) >= new Date(timestamp),
      )
      : connectionHistory.slice()

    return connectionHistory
  }, [allConnections, history])

  const newBadge = useMemo(() => {
    route &&
    history &&
    history.connections &&
    history.connections[route.params.senderDID] &&
    history.connections[route.params.senderDID].newBadge
  }, [history])

  const onDelete = useCallback(() => {
    deleteConnectionAction(route.params.senderDID)
    navigation.goBack(null)
  }, [route])

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatList.current &&
      flatList.current.scrollToEnd({ animated: true })
    }, 300)
  }, [flatList])

  const renderItem = ({ item }: { item: Object }) => {
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
          type={item.action}
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
          colorBackground={colors.red}
          uid={item.originalPayload.uid}
          proof={true}
          navigation={navigation}
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
          colorBackground={themeForLogo.primary}
          uid={item.originalPayload.uid}
          proof={true}
          navigation={navigation}
          data={item}
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
          navigation={navigation}
          proof={true}
          colorBackground={themeForLogo.primary}
          type={item.action}
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
          navigation={navigation}
          received={true}
          data={item}
          imageUrl={route.params.image}
          institutionalName={route.params.senderName}
          colorBackground={colors.red}
          secondColorBackground={colors.red}
          type={item.action}
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
          colorBackground={themeForLogo.primary}
          navigation={navigation}
          received={true}
          data={item}
          imageUrl={route.params.image}
          institutionalName={route.params.senderName}
          secondColorBackground={themeForLogo.secondary}
          type={item.action}
        />
      )
    } else if (item.action === 'QUESTION_RECEIVED') {
      return (
        <QuestionCard
          messageDate={formattedTime}
          uid={item.data.uid}
          messageTitle={item.data.messageTitle}
          messageContent={item.data.messageText}
          navigation={navigation}
          colorBackground={themeForLogo.primary}
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
          navigation={navigation}
          colorBackground={themeForLogo.primary}
          type={item.action}
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
          navigation={navigation}
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
          navigation={navigation}
          received={true}
          data={item}
          imageUrl={navigation.state.params.image}
          institutialName={navigation.state.params.senderName}
          colorBackground={colors.red}
          secondColorBackground={colors.red}
          type={item.action}
        />
      )
    } else if (item.action === 'DELETED') {
      return (
        <CredentialCard
          messageDate={formattedTime}
          messageTitle={'Deleted Credential'}
          messageContent={'You deleted the credential "' + item.name + '"'}
          showButtons={false}
          type={item.action}
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
          colorBackground={colors.red}
          received={true}
          data={item}
          repeatable={true}
          navigation={navigation}
          type={item.action}
        />
      )
    }

    return null
  }

  const onViewedAction = useCallback(() => newConnectionSeen(route.params.senderDID), [route])

  return (
    <View style={styles.container}>
      <HeaderWithDeletion
        headline={route.params.senderName}
        navigation={navigation}
        showImage={true}
        image={route.params.image}
        newBadge={newBadge}
        onViewedAction={onViewedAction}
        onDeleteButtonTitle={'Delete Connection'}
        onDelete={onDelete}
      />
      <FlatList
        ref={flatList}
        keyExtractor={keyExtractor}
        style={styles.flatListContainer}
        data={connectionHistory}
        renderItem={renderItem}
        onContentSizeChange={scrollToEnd}
      />
    </View>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updateStatusBarTheme,
      newConnectionSeen,
      sendConnectionRedirect,
      sendConnectionReuse,
      deleteConnectionAction,
    },
    dispatch,
  )

const screen = CustomConnectionDetailsScreen || ConnectionDetails

export const connectionHistoryScreen = {
  routeName: connectionHistRoute,
  screen: connect(null, mapDispatchToProps)(screen),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  flatListContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
  },
})
