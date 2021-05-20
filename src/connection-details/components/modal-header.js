// @flow

// packages
import React, { useMemo } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'

// styles
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'

// components
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { Avatar } from '../../components/avatar/avatar'
import { ExpandableText } from '../../components/expandable-text/expandable-text'
import ToggleFields from '../../components/toggle-fields/toggle-fields'
import { renderUserAvatar } from "../../components/user-avatar/user-avatar";

type ModalHeaderProps = {
  institutionalName: string,
  credentialName: string,
  credentialText: string,
  imageUrl: string,
  isMissingFieldsShowing?: boolean,
  toggleMissingFields?: (boolean) => void,
  showToggleMenu?: boolean,
}

export const ModalHeader = ({
                              institutionalName,
                              credentialName,
                              credentialText,
                              imageUrl,
                              isMissingFieldsShowing,
                              toggleMissingFields,
                              showToggleMenu,
                            }: ModalHeaderProps) => {
  const source = useMemo(() => ({ uri: imageUrl }), [imageUrl])

  return (
    <>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.issuerAndInfoSection}>
            <Text style={styles.infoText}>{credentialText}</Text>
            <ExpandableText
              text={institutionalName || 'Unknown'}
              style={styles.issuerNameText}
            />
          </View>
        </View>
        <View style={styles.imageContainer}>
          {source && source.uri ? (
            <Avatar
              radius={48}
              src={source}
              testID={`sender-avatar`}
            />
          ) :
            institutionalName ?
              <DefaultLogo
                text={institutionalName[0]}
                size={moderateScale(80)}
                fontSize={48}
              /> :
              renderUserAvatar()
          }
        </View>

        <View style={styles.bottomSection}>
          <ExpandableText
            text={credentialName}
            style={styles.credentialProofQuestionText}
          />
        </View>
      </View>
      {toggleMissingFields && showToggleMenu && isMissingFieldsShowing !== undefined && (
        <ToggleFields
          actionInfoText={[
            'Empty fields are hidden by default.',
            'Empty fields are being displayed.',
          ]}
          actionText={['Show', 'Hide']}
          useToggle={[isMissingFieldsShowing, toggleMissingFields]}
          showToggleMenu={showToggleMenu}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flexDirection: 'column',
    alignItems: 'center',
    paddingRight: '5%',
  },
  topSection: {
    flexDirection: 'row',
  },
  issuerAndInfoSection: {
    flex: 1,
    paddingTop: moderateScale(15),
    paddingBottom: moderateScale(16),
  },
  checkmarkSection: {
    height: '100%',
    width: moderateScale(64),
    alignItems: 'flex-end',
    paddingRight: moderateScale(16),
    paddingTop: moderateScale(16),
  },
  issuerNameText: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    color: colors.gray1,
    fontFamily: fontFamily,
    textAlign: 'center',
  },
  infoText: {
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.gray2,
    fontFamily: fontFamily,
    textAlign: 'center',
    paddingBottom: moderateScale(16),
  },
  image: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(96 / 2),
  },
  bottomSection: {
    width: '100%',
    borderBottomColor: colors.gray1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: moderateScale(24),
    justifyContent: 'center',
    marginBottom: moderateScale(12),
    paddingBottom: moderateScale(12),
  },
  credentialProofQuestionText: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '400',
    color: colors.gray1,
    fontFamily: fontFamily,
    textAlign: 'center',
  },
  imageContainer: {
    borderRadius: moderateScale(96 / 2),
  },
})
