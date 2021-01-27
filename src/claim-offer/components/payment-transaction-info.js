// @flow
import * as React from 'react'
import { PureComponent } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { scale } from 'react-native-size-matters'

import type {
  PaymentTransactionInfoProps,
  TokenFeesData,
} from '../type-claim-offer'

import CredentialCostInfo from './credential-cost-info'
import { ModalButtons } from '../../components/buttons/modal-buttons'
import { CustomText } from '../../components'
import { colors } from '../../common/styles/constant'
import Loader from '../../components/loader/loader'
import { Error } from '../../components/error/error'
import { Container } from '../../components'
import { Success } from '../../components/success/success'
import { CLAIM_REQUEST_STATUS } from '../type-claim-offer'
import { animateLayout } from '../../common/layout-animation'

const messages = {
  IN_PROGRESS: 'Getting network fees...',
  ERROR: 'There was a problem getting network fees.',
  ZERO_FEES: 'No network fees for this transaction. Transferring tokens...',
  INSUFFICIENT_BALANCE:
    'You do not have enough tokens to purchase this credential.',
  INSUFFICIENT_BALANCE_WITH_DATA: (
    feesData: TokenFeesData & { credentialPrice: string }
  ) =>
    `You do not have enough tokens to purchase this credential. You need (credential price: ${feesData.credentialPrice} + fees: ${feesData.fees} = total: ${feesData.total}), while your current token balance is ${feesData.currentTokenBalance}. Please get in touch with Sovrin Foundation to get more tokens. Once you have enough tokens, open credential offer again and you should be able to accept.`,
  SENDING_PAID_CREDENTIAL_REQUEST: 'Transferring tokens...',
  SENDING_CREDENTIAL_REQUEST: 'Accepting offer...',
  SUCCESS:
    'Tokens transferred successfully. You should receive your credential shortly.',
  SUCCESS_SEND_CLAIM_REQUEST: 'Offer accepted successfully.',
  ERROR_PAID_CREDENTIAL_REQUEST: 'There was a problem transferring tokens.',
  ERROR_CREDENTIAL_REQUEST: 'There was a problem accepting this offer.',
}

class PaymentTransactionInfo extends PureComponent<
  PaymentTransactionInfoProps,
  void
> {
  render() {
    const {
      claimThemePrimary,
      claimThemeSecondary,
      onConfirmAndPay,
      onCancel,
      credentialPrice,
      txnFeesStatus,
      claimRequestStatus,
      onRetry,
      feesData = {
        fees: '0',
        total: '',
        currentTokenBalance: '',
      },
      onSuccess = noop,
    } = this.props

    let content = null
    let isError = false

    if (txnFeesStatus) {
      const credentialCostInfo = (
        <CredentialCostInfo
          feesData={feesData}
          payTokenValue={credentialPrice}
          backgroundColor={claimThemePrimary}
          onConfirmAndPay={onConfirmAndPay}
          onCancel={onCancel}
          secondColorBackground={claimThemeSecondary}
        />
      )
      const txnFeesComponent = {
        IN_PROGRESS: <Loader message={messages.IN_PROGRESS} />,
        ERROR: (
          <Error
            errorText={messages.ERROR}
            containerStyles={[styles.errorContainer]}
          />
        ),
        ZERO_FEES: (
          <Container center>
            <Text>{messages.ZERO_FEES}</Text>
          </Container>
        ),
        TRANSFER_EQUAL_TO_BALANCE: credentialCostInfo,
        TRANSFER_POSSIBLE_WITH_FEES: credentialCostInfo,
        TRANSFER_NOT_POSSIBLE_WITH_FEES: (
          <ScrollView style={styles.scrollViewStyles}>
            <Error
              errorText={messages.INSUFFICIENT_BALANCE_WITH_DATA({
                ...feesData,
                credentialPrice,
              })}
              textStyles={[styles.insufficientBalanceText]}
              containerStyles={[styles.errorContainer]}
            />
          </ScrollView>
        ),
      }

      content = txnFeesComponent[txnFeesStatus]
      isError = ['ERROR', 'TRANSFER_NOT_POSSIBLE_WITH_FEES'].includes(
        txnFeesStatus
      )
    }

    if (claimRequestStatus) {
      switch (claimRequestStatus) {
        case CLAIM_REQUEST_STATUS.SENDING_PAID_CREDENTIAL_REQUEST:
          content = (
            <Loader message={messages.SENDING_PAID_CREDENTIAL_REQUEST} />
          )
          break
        case CLAIM_REQUEST_STATUS.SENDING_CLAIM_REQUEST:
          content = <Loader message={messages.SENDING_CREDENTIAL_REQUEST} />
          break
        case CLAIM_REQUEST_STATUS.PAID_CREDENTIAL_REQUEST_FAIL:
          content = (
            <Error
              errorText={messages.ERROR_PAID_CREDENTIAL_REQUEST}
              containerStyles={[styles.errorContainer]}
            />
          )
          break
        case CLAIM_REQUEST_STATUS.SEND_CLAIM_REQUEST_FAIL:
        case CLAIM_REQUEST_STATUS.CLAIM_REQUEST_FAIL:
          content = (
            <Error
              errorText={messages.ERROR_CREDENTIAL_REQUEST}
              containerStyles={[styles.errorContainer]}
            />
          )
          break
        case CLAIM_REQUEST_STATUS.INSUFFICIENT_BALANCE:
          content = (
            <Error
              errorText={messages.INSUFFICIENT_BALANCE}
              containerStyles={[styles.errorContainer]}
            />
          )
          break
        case CLAIM_REQUEST_STATUS.PAID_CREDENTIAL_REQUEST_SUCCESS:
          content = (
            <Success
              successText={messages.SUCCESS}
              afterSuccessShown={onSuccess}
            />
          )
          break
        case CLAIM_REQUEST_STATUS.SEND_CLAIM_REQUEST_SUCCESS:
          content = (
            <Success
              successText={messages.SUCCESS_SEND_CLAIM_REQUEST}
              afterSuccessShown={onSuccess}
            />
          )
          break
        default:
          break
      }

      isError = [
        CLAIM_REQUEST_STATUS.CLAIM_REQUEST_FAIL,
        CLAIM_REQUEST_STATUS.SEND_CLAIM_REQUEST_FAIL,
        CLAIM_REQUEST_STATUS.INSUFFICIENT_BALANCE,
        CLAIM_REQUEST_STATUS.PAID_CREDENTIAL_REQUEST_FAIL,
      ].includes(claimRequestStatus)
    }

    if (content) {
      return (
        <View style={styles.container}>
          {content}
          {isError ? (
            <ModalButtons
              onPress={onRetry}
              onIgnore={onCancel}
              colorBackground={claimThemePrimary}
              secondColorBackground={claimThemeSecondary}
              denyButtonText={'Cancel'}
              acceptBtnText={'Retry'}
            />
          ) : null}
        </View>
      )
    }

    return null
  }

  getSnapshotBeforeUpdate() {
    animateLayout()
  }
}

function Text({ children }: { children: React.Node }) {
  return (
    <CustomText
      primary
      multiline
      transparentBg
      center
      style={styles.statusText}
    >
      {children}
    </CustomText>
  )
}

function noop() {}

export default PaymentTransactionInfo

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '5%',
    paddingTop: 20,
    backgroundColor: colors.cmGray5,
  },
  statusText: {
    color: colors.cmGray3,
    textAlign: 'center',
    marginTop: 40,
    fontSize: scale(15),
    backgroundColor: colors.cmRed,
  },
  errorContainer: {
    flex: 1,
  },
  insufficientBalanceText: { fontSize: scale(17) },
  scrollViewStyles: {
    flex: 1,
  },
})
