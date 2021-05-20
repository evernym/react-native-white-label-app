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
  StatusBar,
  TextInput,
} from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'

// constants
import {
  attributeValueRoute,
  customValuesRoute,
} from '../../common/route-constants'

// components
import { ModalButtons } from '../../components/buttons/modal-buttons'

// types
import type { ImageSource, ReactNavigation } from '../../common/type-common'

// styles
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { Avatar, UserAvatar } from '../../components'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { ALERT_ICON, CHECKMARK_ICON, EvaIcon } from '../../common/icons'
import { DataRenderer } from '../../components/attachment/data-renderer'
import { getFileExtensionName } from '../../components/attachment/helpers'
import {
  isSelected,
  keyExtractor,
  prepareCredentials,
} from './attributes-values'
import { ModalPushLeft } from '../utils/modal-animation'
import { ExpandableText } from '../../components/expandable-text/expandable-text'
import { BLANK_ATTRIBUTE_DATA_TEXT } from '../type-connection-details'
import { modalOptions } from '../utils/modalOptions'
import { CustomSelectAttributeValueModal } from '../../external-imports'

export const renderAvatarWithSource = (avatarSource: number | ImageSource) => {
  return <Avatar radius={18} src={avatarSource} />
}

const AttributeValues = ({
  navigation: { goBack, navigate },
  route: { params },
}: ReactNavigation) => {
  const [selectedValueIndex, setSelectedValueIndex] = useState(
    params.items.findIndex((item: Object) =>
      isSelected(item, params.attributesFilledFromCredential)
    )
  )
  const [data] = useState(prepareCredentials(params.items, params.claimMap))
  const [customValue, setCustomValue] = useState(params.customValue)

  const { key, self_attest_allowed } = params.items[0]

  const hideModal = useCallback(() => {
    goBack(null)
  }, [])

  const onDone = useCallback(() => {
    if (selectedValueIndex !== -1) {
      const selectedValue = params.items[selectedValueIndex]
      params.updateAttributesFilledFromCredentials(selectedValue)
    } else {
      params.onCustomValueSet(customValue, params?.label, key)
    }
    goBack(null)
  }, [selectedValueIndex])

  const onCustomValueChange = (value) => {
    setCustomValue(value)
    setSelectedValueIndex(-1)
  }

  const handleCustomValuesNavigation = () => {
    return navigate(customValuesRoute, {
      label: params.label,
      labelValue: customValue,
      key: key,
      onTextChange: onCustomValueChange,
    })
  }

  const renderItem = ({ item, index }: { item: Object, index: number }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedValueIndex(index)
        }}
      >
        <View style={styles.itemContainer}>
          <View style={styles.itemInnerContainer}>
            <View style={styles.avatarSection}>
              {typeof item.logoUrl === 'string' ? (
                <Avatar radius={18} src={{ uri: item.logoUrl }} />
              ) : (
                <DefaultLogo text={item.senderName} size={32} fontSize={17} />
              )}
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoSection}>
                {!item.data || item.data === '' ? (
                  <Text style={styles.contentGray}>
                    {BLANK_ATTRIBUTE_DATA_TEXT}
                  </Text>
                ) : (
                  <ExpandableText
                    style={styles.credentialNameText}
                    text={
                      item.label.toLowerCase().endsWith('_link')
                        ? `${getFileExtensionName(
                            JSON.parse(item.data)['mime-type']
                          )} file`
                        : item.data
                    }
                    lines={1}
                  />
                )}
              </View>
              <View style={styles.infoSection}>
                <View style={styles.attributesSection}>
                  <ExpandableText
                    style={styles.attributesText}
                    text={item.credentialName}
                    lines={1}
                  />
                </View>
              </View>
              {item.label.toLowerCase().endsWith('_link') && (
                <View style={styles.attachmentWrapper}>
                  <DataRenderer
                    {...{
                      label: item.label,
                      data: item.data,
                      uid: item.claimUuid || '',
                      remotePairwiseDID: item.claimUuid || '',
                    }}
                  />
                </View>
              )}
            </View>
          </View>
          {index === selectedValueIndex && (
            <View style={styles.iconWrapper}>
              <EvaIcon name={CHECKMARK_ICON} color={colors.black} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderHeader = () => (
    <>
      <StatusBar backgroundColor={colors.black} barStyle={'light-content'} />
      <View style={styles.descriptionWrapper}>
        <ExpandableText
          style={styles.labelText}
          text={params?.label || 'Attribute'}
        />
        <Text style={styles.descriptionTitle}>
          {params.items.length} sources
        </Text>
      </View>
      {self_attest_allowed && params.onTextChange && (
        <TouchableOpacity
          onPress={() => {
            handleCustomValuesNavigation()
          }}
        >
          <View style={styles.itemContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputAvatarSection}>
                <UserAvatar>{renderAvatarWithSource}</UserAvatar>
              </View>
              <View style={styles.infoSection}>
                <TextInput
                  style={styles.contentInput}
                  autoCorrect={false}
                  blurOnSubmit={true}
                  clearButtonMode="always"
                  numberOfLines={3}
                  multiline={true}
                  maxLength={200}
                  defaultValue={customValue || 'Default'}
                  placeholder={`Enter`}
                  returnKeyType="done"
                  accessible={true}
                  underlineColorAndroid="transparent"
                  editable={false}
                  pointerEvents="none"
                />
                <Text style={styles.attributesText}>Manual input value</Text>
              </View>
              {selectedValueIndex === -1 && (
                <View style={styles.iconWrapper}>
                  <EvaIcon name={CHECKMARK_ICON} color={colors.black} />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}
      {!self_attest_allowed && params.onTextChange && (
        <View style={[styles.itemContainer]}>
          <View style={styles.inputAvatarSection}>
            <EvaIcon name={ALERT_ICON} color={colors.red} />
          </View>
          <Text style={styles.descriptionTitle} numberOfLines={2}>
            Manual input is disabled for this attribute.
          </Text>
        </View>
      )}
    </>
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
  (CustomSelectAttributeValueModal && CustomSelectAttributeValueModal.screen) ||
  AttributeValues

const navigationOptions =
  (CustomSelectAttributeValueModal &&
    CustomSelectAttributeValueModal.navigationOptions) ||
  modalOptions('Select Attribute Values', 'Arrow', ModalPushLeft)

export const AttributeValuesScreen = {
  routeName: attributeValueRoute,
  screen,
}
AttributeValuesScreen.screen.navigationOptions = navigationOptions

const styles = StyleSheet.create({
  contentInput: {
    padding: 0,
    height: verticalScale(23),
    lineHeight: verticalScale(23),
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: '700',
    color: '#505050',
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
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
    flex: 1,
    flexWrap: 'wrap',
    color: colors.gray1,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '300',
    fontFamily: fontFamily,
    lineHeight: verticalScale(17),
  },
  labelText: {
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: '700',
    color: colors.gray1,
    fontFamily: fontFamily,
    marginVertical: verticalScale(6),
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
  inputContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    flexDirection: 'row',
  },
  itemContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray5,
    paddingVertical: moderateScale(12),
  },
  itemInnerContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'flex-end',
    marginTop: moderateScale(3),
    marginRight: moderateScale(10),
  },
  inputAvatarSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(3),
    marginRight: moderateScale(10),
    width: moderateScale(34),
  },
  infoSection: {
    flex: 1,
  },
  attributesSection: {
    width: '96%',
    height: '100%',
  },
  credentialNameText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: 'bold',
    color: colors.gray1,
  },
  attributesText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size6),
    color: colors.gray2,
  },
  iconWrapper: {
    marginTop: verticalScale(8),
  },
  attachmentWrapper: {
    marginTop: verticalScale(16),
  },
  contentGray: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '400',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
})
