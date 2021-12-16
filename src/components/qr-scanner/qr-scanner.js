// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import { RNCamera } from 'react-native-camera'

import type { GenericObject } from '../../common/type-common'
import type {
  QrCodeOIDC,
  QrScannerProps,
  QrScannerState,
  CameraMarkerProps,
  CornerBoxProps,
  QR_SCAN_STATUS,
} from './type-qr-scanner'

import { Container } from '../layout'
import { CustomView } from '../layout'
import CustomText from '../text'
import type { AriesConnectionInvite } from '../../invitation/type-invitation'
import {
  color,
  OFFSET_2X,
  OFFSET_3X,
  OFFSET_5X,
  colors,
} from '../../common/styles'
import {
  SCAN_STATUS,
  BOTTOM_RIGHT,
  BOTTOM_LEFT,
  TOP_RIGHT,
  TOP_LEFT,
  QR_CODE_TYPES,
} from './type-qr-scanner'
import { isValidUrl, getUrlData } from './qr-code-types/qr-url'
import {
  fetchValidateJWT,
  getOpenidLinkData,
  isValidOpenIDLink,
} from './qr-code-types/qr-code-oidc'
import { uuid } from '../../services/uuid'
import {
  MESSAGE_NO_CAMERA_PERMISSION,
  MESSAGE_ALLOW_CAMERA_PERMISSION,
} from '../../qr-code/type-qr-code'
import { CONNECTION_INVITE_TYPES } from '../../invitation/type-invitation'
import { flatJsonParse } from '../../common/flat-json-parse'
import { validateEphemeralProofQrCode } from '../../proof-request/proof-request-qr-code-reader'
import { EvaIcon, CLOSE_ICON } from '../../common/icons'
import { moderateScale } from 'react-native-size-matters'
import {
  convertProprietaryInvitationToAppInvitation,
  isProprietaryInvitation,
  isShortProprietaryInvitation,
} from '../../invitation/kinds/proprietary-connection-invitation'
import { isAriesInvitation } from '../../invitation/kinds/aries-connection-invitation'
import { isAriesOutOfBandInvitation } from '../../invitation/kinds/aries-out-of-band-invitation'
import { validateEphemeralClaimOffer } from '../../claim-offer/ephemeral-claim-offer'

export default class QRScanner extends PureComponent<
  QrScannerProps,
  QrScannerState
> {
  state = {
    scanStatus: SCAN_STATUS.SCANNING,
  }

  // Need to have this property because we can't rely
  // on state being updated immediately
  // so, while state being updated by react asynchronously,
  // onRead can be called multiple times and we don't want it
  isScanning: boolean = false

  // we queue few async tasks by assuming that camera might still be active
  // however, if this component is unmounted before we could call timers
  // then we possibly might have memory leak and React issue of updating
  // state on unmounted components
  timers = []

  reactivateScanning = () => {
    // this method sets scanning status
    // so that we stop accepting qr code scans and user can see
    // "scanning..." text, otherwise as soon as we set state
    // in "reactivate" function, "scanning..." text will disappear and it looks bad
    const reactivateTimer = setTimeout(() => {
      this.isScanning = false
    }, 2000)
    this.timers.push(reactivateTimer)
  }

  reactivate = () => {
    this.setState(
      {
        scanStatus: SCAN_STATUS.SCANNING,
      },
      this.reactivateScanning
    )
  }

  delayedReactivate = () => {
    // no anonymous function to save closure to avoid memory leak
    const delayedTimer = setTimeout(this.reactivate, 3000)
    this.timers.push(delayedTimer)
  }

  componentWillUnmount() {
    this.timers.map(clearTimeout)
    this.timers = []
  }

  onRead: ({| data: string |}) => Promise<boolean | void> = async (event: {|
    data: string,
  |}) => {
    if (this.isScanning) {
      return false
    }

    let qrData = null

    // set class instance property as well to avoid async React state issue
    this.isScanning = true

    // check if qr code data is url or json object
    const urlQrCode = isValidUrl(event.data)

    if (urlQrCode) {
      // update UI to reflect that ConnectMe has read url and now downloading data
      this.setState({ scanStatus: SCAN_STATUS.DOWNLOADING })

      // we have different url type qr codes as well,
      // identify which type of url qr it is and get a json object from url
      const [urlError, urlData] = await getUrlData(urlQrCode, event.data)
      if (urlError) {
        // we could not get data from url, show error to user
        return this.showError(urlError)
      }

      qrData = urlData
    }

    const openidLinkQrCode = isValidOpenIDLink(event.data)
    if (openidLinkQrCode) {
      const [urlError, urlData] = await getOpenidLinkData(event.data)
      if (urlError) {
        // we could not get data from url, show error to user
        return this.showError(urlError)
      }

      qrData = urlData
    }

    if (!qrData) {
      // If we are here, that means we either got data in `qrData` variable from url
      // or it was not urlQrCode, so we need to check if it is json object
      const [parseError, parsedData] = flatJsonParse(event.data)
      if (parseError) {
        // we did not get data from url,
        // then we tried to check if data is json, and that also failed in parsing
        // show error to user and end continuing with this function
        return this.showError(SCAN_STATUS.FAIL)
      }

      qrData = parsedData
    }

    if (!qrData) {
      // if we still does not get data, then show another error to user
      return this.showError(SCAN_STATUS.FAIL)
    }

    // now we got json object, either via qr code or via downloading from url

    // check if version 1.0 short qr invitation
    const shortInviteQrCode = isShortProprietaryInvitation(qrData)
    if (shortInviteQrCode) {
      this.setState({ scanStatus: SCAN_STATUS.SCANNING })
      return this.props.onShortProprietaryInvitationRead(shortInviteQrCode)
    }

    // check if version 1.0 qr invitation
    const smsInviteQrCode = isProprietaryInvitation(qrData)
    if (smsInviteQrCode) {
      this.setState({ scanStatus: SCAN_STATUS.SCANNING })
      return this.props.onProprietaryInvitationRead(
        convertProprietaryInvitationToAppInvitation(smsInviteQrCode)
      )
    }

    // check if aries invite
    if (qrData.type === CONNECTION_INVITE_TYPES.ARIES_V1_QR) {
      this.setState({ scanStatus: SCAN_STATUS.SCANNING })
      return this.props.onAriesConnectionInviteRead(
        ((qrData: any): AriesConnectionInvite)
      )
    }

    // aries invitation can be directly copied as json string as well
    // above case handles when aries invite comes from url encoded
    const ariesV1Invite = isAriesInvitation(qrData, JSON.stringify(qrData))
    if (ariesV1Invite) {
      this.setState({ scanStatus: SCAN_STATUS.SCANNING })
      return this.props.onAriesConnectionInviteRead(ariesV1Invite)
    }

    // check if OIDC qr code
    if (qrData.type === QR_CODE_TYPES.OIDC) {
      // for OIDC based qr code, we have to follow few more steps
      // show user that we are downloading JWT token
      this.setState({ scanStatus: SCAN_STATUS.DOWNLOADING_AUTHENTICATION_JWT })
      const [jwtAuthenticationRequest, jwtError] = await fetchValidateJWT(
        ((qrData: GenericObject): QrCodeOIDC)
      )
      if (jwtError !== null || jwtAuthenticationRequest === null) {
        // if we get error while validating JWT request
        // then show error on QR scanner and resume re-scanning of QR code
        // after certain amount of time to let user read error
        // and also so that qr code reader does not keep reading qr code
        // and keep checking status in every sub millisecond
        return this.setState(
          { scanStatus: jwtError || SCAN_STATUS.FAIL },
          this.delayedReactivate
        )
      }

      return this.props.onOIDCAuthenticationRequest({
        oidcAuthenticationQrCode: ((qrData: GenericObject): QrCodeOIDC),
        jwtAuthenticationRequest,
        id: uuid(),
      })
    }

    // check if ephemeral proof request
    const [, ephemeralProofRequest] = await validateEphemeralProofQrCode(
      qrData.type === QR_CODE_TYPES.URL_NON_JSON_RESPONSE ||
        qrData.type === QR_CODE_TYPES.EPHEMERAL_PROOF_REQUEST_V1
        ? (qrData: GenericObject).data
        : JSON.stringify(qrData)
    )
    if (
      ephemeralProofRequest &&
      ephemeralProofRequest.type === QR_CODE_TYPES.EPHEMERAL_PROOF_REQUEST_V1
    ) {
      this.setState({ scanStatus: SCAN_STATUS.SCANNING })
      return this.props.onEphemeralProofRequest(
        ephemeralProofRequest.proofRequest
      )
    }

    // check if ephemeral claim offer
    if (
      qrData.type === QR_CODE_TYPES.EPHEMERAL_CREDENTIAL_OFFER &&
      qrData.data
    ) {
      const [, ephemeralCredentialOffer] = await validateEphemeralClaimOffer(
        qrData.data
      )
      if (ephemeralCredentialOffer) {
        this.setState({ scanStatus: SCAN_STATUS.SCANNING })
        return this.props.onEphemeralCredentialOffer(
          ephemeralCredentialOffer.credentialOffer
        )
      }
    }

    const outOfBandInvite = isAriesOutOfBandInvitation(qrData)
    if (outOfBandInvite) {
      return this.props.onAriesOutOfBandInviteRead(outOfBandInvite)
    }

    // if none of the code matches
    // change scan status to fail, show unknown qr code format
    this.setState({ scanStatus: SCAN_STATUS.FAIL })
  }

  showError = (error: QR_SCAN_STATUS) => {
    // re-activate scanning after setting fail status
    this.setState({ scanStatus: error }, this.delayedReactivate)
  }

  render() {
    return (
      <Container>
        <RNCamera
          onBarCodeRead={this.onRead}
          style={[cameraStyle.camera]}
          captureAudio={false}
          androidCameraPermissionOptions={this.androidCameraPermissionOptions}
        >
          {({ status }) => {
            if (status === 'PENDING_AUTHORIZATION') {
              return <CustomText>Checking camera permission....</CustomText>
            }

            if (status === 'NOT_AUTHORIZED') {
              return (
                <CustomView>
                  <CustomText>{MESSAGE_NO_CAMERA_PERMISSION}</CustomText>
                  <CustomText>{MESSAGE_ALLOW_CAMERA_PERMISSION}</CustomText>
                </CustomView>
              )
            }

            return (
              <CameraMarker
                status={this.state.scanStatus}
                onClose={this.props.onClose}
              />
            )
          }}
        </RNCamera>
      </Container>
    )
  }

  androidCameraPermissionOptions = {
    title: 'Permission to use camera',
    message:
      'App needs access to your camera so you can scan QR codes and form connections.',
    buttonPositive: 'Ok',
    buttonNegative: 'Cancel',
  }
}

export class CameraMarker extends PureComponent<CameraMarkerProps, void> {
  render() {
    const { status, onClose } = this.props

    return (
      <CustomView center style={[cameraMarkerStyles.container]}>
        <CustomText h4 semiBold transparentBg>
          Scan QR Code
        </CustomText>
        <CustomView
          transparentBg
          spaceBetween
          style={[cameraMarkerStyles.cameraMarker]}
        >
          <CustomView row spaceBetween>
            <CornerBox status={status} position={TOP_LEFT} />
            <CornerBox status={status} position={TOP_RIGHT} />
          </CustomView>
          <CustomView row spaceBetween>
            <CornerBox status={status} position={BOTTOM_LEFT} />
            <CornerBox status={status} position={BOTTOM_RIGHT} />
          </CustomView>
        </CustomView>
        <CustomView
          style={[cameraMarkerStyles.container, cameraMarkerStyles.overlay]}
        />
        <CustomText
          h5
          semiBold
          transparentBg
          // $FlowFixMe
          style={[scanStatusStyle[status], scanStatusStyle.scanStatusOffset]}
        >
          {status}
        </CustomText>
        <CustomView row center style={[closeIconStyle.closeIcon]}>
          <EvaIcon
            name={CLOSE_ICON}
            width={moderateScale(36)}
            height={moderateScale(36)}
            testID={'close-qr-scanner-icon'}
            accessible={true}
            accessibilityLabel="close-qr-scanner-icon"
            onPress={onClose}
            color={colors.white}
          />
        </CustomView>
      </CustomView>
    )
  }
}

export class CornerBox extends PureComponent<CornerBoxProps, void> {
  render() {
    const { status } = this.props
    const borderStyle = SUCCESS_STYLE_STATES.includes(status)
      ? cameraMarkerStyles.borderSuccess
      : FAILURE_STYLE_STATES.includes(status)
      ? cameraMarkerStyles.borderFail
      : cameraMarkerStyles.border

    return (
      <CustomView
        transparentBg
        style={[
          cameraMarkerStyles.cornerBox,
          // $FlowFixMe
          cameraMarkerStyles[`${this.props.position}Box`],
          borderStyle,
        ]}
      />
    )
  }
}

const SUCCESS_STYLE_STATES = [
  SCAN_STATUS.SUCCESS,
  SCAN_STATUS.DOWNLOADING_INVITATION,
  SCAN_STATUS.DOWNLOADING_AUTHENTICATION_JWT,
  SCAN_STATUS.DOWNLOADING,
]
const FAILURE_STYLE_STATES = [
  SCAN_STATUS.FAIL,
  SCAN_STATUS.NO_INVITATION_DATA,
  SCAN_STATUS.NO_AUTHENTICATION_REQUEST,
  SCAN_STATUS.AUTH_REQUEST_DOWNLOAD_FAILED,
  SCAN_STATUS.AUTH_REQUEST_INVALID_HEADER_DECODE_ERROR,
  SCAN_STATUS.AUTH_REQUEST_INVALID_HEADER_SCHEMA,
  SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_DECODE_ERROR,
  SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_SCHEMA,
  SCAN_STATUS.AUTH_REQUEST_INVALID_SIGNATURE,
  SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_SCHEMA_AND_SEND_FAIL,
  SCAN_STATUS.INVALID_DOWNLOADED_DATA,
  SCAN_STATUS.INVALID_URL_QR_CODE,
]

const markerSize = 250
const cornerBoxSize = 70
const cornerBoxBorderSize = 5

const cameraMarkerStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    zIndex: -1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cameraMarker: {
    width: markerSize,
    height: markerSize,
    marginVertical: OFFSET_5X,
  },
  border: {
    borderColor: color.bg.primary.font.primary,
  },
  borderSuccess: {
    borderColor: color.actions.tertiary,
  },
  borderFail: {
    borderColor: color.actions.dangerous,
  },
  cornerBox: {
    width: cornerBoxSize,
    height: cornerBoxSize,
  },
  topLeftBox: {
    borderTopWidth: cornerBoxBorderSize,
    borderLeftWidth: cornerBoxBorderSize,
  },
  topRightBox: {
    borderTopWidth: cornerBoxBorderSize,
    borderRightWidth: cornerBoxBorderSize,
  },
  bottomLeftBox: {
    borderBottomWidth: cornerBoxBorderSize,
    borderLeftWidth: cornerBoxBorderSize,
  },
  bottomRightBox: {
    borderBottomWidth: cornerBoxBorderSize,
    borderRightWidth: cornerBoxBorderSize,
  },
})

const cameraStyle = StyleSheet.create({
  camera: {
    // magical number 50 can be set here due to footer height
    // we want our QR code to go behind the footer slightly
    // but at the same time we want qr scan status to stay sufficient above footer
    // without margin or padding, by setting height
    // we automatically align qr scanner using flex
    height: Dimensions.get('screen').height,
    backgroundColor: 'transparent',
  },
})

const idleStyle = {
  color: color.actions.none,
}
const failStyle = {
  color: color.actions.dangerous,
}
const successStyle = {
  color: color.actions.tertiary,
}

const scanStatusStyle = StyleSheet.create({
  [SCAN_STATUS.SCANNING]: idleStyle,
  [SCAN_STATUS.SUCCESS]: successStyle,
  [SCAN_STATUS.FAIL]: failStyle,
  [SCAN_STATUS.DOWNLOADING_INVITATION]: successStyle,
  [SCAN_STATUS.NO_INVITATION_DATA]: failStyle,
  [SCAN_STATUS.DOWNLOADING_AUTHENTICATION_JWT]: successStyle,
  [SCAN_STATUS.NO_AUTHENTICATION_REQUEST]: failStyle,
  [SCAN_STATUS.AUTH_REQUEST_DOWNLOAD_FAILED]: failStyle,
  [SCAN_STATUS.AUTH_REQUEST_INVALID_HEADER_DECODE_ERROR]: failStyle,
  [SCAN_STATUS.AUTH_REQUEST_INVALID_HEADER_SCHEMA]: failStyle,
  [SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_DECODE_ERROR]: failStyle,
  [SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_SCHEMA]: failStyle,
  [SCAN_STATUS.AUTH_REQUEST_INVALID_SIGNATURE]: failStyle,
  [SCAN_STATUS.AUTH_REQUEST_INVALID_BODY_SCHEMA_AND_SEND_FAIL]: failStyle,
  scanStatusOffset: {
    marginVertical: OFFSET_3X,
  },
})

const closeIconStyle = StyleSheet.create({
  closeIcon: {
    marginVertical: OFFSET_2X,
  },
})
