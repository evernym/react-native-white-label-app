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

import { RenderAttachmentIcon } from '../../components/attachment/attachment'
import { DataRenderer } from '../../components/attachment/data-renderer'
import { Avatar } from '../../components/avatar/avatar'
import { BLANK_ATTRIBUTE_DATA_TEXT } from '../type-connection-details'
import { flattenAsync } from '../../common/flatten-async'
import { Loader } from '../../components'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import SvgCustomIcon from '../../components/svg-custom-icon'
import { ModalHeader } from './modal-header'
import { ExpandableText } from '../../components/expandable-text/expandable-text'
import {
  checkCredentialForEmptyFields,
  showMissingField,
  showToggleMenu,
} from '../utils/checkForEmptyAttributes'
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
  const { hasEmpty, allEmpty } = useMemo(
    () => checkCredentialForEmptyFields(content),
    [content]
  )
  const [interactionDone, setInteractionDone] = useState(false)
  const [isMissingFieldsShowing, toggleMissingFields] = useState(
    showMissingField(hasEmpty, allEmpty)
  )
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
                {RenderAttachmentIcon(label, data, remotePairwiseDID, uid)}
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
  textAvatarWrapper: {
    width: '98.5%',
    flexDirection: 'row',
  },
  avatarWrapper: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
