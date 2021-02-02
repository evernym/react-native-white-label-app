// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, Platform } from 'react-native'
import {
  CustomView,
  AvatarsPair,
  CustomText,
  Loader,
  Container,
  CustomButton,
} from '../components'
import { colors } from '../common/styles/constant'
import {
  CLAIM_REQUEST_STATUS,
  ACCEPTING_TEXT,
  PAYING_TEXT,
} from './type-claim-offer'
import type {
  ClaimRequestStatusModalProps,
  ClaimRequestStatusModalState,
} from './type-claim-offer'
import { formatNumbers } from '../components/text'
import { moderateScale } from 'react-native-size-matters'

const ClaimRequestModalText = (props: { children: string, bold?: boolean }) => (
  <CustomText
    h5
    center
    tertiary
    bg="tertiary"
    transparentBg
    style={[styles.message]}
    testID={`claim-request-message`}
    bold={props.bold}
  >
    {props.children}
  </CustomText>
)

export class ClaimRequestStatusModal extends PureComponent<
  ClaimRequestStatusModalProps,
  ClaimRequestStatusModalState
> {
  // modalText: string
  state = {
    modalText: '',
  }

  // only states for which claim request modal will be visible
  visibleStates = [
    CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST,
    CLAIM_REQUEST_STATUS.SENDING_PAID_CREDENTIAL_REQUEST,
  ]

  successStates = [
    CLAIM_REQUEST_STATUS.CLAIM_REQUEST_SUCCESS,
    CLAIM_REQUEST_STATUS.PAID_CREDENTIAL_REQUEST_SUCCESS,
    CLAIM_REQUEST_STATUS.SEND_CLAIM_REQUEST_SUCCESS,
  ]

  onContinue = () => {
    setTimeout(() => {
      this.props.onContinue()
    }, 1)
  }

  componentDidMount() {
    if (
      this.props.claimRequestStatus ===
      CLAIM_REQUEST_STATUS.SENDING_PAID_CREDENTIAL_REQUEST
    ) {
      this.setState({
        modalText: PAYING_TEXT,
      })
    } else if (
      this.props.claimRequestStatus ===
        CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST &&
      this.state.modalText !== ACCEPTING_TEXT
    ) {
      this.setState({
        modalText: ACCEPTING_TEXT,
      })
    } else {
    }
  }

  componentDidUpdate(prevProps: ClaimRequestStatusModalProps) {
    if (
      prevProps.claimRequestStatus !== this.props.claimRequestStatus &&
      this.visibleStates.indexOf(this.props.claimRequestStatus) < 0
    ) {
      this.props.onModalHide && this.props.onModalHide()
    }
  }

  render() {
    const {
      claimRequestStatus,
      payload: { issuer, data },
      senderLogoUrl,
      isPending = false,
      message1,
      message3,
      message5,
      message6, //message6 is for payTokenValue related usage
      payTokenValue,
      fromConnectionHistory = false,
    }: ClaimRequestStatusModalProps = this.props
    let message2 = data.name
    let message4 = issuer.name
    if (isPending || payTokenValue) {
      message2 = issuer.name
      message4 = `"${data.name}"`
    }

    if (payTokenValue) {
      message2 = `for ${data.name}`
      message4 = ''
    }

    const isSendingPaidCredentialRequest =
      claimRequestStatus ===
      CLAIM_REQUEST_STATUS.SENDING_PAID_CREDENTIAL_REQUEST
    const isSendingCredentialRequest =
      claimRequestStatus === CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST
    const isSending =
      isSendingPaidCredentialRequest || isSendingCredentialRequest
    const avatarRight = senderLogoUrl
      ? { uri: senderLogoUrl }
      : require('../images/cb_evernym.png')
    const { middleImage, middleImageStyle } =
      isPending || isSending
        ? payTokenValue || isSending
          ? {
              middleImage: require('../images/connectArrowsRight.png'),
              middleImageStyle: styles.connectedArrowRight,
            }
          : {
              middleImage: require('../images/connectArrows.png'),
              middleImageStyle: styles.connectedArrow,
            }
        : {
            middleImage: require('../images/checkMark.png'),
            middleImageStyle: null,
          }
    const conditionalMessage =
      message6 !== undefined ? (payTokenValue ? message6 : null) : message5

    return (
      <Container center={!(isPending && !fromConnectionHistory)}>
        {isPending && !fromConnectionHistory ? (
          <Container center fifth>
            <CustomView center style={[styles.loaderHeading]}>
              <CustomText
                h5
                center
                tertiary
                bg="tertiary"
                transparentBg
                style={[{ marginBottom: moderateScale(5) }]}
                bold
              >
                {isPending && fromConnectionHistory
                  ? message2
                  : this.state.modalText}
              </CustomText>
              {isPending && !fromConnectionHistory && <Loader />}
            </CustomView>
          </Container>
        ) : (
          <CustomView
            center
            shadow
            style={[styles.container, styles.backgroundColor]}
          >
            <CustomView style={[styles.innerContainer]} center verticalSpace>
              {isPending && fromConnectionHistory && (
                <AvatarsPair
                  middleImage={middleImage}
                  middleImageStyle={middleImageStyle}
                  avatarRight={avatarRight}
                  testID={'claim-request'}
                />
              )}
              {isPending && !isSending && (
                <ClaimRequestModalText>{message1}</ClaimRequestModalText>
              )}

              {isPending && payTokenValue && !isSendingPaidCredentialRequest ? (
                <ClaimRequestModalText bold>
                  {`${formatNumbers(payTokenValue)} tokens`}
                </ClaimRequestModalText>
              ) : null}

              <ClaimRequestModalText bold>
                {isPending && fromConnectionHistory
                  ? message2
                  : this.state.modalText}
              </ClaimRequestModalText>

              {isPending && !isSending && message3 ? (
                <ClaimRequestModalText>{message3}</ClaimRequestModalText>
              ) : null}

              {isPending && !isSending && !payTokenValue ? (
                <ClaimRequestModalText bold>{message4}</ClaimRequestModalText>
              ) : null}

              {isPending &&
                conditionalMessage &&
                fromConnectionHistory &&
                !isSending && (
                  <ClaimRequestModalText>
                    {conditionalMessage}
                  </ClaimRequestModalText>
                )}
            </CustomView>
            <CustomButton
              fifth
              onPress={this.onContinue}
              title={'Continue'}
              textStyle={{ fontWeight: 'bold', color: colors.main }}
            />
          </CustomView>
        )}
      </Container>
    )
  }
}

const styles = StyleSheet.create({
  connectedArrow: {
    height: moderateScale(20),
    width: moderateScale(80),
    zIndex: -1,
    right: 7,
  },
  connectedArrowRight: {
    height: moderateScale(20),
    width: moderateScale(80),
    zIndex: -1,
  },
  message: {
    marginBottom: moderateScale(5),
  },
  title: {
    marginBottom: moderateScale(10),
  },
  fullScreen: {
    flex: 1,
  },
  container: {
    marginHorizontal: moderateScale(30),
  },
  innerContainer: {
    ...Platform.select({
      ios: {
        borderBottomColor: colors.gray1,
        borderBottomWidth: moderateScale(StyleSheet.hairlineWidth / 2),
      },
      android: {
        borderBottomColor: colors.gray4,
        borderBottomWidth: 1,
      },
    }),
    padding: moderateScale(20),
  },
  backgroundColor: {
    backgroundColor: colors.white,
  },
  loaderHeading: { height: '84%' },
})
