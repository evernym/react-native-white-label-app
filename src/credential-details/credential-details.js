//@flow
import React, { useMemo, useEffect, useState } from 'react'
import { Text, View, ScrollView, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontFamily, fontSizes } from '../common/styles/constant'
import { credentialDetailsRoute, showCredentialRoute } from '../common/route-constants'
import type { CredentialDetailsProps } from './type-credential-details'
import { Avatar } from '../components/avatar/avatar'
import { DefaultLogo } from '../components/default-logo/default-logo'
import { CredentialList } from './credential-list/credential-list'
import { HeaderWithDeletion, Loader } from '../components'
import { ExpandableText } from '../components/expandable-text/expandable-text'
import { bindActionCreators } from 'redux'
import { deleteClaim } from '../claim/claim-store'
import { InteractionManager } from 'react-native'
import { ViewPushLeft } from '../connection-details/utils/modal-animation'
import { CustomCredentialDetailsScreen, showCredential } from '../external-imports'
import ToggleFields from '../components/toggle-fields/toggle-fields'
import {
  checkCredentialForEmptyFields,
  showMissingField,
  showToggleMenu,
} from '../connection-details/utils/checkForEmptyAttributes'
import { Button } from '../components/buttons/button'
import { GRID_ICON } from '../common/icons'

const CredentialDetails = (props: CredentialDetailsProps) => {
  const {
    credentialName,
    issuerName,
    attributes,
    logoUrl,
    remoteDid,
    uid,
    date,
    claimOfferUuid,
  } = props.route.params

  const [loading, setLoading] = useState(true)

  const { data, hasEmpty, allEmpty } = useMemo(() => {
    const data = attributes.map((attribute) => ({
      label: attribute.label,
      data: attribute.data,
    }))

    const { hasEmpty, allEmpty } = checkCredentialForEmptyFields(data)

    return {
      data,
      hasEmpty,
      allEmpty,
    }
  }, [attributes])

  const [isMissingFieldsShowing, toggleMissingFields] = useState(
    showMissingField(hasEmpty, allEmpty)
  )
  const isToggleMenuShowing = showToggleMenu(hasEmpty, allEmpty)

  const onDelete = () => {
    props.deleteClaim(claimOfferUuid)
    props.navigation.goBack(null)
  }

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setLoading(false)
    })
  }, [])

  const show = async () => {
    props.navigation.navigate(showCredentialRoute, {
      credentialName,
      attributes: data,
      claimOfferUuid: claimOfferUuid,
    })
  }

  return (
    <View style={styles.container}>
      <HeaderWithDeletion
        headline="Credential Details"
        navigation={props.navigation}
        onDeleteButtonTitle={'Delete Credential'}
        onDelete={onDelete}
        route={props.route}
      />
      {loading ? (
        <Loader/>
      ) : (
        <>
          <ScrollView>
            <View style={styles.headerWrapper}>
              <Text style={styles.headerSubText}>
                {date ? 'Issued by' : 'Offered by'}
              </Text>
              <ExpandableText style={styles.headerText} text={issuerName}/>
              <View style={styles.avatarSection}>
                {typeof logoUrl === 'string' ? (
                  <Avatar
                    radius={48}
                    src={{ uri: logoUrl }}
                    testID={`sender-avatar`}
                  />
                ) : (
                  <DefaultLogo text={issuerName} size={96} fontSize={48}/>
                )}
              </View>
              <View style={styles.contentWrapper}>
                <ExpandableText
                  style={styles.contentText}
                  text={credentialName}
                />
              </View>
            </View>
            {toggleMissingFields && showToggleMenu && (
              <ToggleFields
                actionInfoText={[
                  'Empty fields are hidden by default.',
                  'Empty fields are being displayed.',
                ]}
                actionText={['Show', 'Hide']}
                useToggle={[isMissingFieldsShowing, toggleMissingFields]}
                showToggleMenu={isToggleMenuShowing}
              />
            )}
            <View style={styles.listContainer}>
              <CredentialList
                content={data}
                uid={uid}
                remotePairwiseDID={remoteDid}
                isMissingFieldsShowing={isMissingFieldsShowing}
              />
            </View>
          </ScrollView>
          {showCredential &&
          <Button
            onPress={show}
            label="Show"
            evaIcon={GRID_ICON}
          />
          }
        </>
      )}
    </View>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ deleteClaim }, dispatch)

const screen = CustomCredentialDetailsScreen || CredentialDetails

export const credentialDetailsScreen = {
  routeName: credentialDetailsRoute,
  screen: connect(null, mapDispatchToProps)(screen),
}

credentialDetailsScreen.screen.navigationOptions = () => ViewPushLeft
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerWrapper: {
    marginStart: moderateScale(8),
    marginEnd: moderateScale(8),
    borderBottomColor: colors.gray1,
    borderBottomWidth: verticalScale(1),
  },
  headerSubText: {
    marginTop: verticalScale(16),
    fontSize: verticalScale(fontSizes.size5),
    color: colors.gray2,
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
    color: colors.gray1,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  contentWrapper: {
    width: '100%',
    marginTop: verticalScale(24),
    marginBottom: verticalScale(12),
  },
  contentText: {
    marginStart: moderateScale(8),
    marginEnd: moderateScale(8),
    fontSize: verticalScale(fontSizes.size2),
    color: colors.gray1,
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
