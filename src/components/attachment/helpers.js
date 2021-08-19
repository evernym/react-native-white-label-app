// @flow
import React from 'react'
import { Image } from 'react-native'

import { attachMimeTypes } from './type-attachment'
import { styles } from './styles'
const {
  docMimeTypes,
  csvMimeType,
  excelMimeTypes,
  pptMimeTypes,
  pdfMimeTypes,
  audioVideoMimeType,
  photoMimeTypes,
} = attachMimeTypes

export const getFileExtensionLabel = (mimeType: string) =>
  `${getFileExtensionName(mimeType)} file`

export const getFileExtensionName = (mimeType: string) => {
  switch (true) {
    case docMimeTypes.includes(mimeType):
      return 'docx'
    case csvMimeType.includes(mimeType):
      return 'CSV'
    case excelMimeTypes.includes(mimeType):
      return 'xlsx'
    case pptMimeTypes.includes(mimeType):
      return 'ppt'
    case pdfMimeTypes.includes(mimeType):
      return 'pdf'
    case audioVideoMimeType.includes(mimeType):
      return 'audio'
    case photoMimeTypes
      .filter((type) => type !== 'image/png')
      .includes(mimeType):
      return 'JPG'
    case photoMimeTypes.includes(mimeType):
      return 'PNG'
    default:
      return 'unknown'
  }
}

export const getIcon = (mimeType: string) => {
  switch (true) {
    case docMimeTypes.includes(mimeType):
      return require('../../images/docx_icon.png')
    case excelMimeTypes.includes(mimeType):
      return require('../../images/xlsx_icon.png')
    case pptMimeTypes.includes(mimeType):
      return require('../../images/ppt_icon.png')
    case pdfMimeTypes.includes(mimeType):
      return require('../../images/pdf_icon.png')
    case audioVideoMimeType.includes(mimeType):
      return require('../../images/audio_icon.png')
    default:
      return require('../../images/unknown_icon.png')
  }
}

export const checkObjectTypes = (attachment: any) =>
  !attachment['mime-type'] ||
  !attachment.data ||
  !attachment.data.base64 ||
  !attachment.extension ||
  !attachment.name
    ? true
    : false

export const PhotoAttachment = (props: { base64: string }) => {
  // TODO:KS handle error condition if image base64 encoded data is not correct
  // and image load fails
  return (
    <Image
      source={{ uri: `${props.base64}` }}
      style={styles.photoAttachment}
      resizeMode="contain"
    />
  )
}
