// @flow
import React, {Component} from 'react';
import {StyleSheet, Image, View, Text} from 'react-native';
import {connect} from 'react-redux';
import VersionNumber from 'react-native-version-number';
import {ListItem} from 'react-native-elements';

import {
  INFO,
  AdditionalInfo,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../../../../app/evernym-sdk/about';

import {
  APP_LOGO,
  APP_NAME,
  COMPANY_LOGO,
  COMPANY_NAME,
  // $FlowExpectedError[cannot-resolve-module] external file
} from '../../../../../app/evernym-sdk/app';

import {
  TermsAndConditionsTitle,
  PrivacyPolicyTitle,
} from '../common/privacyTNC-constants';
import {EvaIcon, ARROW_RIGHT_ICON} from '../common/icons';

import type {AboutAppProps, AboutAppListItemProps} from './type-about-app';
import type {Store} from '../store/type-store';

import {Container, CustomText, CustomView} from '../components';
import { OFFSET_1X, OFFSET_2X, lightGray, fontFamily, fontSizes } from '../common/styles'
import {aboutAppRoute, privacyTNCRoute} from '../common';
import {PrivacyTNC} from '../privacy-tnc/privacy-tnc-screen';
import {getEnvironmentName} from '../store/config-store';
import {Header} from '../components/header/common-header/header';
import { color, colors } from '../common/styles/constant'

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
  }
});

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
  );
};

const info = INFO || {
  appLogo: true,
  appName: true,
  appVersion: true,
  appEnvironment: true,
  builtBy: true,
  poweredBy: true,
};

const rightIcon = <EvaIcon name={ARROW_RIGHT_ICON} color={colors.gray3}/>;
const logoApp = <Image source={APP_LOGO}/>;
const logoEvernym = <Image source={require('../images/logo_evernym.png')}/>;
const versionNumber = VersionNumber;
const companyLogo = <Image source={COMPANY_LOGO}/>;

export class AboutApp extends Component<AboutAppProps, void> {
  openTermsAndConditions = () => {
    this.props.navigation.navigate(privacyTNCRoute, PrivacyTNC.INFO_TYPE.TNC);
  };

  openPrivacyPolicy = () => {
    this.props.navigation.navigate(
      privacyTNCRoute,
      PrivacyTNC.INFO_TYPE.PRIVACY,
    );
  };

  render() {
    return (
      <Container tertiary>
        <Header
          headline="About this App"
          navigation={this.props.navigation}
          route={this.props.route}
        />
        <CustomView center doubleVerticalSpace>
          {info.appLogo && logoApp}
          {
            info.appName &&
            <CustomView center doubleVerticalSpace>
              <CustomText bg="tertiary" tertiary bold>
                {APP_NAME}
              </CustomText>
            </CustomView>
          }
          {
            info.appVersion &&
            <CustomView center doubleVerticalSpace>
              <CustomText bg="tertiary" tertiary semiBold>
                VERSION # {versionNumber.appVersion}.{versionNumber.buildVersion}
              </CustomText>
            </CustomView>
          }
          {
            info.appEnvironment &&
            <CustomView center verticalSpace>
              <CustomText bg="tertiary" tertiary transparentBg semiBold>
                {this.props.environmentName}
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
                  COMPANY_LOGO ?
                    companyLogo :
                    <Text style={styles.text}>{COMPANY_NAME}</Text>
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
              {logoEvernym}
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
    );
  }
}

const mapStateToProps = (state: Store) => ({
  environmentName: getEnvironmentName(state.config),
});

const AboutAppScreen = connect(mapStateToProps)(AboutApp);

export const aboutAppScreen = {
  routeName: aboutAppRoute,
  screen: AboutAppScreen,
};
