// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, Platform } from 'react-native'
import { CustomView, Icon, CustomText, CustomButton } from '../components'
import { moderateScale } from 'react-native-size-matters'
import { colors } from '../common/styles/constant'
import Modal from 'react-native-modal'
import PaymentFailureModal from './payment-failure-modal'
import {
  CLAIM_REQUEST_STATUS,
  CREDENTIAL_OFFER_MODAL_STATUS,
} from '../claim-offer/type-claim-offer'
import type {
  CredentialOfferModalProps,
  CredentialOfferModalState,
} from '../claim-offer/type-claim-offer'
import { ClaimRequestStatusModal } from '../claim-offer/claim-request-modal'
import { LedgerFeesModal } from '../components/ledger-fees-modal/ledger-fees-modal'

export default class CredentialOfferModal extends PureComponent<
  CredentialOfferModalProps,
  CredentialOfferModalState
> {
  onContinue = () => {
    this.props.onClose()
  }

  render() {
    const {
      testID,
      claimRequestStatus,
      claimOfferData,
      isValid,
      logoUrl,
      payTokenValue,
      credentialOfferModalStatus,
      transferAmount,
      connectionName,
    } = this.props
    return (
      <Modal
        backdropColor={colors.cmGray5}
        isVisible={
          credentialOfferModalStatus !== CREDENTIAL_OFFER_MODAL_STATUS.NONE
        }
        animationIn="zoomIn"
        animationOut="zoomOut"
        animationOutTiming={100}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
        onBackButtonPress={this.props.onClose}
        onBackdropPress={this.props.onClose}
        onModalHide={this.props.onModalHide}
        testID={'credential-offer-modal'}
        style={[
          claimRequestStatus ===
            CLAIM_REQUEST_STATUS.SENDING_PAID_CREDENTIAL_REQUEST ||
          claimRequestStatus === CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST ||
          claimRequestStatus === CLAIM_REQUEST_STATUS.SEND_CLAIM_REQUEST_SUCCESS
            ? {
                padding: 0,
                margin: 0,
              }
            : {},
        ]}
      >
        {isValid &&
          credentialOfferModalStatus ===
            CREDENTIAL_OFFER_MODAL_STATUS.INSUFFICIENT_BALANCE &&
          payTokenValue && (
            <CustomView center fifth shadow style={[styles.container]}>
              <CustomView
                spaceBetween
                style={[styles.innerContainer]}
                center
                verticalSpace
              >
                <CustomView center verticalSpace>
                  <Icon src={require('../images/alertInfo.png')} />
                </CustomView>
                <CustomText
                  transparentBg
                  style={[styles.fontBlack]}
                  center
                  demiBold
                >
                  You do not have enough tokens to purchase this credential
                </CustomText>
              </CustomView>
              <CustomButton
                fifth
                onPress={this.props.onClose}
                title={'Continue'}
                textStyle={{ fontWeight: 'bold', color: colors.cmGreen1 }}
              />
            </CustomView>
          )}

        {isValid &&
          credentialOfferModalStatus ===
            CREDENTIAL_OFFER_MODAL_STATUS.CREDENTIAL_REQUEST_FAIL && (
            <CustomView center fifth shadow style={[styles.container]}>
              <CustomView
                spaceBetween
                style={[styles.innerContainer]}
                center
                verticalSpace
              >
                <CustomView center verticalSpace>
                  <Icon src={require('../images/alertInfo.png')} />
                </CustomView>
                <CustomText
                  transparentBg
                  style={[styles.fontBlack]}
                  center
                  demiBold
                >
                  Error accepting credential. Please try again.
                </CustomText>
              </CustomView>
              <CustomButton
                fifth
                onPress={this.props.onClose}
                title={'OK'}
                textStyle={{ fontWeight: 'bold' }}
              />
            </CustomView>
          )}

        {claimRequestStatus &&
          claimOfferData &&
          isValid &&
          credentialOfferModalStatus ===
            CREDENTIAL_OFFER_MODAL_STATUS.CREDENTIAL_REQUEST_STATUS && (
            <ClaimRequestStatusModal
              claimRequestStatus={claimRequestStatus}
              payload={claimOfferData}
              onContinue={this.props.onClose}
              senderLogoUrl={logoUrl}
              payTokenValue={payTokenValue}
              message1={payTokenValue ? 'You paid' : 'You accepted'}
              message3={payTokenValue ? '' : 'from'}
              message6={
                payTokenValue ? 'They will issue it to you shortly.' : ''
              }
              isPending={
                claimRequestStatus ===
                  CLAIM_REQUEST_STATUS.SENDING_PAID_CREDENTIAL_REQUEST ||
                claimRequestStatus ===
                  CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST
              }
              onModalHide={this.props.onModalHide}
            />
          )}

        {credentialOfferModalStatus ===
          CREDENTIAL_OFFER_MODAL_STATUS.SEND_PAID_CREDENTIAL_REQUEST_FAIL ||
        credentialOfferModalStatus ===
          CREDENTIAL_OFFER_MODAL_STATUS.TOKEN_SENT_FAIL ? (
          <PaymentFailureModal
            connectionName={
              connectionName ||
              (claimOfferData != null && claimOfferData.issuer != null
                ? claimOfferData.issuer.name
                : '')
            }
            testID={`${testID}-payment-failure-modal`}
            onClose={this.props.onClose}
            onRetry={this.props.onRetry}
          />
        ) : null}

        {(payTokenValue || transferAmount) &&
        credentialOfferModalStatus ===
          CREDENTIAL_OFFER_MODAL_STATUS.LEDGER_FEES ? (
          <LedgerFeesModal
            onNo={this.props.onNo}
            onYes={this.props.onYes}
            transferAmount={transferAmount}
            renderFeesText={this.props.renderFeesText}
          />
        ) : null}
      </Modal>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: moderateScale(30),
  },
  innerContainer: {
    ...Platform.select({
      ios: {
        borderBottomColor: colors.cmGray1,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomColor: colors.cmGray5,
        borderBottomWidth: 1,
      },
    }),
    padding: moderateScale(20),
  },
  message: {
    marginBottom: moderateScale(5),
  },
  fontBlack: {
    color: colors.cmGray2,
  },
})
