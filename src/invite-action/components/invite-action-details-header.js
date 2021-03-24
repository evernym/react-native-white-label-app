// @flow
// packages
import React, { useMemo } from 'react'
import { Text, View, Image, StyleSheet } from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'

// styles
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { DefaultLogo } from '../../components/default-logo/default-logo'

// types
import type { InviteActionDetailsHeaderProps } from '../type-invite-action'

export const InviteActionDetailsHeader = ({
  institutionalName,
  imageUrl,
}: InviteActionDetailsHeaderProps) => {
  const source = useMemo(
    () => ({
      uri: imageUrl,
    }),
    [imageUrl]
  )

  return (
    <View style={styles.container}>
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
          style={styles.institutionalNameStyles}
        >
          {institutionalName}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '10%',
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
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(150 / 2),
  },
  bottomSection: {
    width: '100%',
    paddingTop: moderateScale(12),
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  institutionalNameStyles: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '900',
    color: colors.gray1,
    fontFamily: fontFamily,
    marginBottom: moderateScale(50),
    textAlign: 'center',
  },
  imageContainer: {
    borderRadius: moderateScale(150 / 2),
  },
})
