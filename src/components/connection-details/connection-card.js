// @flow
import React, { PureComponent } from 'react'
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

// TODO: Fix the <any, {}> to be the correct types for props and state
class ConnectionCardComponent extends PureComponent<
  any & {
    deleteHistoryEvent: typeof deleteHistoryEvent,
    denyProofRequest: typeof denyProofRequest,
  },
  {}
> {
  updateAndShowModal = () => {
    const { data: event } = this.props
    if (
      event.action === SEND_CLAIM_REQUEST_FAIL ||
      event.action === PAID_CREDENTIAL_REQUEST_FAIL
    ) {
      this.props.acceptClaimOffer(
        event.originalPayload.uid,
        event.originalPayload.remoteDid
      )
      return
    }

    if (event.action === ERROR_SEND_PROOF) {
      this.props.reTrySendProof(
        event.originalPayload.selfAttestedAttributes,
        event.originalPayload
      )
      return
    }

    if (event.action === DENY_PROOF_REQUEST_FAIL) {
      this.props.denyProofRequest(event.originalPayload.uid)
      return
    }

    if (event.action === CONNECTION_FAIL) {
      this.props.sendInvitationResponse({
        response: ResponseType.accepted,
        senderDID: event.remoteDid,
      })
      return
    }

    if (this.props.proof) {
      this.props.navigation.navigate(modalContentProofShared, {
        uid: this.props.uid,
        data: this.props.data,
        claimMap: this.props.claimMap,
      })
    } else {
      this.props.navigation.navigate(modalScreenRoute, {
        data: this.props.data,
        imageUrl: this.props.imageUrl,
        institutionalName: this.props.institutionalName,
        colorBackground: this.props.colorBackground,
        secondColorBackground: this.props.secondColorBackground,
      })
    }
  }

  render() {
    const canDelete = reTryActions.includes(this.props.data.action)

    return (
      <View style={styles.container}>
        <Text style={styles.messageDate}>{this.props.messageDate}</Text>
        <View style={styles.innerWrapper}>
          {this.props.payTokenValue && (
            <CredentialPriceInfo
              isPaid={true}
              price={this.props.payTokenValue}
            />
          )}
          <View style={styles.innerWrapperPadding}>
            <View style={styles.top}>
              <View
                style={[
                  styles.badge,
                  { display: this.props.showBadge ? 'flex' : 'none' },
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
                    text={this.props.headerText}
                    style={styles.headerText}
                    lines={1}
                  />
                </View>
                <View style={styles.infoWrapper}>
                  <Text style={styles.infoType}>{this.props.infoType}</Text>
                  <Text style={styles.infoDate}>{this.props.infoDate}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottom}>
              {!!this.props.noOfAttributes && (
                <View style={styles.attributesWrapper}>
                  <Text style={styles.attributesText}>
                    {this.props.noOfAttributes}
                  </Text>
                  <Text style={styles.attributesText}> Attributes</Text>
                </View>
              )}
              <View style={styles.button}>
                {(!!this.props.noOfAttributes || this.props.repeatable) && (
                  <TouchableOpacity onPress={this.updateAndShowModal}>
                    <Text
                      style={[
                        styles.buttonText,
                        { color: this.props.colorBackground },
                      ]}
                    >
                      {this.props.buttonText}
                    </Text>
                  </TouchableOpacity>
                )}
                {canDelete && (
                  <Text
                    style={[
                      styles.buttonText,
                      { color: this.props.colorBackground },
                    ]}
                    onPress={this.onDelete}
                  >
                    DELETE
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={styles.helperView} />
      </View>
    )
  }

  onDelete = () => {
    const { data: event } = this.props
    if (event.action === CONNECTION_FAIL) {
      this.props.deleteConnectionAction(event.remoteDid)
      this.props.navigation.navigate(connectionsDrawerRoute)
      return
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
    this.props.deleteHistoryEvent(this.props.data)
  }
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
    dispatch
  )

export const ConnectionCard = connect(
  null,
  mapDispatchToProps
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
  badgeImage: {
    width: moderateScale(23),
    height: moderateScale(34),
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
