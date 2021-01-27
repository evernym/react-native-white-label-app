// @flow
import React, { useCallback } from 'react'
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'
import FileViewer from 'react-native-file-viewer'

import { BLANK_ATTRIBUTE_DATA_TEXT } from './type-credential-list'
import { flattenAsync } from '../../common/flatten-async'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'

import type {
  CredentialListProps,
  AttachmentPropType,
  PhotoAttachmentPropType,
} from './type-credential-list'
import { photoMimeTypes } from './type-credential-list'

import {
  EvaIcon,
  ATTACHMENT_ICON,
  PHOTO_ATTACHMENT_ICON,
} from '../../common/icons'
import { ExpandableText } from '../../components/expandable-text/expandable-text'

export const CredentialList = ({
  uid,
  remotePairwiseDID,
  content,
}: CredentialListProps) => {
  return (
    <View style={styles.container}>
      {content.map((userData, index) => (
        <View key={index} style={styles.wrapper}>
          <View style={styles.textWrapper}>
            <DataRenderer
              label={userData.label}
              data={userData.data}
              uid={uid}
              remotePairwiseDID={remotePairwiseDID}
            />
          </View>
        </View>
      ))}
    </View>
  )
}

function DataRenderer(props: {
  label: string,
  data: ?string,
  uid: string,
  remotePairwiseDID: string,
}) {
  const { label, data, uid, remotePairwiseDID } = props
  const labelComponent = (
    <ExpandableText
      style={styles.label}
      text={label.toLowerCase().endsWith('_link') ? label.slice(0, -5) : label}
    />
  )

  if (!data) {
    // Replace empty data string with (none) in lighter gray
    return (
      <View>
        {labelComponent}
        <Text style={styles.contentGray}>{BLANK_ATTRIBUTE_DATA_TEXT}</Text>
      </View>
    )
  }

  if (label.toLowerCase().endsWith('_link')) {
    // since attribute name ends with "_link"
    // we now know that this is supposed to be an attachment
    // now, we need to render specific icon on the basis of the MIME-type
    let formattedLabel = label.slice(0, -5)
    let attachment: $PropertyType<
      AttachmentPropType,
      'attachment'
    > | null = null
    try {
      attachment = JSON.parse(data)

      // TODO:KS Harden security check around file extension
      if (
        !attachment['mime-type'] ||
        !attachment.data ||
        !attachment.data.base64 ||
        !attachment.extension ||
        !attachment.name
      ) {
        throw new Error('Invalid data')
      }
    } catch (e) {
      console.log(e.message)
      return <Text style={styles.contentGray}>Error rendering file.</Text>
    }

    // Now we know that we have got attachment data, and all fields are present
    // We can render either photo sent inside data, or we can render icon for file
    if (photoMimeTypes.includes(attachment['mime-type'].toLowerCase())) {
      const type = attachment.extension.toUpperCase()
      return (
        <PhotoAttachment
          label={formattedLabel}
          extension={type}
          base64={attachment.data.base64}
        />
      )
    }

    return (
      <Attachment
        attachment={attachment}
        uid={uid}
        remotePairwiseDID={remotePairwiseDID}
        label={formattedLabel}
      />
    )
  }

  return (
    <View>
      {labelComponent}
      <ExpandableText style={styles.content} text={data} />
    </View>
  )
}

function PhotoAttachment(props: PhotoAttachmentPropType) {
  // TODO:KS handle error condition if image base64 encoded data is not correct
  // and image load fails
  return (
    <View>
      <View style={styles.photoAttachmentWrapper}>
        <EvaIcon
          style={styles.attachmentIcon}
          name={PHOTO_ATTACHMENT_ICON}
          color={colors.cmGray1}
        />
        <View>
          <Text style={styles.label}>{props.label}</Text>
          <Text style={styles.attachmentContent}>
            {props.extension + ' file'}
          </Text>
        </View>
      </View>
      <Image
        source={{ uri: `${props.base64}` }}
        style={styles.photoAttachment}
        resizeMode="contain"
      />
    </View>
  )
}

function Attachment(props: AttachmentPropType) {
  // This component renders icon only and not render content itself
  // ConnectMe is not rendering and opening items inside ConnectMe
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

  const extension = props.attachment.extension.toUpperCase()

  return (
    <TouchableOpacity
      onPress={onKnownAttachmentOpen}
      style={styles.nameIconContainer}
    >
      <View style={styles.photoAttachmentWrapper}>
        <EvaIcon
          style={styles.attachmentIcon}
          name={ATTACHMENT_ICON}
          color={colors.cmGray1}
        />
        <View>
          <Text style={styles.label}>{props.label}</Text>
          <Text style={styles.attachmentContent}>{extension + ' file'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    paddingTop: moderateScale(12),
    borderBottomColor: colors.cmGray2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '90%',
    marginLeft: '5%',
    flexDirection: 'row',
    paddingBottom: moderateScale(12),
  },
  label: {
    fontSize: verticalScale(fontSizes.size7),
    color: colors.cmGray3,
    width: '100%',
    textAlign: 'left',
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
  },
  content: {
    fontSize: moderateScale(fontSizes.size4),
    fontWeight: '700',
    color: colors.cmGray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  attachmentContent: {
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    color: colors.cmGray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  contentGray: {
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: '700',
    color: colors.cmGray2,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  textWrapper: {
    width: '100%',
  },
  photoAttachment: {
    marginStart: moderateScale(40),
    marginTop: moderateScale(8),
    width: moderateScale(150),
    height: moderateScale(150),
  },
  attachmentIcon: {
    marginEnd: moderateScale(16),
  },
  nameIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoAttachmentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
