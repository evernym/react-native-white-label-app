// @flow
import React, { useMemo } from 'react'
import { Text, View, Image, StyleSheet } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { DefaultLogo } from '../../components/default-logo/default-logo'

type ModalHeaderProps = {
  institutionalName: string,
  credentialName: string,
  credentialText: string,
  imageUrl: string,
}

export const ModalHeader = ({
  institutionalName,
  credentialName,
  credentialText,
  imageUrl,
}: ModalHeaderProps) => {
  const source = useMemo(() => ({ uri: imageUrl }), [imageUrl])

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.issuerAndInfoSection}>
          <Text style={styles.infoText}>{credentialText}</Text>
          <Text style={styles.issuerNameText}>{institutionalName}</Text>
        </View>
      </View>
      <View style={styles.imageContainer}>
        {source && source.uri ? (
          <Image style={styles.image} source={source} resizeMode="cover" />
        ) : (
          <DefaultLogo
            text={institutionalName[0]}
            size={moderateScale(80)}
            fontSize={48}
          />
        )}
      </View>

      <View style={styles.bottomSection}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.credentialProofQuestionText}
        >
          {credentialName}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cmWhite,
    flexDirection: 'column',
    alignItems: 'center',
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
    color: colors.cmGray1,
    fontFamily: fontFamily,
    textAlign: 'center',
  },
  infoText: {
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.cmGray2,
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
    borderBottomColor: colors.cmGray1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: moderateScale(24),
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  credentialProofQuestionText: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '400',
    color: colors.cmGray1,
    fontFamily: fontFamily,
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  imageContainer: {
    borderRadius: moderateScale(96 / 2),
  },
})
