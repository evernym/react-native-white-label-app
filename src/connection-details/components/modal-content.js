// @flow
import React, { useMemo, useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, InteractionManager } from 'react-native'

import { RenderAttachmentIcon } from '../../components/attachment/attachment'
import { Avatar } from '../../components/avatar/avatar'
import { Loader } from '../../components'
import { colors } from '../../common/styles/constant'
import { ModalHeader } from './modal-header'
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
            return <View key={uuid()} />
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
