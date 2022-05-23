// @flow
import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View, FlatList } from 'react-native'
import { bindActionCreators } from 'redux'
import { moderateScale } from 'react-native-size-matters'
import { connect } from 'react-redux'
import type { Store } from '../store/type-store'
import type { HomeProps } from './type-home'
import { CameraButton } from '../components'
import { homeDrawerRoute, qrCodeScannerTabRoute } from '../common'
import { getUnacknowledgedMessages } from '../store/config-store'
import { GET_MESSAGES_LOADING } from '../store/type-config-store'
import { colors } from '../common/styles'
import { NewBannerCard } from './new-banner-card/new-banner-card'
import { RecentCard } from './recent-card/recent-card'
import { RecentCardSeparator } from './recent-card-separator'
import { EmptyViewPlaceholder } from './empty-view-placeholder'
import { EmptyState } from './empty-state'
import {
  CustomHomeScreen,
  homeHeadline,
  homeShowCameraButton,
  homeShowHistoryEvents,
  HomeViewEmptyState,
} from '../external-imports'
import { isNewEvent } from '../store/store-utils'
import { getEventMessage, getEventRedirectionRoute } from './home-utils'
import { useIsDrawerOpen } from '@react-navigation/drawer'
import { useDispatch } from 'react-redux'
import {
  CLOSING_THE_SIDE_MENU,
  OPENING_THE_SIDE_MENU,
} from '../feedback/log-to-apptentive'
import { remoteLog } from '../store/remote-debug-log'

export const headlineForHomeRoute = homeHeadline || 'Home'
const showHistoryEvents =
  typeof homeShowHistoryEvents === 'boolean' ? homeShowHistoryEvents : true
const showCameraButton =
  typeof homeShowCameraButton === 'boolean' ? homeShowCameraButton : true

const keyExtractor = (item: Object) => item.id

const renderEmptyListPlaceholder = () => <EmptyViewPlaceholder />

export const HomeScreen = (props: HomeProps) => {
  const dispatch = useDispatch()
  const isDrawerOpen = useIsDrawerOpen()

  useEffect(() => {
    if (isDrawerOpen) {
      dispatch(OPENING_THE_SIDE_MENU)
    } else {
      dispatch(CLOSING_THE_SIDE_MENU)
    }
  }, [isDrawerOpen])

  useEffect(() => {
    remoteLog('on Home screen')
    props.getUnacknowledgedMessages()
  }, [])

  const onCameraButton = () => {
    props.navigation.navigate(qrCodeScannerTabRoute, {
      backRedirectRoute: homeDrawerRoute,
    })
  }

  const onRefresh = () => {
    props.getUnacknowledgedMessages()
  }

  const renderRecentCard = useCallback((item: Object) => (
    <RecentCard
      status={item.action}
      timestamp={item.timestamp}
      statusMessage={getEventMessage(item)}
      issuerName={item.senderName}
      logoUrl={item.senderLogoUrl}
      item={item}
    />
  ))

  const renderNewBannerCard = useCallback(
    (item: Object) => {
      return (
        <NewBannerCard
          navigation={props.navigation}
          navigationRoute={getEventRedirectionRoute(item)}
          timestamp={item.timestamp}
          logoUrl={item.senderLogoUrl}
          uid={item.originalPayload.payloadInfo.uid}
          issuerName={item.senderName}
        />
      )
    },
    [props]
  )

  return (
    <View style={styles.outerContainer}>
      <View
        style={styles.container}
        testID="home-container"
        accessible={false}
        accessibilityLabel="home-container"
      >
        {(props.hasNoConnection || props.hasNoRecentConnections) &&
          (HomeViewEmptyState ? <HomeViewEmptyState /> : <EmptyState />)}
        <View style={styles.checkmarkContainer}>
          <FlatList
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.newBadgeFlatListInnerContainer}
            data={props.newBannerConnections}
            renderItem={({ item }) => renderNewBannerCard(item)}
            ListEmptyComponent={renderEmptyListPlaceholder}
            onRefresh={onRefresh}
            refreshing={props.messageDownloadStatus === GET_MESSAGES_LOADING}
          />
        </View>

        {showHistoryEvents && (
          <>
            <RecentCardSeparator />
            <View style={styles.recentFlatListContainer}>
              <FlatList
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.recentFlatListInnerContainer}
                data={props.recentConnections}
                renderItem={({ item }) => renderRecentCard(item)}
              />
            </View>
          </>
        )}
      </View>
      {showCameraButton && <CameraButton onPress={onCameraButton} />}
    </View>
  )
}

const mapStateToProps = (state: Store) => {
  const historyEvents = []

  if (state.history && state.history.data && state.history.data.connections) {
    Object.values(state.history.data.connections).forEach(
      (connectionHistory: any) => {
        if (
          connectionHistory &&
          connectionHistory.data &&
          connectionHistory.data.length
        ) {
          historyEvents.push(...connectionHistory.data)
        }
      }
    )
  }

  // Sorts the newest actions to be on top
  const sortedHistoryEvents = historyEvents.sort((a, b) => {
    if (!b.timestamp) {
      return 0
    }
    let bTimestamp = new Date(b.timestamp).getTime()
    if (!a.timestamp) {
      return 0
    }
    let aTimestamp = new Date(a.timestamp).getTime()
    return bTimestamp - aTimestamp
  })

  const newEvents = []
  const recentEvents = []

  sortedHistoryEvents.map((connection) => {
    if (isNewEvent(connection.status, connection.showBadge)) {
      newEvents.push(connection)
    } else {
      const statusMessage = getEventMessage(connection)
      if (statusMessage) {
        recentEvents.push(connection)
      }
    }
  })

  const hasNoConnection = historyEvents.length === 0
  const hasNoRecentConnections = recentEvents.length === 0

  return {
    hasNoConnection,
    hasNoRecentConnections,
    newBannerConnections: newEvents,
    recentConnections: recentEvents,
    messageDownloadStatus: state.config.messageDownloadStatus,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      getUnacknowledgedMessages,
    },
    dispatch
  )

const screen = CustomHomeScreen || HomeScreen

export const homeScreen = {
  routeName: homeDrawerRoute, // --> This route name needs to be homeDrawerRoute, because homeRoute is the name of the entire DrawerNavigator.
  screen: connect(mapStateToProps, mapDispatchToProps)(screen),
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    flex: 1,
  },
  checkmarkContainer: {
    width: '100%',
    height: '50%',
  },
  newBadgeFlatListInnerContainer: {
    paddingBottom: moderateScale(20, 0.2),
    paddingTop: moderateScale(18, 0.1),
  },
  recentFlatListContainer: {
    flex: 1,
  },
  recentFlatListInnerContainer: {
    paddingBottom: moderateScale(70, 0.12),
    paddingTop: moderateScale(10, 0.28),
  },
})
