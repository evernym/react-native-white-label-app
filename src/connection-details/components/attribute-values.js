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
import { ModalHeaderBar } from '../../components/modal-header-bar/modal-header-bar'

// types
import type { ImageSource, ReactNavigation } from '../../common/type-common'

// styles
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { Avatar, UserAvatar } from '../../components'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { ALERT_ICON, CHECKMARK_ICON, EvaIcon } from '../../common/icons'
import { DataRenderer, getFileExtensionName } from './modal-content'
import {
  isSelected,
  keyExtractor,
  prepareCredentials,
} from './attributes-values'

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
  const [customValue, setCustomValue] = useState('Default')

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
      labelValue: params.labelValue,
      key: key,
      onTextChange: onCustomValueChange,
    })
  }

  const renderItem = ({ item, index }: { item: Object, index: number }) => {
    return (
      <View>
        <TouchableOpacity
          onPress={() => {
            setSelectedValueIndex(index)
          }}
        >
          <View style={styles.itemContainer}>
            <View style={styles.avatarSection}>
              {typeof item.logoUrl === 'string' ? (
                <Avatar radius={18} src={{ uri: item.logoUrl }} />
              ) : (
                <DefaultLogo text={item.senderName} size={32} fontSize={17} />
              )}
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoSectionTopRow}>
                <Text
                  style={styles.credentialNameText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.label.toLowerCase().endsWith('_link')
                    ? `${getFileExtensionName(
                        JSON.parse(item.data)['mime-type']
                      )} file`
                    : item.data}
                </Text>
              </View>
              <View style={styles.infoSectionBottomRow}>
                <View style={styles.attributesSection}>
                  <Text
                    style={styles.attributesText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.credentialName}
                  </Text>
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
        <StatusBar
          backgroundColor={colors.cmBlack}
          barStyle={'light-content'}
        />
        <View style={styles.descriptionWrapper}>
          <Text style={styles.labelText}>{params?.label || 'Attribute'}</Text>
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
                    defaultValue={customValue}
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
                    <EvaIcon name={CHECKMARK_ICON} color={colors.cmBlack} />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        {!self_attest_allowed && params.onTextChange && (
          <View style={[styles.itemContainer]}>
            <View style={styles.inputAvatarSection}>
              <EvaIcon name={ALERT_ICON} color={colors.cmRed} />
            </View>
            <Text style={styles.descriptionTitle}>
              Manual input is disabled for this attribute.
            </Text>
          </View>
        )}
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

export const AttributeValuesScreen = {
  routeName: attributeValueRoute,
  screen: AttributeValues,
}

AttributeValuesScreen.screen.navigationOptions = ({
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
      headerTitle={isFocused() ? 'Select Attribute Value' : ''}
      dismissIconType={isFocused() ? 'Arrow' : null}
      onPress={() => goBack(null)}
    />
  ),
})

const styles = StyleSheet.create({
  textInnerWrapper: {
    width: '90%',
  },
  wrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
  },
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
  inputContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
    flexDirection: 'row',
  },
  itemContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.cmGray5,
    paddingVertical: moderateScale(12),
  },
  avatarSection: {
    alignItems: 'flex-start',
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
  infoSectionTopRow: {
    flex: 1,
    flexDirection: 'row',
    height: verticalScale(20),
  },
  infoSectionBottomRow: {
    flex: 1,
    height: verticalScale(17),
  },
  attributesSection: {
    width: '96%',
    height: '100%',
  },
  credentialNameText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: 'bold',
    color: colors.cmGray1,
  },
  credentialNameWrapper: {
    paddingBottom: moderateScale(0),
  },
  attributesText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size6),
    color: colors.cmGray2,
  },
  content: {
    fontSize: verticalScale(fontSizes.size4),
    fontWeight: '700',
    color: '#505050',
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  iconWrapper: {
    marginTop: verticalScale(8),
  },
  attachmentWrapper: {
    marginTop: verticalScale(16),
  },
})
