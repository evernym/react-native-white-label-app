// @flow

// packages
import React, { useCallback, useState } from 'react'
import {
  View,
  Platform,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'

// constants
import { attributesValueRoute } from '../../common/route-constants'

// components
import { ModalButtons } from '../../components/buttons/modal-buttons'

// types
import type {
  ReactNavigation,
  RequestedAttrsJson,
} from '../../common/type-common'

// styles
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { Avatar } from '../../components'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { CHECKMARK_ICON, EvaIcon } from '../../common/icons'
import { RenderAttachmentIcon } from '../../components/attachment/attachment'
import { ModalPushLeft } from '../utils/modal-animation'
import { ExpandableText } from '../../components/expandable-text/expandable-text'
import { modalOptions } from '../utils/modalOptions'
import { CustomSelectAttributesValuesModal } from '../../external-imports'

export const keyExtractor = (item: Object) => item.claimUuid.toString()

export const isSelected = (item: Object, selectedClaims: RequestedAttrsJson) =>
  selectedClaims[item.key] && item.claimUuid === selectedClaims[item.key][0]

export const prepareCredentials = (items: any, claimMap: any) => {
  return items.map((item) => {
    const claimInfo = claimMap[item.claimUuid]
    return {
      label: item.label,
      claimUuid: item.claimUuid,
      credentialName: claimInfo.name || 'Default Credential',
      senderName: claimInfo.senderName,
      date: claimInfo.issueDate,
      data: item.data,
      values: item.values,
      logoUrl: claimInfo.logoUrl,
      cred_info: item.cred_info,
      key: item.key,
      self_attest_allowed: item.self_attest_allowed,
    }
  })
}

const AttributesValues = ({
  navigation: { goBack },
  route: { params },
}: ReactNavigation) => {
  const [selectedValueIndex, setSelectedValueIndex] = useState(
    params.items.findIndex((item: Object) =>
      isSelected(item, params.attributesFilledFromCredential)
    )
  )
  const [data] = useState(prepareCredentials(params.items, params.claimMap))

  const hideModal = useCallback(() => {
    goBack(null)
  }, [])

  const onDone = useCallback(() => {
    const selectedValue = params.items[selectedValueIndex]
    params.updateAttributesFilledFromCredentials(selectedValue)
    goBack(null)
  }, [selectedValueIndex])

  const renderItem = ({ item, index }: { item: Object, index: number }) => {
    return (
      <TouchableOpacity
        onPress={() => setSelectedValueIndex(index)}
        style={styles.itemContainer}
      >
        <View style={styles.itemInnerContainer}>
          <View style={styles.itemValuesContainer}>
            <View style={styles.avatarSection}>
              {typeof item.logoUrl === 'string' ? (
                <Avatar radius={18} src={{ uri: item.logoUrl }} />
              ) : (
                <DefaultLogo text={item.senderName} size={32} fontSize={17} />
              )}
            </View>
            <View style={styles.infoSectionRow}>
              <ExpandableText
                style={styles.credentialsNameText}
                lines={1}
                text={item.credentialName}
              />
            </View>
          </View>
          <View style={styles.itemAttributesContainer}>
            {Object.keys(item.values).map((label, keyIndex) => (
              <View key={`${index}_${keyIndex}`}>
                {RenderAttachmentIcon(
                  label,
                  item.values[label],
                  item.claimUuid || '',
                  item.claimUuid || '',
                  styles.title,
                  styles.content
                )}
              </View>
            ))}
          </View>
        </View>
        {index === selectedValueIndex && (
          <View style={styles.iconWrapper}>
            <EvaIcon name={CHECKMARK_ICON} color={colors.black} />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderHeader = () => (
    <View style={styles.descriptionWrapper}>
      <ExpandableText
        style={styles.descriptionTitle}
        text={
          params?.sender +
          ' requires these attributes to come from the same credential:'
        }
      />
    </View>
  )

  return (
    <>
      <FlatList
        keyExtractor={keyExtractor}
        style={styles.container}
        data={data}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
      />
      <ModalButtons
        onPress={onDone}
        onIgnore={hideModal}
        denyButtonText="Cancel"
        acceptBtnText="Done"
        disableAccept={false}
        colorBackground={colors.main}
        numberOfLines={3}
        multiline={true}
        maxLength={200}
      />
    </>
  )
}

const screen =
  (CustomSelectAttributesValuesModal &&
    CustomSelectAttributesValuesModal.screen) ||
  AttributesValues

const navigationOptions =
  (CustomSelectAttributesValuesModal &&
    CustomSelectAttributesValuesModal.navigationOptions) ||
  modalOptions('Select Attributes Values', 'Arrow', ModalPushLeft)

export const AttributesValuesScreen = {
  routeName: attributesValueRoute,
  screen,
}

AttributesValuesScreen.screen.navigationOptions = navigationOptions

const styles = StyleSheet.create({
  descriptionWrapper: {
    ...Platform.select({
      ios: {
        borderBottomColor: colors.gray1,
        borderBottomWidth: 1,
      },
      android: {
        borderBottomColor: colors.gray1,
        borderBottomWidth: 1,
      },
    }),
    paddingVertical: moderateScale(16),
  },
  descriptionTitle: {
    color: colors.gray1,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '300',
    fontFamily: fontFamily,
    marginTop: verticalScale(6),
    lineHeight: verticalScale(17),
  },
  labelText: {
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: '700',
    color: colors.gray1,
    fontFamily: fontFamily,
    marginTop: verticalScale(6),
    lineHeight: verticalScale(20),
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    flex: 1,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  itemContainer: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray5,
    paddingVertical: moderateScale(12),
  },
  itemInnerContainer: {
    flexDirection: 'column',
    width: '90%',
  },
  itemValuesContainer: {
    width: '100%',
    flexDirection: 'row',
  },
  itemAttributesContainer: {
    width: '100%',
    flexDirection: 'column',
    paddingTop: verticalScale(10),
    paddingLeft: moderateScale(10),
  },
  avatarSection: {
    alignItems: 'flex-start',
    marginRight: moderateScale(10),
  },
  infoSectionRow: {
    flex: 1,
  },
  credentialsNameText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: 'bold',
    color: colors.gray1,
    lineHeight: verticalScale(17),
  },
  title: {
    fontSize: verticalScale(fontSizes.size6),
    color: colors.gray3,
    width: '100%',
    textAlign: 'left',
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
  iconWrapper: {
    marginTop: verticalScale(8),
  },
})
