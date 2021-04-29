// @flow
import type { ReactNavigation } from '../common/type-common'
import { proofRequestReceived } from '../proof-request/proof-request-store'
import type { InvitationPayload } from '../invitation/type-invitation'
import { handleInvitation } from '../invitation/invitation-store'
import { openIdConnectUpdateStatus } from '../open-id-connect/open-id-connect-actions'
import { changeEnvironmentUrl } from '../switch-environment/switсh-environment-store'

export type QRCodeScannerScreenState = {
  isCameraEnabled: boolean,
  appState: ?string,
  permission: boolean,
}

export type QRCodeScannerScreenProps = {
  currentScreen: string,
  openIdConnectUpdateStatus: typeof openIdConnectUpdateStatus,
  changeEnvironmentUrl: typeof changeEnvironmentUrl,
  handleInvitation: typeof handleInvitation,
  proofRequestReceived: typeof proofRequestReceived,
  scanQrClose: () => void
} & ReactNavigation

export type OutOfBandNavigation = {
  mainRoute: string,
  backRedirectRoute: string,
  uid: string,
  invitationPayload: InvitationPayload,
  senderName: string,
}

export const MESSAGE_NO_CAMERA_PERMISSION = 'No Camera permission'

export const MESSAGE_ALLOW_CAMERA_PERMISSION =
  'Please allow connect me to access camera from camera settings'
