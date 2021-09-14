// @flow

import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Image,
  DeviceEventEmitter,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation, useIsFocused } from '@react-navigation/native'
import CountryPicker from 'react-native-country-picker-modal'
import { moderateScale, verticalScale } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/FontAwesome'

import { RadioButton } from './components/radio-button'
import type { Store } from '../store/type-store'
import type {
  PhysicalIdProcessStatus,
  PhysicalIdConnectionStatus,
} from './physical-id-type'

import { Container, CustomView, Loader } from '../components'
import {
  getSupportedDocuments,
  launchPhysicalIdSDK,
  resetPhysicalIdStatues,
  selectDocumentTypes,
  selectDocumentTypesIsLoading,
  stopPhysicalId,
} from './physical-id-store'
import { white, colors, fontFamily, fontSizes } from '../common/styles'
import {
  physicalIdProcessStatus,
  physicalIdConnectionStatus,
} from './physical-id-type'
import { physicalIdRoute } from '../common/route-constants'
import {
  homeDrawerRoute,
  homeRoute,
  physicalIdSuccessRoute,
  pushNotificationPermissionRoute,
} from '../common'
import { ModalButtons } from '../components/buttons/modal-buttons'
import { getPushNotificationAuthorizationStatus } from '../push-notification/components/push-notification-permission-screen'
import { usePushNotifications } from '../external-imports'

// import { physicalIdHeadline } from '../external-imports'

const documentVerificationImage = require('../images/physicalId.png')

function PhysicalId() {
  const {
    status: processStatus,
    physicalIdConnectionStatus: connectionStatus,
  } = useSelector((state: Store) => state.physicalId)
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const [country, setCountry] = useState()
  const [document, setDocument] = useState()
  const testID = 'physicalId'
  const [loaderText, setLoaderText] = useState(LOADER_TEXT.preparation)
  const [countryPickerVisible, setCountryPickerVisible] = useState(false)
  const focus = useIsFocused()
  const actedOnPushPermission = useRef()

  const resetState = () => {
    setCountry()
    setDocument()
    setCountryPickerVisible(false)
    setLoaderText(LOADER_TEXT.preparation)
  }

  const resetProcess = () => {
    resetState()
    dispatch(stopPhysicalId())
  }

  useEffect(() => {
    if (processStatus !== physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_START) {
      resetProcess()
    }
  }, [focus])

  useEffect(() => {
    if (Platform.OS === 'android') {
      DeviceEventEmitter.addListener('FACE_SCAN', () => {
        setLoaderText(LOADER_TEXT.finish)
      })
    }
    return () => {
      if (Platform.OS === 'android') {
        DeviceEventEmitter.removeAllListeners()
      }
    }
  }, [])

  const onAction = async () => {
    const isAuthorized = await getPushNotificationAuthorizationStatus()
    if (
      Platform.OS === 'ios' &&
      usePushNotifications &&
      !isAuthorized &&
      !actedOnPushPermission.current
    ) {
      navigation.navigate(pushNotificationPermissionRoute, {
        intendedRoute: physicalIdRoute,
      })
      actedOnPushPermission.current = true
      return
    }

    if (!!country && !!document) {
      dispatch(launchPhysicalIdSDK(country, document))
      resetState()
    } else if (!country) {
      setCountryPickerVisible(true)
    }
  }

  const onCancel = () => {
    resetState()
    navigation.navigate(homeRoute, {
      screen: homeDrawerRoute,
    })
  }

  const onCountrySelect = async (country) => {
    setCountry(country.cca2)
  }

  const onDocumentSelect = async (document) => {
    setDocument(document.value)
  }

  useEffect(() => {
    dispatch(resetPhysicalIdStatues())
  }, [])

  useEffect(() => {
    if (processStatus === physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_START) {
      navigation.navigate(homeRoute, {
        screen: homeDrawerRoute,
      })
      navigation.navigate(physicalIdSuccessRoute)
    }
  }, [processStatus])

  useEffect(() => {
    setLoaderText(getLoaderMessageText(processStatus))
  }, [processStatus])

  const loaderWithMessage = useMemo(
    () => (
      <Container tertiary key={loaderText}>
        <Loader showMessage={true} message={loaderText} />
      </Container>
    ),
    [processStatus, loaderText]
  )

  if (isLoaderVisible(processStatus, connectionStatus)) {
    return loaderWithMessage
  }

  return (
    <Container tertiary>
      <Container vCenter hCenter horizontalSpace>
        <PhysicalIdDefault
          country={country}
          setDocument={onDocumentSelect}
          onCountrySelect={onCountrySelect}
          countryPickerVisible={countryPickerVisible}
          setCountryPickerVisible={setCountryPickerVisible}
        />
        {hasError(processStatus, connectionStatus) ? (
          <PhysicalIdError
            status={processStatus}
            connectionStatus={connectionStatus}
          />
        ) : null}
      </Container>
      <CustomView row safeArea>
        {!country ? (
          <ModalButtons
            onPress={onAction}
            onIgnore={onCancel}
            colorBackground={colors.main}
            acceptBtnText="Start Document Verification"
            topTestID={`${testID}-start`}
            containerStyles={styles.actionContainer}
          />
        ) : (
          <ModalButtons
            onPress={onAction}
            onIgnore={onCancel}
            colorBackground={colors.main}
            secondColorBackground={colors.main}
            denyButtonText="Cancel"
            acceptBtnText="Scan Document"
            disableAccept={country && !document}
            topTestID={`${testID}-continue`}
            containerStyles={styles.actionContainer}
          />
        )}
      </CustomView>
    </Container>
  )
}

const LOADER_TEXT = {
  preparation: 'Please have your document ready',
  finish: 'Finishing up...',
  processing: 'Processing...',
}

const LoaderVisiblePhysicalIdStates = [physicalIdProcessStatus.SDK_SCAN_START]

const LoaderVisiblePhysicalIdConnectionStates = [
  physicalIdConnectionStatus.CONNECTION_DETAIL_FETCHING,
  physicalIdConnectionStatus.CONNECTION_IN_PROGRESS,
]

function isLoaderVisible(
  status: PhysicalIdProcessStatus,
  connectionStatus: PhysicalIdConnectionStatus
) {
  return (
    LoaderVisiblePhysicalIdStates.includes(status) ||
    LoaderVisiblePhysicalIdConnectionStates.includes(connectionStatus)
  )
}

function getLoaderMessageText(status: PhysicalIdProcessStatus) {
  switch (status) {
    case physicalIdProcessStatus.SDK_SCAN_START:
      return LOADER_TEXT.processing
    case physicalIdProcessStatus.SDK_SCAN_SUCCESS:
      return LOADER_TEXT.finish
    default:
      return LOADER_TEXT.preparation
  }
}

const physicalIdErrorStates = [
  physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL,
  physicalIdProcessStatus.SDK_TOKEN_PARSE_FAIL,
  physicalIdProcessStatus.SDK_INIT_FAIL,
  physicalIdProcessStatus.SDK_SCAN_FAIL,
  physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL,
]

const physicalIdConnectionErrorStates = [
  physicalIdConnectionStatus.CONNECTION_DETAIL_FETCH_ERROR,
  physicalIdConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR,
  physicalIdConnectionStatus.CONNECTION_FAIL,
]

function PhysicalIdError(props: {
  status: PhysicalIdProcessStatus,
  connectionStatus: PhysicalIdConnectionStatus,
}) {
  let errorText = getErrorText(props.status)
  if (!errorText) {
    errorText = getErrorConnectionText(props.connectionStatus)
  }

  if (!errorText) {
    return null
  }

  return <Text style={styles.errorText}>{errorText}</Text>
}

function hasError(
  status: PhysicalIdProcessStatus,
  connectionStatus: PhysicalIdConnectionStatus
) {
  return (
    physicalIdErrorStates.includes(status) ||
    physicalIdConnectionErrorStates.includes(connectionStatus)
  )
}

function getErrorText(status: PhysicalIdProcessStatus) {
  switch (status) {
    case physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL:
    case physicalIdProcessStatus.SDK_TOKEN_PARSE_FAIL:
      return 'Document verification faced an error while trying to start process. Please try again.'

    case physicalIdProcessStatus.SDK_INIT_FAIL:
    case physicalIdProcessStatus.SDK_SCAN_FAIL:
    case physicalIdProcessStatus.SEND_ISSUE_CREDENTIAL_FAIL:
      return 'Document verification could not complete processing your document. Please try again.'

    default:
      return null
  }
}

function getErrorConnectionText(connectionStatus: PhysicalIdConnectionStatus) {
  switch (connectionStatus) {
    case physicalIdConnectionStatus.CONNECTION_DETAIL_FETCH_ERROR:
    case physicalIdConnectionStatus.CONNECTION_DETAIL_INVALID_ERROR:
    case physicalIdConnectionStatus.CONNECTION_FAIL:
      return 'Error establishing Sovrin connection with issuer. Please try again.'

    default:
      return null
  }
}

const orderedDocuments = ['PASSPORT', 'DRIVING_LICENSE', 'IDENTITY_CARD']

const documentTypesMap = {
  PASSPORT: 'Passport',
  DRIVING_LICENSE: 'Driving License',
  IDENTITY_CARD: 'Identity Document',
}

const PhysicalIdDefault = ({
  country,
  setDocument,
  onCountrySelect,
  countryPickerVisible,
  setCountryPickerVisible,
}) => {
  const dispatch = useDispatch()
  const documentTypes = useSelector(selectDocumentTypes)
  const documentTypesIsLoading = useSelector(selectDocumentTypesIsLoading)

  useEffect(() => {
    if (country) {
      dispatch(getSupportedDocuments(country))
    }
  }, [country])

  const data = useMemo(() => {
    return documentTypes
      ? orderedDocuments
          .filter((document) => documentTypes.includes(document))
          .map((document) => ({
            label: documentTypesMap[document],
            value: document,
          }))
      : []
  }, [documentTypes])

  const onCloseCountryPicker = () => {
    setCountryPickerVisible(false)
  }

  return (
    <>
      <View style={styles.containerStyles}>
        {!country ? (
          <View style={styles.containerStyles}>
            <Image source={documentVerificationImage} style={styles.image} />
            <Text style={styles.physicalIdParagraphText}>
              By scanning your government-issued documents and taking a selfie,
              you can turn your physical documents into private, secure digital
              credentials stored on your phone. Your personal information is
              discarded after verification.
            </Text>
          </View>
        ) : (
          <Text style={styles.physicalIdParagraphText}>
            Choose a document to scan. If prompted, please grant camera
            permissions.
          </Text>
        )}
        {countryPickerVisible || country ? (
          <CountryPicker
            withFilter={true}
            withFlag={true}
            withCountryNameButton={true}
            withEmoji={true}
            withCloseButton={true}
            withFlagButton={true}
            withAlphaFilter={true}
            onSelect={onCountrySelect}
            countryCode={country || ''}
            visible={countryPickerVisible}
            onClose={onCloseCountryPicker}
          />
        ) : null}
      </View>
      {country ? (
        <View style={styles.documentsContainer}>
          {documentTypesIsLoading && (
            <Loader
              showMessage={true}
              message="Getting supported document types"
            />
          )}
          {!documentTypesIsLoading && (!data || data.length === 0) && (
            <Text style={styles.errorText}>
              There are no supported documents for this country
            </Text>
          )}
          {!documentTypesIsLoading && data && data.length > 0 && (
            <RadioButton
              data={data}
              selectedBtn={setDocument}
              icon={
                <Icon name="check-circle" size={25} color={colors.green1} />
              }
              animationType="rotate"
              duration={300}
              textColor={colors.gray1}
              activeColor={colors.green1}
              boxActiveBgColor={colors.green3}
              textStyle={styles.documentNameText}
            />
          )}
        </View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  containerStyles: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    flex: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonStyle: {
    borderLeftColor: white,
    borderLeftWidth: StyleSheet.hairlineWidth,
    marginHorizontal: '5%',
    marginBottom: 15,
  },
  successTextStyle: {
    marginVertical: 15,
  },
  physicalIdParagraphText: {
    marginTop: '5%',
    lineHeight: 25,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.gray1,
    fontFamily: fontFamily,
    textAlign: 'left',
  },
  errorText: {
    marginBottom: '2%',
    lineHeight: 25,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.red,
    fontFamily: fontFamily,
    textAlign: 'center',
  },
  actionContainer: {
    padding: moderateScale(15),
    paddingBottom:
      Platform.OS === 'ios' ? moderateScale(30) : moderateScale(10),
  },
  documentsContainer: {
    marginTop: '3%',
    flex: 2,
    width: '100%',
  },
  documentNameText: {
    fontFamily: fontFamily,
    fontWeight: '400',
    fontSize: verticalScale(fontSizes.size6),
  },
  image: {
    flex: 1,
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
})

let headline = 'Document Verification'
export const physicalIdScreen = {
  routeName: physicalIdRoute,
  screen: PhysicalId,
  headline,
}
