// @flow
import * as React from 'react'
import {
  Text,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  LayoutAnimation,
} from 'react-native'
import { connect } from 'react-redux'
import { SwipeRow } from 'react-native-swipe-list-view'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'
import {
  colors,
  fontFamily,
  fontSizes as fonts,
  fontSizes,
} from '../../common/styles/constant'
import { isiPhone5 } from '../../common/styles'

import type { RecentCardProps } from './type-recent-card'
import {
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  DENY_CLAIM_OFFER_FAIL,
} from '../../claim-offer/type-claim-offer'
import { bindActionCreators } from 'redux'
import {
  acceptClaimOffer,
  denyClaimOffer,
} from '../../claim-offer/claim-offer-store'
import {
  ERROR_SEND_PROOF,
} from '../../proof/type-proof'
import { reTrySendProof } from '../../proof/proof-store'
import { deleteHistoryEvent } from '../../connection-history/connection-history-store'
import { safeGet, safeSet } from '../../services/storage'
import {
  DENY_PROOF_REQUEST_FAIL,
} from '../../proof-request/type-proof-request'
import { denyProofRequest } from '../../proof-request/proof-request-store'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { CONNECTION_FAIL } from '../../store/type-connection-store'
import { sendInvitationResponse } from '../../invitation/invitation-store'
import { ResponseType } from '../../components/request/type-request'
import { deleteConnectionAction } from '../../store/connections-store'
import { LOADING_ACTIONS } from '../../connection-history/type-connection-history'
import { PROOF_VERIFICATION_FAILED } from '../../verifier/type-verifier'
import { renderUserAvatar } from "../../components/user-avatar/user-avatar";

class RecentCardComponent extends React.Component<RecentCardProps, void> {
  render() {
    const props = this.props
    const isRetryCard = getRetryStatus(props.item)
    const isLoading = getLoadingStatus(props.status)
    const isFailed = getFailedStatus(props.status)

    const cardContent = (
      <View style={styles.container}>
        <View style={styles.iconSection}>
          { props.issuerName ?
            renderImageOrText(props.logoUrl, props.issuerName) :
            renderUserAvatar({ size: 'superSmall' })
          }
        </View>
        <View style={styles.textSection}>
          <View style={styles.textMessageSection}>
            <Text
              style={
                isFailed
                  ? [styles.textMessage, styles.retryText]
                  : styles.textMessage
              }
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {props.statusMessage}
            </Text>
          </View>
          <View style={styles.textIssuerSection}>
            <Text
              style={
                isFailed
                  ? [styles.textIssuer, styles.retryText]
                  : styles.textIssuer
              }
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {props.issuerName}
            </Text>
          </View>
        </View>
        <View style={styles.textDateSection}>
          {isRetryCard ? (
            <Text style={[styles.textDate, styles.retryText]}>
              Tap to retry
            </Text>
          ) : isLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.textDate}>{props.timestamp}</Text>
          )}
        </View>
      </View>
    )

    if (isRetryCard) {
      const onRetry = getRetryFunction(props)
      const onDeleteExtra = getDeleteFunction(props)
      return (
        <SwipeableRetry
          onDelete={() => this.onDelete(onDeleteExtra)}
          onRetry={onRetry}
        >
          {cardContent}
        </SwipeableRetry>
      )
    }

    return cardContent
  }

  onDelete = (onDeleteExtraFunc: function) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
    this.props.deleteHistoryEvent(this.props.item)
    onDeleteExtraFunc()
  }
}

const renderImageOrText = (logoUrl: string, issuerName: string) => {
  return typeof logoUrl === 'string' ? (
    <Image source={{ uri: logoUrl }} style={styles.issuerLogo} />
  ) : (
    <DefaultLogo
      text={issuerName}
      size={moderateScale(30)}
      fontSize={isiPhone5 ? fonts.size5 : fonts.size4}
    />
  )
}

class SwipeableRetry extends React.PureComponent<
  { onDelete: () => void, onRetry: () => void, children: React.Element<any> },
  { showPreview: boolean }
> {
  state = {
    showPreview: false,
  }

  render() {
    const { onDelete, onRetry, children } = this.props
    const { showPreview } = this.state

    // show preview to user for deleting only 2 times in app lifetime
    return (
      <SwipeRow
        disableRightSwipe={true}
        preview={showPreview}
        rightOpenValue={-scale(100)}
      >
        <TouchableWithoutFeedback onPress={onDelete}>
          <View style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={onRetry}>
          {children}
        </TouchableWithoutFeedback>
      </SwipeRow>
    )
  }

  async componentDidMount() {
    try {
      const DELETE_MESSAGE_PREVIEW_COUNT = 'DELETE_MESSAGE_PREVIEW_COUNT'
      const previewCount: string | null = await safeGet(
        DELETE_MESSAGE_PREVIEW_COUNT
      )
      const previewCounter = parseInt(previewCount, 10)
      // if count is not zero or null
      if (!previewCount || isNaN(previewCounter)) {
        this.setState({ showPreview: true })
        // user has never seen delete button preview
        // set count that user has seen it once
        await safeSet(DELETE_MESSAGE_PREVIEW_COUNT, '1')
        return
      }

      if (previewCounter < 3) {
        this.setState({ showPreview: true })
        await safeSet(DELETE_MESSAGE_PREVIEW_COUNT, `${previewCounter + 1}`)
        return
      }
    } catch (e) {}
  }
}

export const reTryActions = [
  CONNECTION_FAIL,
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  ERROR_SEND_PROOF,
  DENY_PROOF_REQUEST_FAIL,
  // DENY_CLAIM_OFFER_FAIL, --> Uncomment this when we have vcx deny claim offer functions in place.
]

export const FAILED_ACTIONS = [
  CONNECTION_FAIL,
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
  ERROR_SEND_PROOF,
  DENY_PROOF_REQUEST_FAIL,
  PROOF_VERIFICATION_FAILED,
]

function getRetryStatus(event: *): boolean {
  return reTryActions.includes(event.action)
}

function getLoadingStatus(status: string) {
  return LOADING_ACTIONS.includes(status)
}

function getFailedStatus(status: string) {
  return FAILED_ACTIONS.includes(status)
}

// TODO:KS Memoize this function
function getRetryFunction({
  item: event,
  sendInvitationResponse,
  acceptClaimOffer,
  reTrySendProof,
  denyProofRequest,
  denyClaimOffer,
}: *): () => void {
  if (event.action === CONNECTION_FAIL) {
    return () => {
      sendInvitationResponse({
        response: ResponseType.accepted,
        senderDID: event.remoteDid,
      })
    }
  }

  if (
    event.action === SEND_CLAIM_REQUEST_FAIL ||
    event.action === PAID_CREDENTIAL_REQUEST_FAIL
  ) {
    return () => {
      acceptClaimOffer(
        event.originalPayload.uid,
        event.originalPayload.remoteDid
      )
    }
  }

  if (event.action === ERROR_SEND_PROOF) {
    return () => {
      reTrySendProof(
        event.originalPayload.selfAttestedAttributes,
        event.originalPayload
      )
    }
  }

  if (event.action === DENY_PROOF_REQUEST_FAIL) {
    return () => {
      denyProofRequest(event.originalPayload.uid)
    }
  }

  if (event.action === DENY_CLAIM_OFFER_FAIL) {
    return () => {
      denyClaimOffer(event.originalPayload.uid)
    }
  }

  return () => {}
}

function getDeleteFunction({
  item: event,
  deleteConnectionAction,
}: *): () => void {
  if (event.action === CONNECTION_FAIL) {
    return () => {
      deleteConnectionAction(event.remoteDid)
    }
  }

  return () => {}
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      sendInvitationResponse,
      deleteConnectionAction,
      acceptClaimOffer,
      reTrySendProof,
      deleteHistoryEvent,
      denyProofRequest,
      denyClaimOffer,
    },
    dispatch
  )

export const RecentCard = connect(null, mapDispatchToProps)(RecentCardComponent)

const commonCardStyles = {
  height: verticalScale(40),
  marginLeft: moderateScale(20),
  marginRight: moderateScale(20),
}
const styles = StyleSheet.create({
  messageContainer: { flex: 1 },
  container: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    ...commonCardStyles,
  },
  iconSection: {
    height: '100%',
    width: 40,
    justifyContent: 'center',
  },
  textSection: {
    flex: 1,
  },
  textMessageSection: {
    flex: 2,
    justifyContent: 'flex-end',
  },
  textIssuerSection: {
    flex: 2,
    justifyContent: 'flex-start',
  },
  textDateSection: {
    height: '100%',
    width: moderateScale(48),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  issuerLogo: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(30) / 2,
    opacity: 0.5,
  },
  textMessage: {
    fontSize: verticalScale(fontSizes.size8),
    fontWeight: 'normal',
    fontFamily: fontFamily,
    color: colors.gray3,
  },
  textIssuer: {
    fontSize: verticalScale(fontSizes.size10),
    fontWeight: 'normal',
    fontFamily: fontFamily,
    color: colors.gray3,
  },
  textDate: {
    fontSize: verticalScale(fontSizes.size11),
    fontWeight: 'normal',
    fontFamily: fontFamily,
    fontStyle: 'italic',
    color: colors.gray3,
  },
  placeholderIfNoImage: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(30) / 2,
    backgroundColor: colors.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTextIfNoImage: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size7),
    fontWeight: 'bold',
    color: colors.white,
  },
  retryText: {
    color: colors.red,
    marginRight: scale(3),
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.red,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
    ...commonCardStyles,
  },
  deleteButtonText: {
    color: colors.white,
    alignItems: 'center',
    marginRight: scale(30),
    fontFamily: fontFamily,
    fontSize: scale(12),
  },
})
