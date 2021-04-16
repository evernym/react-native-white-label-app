// @flow
import React from 'react'
import { View, StyleSheet } from 'react-native'

import { moderateScale } from 'react-native-size-matters'
import { colors } from '../../common/styles/constant'
import { RenderAttachmentIcon } from '../../components/attachment/attachment'

import type { CredentialListProps } from './type-credential-list'

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
