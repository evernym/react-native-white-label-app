// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { withNavigation } from '@react-navigation/compat'

import type { GenericObject } from '../common/type-common'
import type { Store } from '../store/type-store'

import { withBottomUpSliderScreen } from '../components/bottom-up-slider-screen/bottom-up-slider-screen'
import { txnAuthorAgreementRoute } from '../common'

import { BottomUpSliderContentHeaderDetail } from '../components/bottom-up-slider-screen/components/bottom-up-slider-screen-header-detail'
import { BottomUpSliderLoader } from '../components/bottom-up-slider-screen/components/bottom-up-slider-loader'
import { CustomView } from '../components'

import { BottomUpSliderSuccess } from '../components/bottom-up-slider-screen/components/bottom-up-slider-success'
import { BottomUpSliderError } from '../components/bottom-up-slider-screen/components/bottom-up-slider-error'
import {
  checkTxnAuthorAgreement,
  taaAccepted,
  taaAcceptSubmit,
} from './txn-author-agreement-store'
import { TAA_STATUS } from './type-txn-author-agreement'

import { measurements } from '../common/styles/measurements'
import { ModalButtons } from '../components/buttons/modal-buttons'
import type { TxnAuthorAgreementScreenProps } from './type-txn-author-agreement'
import { fontFamily } from '../common/styles'
const sovrinLogo = require('../images/iconTokenOrange.png')

export class TxnAuthorAgreement extends Component<
  TxnAuthorAgreementScreenProps,
  void
> {
  componentDidMount() {
    this.props.checkTxnAuthorAgreement()
  }

  taaAcceptSubmit = () => {
    this.props.taaAcceptSubmit()
  }
  closeTAA = () => {
    this.props.navigation.goBack(null)
  }

  getBody = (status: string) => {
    const extraHeightStyle: Array<GenericObject> = [styles.extraHeight]

    const inProgressStates = [
      TAA_STATUS.ACCEPT_TAA_IN_PROGRESS,
      TAA_STATUS.GET_TAA_IN_PROGRESS,
      TAA_STATUS.IDLE,
    ]
    const errorStates = [TAA_STATUS.ACCEPT_TAA_ERROR, TAA_STATUS.GET_TAA_ERROR]

    const message =
      status === TAA_STATUS.ACCEPT_TAA_IN_PROGRESS ? 'sending' : 'working'
    if (inProgressStates.includes(status)) {
      return (
        <BottomUpSliderLoader message={message} style={styles.extraHeight} />
      )
    } else if (status === TAA_STATUS.ACCEPT_TAA_SUCCESS) {
      return (
        <BottomUpSliderSuccess
          afterSuccessShown={this.afterSuccessShown}
          successText="Transaction Author Agreement accepted."
          style={extraHeightStyle}
        />
      )
    } else if (errorStates.includes(status)) {
      const errorText =
        status === TAA_STATUS.ACCEPT_TAA_ERROR
          ? 'Error occurred while accepting Transaction Author Agreement'
          : status === TAA_STATUS.GET_TAA_ERROR
          ? 'Error occurred while getting Transaction Author Agreement'
          : 'Error'

      return (
        <View>
          <BottomUpSliderError
            errorText={errorText}
            textStyles={[styles.errorText]}
            containerStyles={[styles.errorTextContainer, styles.errorText]}
          />
          <ModalButtons
            onPress={
              status === TAA_STATUS.ACCEPT_TAA_ERROR
                ? this.props.checkTxnAuthorAgreement
                : this.props.taaAcceptSubmit
            }
            onIgnore={this.afterSuccessShown}
            colorBackground={'#EB9B2D'}
            secondColorBackground={'#B37622'}
            topBtnText={'Ignore'}
            bottomBtnText={'Try Again'}
          />
        </View>
      )
    } else {
      return (
        <View style={styles.scrollViewWrapperContainer}>
          <View style={styles.overflow}>
            <ScrollView style={styles.scrollViewWrapper}>
              <View style={styles.placeholderView} />
              <Text style={styles.text}>
                {this.props.text !== ''
                  ? this.props.text
                  : `TAA is not active this is placeholder text until it is activated Transaction Author Agreement`}
              </Text>
            </ScrollView>
            <View style={styles.placeholderView} />
          </View>
          <ModalButtons
            onPress={this.props.taaAcceptSubmit}
            onIgnore={this.afterSuccessShown}
            colorBackground={'#EB9B2D'}
            secondColorBackground={'#B37622'}
            topBtnText={'Ignore'}
            bottomBtnText={'Accept'}
          />
        </View>
      )
    }
  }
  render() {
    const { status } = this.props
    return (
      <CustomView style={[styles.modalWrapper]}>
        <BottomUpSliderContentHeaderDetail
          senderName={'Sovrin Foundation'}
          source={sovrinLogo}
          headerInfo={'you must sign before sending tokens'}
          headerTitle={'Transaction Author Agreement'}
        />
        {this.getBody(status)}
      </CustomView>
    )
  }

  afterSuccessShown = () => {
    this.props.navigation.goBack(null)
  }

  afterErrorShown = () => {
    this.props.navigation.goBack(null)
  }
}

const mapStateToProps = (state: Store) => {
  return {
    status: state.txnAuthorAgreement.status,
    text: state.txnAuthorAgreement.text,
    version: state.txnAuthorAgreement.version,
    haveAlreadySignedAgreement:
      state.txnAuthorAgreement.haveAlreadySignedAgreement,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      checkTxnAuthorAgreement,
      taaAccepted,
      taaAcceptSubmit,
    },
    dispatch
  )

export const txnAuthorAgreementScreen = withBottomUpSliderScreen(
  { routeName: txnAuthorAgreementRoute },
  withNavigation(
    connect(mapStateToProps, mapDispatchToProps)(TxnAuthorAgreement)
  )
)

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamily,
  },
  container: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingHorizontal: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollViewWrapperContainer: {
    justifyContent: 'space-between',
  },
  scrollViewWrapper: {
    paddingHorizontal: '3%',
    paddingVertical: '0%',
    flexGrow: 0,
  },
  overflow: {
    minHeight: 75,
    maxHeight: measurements.WINDOW_HEIGHT * 0.8 - 192,
  },
  wrapper: {
    backgroundColor: '#f2f2f2',
    width: '90%',
    marginLeft: '5%',
    paddingTop: 12,
    position: 'relative',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a5a5a5',
    width: '100%',
    textAlign: 'left',
    marginBottom: 2,
    fontFamily: fontFamily,
  },
  content: {
    fontSize: 17,
    fontWeight: '400',
    color: '#505050',
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    paddingBottom: 12,
  },
  textAvatarWrapper: {
    width: '98.5%',
    flexDirection: 'row',
  },
  textWrapper: {
    width: '85%',
  },
  avatarWrapper: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWrapper: {
    overflow: 'hidden',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    // paddingHorizontal: '3%',
    backgroundColor: '#f2f2f2',
    // backgroundColor: 'red',
    maxHeight: measurements.WINDOW_HEIGHT * 0.8,
  },
  errorText: {
    maxWidth: '90%',
    marginLeft: '5%',
  },
  errorTextContainer: {
    minHeight: 180,
    backgroundColor: '#f2f2f2',
  },
  errorTextStyles: {
    maxWidth: '90%',
    marginLeft: '5%',
  },
  extraHeight: {
    minHeight: 180,
    backgroundColor: '#f2f2f2',
  },
  placeholderView: { height: 20 },
})
