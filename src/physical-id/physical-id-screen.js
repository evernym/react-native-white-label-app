// @flow

import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, Platform } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import CountryPicker from 'react-native-country-picker-modal'
import { moderateScale, verticalScale } from 'react-native-size-matters'
import RadioButtonRN from 'radio-buttons-react-native'
import Icon from 'react-native-vector-icons/FontAwesome'

import type { Store } from '../store/type-store'
import type {
  PhysicalIdProcessStatus,
  PhysicalIdConnectionStatus,
} from './physical-id-type'

import { Container, CustomText, CustomView, Loader } from '../components'
import {
  launchPhysicalIdSDK,
  resetPhysicalIdStatues,
} from './physical-id-store'
import { white, colors, fontFamily, fontSizes } from '../common/styles'
import {
  physicalIdProcessStatus,
  physicalIdConnectionStatus,
} from './physical-id-type'
import { physicalIdRoute } from '../common/route-constants'
import { homeDrawerRoute, homeRoute, physicalIdSuccessRoute } from '../common'
import { ModalButtons } from '../components/buttons/modal-buttons'

// import { physicalIdHeadline } from '../external-imports'

function PhysicalId() {
  const {
    status: processStatus,
    physicalIdConnectionStatus: connectionStatus,
  } = useSelector((state: Store) => state.physicalId)
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const [country, setCountry] = useState()
  const [document, setDocument] = useState()
  const [documents, setDocuments] = useState()
  const testID = 'physicalId'

  const onAction = async () => {
    if (!!country && !!document) {
      dispatch(launchPhysicalIdSDK(country, document))
    }
  }

  const onCancel = () => {
    navigation.navigate(homeRoute, {
      screen: homeDrawerRoute,
    })
  }

  const onCountrySelect = async (country) => {
    setCountry(country.cca2)
  }

  const onDocumentSelect = async (document) => {
    setDocument(document.label)
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

  console.log({ processStatus, connectionStatus })
  if (isLoaderVisible(processStatus, connectionStatus)) {
    const loaderText = getLoaderMessageText(processStatus, connectionStatus)
    return (
      <Container tertiary>
        <Loader showMessage={true} message={loaderText} />
      </Container>
    )
  }

  return (
    <Container tertiary>
      <Container vCenter hCenter horizontalSpace>
        <PhysicalIdDefault
          country={country}
          document={document}
          documents={documents}
          setDocument={onDocumentSelect}
          onCountrySelect={onCountrySelect}
        />
        {hasError(processStatus, connectionStatus) ? (
          <PhysicalIdError
            status={processStatus}
            connectionStatus={connectionStatus}
          />
        ) : null}
      </Container>
      <CustomView row safeArea>
        <ModalButtons
          onPress={onAction}
          onIgnore={onCancel}
          colorBackground={colors.main}
          secondColorBackground={colors.main}
          denyButtonText="Cancel"
          acceptBtnText="Start Document Verification"
          disableAccept={!country || !document}
          topTestID={`${testID}-deny`}
          bottomTestID={`${testID}-accept`}
          containerStyles={styles.actionContainer}
        />
      </CustomView>
    </Container>
  )
}

const LoaderVisiblePhysicalIdStates = [
  physicalIdProcessStatus.SDK_TOKEN_FETCH_START,
  physicalIdProcessStatus.SDK_TOKEN_FETCH_SUCCESS,
  physicalIdProcessStatus.SDK_INIT_START,
  physicalIdProcessStatus.SDK_INIT_SUCCESS,
  physicalIdProcessStatus.SDK_SCAN_START,
  physicalIdProcessStatus.SDK_SCAN_SUCCESS,
  physicalIdProcessStatus.SEND_WORKFLOW_ID_START,
  physicalIdProcessStatus.SEND_WORKFLOW_ID_SUCCESS,
]

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

function getLoaderMessageText(
  status: PhysicalIdProcessStatus,
  connectionStatus: PhysicalIdConnectionStatus
) {
  switch (connectionStatus) {
    case physicalIdConnectionStatus.CONNECTION_DETAIL_FETCHING:
      return 'Fetching connection details'
    case physicalIdConnectionStatus.CONNECTION_IN_PROGRESS:
      return 'Establishing connection'
  }

  switch (status) {
    case physicalIdProcessStatus.SDK_TOKEN_FETCH_START:
      return 'Loading'
    case physicalIdProcessStatus.SDK_TOKEN_FETCH_SUCCESS:
      return 'Loading'
    case physicalIdProcessStatus.SDK_INIT_START:
      return 'Loading'
    case physicalIdProcessStatus.SDK_INIT_SUCCESS:
      return 'Loading'
    case physicalIdProcessStatus.SDK_SCAN_START:
      return 'Scanning...'
    case physicalIdProcessStatus.SDK_SCAN_SUCCESS:
      return 'Processing document'
    case physicalIdProcessStatus.SEND_WORKFLOW_ID_START:
      return 'Processing document'
    case physicalIdProcessStatus.SEND_WORKFLOW_ID_SUCCESS:
      return 'Processing document'
  }
}

const physicalIdErrorStates = [
  physicalIdProcessStatus.SDK_TOKEN_FETCH_FAIL,
  physicalIdProcessStatus.SDK_TOKEN_PARSE_FAIL,
  physicalIdProcessStatus.SDK_INIT_FAIL,
  physicalIdProcessStatus.SDK_SCAN_FAIL,
  physicalIdProcessStatus.SEND_WORKFLOW_ID_FAIL,
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

  return (
    <CustomText bg="tertiary" h4 center>
      {errorText}
    </CustomText>
  )
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
    case physicalIdProcessStatus.SEND_WORKFLOW_ID_FAIL:
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

const PhysicalIdDefault = ({
  country,
  document,
  setDocument,
  documents,
  onCountrySelect,
}) => {
  const data = [
    { label: 'Passport' },
    { label: "Driver's License" },
    { label: 'Identity Document' },
  ]

  return (
    <>
      <Text style={styles.physicalIdParagraphText}>
        Scan your driver license or passport and receive a verifiable
        credential. Have your document ready to scan.
      </Text>
      <CountryPicker
        withFilter={true}
        withFlag={true}
        withCountryNameButton={true}
        withEmoji={true}
        withCloseButton={true}
        withFlagButton={true}
        onSelect={onCountrySelect}
        countryCode={country || ''}
        preferredCountries={['CA', 'IN', 'RS', 'GB', 'US']}
      />
      {country ? (
        <View style={styles.documentsContainer}>
          <RadioButtonRN
            data={data}
            selectedBtn={setDocument}
            icon={<Icon name="check-circle" size={25} color={colors.green1} />}
            animationType="rotate"
            duration={300}
            textColor={colors.gray1}
            activeColor={colors.green1}
            boxActiveBgColor={colors.green3}
            textStyle={styles.documentNameText}
          />
        </View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
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
    marginBottom: '5%',
    lineHeight: 25,
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.gray1,
    fontFamily: fontFamily,
    textAlign: 'center',
  },
  actionContainer: {
    padding: moderateScale(15),
    paddingBottom:
      Platform.OS === 'ios' ? moderateScale(30) : moderateScale(10),
  },
  documentsContainer: {
    // padding: moderateScale(15),
    flex: 1,
    width: '100%',
  },
  documentNameText: {
    fontFamily: fontFamily,
    fontWeight: '400',
    fontSize: verticalScale(fontSizes.size6),
  },
})

const headline = 'Document Verification'
export const physicalIdScreen = {
  routeName: physicalIdRoute,
  screen: PhysicalId,
  headline,
}
