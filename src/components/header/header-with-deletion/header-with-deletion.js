// @flow
import React, { useCallback } from 'react'
import { Text, View, Image, TouchableOpacity, Platform } from 'react-native'
import {
  EvaIcon,
  ANDROID_BACK_ARROW_ICON,
  IOS_BACK_ARROW_ICON,
  MORE_ICON,
} from '../../../common/icons'
import { moderateScale } from 'react-native-size-matters'
import { DefaultLogo } from '../../../components/default-logo/default-logo'
import { styles } from '../type-header'
import ActionSheet from 'react-native-action-sheet'

type HeaderWithDeletionProps = {
  headline: string,
  navigation: any,
  onDelete: any,
  onDeleteButtonTitle: string,
  showImage?: boolean,
  image?: any,
}

const iOS = Platform.OS === 'ios'

export const HeaderWithDeletion = ({
                                     headline,
                                     showImage,
                                     image,
                                     onDelete,
                                     navigation,
                                     onDeleteButtonTitle,
                                   }: HeaderWithDeletionProps) => {
  const goBack = () => {
    navigation.goBack(null)
  }

  const openDialog = useCallback(() => {
    ActionSheet.showActionSheetWithOptions({
        options: [
          onDeleteButtonTitle || 'Delete',
          'Cancel',
        ],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        tintColor: 'blue',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          onDelete()
        }
      })
  })

  return (
    <>
      <View style={styles.container}>
        <View style={styles.iconSection}>
          <TouchableOpacity
            testID="back-arrow-touchable"
            onPress={goBack}
            accessible={true}
            accessibilityLabel="back-arrow"
          >
            <EvaIcon
              name={iOS ? IOS_BACK_ARROW_ICON : ANDROID_BACK_ARROW_ICON}
              width={moderateScale(32)}
              height={moderateScale(32)}
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.iconAndNameWrapper}>
          <View
            style={styles.headerImageOuterWrapper}
            accessible={true}
            accessibilityLabel="logo"
          >
            {
              showImage ?
                typeof image === 'string' ? (
                  <View style={styles.headerImageWrapper}>
                    <Image
                      style={styles.headerIcon}
                      source={{ uri: image }}
                      resizeMode={'cover'}
                    />
                  </View>
                ) : (
                  <DefaultLogo
                    text={headline[0]}
                    size={moderateScale(32)}
                    fontSize={17}
                  />
                ) :
                <></>
            }
          </View>
          <View
            style={styles.labelWithIconSection}
            accessible={true}
            accessibilityLabel={headline}
          >
            <Text style={[styles.label, { paddingRight: moderateScale(20) }]} numberOfLines={1} ellipsizeMode="tail">
              {headline}
            </Text>
          </View>
        </View>
        <View style={styles.buttonMoreOptionsWrapper}>
          <TouchableOpacity
            testID="three-dots"
            accessible={true}
            accessibilityLabel="three-dots"
            onPress={openDialog}
          >
            <EvaIcon
              name={MORE_ICON}
              width={moderateScale(32)}
              height={moderateScale(32)}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}
