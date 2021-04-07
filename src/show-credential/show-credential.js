// @flow
import React, { useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Alert,
  View,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { showCredentialRoute } from '../common/route-constants'
import type { ReactNavigation } from '../common/type-common'
import { colors, fontSizes, fontFamily } from '../common/styles/constant'
import QRCode from 'react-native-qrcode-svg'
import { ExpandableText } from '../components/expandable-text/expandable-text'
import { modalOptions } from '../connection-details/utils/modalOptions'
import { Button } from '../components/buttons/button'
import {
  getIsCredentialSent,
  getShowCredentialData,
  getShowCredentialError,
} from '../store/store-selector'
import { Loader } from '../components'
import { showCredential, credentialPresentationSent } from './type-show-credential'

const { width } = Dimensions.get('screen')

export const ShowCredential = ({
                          navigation: { goBack },
                          route: { params },
                        }: ReactNavigation) => {
  const dispatch = useDispatch()

  const data = useSelector(getShowCredentialData)
  const error = useSelector(getShowCredentialError)
  const isSent = useSelector(getIsCredentialSent)

  useEffect(() => {
    dispatch(showCredential(params.claimOfferUuid))
  }, [dispatch])

  useEffect(() => {
    if (isSent) {
      goBack(null)
    }
  }, [isSent])

  const onDone = useCallback(() => {
    goBack(null)
    dispatch(credentialPresentationSent())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      Alert.alert(
        'Cannot show credential',
        error,
      )
    }
  }, [error])

  const attributesLabel = useMemo(() => {
    const countAttributes = params.attributes.length
    const countAttachments = params.attributes.filter(attribute => attribute.label.endsWith('_link'))

    return countAttachments > 0 ?
      `${countAttributes} attributes, ${countAttachments} attachments`:
      `${countAttributes} attributes`
  }, [params])

  return !data ?
    <Loader/> :
    <>
      <View style={styles.modalWrapper}>
        <ExpandableText
          style={styles.titleText}
          text={params.credentialName}
        />
        <View style={styles.qrCodeWrapper}>
          <QRCode value={data} size={moderateScale(width * 0.8)}/>
        </View>
        <Text style={styles.text}>
          Present this QR code to a verifier for scanning
        </Text>
        <Text style={styles.text}>
          {attributesLabel}
        </Text>
        <Button onPress={onDone} label="Done"/>
      </View>
    </>
}

export const ShowCredentialScreen = {
  routeName: showCredentialRoute,
  screen: ShowCredential,
}

ShowCredentialScreen.screen.navigationOptions = modalOptions('Show Credential', 'CloseIcon')

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  titleText: {
    marginTop: verticalScale(24),
    marginHorizontal: moderateScale(8),
    fontSize: verticalScale(fontSizes.size1),
    color: colors.gray1,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(24),
  },
  text: {
    marginBottom: verticalScale(18),
    fontSize: verticalScale(fontSizes.size5),
    color: colors.gray2,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
})
