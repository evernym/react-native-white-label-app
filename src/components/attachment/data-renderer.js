// @flow
import React, { useCallback } from 'react'
import { Text, View, Image, TouchableOpacity, Alert } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'
import FileViewer from 'react-native-file-viewer'

import type { AttachmentPropType } from './type-attachment'

import { BLANK_ATTRIBUTE_DATA_TEXT } from '../../connection-details/type-connection-details'
import { flattenAsync } from '../../common/flatten-async'
import { ExpandableText } from '../../components/expandable-text/expandable-text'

import {
  PhotoAttachment,
  checkObjectTypes,
  getIcon,
} from './helpers'
import { attachMimeTypes } from './type-attachment'
import { styles } from './styles'

const { photoMimeTypes } = attachMimeTypes

export const DataRenderer = (props: {
  label: string,
  data?: string,
  uid: string,
  remotePairwiseDID: string,
  contentStyles?: any,
}) => {
  const { label, data, uid, remotePairwiseDID, contentStyles } = props

  if (!data || data === '') {
    return (
      // Replace empty data string with (none) in lighter gray
      <Text style={[styles.contentGray, contentStyles]}>
        {BLANK_ATTRIBUTE_DATA_TEXT}
      </Text>
    )
  }

  if (label.toLowerCase().endsWith('_link')) {
    // since attribute name ends with "_link"
    // we now know that this is supposed to be an attachment
    // now, we need to render specific icon on the basis of the MIME-type
    let attachment: $PropertyType<
      AttachmentPropType,
      'attachment'
    > | null = null
    try {
      attachment = JSON.parse(data)

      // TODO:KS Harden security check around file extension
      if (checkObjectTypes(attachment)) {
        throw new Error('Invalid data')
      }
    } catch (e) {
      console.log(e.message)
      return <Text style={styles.contentGray}>Error rendering file.</Text>
    }
    console.log(attachment)
    // Now we know that we have got attachment data, and all fields are present
    // We can render either photo sent inside data, or we can render icon for file
    if (photoMimeTypes.includes(attachment['mime-type'].toLowerCase())) {
      return <PhotoAttachment base64={attachment.data.base64} />
    }

    return (
      <Attachment
        attachment={attachment}
        uid={uid}
        remotePairwiseDID={remotePairwiseDID}
        label={label}
      />
    )
  }
  return <ExpandableText text={data} style={[styles.content, contentStyles]} />
}

const Attachment = (props: AttachmentPropType) => {
  // This component renders icon only and not render content itself
  // MSDK is not rendering and opening items inside MSDK
  // because it is not safe from security perspective
  // Also, we don't have much time to implement, audio, video, pdf, doc, excel etc.
  // So, for file types whose mime type is known to us, we will render it's icon
  // if mime type matches word doc, then we render word doc icon

  const onKnownAttachmentOpen = useCallback(async () => {
    const {
      uid,
      remotePairwiseDID,
      label,
      attachment: {
        extension,
        data: { base64 },
      },
    } = props
    // create file path with DocumentDirectory, uid, remotePairwiseDID and label
    const attachmentPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${remotePairwiseDID}-${uid}-${label}.${extension}`
    // check if file exists
    const [existError, exists] = await flattenAsync(RNFetchBlob.fs.exists)(
      attachmentPath
    )
    if (existError) {
      Alert.alert('CO001: Error opening file.')
    }
    if (!exists) {
      // if file does not exist writeFile
      const [writeError] = await flattenAsync(RNFetchBlob.fs.writeFile)(
        attachmentPath,
        base64,
        'base64'
      )

      if (writeError) {
        Alert.alert('CO002: Error opening file.')
      }
    }

    // Use file viewer to open file
    const [openError] = await flattenAsync(FileViewer.open)(attachmentPath, {
      displayName: `${label}.${extension}`,
      showOpenWithDialog: true,
      showAppsSuggestions: true,
    })
    if (openError) {
      Alert.alert(
        'CO003: Error opening file.',
        `Please install an application which can handle .${extension}`
      )
    }
  }, [props])

  const icon = getIcon(props.attachment['mime-type'])

  return (
    <TouchableOpacity
      onPress={onKnownAttachmentOpen}
      style={styles.nameIconContainer}
    >
      <Image source={icon} style={styles.attachmentIcon} resizeMode="contain" />
      <View style={styles.attachmentNameContainer}>
        <Text style={styles.content} ellipsizeMode="tail" numberOfLines={3}>
          {props.attachment.name}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
