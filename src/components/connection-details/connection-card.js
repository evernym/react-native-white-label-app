// @flow
import React, { useCallback, useMemo } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
} from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import SvgCustomIcon from '../../components/svg-custom-icon'
import CredentialPriceInfo from '../../components/labels/credential-price-info'
import {
  connectionsDrawerRoute,
  modalContentProofShared,
  modalScreenRoute,
  receivedProofRoute,
} from '../../common'
import {
  SEND_CLAIM_REQUEST_FAIL,
  PAID_CREDENTIAL_REQUEST_FAIL,
} from '../../claim-offer/type-claim-offer'
import { acceptClaimOffer } from '../../claim-offer/claim-offer-store'
import { reTrySendProof } from '../../proof/proof-store'
import { ERROR_SEND_PROOF } from '../../proof/type-proof'
import { reTryActions } from '../../home/recent-card/recent-card'
import { deleteHistoryEvent } from '../../connection-history/connection-history-store'
import { DENY_PROOF_REQUEST_FAIL } from '../../proof-request/type-proof-request'
import { denyProofRequest } from '../../proof-request/proof-request-store'
import { moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { CONNECTION_FAIL } from '../../store/type-connection-store'
import { ResponseType } from '../request/type-request'
import { sendInvitationResponse } from '../../invitation/invitation-store'
import { deleteConnectionAction } from '../../store/connections-store'
import { ExpandableText } from '../expandable-text/expandable-text'
import type { ReactNavigation } from '../../common/type-common'
import { PRESENTATION_VERIFIED } from '../../verifier/type-verifier'

type ConnectionCardProps = {
  messageDate: string,
  headerText: string,
  infoType: string,
  infoDate: string,
  buttonText: string,
  data: any,
  type: string,
  colorBackground?: string,
  noOfAttributes?: number,
  showBadge?: boolean,
  institutionalName?: string,
  imageUrl?: any,
  secondColorBackground?: string,
  payTokenValue?: any,
  repeatable?: boolean,
  acceptClaimOffer: typeof acceptClaimOffer,
  reTrySendProof: typeof reTrySendProof,
  deleteHistoryEvent: typeof deleteHistoryEvent,
  denyProofRequest: typeof denyProofRequest,
  sendInvitationResponse: typeof sendInvitationResponse,
  deleteConnectionAction: typeof deleteConnectionAction,
} & ReactNavigation

const ConnectionCardComponent = ({
                                   messageDate,
                                   headerText,
                                   infoType,
                                   infoDate,
                                   buttonText,
                                   data,
                                   type,
                                   colorBackground,
                                   noOfAttributes,
                                   showBadge,
                                   institutionalName,
                                   imageUrl,
                                   secondColorBackground,
                                   payTokenValue,
                                   repeatable,
                                   navigation,
                                   acceptClaimOffer,
                                   reTrySendProof,
                                   deleteHistoryEvent,
                                   denyProofRequest,
                                   sendInvitationResponse,
                                   deleteConnectionAction,
                                 }: ConnectionCardProps) => {
  const updateAndShowModal = useCallback(() => {
    if (
      type === SEND_CLAIM_REQUEST_FAIL ||
      type === PAID_CREDENTIAL_REQUEST_FAIL
    ) {
      acceptClaimOffer(
        data.originalPayload.uid,
        data.originalPayload.remoteDid,
      )
    } else if (type === ERROR_SEND_PROOF) {
      reTrySendProof(
        data.originalPayload.selfAttestedAttributes,
        data.originalPayload,
      )
    } else if (type === DENY_PROOF_REQUEST_FAIL) {
      denyProofRequest(data.originalPayload.uid)
    } else if (type === CONNECTION_FAIL) {
      sendInvitationResponse({
        response: ResponseType.accepted,
        senderDID: data.remoteDid,
      })
    } else if (type === 'SHARED') {
      navigation.navigate(modalContentProofShared, {
        data,
        colorBackground,
      })
    } else if (type === 'RECEIVED') {
      navigation.navigate(modalScreenRoute, {
        data,
        imageUrl,
        institutionalName,
        colorBackground,
        secondColorBackground,
      })
    } else if (type === PRESENTATION_VERIFIED) {
      navigation.navigate(receivedProofRoute, {
        data,
        colorBackground,
      })
    } else {
      return null
    }
  }, [data, type])

  const onDelete = useCallback(() => {
    if (type === CONNECTION_FAIL) {
      deleteConnectionAction(data.remoteDid)
      navigation.navigate(connectionsDrawerRoute)
      return
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
    deleteHistoryEvent(data)
  }, [data, type])

  const canDelete = useMemo(() => reTryActions.includes(data.action), [data])

  return (
    <View style={styles.container}>
      <Text style={styles.messageDate}>{messageDate}</Text>
      <View style={styles.innerWrapper}>
        {payTokenValue && (
          <CredentialPriceInfo
            isPaid={true}
            price={payTokenValue}
          />
        )}
        <View style={styles.innerWrapperPadding}>
          <View style={styles.top}>
            <View
              style={[
                styles.badge,
                { display: showBadge ? 'flex' : 'none' },
              ]}
            >
              <View style={styles.iconWrapper}>
                <SvgCustomIcon
                  name="CheckmarkBadge"
                  fill={colors.gray1}
                  width={moderateScale(22)}
                  height={moderateScale(33)}
                />
              </View>
            </View>
            <View style={styles.headerWrapper}>
              <View style={styles.header}>
                <ExpandableText
                  text={headerText}
                  style={styles.headerText}
                  lines={1}
                />
              </View>
              <View style={styles.infoWrapper}>
                <Text style={styles.infoType}>{infoType}</Text>
                <Text style={styles.infoDate}>{infoDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottom}>
            {!!noOfAttributes && (
              <View style={styles.attributesWrapper}>
                <Text style={styles.attributesText}>
                  {noOfAttributes}
                </Text>
                <Text style={styles.attributesText}> Attributes</Text>
              </View>
            )}
            <View style={styles.button}>
              {(!!noOfAttributes || repeatable) && (
                <TouchableOpacity onPress={updateAndShowModal}>
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colorBackground },
                    ]}
                  >
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              )}
              {canDelete && (
                <Text
                  style={[
                    styles.buttonText,
                    { color: colorBackground },
                  ]}
                  onPress={onDelete}
                >
                  DELETE
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
      <View style={styles.helperView}/>
    </View>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      acceptClaimOffer,
      reTrySendProof,
      deleteHistoryEvent,
      denyProofRequest,
      sendInvitationResponse,
      deleteConnectionAction,
    },
    dispatch,
  )

export const ConnectionCard = connect(
  null,
  mapDispatchToProps,
)(ConnectionCardComponent)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingLeft: '7%',
    paddingRight: '7%',
    paddingTop: moderateScale(15),
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  innerWrapper: {
    marginTop: moderateScale(15),
    borderBottomColor: colors.gray4,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    elevation: Platform.OS === 'android' ? 4 : 0,
    marginBottom: moderateScale(15),
    borderRadius: 6,
  },
  innerWrapperPadding: {
    padding: moderateScale(15),
  },
  messageDate: {
    color: colors.gray2,
    fontSize: moderateScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingBottom: moderateScale(15),
    borderBottomColor: colors.gray3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    height: moderateScale(38),
    width: moderateScale(35),
  },
  headerWrapper: {
    flex: 1,
  },
  header: {
    width: '100%',
  },
  headerText: {
    textAlign: 'left',
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    color: colors.gray1,
    fontFamily: fontFamily,
  },
  infoWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    paddingTop: moderateScale(4),
  },
  infoType: {
    textAlign: 'left',
    fontSize: moderateScale(fontSizes.size9),
    fontWeight: '500',
    color: colors.gray2,
    flex: 1,
    fontFamily: fontFamily,
  },
  infoDate: {
    textAlign: 'right',
    fontSize: moderateScale(fontSizes.size9),
    fontWeight: '500',
    color: colors.gray1,
    fontFamily: fontFamily,
  },
  bottom: {
    width: '100%',
    paddingTop: moderateScale(15),
    backgroundColor: colors.white,
  },
  attributesWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  attributesText: {
    textAlign: 'left',
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '400',
    color: colors.gray1,
    fontFamily: fontFamily,
  },
  button: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  helperView: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray5,
    width: '100%',
    paddingTop: moderateScale(15),
  },
})
