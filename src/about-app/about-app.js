// @flow
import React, { useCallback } from 'react'
import { StyleSheet, Image, View, Text } from 'react-native'
import { connect, useSelector } from 'react-redux'
import VersionNumber from 'react-native-version-number'
import { ListItem } from 'react-native-elements'

import {
  TermsAndConditionsTitle,
  PrivacyPolicyTitle,
} from '../common/privacyTNC-constants'
import { EvaIcon, ARROW_RIGHT_ICON } from '../common/icons'

import type { AboutAppProps, AboutAppListItemProps } from './type-about-app'

import { Container, CustomText, CustomView } from '../components'
import { OFFSET_1X, OFFSET_2X, lightGray, fontFamily, fontSizes } from '../common/styles'
import { aboutAppRoute, privacyTNCRoute } from '../common'
import { PrivacyTNC } from '../privacy-tnc/privacy-tnc-screen'
import { Header } from '../components'
import { color, colors } from '../common/styles'
import { getEnvironmentName } from '../store/store-selector'
import {
  aboutAppInfo,
  AdditionalInfo,
  appLogo,
  appName,
  companyLogo,
  companyName,
  CustomAboutAppScreen,
} from '../external-exports'

const info = aboutAppInfo || {
  appLogo: true,
  appName: true,
  appVersion: true,
  appEnvironment: true,
  builtBy: true,
  poweredBy: true,
  termsAndConditions: true,
  privacyPolicy: true,
}

export const AboutAppListItem = ({
                                   titleValue,
                                   onPress,
                                 }: AboutAppListItemProps) => {
  return (
    <ListItem
      title={
        <CustomView>
          <CustomText h5 semiBold bg="fifth">
            {titleValue}
          </CustomText>
        </CustomView>
      }
      onPress={onPress}
      rightIcon={<EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3}/>}
    />
  )
}

export const AboutApp = ({
                           navigation,
                           route,
                         }: AboutAppProps) => {
  const environmentName = useSelector(getEnvironmentName)

  const openTermsAndConditions = () => {
    navigation.navigate(privacyTNCRoute, PrivacyTNC.INFO_TYPE.TNC)
  }

  const openPrivacyPolicy = useCallback(() => {
    navigation.navigate(
      privacyTNCRoute,
      PrivacyTNC.INFO_TYPE.PRIVACY,
    )
  })

  return (
    <Container tertiary>
      <Header
        headline="About this App"
        navigation={navigation}
        route={route}
      />
      <CustomView center doubleVerticalSpace>
        {
          info.appLogo &&
          <Image source={appLogo}/>
        }
        {
          info.appName &&
          <CustomView center doubleVerticalSpace>
            <CustomText bg="tertiary" tertiary bold>
              {appName}
            </CustomText>
          </CustomView>
        }
        {
          info.appVersion &&
          <CustomView center doubleVerticalSpace>
            <CustomText bg="tertiary" tertiary semiBold>
              VERSION # {VersionNumber.appVersion}.{VersionNumber.buildVersion}
            </CustomText>
          </CustomView>
        }
        {
          info.appEnvironment &&
          <CustomView center verticalSpace>
            <CustomText bg="tertiary" tertiary transparentBg semiBold>
              {environmentName}
            </CustomText>
          </CustomView>
        }
        {AdditionalInfo ? <AdditionalInfo/> : <View/>}
        <CustomView verticalSpace vCenter style={[styles.thickLine]}/>
        {
          info.builtBy && (
            <CustomView doubleVerticalSpace>
              <CustomText
                bg="tertiary"
                tertiary
                transparentBg
                h7
                style={[styles.topFloatText]}
              >
                built by
              </CustomText>
              {
                companyLogo ?
                  <Image source={companyLogo}/> :
                  <Text style={styles.text}>{companyName}</Text>
              }
            </CustomView>
          )}
        {info.poweredBy && (
          <CustomView verticalSpace>
            <CustomText
              bg="tertiary"
              tertiary
              transparentBg
              h7
              style={[styles.bottomFloatText]}
            >
              powered by
            </CustomText>
            <Image source={require('../images/logo_evernym.png')}/>
          </CustomView>
        )}
      </CustomView>
      <Container>
        {
          info.termsAndConditions &&
          <AboutAppListItem
            titleValue={TermsAndConditionsTitle}
            onPress={openTermsAndConditions}
          />
        }
        {
          info.privacyPolicy &&
          <AboutAppListItem
            titleValue={PrivacyPolicyTitle}
            onPress={openPrivacyPolicy}
          />
        }
      </Container>
    </Container>
  )
}

const AboutAppScreen = connect()(
  CustomAboutAppScreen ?
    CustomAboutAppScreen :
    AboutApp,
)

export const aboutAppScreen = {
  routeName: aboutAppRoute,
  screen: AboutAppScreen,
}

const styles = StyleSheet.create({
  headerLeft: {
    width: OFFSET_2X,
  },
  thickLine: {
    height: 2,
    width: 140,
    borderBottomColor: lightGray,
    borderBottomWidth: 2,
  },
  topFloatText: {
    paddingBottom: OFFSET_1X,
  },
  bottomFloatText: {
    paddingBottom: OFFSET_1X / 2,
  },
  text: {
    fontFamily: fontFamily,
    fontWeight: '600',
    fontSize: fontSizes.size2,
    color: color.bg.tertiary.font.tertiary,
    marginTop: -12,
  },
})
