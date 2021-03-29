// @flow

// packages
import React, { Component } from 'react'
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  InteractionManager,
} from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { moderateScale } from 'react-native-size-matters'

// types
import type {
  ProofRequestState,
  ProofRequestAndHeaderProps,
} from '../../proof-request/type-proof-request'
import {
  MESSAGE_ERROR_PROOF_GENERATION_TITLE,
  MESSAGE_ERROR_PROOF_GENERATION_DESCRIPTION,
  MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_TITLE,
  MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_DESCRIPTION, PRIMARY_ACTION_SEND,
} from '../../proof-request/type-proof-request'
import type { SelectedAttribute } from '../../push-notification/type-push-notification'

// store
import {
  rejectProofRequest,
  acceptProofRequest,
  ignoreProofRequest,
  proofRequestShown,
  proofRequestShowStart,
  denyProofRequest,
  applyAttributesForPresentationRequest,
  deleteOutofbandPresentationRequest,
} from '../../proof-request/proof-request-store'
import { newConnectionSeen } from '../../connection-history/connection-history-store'
import { updateAttributeClaim, getProof } from '../../proof/proof-store'
import type { Store } from '../../store/type-store'
import { acceptOutOfBandInvitation } from '../../invitation/invitation-store'

// components
import { ModalButtons } from '../../components/buttons/modal-buttons'
import { Loader } from '../../components'
import ProofRequestAttributeList from './proof-request-attribute-list'

// styles
import { colors } from '../../common/styles/constant'

// utils
import { hasMissingAttributes } from '../utils'
import { authForAction } from '../../lock/lock-auth-for-action.js'
import { homeDrawerRoute, homeRoute } from '../../common'
import { proofRequestAcceptButtonText, proofRequestDenyButtonText } from '../../external-imports'

class ModalContentProof extends Component<
  ProofRequestAndHeaderProps,
  ProofRequestState & { scheduledDeletion: boolean }
> {
  constructor(props) {
    super(props)
    if (this.props.uid) {
      props.proofRequestShowStart(this.props.uid)
    }

    this.state = {
      allMissingAttributesFilled: !hasMissingAttributes(
        this.props.missingAttributes
      ),
      interactionsDone: false,
      scheduledDeletion: false,
      attributesFilledFromCredential: {},
      attributesFilledByUser: {},
    }
    this.onSend = this.onSend.bind(this)
  }

  componentDidUpdate(prevProps: ProofRequestAndHeaderProps) {
    if (
      prevProps.dissatisfiedAttributes !== this.props.dissatisfiedAttributes &&
      this.props.dissatisfiedAttributes.length > 0
    ) {
      Alert.alert(
        MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_TITLE,
        MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_DESCRIPTION(
          this.props.dissatisfiedAttributes,
          this.props.name
        ),
        [
          {
            text: 'OK',
            onPress: this.onIgnore,
          },
        ]
      )
      return
    }

    if (
      this.props.dissatisfiedAttributes.length === 0 &&
      this.props.missingAttributes !== prevProps.missingAttributes &&
      hasMissingAttributes(this.props.missingAttributes)
    ) {
      this.setState({
        allMissingAttributesFilled: false,
      })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: ProofRequestAndHeaderProps) {
    if (
      this.props.proofGenerationError !== nextProps.proofGenerationError &&
      nextProps.proofGenerationError
    ) {
      setTimeout(() => {
        Alert.alert(
          MESSAGE_ERROR_PROOF_GENERATION_TITLE,
          MESSAGE_ERROR_PROOF_GENERATION_DESCRIPTION,
          [
            {
              text: 'OK',
            },
          ]
        )
      }, 300)
    }

    if (
      this.props.data &&
      this.props.data.requestedAttributes !== nextProps.data.requestedAttributes
    ) {
      const attributesFilledFromCredential = nextProps.data.requestedAttributes.reduce(
        (acc, item) => {
          const items = { ...acc }
          if (Array.isArray(item)) {
            if (item[0].claimUuid) {
              items[`${item[0].key}`] = [
                item[0].claimUuid,
                true,
                item[0].cred_info,
              ]
            }
          }
          return items
        },
        {}
      )
      this.setState({ attributesFilledFromCredential })
    }
  }

  updateAttributesFilledFromCredentials = (item: SelectedAttribute) => {
    const attributesFilledFromCredential = {
      ...this.state.attributesFilledFromCredential,
      [`${item.key}`]: [item.claimUuid, true, item.cred_info],
    }
    this.setState({ attributesFilledFromCredential })

    // attribute is not self attested anymore
    if (this.state.attributesFilledByUser[item.key] !== undefined) {
      const {
        [item.key]: deleted,
        ...attributesFilledByUser
      } = this.state.attributesFilledByUser
      this.setState({ attributesFilledByUser })
    }
  }

  updateAttributesFilledByUser = (item: SelectedAttribute) => {
    const attributesFilledByUser = {
      ...this.state.attributesFilledByUser,
      [item.key]: item.value,
    }
    this.setState({ attributesFilledByUser })

    // attribute is not filled from credential anymore
    if (this.state.attributesFilledFromCredential[item.key] !== undefined) {
      const {
        [item.key]: deleted,
        ...attributesFilledFromCredential
      } = this.state.attributesFilledFromCredential
      this.setState({ attributesFilledFromCredential })
    }
  }

  canEnablePrimaryAction = (allMissingAttributesFilled: boolean) => {
    this.setState({
      allMissingAttributesFilled,
    })
  }

  componentDidMount() {
    this.props.proofRequestShown(this.props.uid)
    this.props.getProof(this.props.uid)
    InteractionManager.runAfterInteractions(() => {
      this.setState({
        interactionsDone: true,
      })
    })
  }

  componentWillUnmount() {
    if (this.state.scheduledDeletion) {
      this.props.deleteOutofbandPresentationRequest(this.props.uid)
    }
  }

  navigateOnSuccess = () => {
    const redirectBack = this.props.route.params?.redirectBack
    if (redirectBack) {
      this.props.navigation.goBack(null)
    } else {
      this.props.navigation.navigate(homeRoute, {
        screen: homeDrawerRoute,
        params: undefined,
      })
    }
  }

  onIgnore = () => {
    if (this.props.invitationPayload) {
      this.setState({ scheduledDeletion: true })
    } else {
      this.props.newConnectionSeen(this.props.remotePairwiseDID)
      this.props.ignoreProofRequest(this.props.uid)
    }
  }

  onRetry = () => {
    this.props.updateAttributeClaim(
      this.props.uid,
      this.props.remotePairwiseDID,
      this.state.attributesFilledFromCredential,
      this.state.attributesFilledByUser
    )
  }

  onDeny = () => {
    if (this.props.canBeIgnored) {
      // on cancel
      this.setState({ scheduledDeletion: true })
      this.props.hideModal()
    } else {
      // on reject
      authForAction({
        lock: this.props.lock,
        navigation: this.props.navigation,
        onSuccess: this.onDenyAuthSuccess,
      })
    }
  }

  onDenyAuthSuccess = () => {
    this.props.denyProofRequest(this.props.uid)
    this.navigateOnSuccess()
  }

  onSend = () => {
    authForAction({
      lock: this.props.lock,
      navigation: this.props.navigation,
      onSuccess: this.onSendAuthSuccess,
    })
  }

  onSendAuthSuccess = () => {
    this.props.newConnectionSeen(this.props.remotePairwiseDID)

    if (this.props.invitationPayload) {
      // if properties contains invitation it means we accepted out-of-band presentation request
      this.props.acceptOutOfBandInvitation(
        this.props.invitationPayload,
        this.props.attachedRequest
      )
      this.props.applyAttributesForPresentationRequest(
        this.props.uid,
        this.state.attributesFilledFromCredential,
        this.state.attributesFilledByUser
      )
    } else {
      this.props.updateAttributeClaim(
        this.props.uid,
        this.props.remotePairwiseDID,
        this.state.attributesFilledFromCredential,
        this.state.attributesFilledByUser
      )
    }

    this.navigateOnSuccess()
  }

  render() {
    const {
      claimMap,
      missingAttributes,
      institutionalName,
      credentialName,
      credentialText,
      imageUrl,
      colorBackground,
      secondColorBackground,
      navigation,
      route,
    } = this.props

    if (!this.state.interactionsDone) {
      return <Loader />
    }

    const disableAccept =
      this.props.proofGenerationError ||
      !this.state.allMissingAttributesFilled ||
      (this.props.dissatisfiedAttributes &&
        this.props.dissatisfiedAttributes.length > 0)

    let acceptButtonText = proofRequestAcceptButtonText || PRIMARY_ACTION_SEND
    let denyButtonText = proofRequestDenyButtonText || (this.props.canBeIgnored ? 'Cancel' : 'Reject')

    const {
      canEnablePrimaryAction,
      updateAttributesFilledFromCredentials,
      updateAttributesFilledByUser,
    } = this
    return (
      <View style={styles.outerModalWrapper}>
        <View style={styles.innerModalWrapper}>
          <ProofRequestAttributeList
            list={this.props.data.requestedAttributes}
            {...{
              claimMap,
              missingAttributes,
              canEnablePrimaryAction,
              updateAttributesFilledFromCredentials,
              updateAttributesFilledByUser,
              institutionalName,
              credentialName,
              credentialText,
              imageUrl,
              colorBackground,
              navigation,
              route,
              attributesFilledFromCredential: this.state
                .attributesFilledFromCredential,
              attributesFilledByUser: this.state.attributesFilledByUser,
            }}
          />
        </View>
        <ModalButtons
          onPress={this.onSend}
          onIgnore={this.onDeny}
          denyButtonText={denyButtonText}
          acceptBtnText={acceptButtonText}
          disableAccept={disableAccept}
          svgIcon="Send"
          colorBackground={colors.main}
          {...{ secondColorBackground }}
        />
      </View>
    )
  }
}

const mapStateToProps = (state: Store, mergeProps) => {
  const { proofRequest, lock } = state
  const uid = mergeProps.uid
  const proofRequestData = proofRequest[uid] || {}
  const {
    data,
    requester = {},
    remotePairwiseDID,
    missingAttributes = {},
    dissatisfiedAttributes = [],
    ephemeralProofRequest,
  } = proofRequestData
  const { name } = requester
  const proofGenerationError = state.proof[uid] ? state.proof[uid].error : null

  const canBeIgnored = mergeProps.invitationPayload || ephemeralProofRequest

  return {
    data,
    name,
    uid,
    proofGenerationError,
    claimMap: state.claim.claimMap,
    missingAttributes,
    remotePairwiseDID,
    dissatisfiedAttributes,
    lock,
    canBeIgnored,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      proofRequestShown,
      acceptProofRequest,
      ignoreProofRequest,
      rejectProofRequest,
      updateAttributeClaim,
      acceptOutOfBandInvitation,
      applyAttributesForPresentationRequest,
      deleteOutofbandPresentationRequest,
      getProof,
      proofRequestShowStart,
      newConnectionSeen,
      denyProofRequest,
    },
    dispatch
  )
export default connect(mapStateToProps, mapDispatchToProps)(ModalContentProof)

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: moderateScale(12),
    ...Platform.select({
      ios: {
        borderBottomColor: colors.gray5,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomColor: colors.gray5,
        borderBottomWidth: 1,
      },
    }),
  },
  avatarWrapper: {
    marginTop: moderateScale(-15),
    width: '15%',
  },
  outerModalWrapper: {
    width: '100%',
    flex: 1,
  },
  innerModalWrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },
})
