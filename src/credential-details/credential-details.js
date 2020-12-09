//@flow
import React from 'react'
import { Text, View, ScrollView, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontFamily, fontSizes } from '../common/styles/constant'
import { credentialDetailsRoute } from '../common/route-constants'
import type { CredentialDetailsProps } from './type-credential-details'
import { Avatar } from '../components/avatar/avatar'
import { DefaultLogo } from '../components/default-logo/default-logo'
import { CredentialList } from './credential-list/credential-list'
import { Header } from '../components'

const CredentialDetails = (props: CredentialDetailsProps) => {
  const {
    credentialName,
    issuerName,
    attributes,
    logoUrl,
    remoteDid,
    uid,
    date,
  } = props.route.params

  const data = attributes.map((attribute) => ({
    label: attribute.label,
    data: attribute.data,
  }))

  return (
    <View style={styles.container}>
      <Header
        headline="Credential Details"
        navigation={props.navigation}
        route={props.route}
      />
      <ScrollView>
        <View style={styles.headerWrapper}>
          <Text style={styles.headerSubText}>
            {date ? 'Issued by' : 'Offered by'}
          </Text>
          <Text
            style={styles.headerText}
            ellipsizeMode="tail"
            numberOfLines={2}
          >
            {issuerName}
          </Text>

          <View style={styles.avatarSection}>
            {typeof logoUrl === 'string' ? (
              <Avatar
                radius={48}
                src={{ uri: logoUrl }}
                testID={`${credentialName}-avatar`}
              />
            ) : (
              <DefaultLogo text={issuerName} size={96} fontSize={48} />
            )}
          </View>
          <View style={styles.contentWrapper}>
            <Text
              style={styles.contentText}
              ellipsizeMode="tail"
              numberOfLines={2}
            >
              {credentialName}
            </Text>
          </View>
        </View>
        <View style={styles.listContainer}>
          <CredentialList
            content={data}
            uid={uid}
            remotePairwiseDID={remoteDid}
          />
        </View>
      </ScrollView>
    </View>
  )
}

export const credentialDetailsScreen = {
  routeName: credentialDetailsRoute,
  screen: connect()(CredentialDetails),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cmWhite,
  },
  headerWrapper: {
    marginStart: moderateScale(8),
    marginEnd: moderateScale(8),
    borderBottomColor: colors.cmGray1,
    borderBottomWidth: verticalScale(1),
  },
  headerSubText: {
    marginTop: verticalScale(16),
    fontSize: verticalScale(fontSizes.size5),
    color: colors.cmGray2,
    width: '100%',
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  headerText: {
    marginTop: verticalScale(16),
    marginStart: moderateScale(8),
    marginEnd: moderateScale(8),
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: 'bold',
    color: colors.cmGray1,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  contentWrapper: {
    width: '100%',
  },
  contentText: {
    marginTop: verticalScale(24),
    marginBottom: verticalScale(8),
    marginStart: moderateScale(8),
    marginEnd: moderateScale(8),
    fontSize: verticalScale(fontSizes.size2),
    color: colors.cmGray1,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  avatarSection: {
    width: '100%',
    height: 96,
    marginTop: verticalScale(16),
    alignItems: 'center',
  },
  listContainer: {
    width: '100%',
    marginTop: verticalScale(4),
  },
})
