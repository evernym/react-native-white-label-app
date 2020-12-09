// @flow

// packages
import React, { useCallback, useState } from 'react'
import {
  View,
  Platform,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'

// constants
import { attributesValueRoute } from '../../common/route-constants'

// components
import { ModalButtons } from '../../components/buttons/modal-buttons'
import { ModalHeaderBar } from '../../components/modal-header-bar/modal-header-bar'

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
import { renderAttachmentIcon } from './modal-content'

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
      <View>
        <TouchableOpacity onPress={() => setSelectedValueIndex(index)}>
          <View style={styles.itemContainer}>
            <View style={styles.itemInnerContainer}>
              <View style={styles.itemValuesContainer}>
                <View style={styles.avatarSection}>
                  {typeof item.logoUrl === 'string' ? (
                    <Avatar radius={18} src={{ uri: item.logoUrl }} />
                  ) : (
                    <DefaultLogo
                      text={item.senderName}
                      size={32}
                      fontSize={17}
                    />
                  )}
                </View>
                <View style={styles.infoSectionRow}>
                  <Text
                    style={styles.credentialsNameText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.credentialName}
                  </Text>
                </View>
              </View>
              <View style={styles.itemAttributesContainer}>
                {Object.keys(item.values).map((label, keyIndex) => (
                  <View key={`${index}_${keyIndex}`}>
                    {renderAttachmentIcon(
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
                <EvaIcon name={CHECKMARK_ICON} color={colors.cmBlack} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <>
      <View style={styles.modalWrapper}>
        <View style={styles.descriptionWrapper}>
          <Text style={styles.descriptionTitle}>
            {params?.sender} requires following attributes coming from the same
            credential:
          </Text>
          <Text style={styles.labelText}>{params?.label || 'Attribute'}</Text>
          <Text style={styles.descriptionTitle}>
            {params.items.length} sources
          </Text>
        </View>
        <View style={styles.customValuesWrapper}>
          <FlatList
            keyExtractor={keyExtractor}
            style={styles.container}
            data={data}
            renderItem={renderItem}
          />
        </View>
      </View>
      <ModalButtons
        onPress={onDone}
        onIgnore={hideModal}
        topBtnText="Cancel"
        bottomBtnText="Done"
        disableAccept={false}
        colorBackground={colors.cmGreen1}
        numberOfLines={3}
        multiline={true}
        maxLength={200}
      />
    </>
  )
}

export const AttributesValuesScreen = {
  routeName: attributesValueRoute,
  screen: AttributesValues,
}

AttributesValuesScreen.screen.navigationOptions = ({
  navigation: { goBack, isFocused },
}) => ({
  safeAreaInsets: { top: 85 },
  cardStyle: {
    marginLeft: '2.5%',
    marginRight: '2.5%',
    marginBottom: '4%',
    borderRadius: 10,
    backgroundColor: colors.cmWhite,
  },
  cardOverlay: () => (
    <ModalHeaderBar
      headerTitle={isFocused() ? 'Select Attributes Values' : ''}
      dismissIconType={isFocused() ? 'Arrow' : null}
      onPress={() => goBack(null)}
    />
  ),
})

const styles = StyleSheet.create({
  customValuesWrapper: {
    flex: 1,
  },
  descriptionWrapper: {
    ...Platform.select({
      ios: {
        borderBottomColor: colors.cmGray1,
        borderBottomWidth: 1,
      },
      android: {
        borderBottomColor: colors.cmGray1,
        borderBottomWidth: 1,
      },
    }),
    paddingVertical: moderateScale(16),
  },
  descriptionTitle: {
    color: colors.cmGray1,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '300',
    fontFamily: fontFamily,
    lineHeight: verticalScale(17),
  },
  modalWrapper: {
    flex: 1,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  labelText: {
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: '700',
    color: colors.cmGray1,
    fontFamily: fontFamily,
    marginVertical: verticalScale(6),
    lineHeight: verticalScale(20),
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
  },
  itemContainer: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.cmGray5,
    paddingVertical: moderateScale(12),
  },
  itemInnerContainer: {
    flex: 1,
    flexDirection: 'column',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  credentialsNameText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: 'bold',
    color: colors.cmGray1,
    lineHeight: verticalScale(17),
  },
  title: {
    fontSize: verticalScale(fontSizes.size6),
    color: colors.cmGray3,
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
