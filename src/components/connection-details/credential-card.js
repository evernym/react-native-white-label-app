// @flow
import React, { useCallback } from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { proofRequestRoute, claimOfferRoute } from '../../common'
import { moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { ExpandableText } from '../expandable-text/expandable-text'
import type { ReactNavigation } from '../../common/type-common'
import { connect } from 'react-redux'

type CredentialCardProps = {
  messageDate: string,
  messageTitle: string,
  messageContent: string,
  uid?: string,
  proof?: boolean,
  showButtons?: boolean,
  colorBackground?: string,
} & ReactNavigation

const CredentialCardComponent = ({
                                   messageDate,
                                   messageTitle,
                                   messageContent,
                                   showButtons,
                                   uid,
                                   proof,
                                   colorBackground,
                                   navigation,
                                 }: CredentialCardProps) => {
  const updateAndShowModal = useCallback(() => {
    const route = proof ? proofRequestRoute : claimOfferRoute
    navigation.navigate(route, { uid })
  }, [proof, uid])

  return (
    <View style={styles.container}>
      <Text style={styles.messageDate}>{messageDate}</Text>
      <ExpandableText text={messageTitle} style={styles.messageTitle} lines={1}/>
      <ExpandableText text={messageContent} style={styles.messageContent} lines={1}/>
      <View
        style={[
          styles.buttonsWrapper,
          { display: showButtons ? 'flex' : 'none' },
        ]}
      >
        <TouchableOpacity
          onPress={updateAndShowModal}
          style={[
            styles.buttonView,
            { backgroundColor: colorBackground },
          ]}
        >
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.helperView}/>
    </View>
  )
}

export const CredentialCard = connect()(CredentialCardComponent)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingLeft: '7%',
    paddingRight: '7%',
    paddingTop: moderateScale(15),
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  messageDate: {
    color: colors.gray2,
    fontSize: moderateScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  messageTitle: {
    color: colors.gray1,
    fontWeight: '500',
    fontSize: moderateScale(fontSizes.size5),
    textAlign: 'left',
    marginTop: moderateScale(2),
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
  },
  messageContent: {
    color: colors.gray1,
    fontSize: moderateScale(fontSizes.size7),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  buttonsWrapper: {
    flexDirection: 'row',
    width: '100%',
    marginTop: moderateScale(15),
  },
  buttonView: {
    padding: moderateScale(6),
    paddingLeft: moderateScale(26),
    paddingRight: moderateScale(26),
    borderRadius: 5,
  },
  viewText: {
    color: colors.white,
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  helperView: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray5,
    width: '100%',
    paddingTop: moderateScale(15),
  },
})
