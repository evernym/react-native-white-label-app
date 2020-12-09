// @flow

// packages
import React, { useCallback, useState } from 'react'
import { View, Platform, StyleSheet, TextInput, Text } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'

// constants
import { customValuesRoute } from '../../common/route-constants'

// components
import { ModalButtons } from '../../components/buttons/modal-buttons'
import { ModalHeaderBar } from '../../components/modal-header-bar/modal-header-bar'

// types
import type { ReactNavigation } from '../../common/type-common'

// styles
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'

const CustomValues = ({
  navigation: { goBack },
  route: { params },
}: ReactNavigation) => {
  const [value, setValue] = useState(params?.labelValue || '')

  const hideModal = useCallback(() => {
    goBack(null)
  }, [])

  const onDone = useCallback(() => {
    params.onTextChange(value, adjustedLabel, params.key)
    goBack(null)
  }, [value])

  const adjustedLabel = params.label.toLocaleLowerCase()

  return (
    <>
      <View style={styles.modalWrapper}>
        <View style={styles.descriptionWrapper}>
          <Text style={styles.descriptionTitle}>
            Please provide values for the following attributes
          </Text>
        </View>
        <Text style={styles.labelText}>{params?.label || 'Attribute'}</Text>
        <View style={styles.customValuesWrapper}>
          <TextInput
            onChangeText={setValue}
            placeholder="Please type..."
            placeholderTextColor={colors.cmGray2}
            defaultValue={params?.labelValue ? params?.labelValue : ''}
            style={styles.contentInput}
            keyboardType="default"
            returnKeyType="done"
            multiline={true}
            blurOnSubmit={true}
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

export const CustomValuesScreen = {
  routeName: customValuesRoute,
  screen: CustomValues,
}

CustomValuesScreen.screen.navigationOptions = ({
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
      headerTitle={isFocused() ? 'Custom Values' : ''}
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
    marginBottom: moderateScale(16),
    marginTop: moderateScale(16),
  },
  descriptionTitle: {
    color: colors.cmGray1,
    fontSize: verticalScale(fontSizes.size8),
    fontWeight: '300',
    marginBottom: moderateScale(16),
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  contentInput: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '400',
    color: colors.cmGray2,
    width: '100%',
    textAlign: 'left',
    paddingLeft: 10,
    fontFamily: fontFamily,
    borderTopColor: colors.cmGray3,
    borderTopWidth: 1,
    borderRightColor: colors.cmGray3,
    borderRightWidth: 1,
    borderBottomColor: colors.cmGray3,
    borderBottomWidth: 1,
    borderLeftColor: colors.cmGray3,
    borderLeftWidth: 1,
    borderRadius: 5,
  },
  modalWrapper: {
    flex: 1,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  labelText: {
    marginBottom: moderateScale(8),
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '700',
    color: colors.cmGray1,
    width: '100%',
    textAlign: 'left',
  },
})
