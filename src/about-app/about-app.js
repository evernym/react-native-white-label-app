// @flow
import React, { Component } from 'react'
import { StyleSheet, Image } from 'react-native'
import { connect } from 'react-redux'
import VersionNumber from 'react-native-version-number'
import { ListItem } from 'react-native-elements'

// $FlowExpectedError[cannot-resolve-module] external file
import { displaySovrin } from '../../../../../app/evernym-sdk/about'

// $FlowExpectedError[cannot-resolve-module] external file
import { APP_LOGO } from '../../../../../app/evernym-sdk/app'

const appImage = APP_LOGO || require('../images/logo_app.png')

import {
  TermsAndConditionsTitle,
  PrivacyPolicyTitle,
} from '../common/privacyTNC-constants'
import { EvaIcon, ARROW_RIGHT_ICON } from '../common/icons'

import type { AboutAppProps, AboutAppListItemProps } from './type-about-app'
import type { Store } from '../store/type-store'

import { Container, CustomText, CustomView } from '../components'
import { OFFSET_1X, OFFSET_2X, lightGray } from '../common/styles'
import { aboutAppRoute, privacyTNCRoute } from '../common'
import { PrivacyTNC } from '../privacy-tnc/privacy-tnc-screen'
import { getEnvironmentName } from '../store/config-store'
import { Header } from '../components/header/common-header/header'
import { colors } from '../common/styles/constant'

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
})

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
      rightIcon={rightIcon}
    />
  )
}

const rightIcon = <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3} />

const logoApp = <Image source={appImage} />
const logoEvernym = <Image source={require('../images/logo_evernym.png')} />
const logoSovrin = <Image source={require('../images/logo_sovrin.png')} />
const versionNumber = VersionNumber

export class AboutApp extends Component<AboutAppProps, void> {
  openTermsAndConditions = () => {
    this.props.navigation.navigate(privacyTNCRoute, PrivacyTNC.INFO_TYPE.TNC)
  }

  openPrivacyPolicy = () => {
    this.props.navigation.navigate(
      privacyTNCRoute,
      PrivacyTNC.INFO_TYPE.PRIVACY
    )
  }

  render() {
    return (
      <Container tertiary>
        <Header
          headline="About this App"
          navigation={this.props.navigation}
          route={this.props.route}
        />
        <CustomView center doubleVerticalSpace>
          {logoApp}
          <CustomView center doubleVerticalSpace>
            <CustomText bg="tertiary" tertiary transparentBg semiBold>
              VERSION # {versionNumber.appVersion}.{versionNumber.buildVersion}
            </CustomText>
          </CustomView>
          <CustomView center verticalSpace>
            <CustomText bg="tertiary" tertiary transparentBg semiBold>
              {this.props.environmentName}
            </CustomText>
          </CustomView>
          <CustomView verticalSpace vCenter style={[styles.thickLine]} />
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
            {logoEvernym}
          </CustomView>
          {displaySovrin && (
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
              {logoSovrin}
            </CustomView>
          )}
        </CustomView>
        <Container>
          {/* TODO: move the below titles also to constants */}
          <AboutAppListItem
            titleValue={TermsAndConditionsTitle}
            onPress={this.openTermsAndConditions}
          />
          <AboutAppListItem
            titleValue={PrivacyPolicyTitle}
            onPress={this.openPrivacyPolicy}
          />
        </Container>
      </Container>
    )
  }
}

const mapStateToProps = (state: Store) => ({
  environmentName: getEnvironmentName(state.config),
})

const AboutAppScreen = connect(mapStateToProps)(AboutApp)

export const aboutAppScreen = {
  routeName: aboutAppRoute,
  screen: AboutAppScreen,
}
