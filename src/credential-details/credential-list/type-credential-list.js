//@flow

export const BLANK_ATTRIBUTE_DATA_TEXT = 'n/a'

// MIME-TYPES for different file types
export const photoMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']

export type PhotoAttachmentPropType = {
  label: string,
  extension: string,
  base64: string,
}

export type AttachmentPropType = {
  attachment: {
    'mime-type': string,
    data: {
      base64: string,
    },
    extension: string,
    name: string,
  },
  uid: string,
  remotePairwiseDID: string,
  label: string,
}

export type CredentialListProps = {
  uid: string,
  remotePairwiseDID: string,
  content: Array<{
    label: string,
    data?: string,
  }>,
  isMissingFieldsShowing?: boolean,
}
