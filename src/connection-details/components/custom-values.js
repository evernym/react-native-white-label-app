// @flow

// packages
import React, { useCallback, useState } from 'react'
import { View, Platform, StyleSheet, TextInput, Text } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'

// constants
import { customValuesRoute } from '../../common/route-constants'

// types
import type { ReactNavigation } from '../../common/type-common'

// styles
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'
import { ExpandableText } from '../../components/expandable-text/expandable-text'
import { modalOptions } from '../utils/modalOptions'
import {CustomEnterAttributeValueModal} from '../../external-imports'
import {ModalPushLeft} from "../utils/modal-animation";

const CustomValues = ({
                        navigation: { goBack },
                        route: { params },
                      }: ReactNavigation) => {
  const [value, setValue] = useState(params?.labelValue || '')

  const onDone = useCallback(() => {
    params.onTextChange(value, adjustedLabel, params.key)
    goBack(null)
  }, [value])

  const adjustedLabel = params.label.toLocaleLowerCase()

  return (
    <View style={styles.modalWrapper}>
      <View style={styles.descriptionWrapper}>
        <Text style={styles.descriptionTitle}>
          Please provide values for the following attributes
        </Text>
      </View>
      <ExpandableText style={styles.labelText} text={params?.label || 'Attribute'} />
      <View style={styles.customValuesWrapper}>
        <TextInput
          onChangeText={setValue}
          autoFocus
          placeholder="Please type..."
          placeholderTextColor={colors.gray2}
          defaultValue={params?.labelValue ? params?.labelValue : ''}
          style={styles.contentInput}
          keyboardType="default"
          returnKeyType="done"
          multiline={true}
          blurOnSubmit={true}
          testID="custom-value-input"
          accessible={true}
          accessibilityLabel="custom-value-input"
          onSubmitEditing={onDone}
        />
      </View>
    </View>
  )
}

const screen =
  CustomEnterAttributeValueModal && CustomEnterAttributeValueModal.screen ||
  CustomValues

const navigationOptions =
  CustomEnterAttributeValueModal && CustomEnterAttributeValueModal.navigationOptions ||
  modalOptions('Custom Values', 'CloseIcon', ModalPushLeft)

export const CustomValuesScreen = {
  routeName: customValuesRoute,
  screen,
}

CustomValuesScreen.screen.navigationOptions = navigationOptions

const styles = StyleSheet.create({
  customValuesWrapper: {
    flex: 1,
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
    marginBottom: moderateScale(16),
    marginTop: moderateScale(16),
  },
  descriptionTitle: {
    color: colors.gray1,
    fontSize: verticalScale(fontSizes.size8),
    fontWeight: '300',
    marginBottom: moderateScale(16),
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  contentInput: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '400',
    color: colors.gray2,
    width: '100%',
    textAlign: 'left',
    paddingLeft: 10,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: fontFamily,
    borderTopColor: colors.gray3,
    borderTopWidth: 1,
    borderRightColor: colors.gray3,
    borderRightWidth: 1,
    borderBottomColor: colors.gray3,
    borderBottomWidth: 1,
    borderLeftColor: colors.gray3,
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
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
  },
})
