// @flow
import React from 'react'
import { Text, View } from 'react-native'

import type { AttachmentPropType } from './type-attachment'

import SvgCustomIcon from '../svg-custom-icon'
import { ExpandableText } from '../expandable-text/expandable-text'
import { checkObjectTypes, getFileExtensionName } from './helpers'
import { attachMimeTypes } from './type-attachment'
import { DataRenderer } from './data-renderer'
import { styles } from './styles'

const { photoMimeTypes } = attachMimeTypes

export const RenderAttachmentIcon = (
  label: string,
  data: any,
  remotePairwiseDID: string,
  uid: string,
  titleStyles?: any,
  contentStyles?: any
) => {
  let attachment: $PropertyType<AttachmentPropType, 'attachment'> | null = null

  if (label.toLowerCase().endsWith('_link')) {
    attachment = JSON.parse(data)

    try {
      if (checkObjectTypes(attachment)) {
        throw new Error('Invalid data')
      }
    } catch (e) {
      console.log(e.message)
      return null
    }

    return (
      <View style={styles.parentWrapper}>
        <SvgCustomIcon
          name={
            attachment !== null &&
            photoMimeTypes.includes(attachment['mime-type'].toLowerCase())
              ? 'Image'
              : 'Attachment'
          }
          style={styles.svgStyles}
          width={24}
        />
        <View style={styles.textWrapper}>
          <ExpandableText
            text={label.slice(0, -5)}
            style={[styles.title, titleStyles]}
          />
          <Text style={styles.extensionNameStyle}>
            {attachment !== null &&
              `${getFileExtensionName(attachment['mime-type'])} file`}
          </Text>
          <DataRenderer {...{ label, data, uid, remotePairwiseDID }} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.textWrapper}>
      <ExpandableText text={label} style={[styles.title, titleStyles]} />
      <DataRenderer
        {...{ label, data, uid, remotePairwiseDID, contentStyles }}
      />
    </View>
  )
}
