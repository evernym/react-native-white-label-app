// @flow
import React, { useMemo, useCallback, useState, useEffect } from 'react'
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  InteractionManager,
  Platform,
} from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'
import FileViewer from 'react-native-file-viewer'

import { Avatar } from '../../components/avatar/avatar'
import { BLANK_ATTRIBUTE_DATA_TEXT } from '../type-connection-details'
import { flattenAsync } from '../../common/flatten-async'
import { Loader } from '../../components'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import SvgCustomIcon from '../../components/svg-custom-icon'
import { ModalHeader } from './modal-header'
import { ExpandableText } from '../../components/expandable-text/expandable-text'
import { checkCredentialForEmptyFields, showMissingField, showToggleMenu } from '../utils/checkForEmptyAttributes'
import { uuid } from '../../services/uuid'

type ModalContentProps = {
  uid: string,
  remotePairwiseDID: string,
  content: Array<{
    label: string,
    data?: string,
  }>,
  showSidePicture?: boolean,
  imageUrl?: string,
  institutionalName: string,
  credentialName: string,
  credentialText: string,
}

export const getFileExtensionName = (mimeType: string) => {
  switch (true) {
    case docMimeTypes.includes(mimeType):
      return 'docx'
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
      return 'PDF'
    default:
      return 'unknown'
  }
}

export const renderAttachmentIcon = (
  label: string,
  data: any,
  remotePairwiseDID: string,
  uid: string,
  titleStyles?: any,
  contentStyles?: any
) => {
  let attachment: $PropertyType<AttachmentPropType, 'attachment'> | null = null

  if (label.toLowerCase().endsWith('_link')) {
    try {
      attachment = JSON.parse(data)

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
            style={[styles.title, titleStyles]} />
          <Text style={styles.extensionNameStyle}>
            {`${getFileExtensionName(attachment['mime-type'])} file`}
          </Text>
          <DataRenderer {...{ label, data, uid, remotePairwiseDID }} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.textWrapper}>
      <ExpandableText
        text={label}
        style={[styles.title, titleStyles]} />
      <DataRenderer
        {...{ label, data, uid, remotePairwiseDID, contentStyles }}
      />
    </View>
  )
}

const checkObjectTypes = (attachment) =>
  !attachment['mime-type'] ||
  !attachment.data ||
  !attachment.data.base64 ||
  !attachment.extension ||
  !attachment.name
    ? true
    : false

export const ModalContent = ({
  uid,
  remotePairwiseDID,
  content,
  imageUrl,
  showSidePicture = false,
  institutionalName,
  credentialName,
  credentialText,
}: ModalContentProps) => {
  const source = useMemo(
    () => ({
      uri: imageUrl,
    }),
    [imageUrl]
  )
  const { hasEmpty, allEmpty } = useMemo(() => checkCredentialForEmptyFields(content), [content])
  const [interactionDone, setInteractionDone] = useState(false)
  const [isMissingFieldsShowing, toggleMissingFields] = useState(showMissingField(hasEmpty, allEmpty))
  const isToggleMenuShowing = showToggleMenu(hasEmpty, allEmpty)

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => setInteractionDone(true))
  }, [])

  if (!interactionDone) {
    return <Loader />
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewWrapper}
      >
        <ModalHeader
          {...{
            institutionalName,
            credentialName,
            credentialText,
            imageUrl,
            isMissingFieldsShowing,
            toggleMissingFields,
            showToggleMenu: isToggleMenuShowing,

          }}
        />
        {content.map(({ label, data }) => {
          if ((data === '' || !data) && !isMissingFieldsShowing) {
            return <View />
          }
          return (
            <>
              <View key={uuid()} style={styles.textAvatarWrapper}>
                {renderAttachmentIcon(label, data, remotePairwiseDID, uid)}
                {showSidePicture && (
                  <View style={styles.avatarWrapper}>
                    <Avatar radius={16} src={source} />
                  </View>
                )}
              </View>
            </>
          )
        })}
      </ScrollView>
    </View>
  )
}

export function DataRenderer(props: {
  label: string,
  data: ?string,
  uid: string,
  remotePairwiseDID: string,
  contentStyles?: any,
}) {
  const { label, data, uid, remotePairwiseDID, contentStyles } = props

  if (!data || data === '') {
    return (
      // Replace empty data string with (none) in lighter gray
      <Text style={[styles.contentGray, contentStyles]}>{BLANK_ATTRIBUTE_DATA_TEXT}</Text>
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
  return <ExpandableText
    text={data}
    style={[styles.content, contentStyles]}/>
}

function PhotoAttachment(props: { base64: string }) {
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

function Attachment(props: AttachmentPropType) {
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

function getIcon(mimeType: string) {
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

// MIME-TYPES for different file types
const photoMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
// TODO:KS these file types can be dangerous for a user to open on their device
// what should we do to mitigate risk?
const docMimeTypes = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'application/vnd.ms-word.document.macroEnabled.12',
  'application/vnd.ms-word.template.macroEnabled.12',
]
const excelMimeTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.template.macroEnabled.12',
  'application/vnd.ms-excel.addin.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
]
const pptMimeTypes = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.template',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  'application/vnd.ms-powerpoint.addin.macroEnabled.12',
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  'application/vnd.ms-powerpoint.template.macroEnabled.12',
  'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
]
const pdfMimeTypes = ['application/pdf']
const audioVideoMimeType = ['audio/mp4', 'audio/mpeg', 'audio/mp3', 'video/mp4']

type AttachmentPropType = {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollViewWrapper: {
    backgroundColor: colors.white,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  wrapper: {
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
  title: {
    fontSize: verticalScale(fontSizes.size6),
    color: colors.gray3,
    width: '100%',
    textAlign: 'left',
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
    lineHeight: verticalScale(17),
  },
  content: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '700',
    color: '#505050',
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    lineHeight: verticalScale(23),
  },
  contentGray: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  textAvatarWrapper: {
    width: '98.5%',
    flexDirection: 'row',
  },
  textWrapper: {
    width: '90%',
    paddingBottom: moderateScale(10),
  },
  avatarWrapper: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAttachment: {
    width: moderateScale(150),
    height: moderateScale(150),
  },
  attachmentIcon: {
    width: moderateScale(64),
    height: moderateScale(64),
  },
  nameIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentNameContainer: {
    flex: 1,
    marginLeft: moderateScale(10),
  },
  parentWrapper: {
    flexDirection: 'row',
  },
  svgStyles: {
    marginRight: moderateScale(16),
  },
  extensionNameStyle: {
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '600',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
})
