// @flow
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

export type PhotoAttachmentPropType = {
  label: string,
  extension: string,
  base64: string,
}

export const attachMimeTypes = {
  photoMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  docMimeTypes: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
    'application/vnd.ms-word.document.macroEnabled.12',
    'application/vnd.ms-word.template.macroEnabled.12',
  ],
  excelMimeTypes: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'application/vnd.ms-excel.template.macroEnabled.12',
    'application/vnd.ms-excel.addin.macroEnabled.12',
    'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    'text/csv',
  ],
  pptMimeTypes: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.template',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    'application/vnd.ms-powerpoint.addin.macroEnabled.12',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    'application/vnd.ms-powerpoint.template.macroEnabled.12',
    'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
  ],
  pdfMimeTypes: ['application/pdf'],
  audioVideoMimeType: ['audio/mp4', 'audio/mpeg', 'audio/mp3', 'video/mp4'],
  csvMimeType: ['text/csv'],
}
