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
import { RenderAttachmentIcon } from '../../components/attachment/attachment'

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
  isMissingFieldsShowing,
}: CredentialListProps) => {
  return (
    <View style={styles.container}>
      {content.map((userData, index) => {
        if (
          (userData.data === '' || !userData.data) &&
          !isMissingFieldsShowing
        ) {
          return <View />
        }

        return (
          <View key={index} style={styles.wrapper}>
            <View style={styles.textWrapper}>
              {RenderAttachmentIcon(
                userData.label,
                userData.data,
                uid,
                remotePairwiseDID
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    paddingTop: moderateScale(12),
    borderBottomColor: colors.gray2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '90%',
    marginLeft: '5%',
    flexDirection: 'row',
    paddingBottom: moderateScale(12),
  },
  textWrapper: {
    width: '100%',
  },
})
