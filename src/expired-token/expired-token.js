// @flow
import React, { PureComponent } from 'react'
import { Image, StyleSheet } from 'react-native'

import type { ReactNavigation } from '../common/type-common'

import { Container, CustomView, CustomText, CustomButton } from '../components'
import { isBiggerThanShortDevice } from '../common/styles'
import { homeRoute, expiredTokenRoute } from '../common'
import { appLogo } from '../external-exports'

class ExpiredToken extends PureComponent<ReactNavigation, void> {
  onOk = () => {
    this.props.navigation.navigate(homeRoute)
  }

  render() {
    return (
      <Container fifth testID="expired-token-container">
        <Container center>
          <CustomView vCenter>
            <Image
              style={styles.appLogo}
              source={appLogo}
              resizeMode="contain"
            />
          </CustomView>
          <CustomView vCenter style={[styles.textContainer]}>
            <CustomText transparentBg primary h1 style={[styles.sorryText]}>
              Sorry!
            </CustomText>
            <CustomText transparentBg primary h3 bold center>
              This invitation has expired!
            </CustomText>
          </CustomView>
        </Container>
        <CustomView safeArea style={[styles.okButtonContainer]}>
          <CustomButton
            testID="expired-token-ok"
            title="Ok"
            primary
            medium
            fontWeight="600"
            large={isBiggerThanShortDevice ? true : false}
            onPress={this.onOk}
            style={[styles.okButton]}
          />
        </CustomView>
      </Container>
    )
  }
}

export const expiredTokenScreen = {
  routeName: expiredTokenRoute,
  screen: ExpiredToken,
}

const styles = StyleSheet.create({
  expiredTokenContainer: {
    paddingTop: 30,
  },
  sovrinLogo: {
    width: 90,
    height: 90,
  },
  appLogo: {
    width: 200,
  },
  textContainer: {
    paddingTop: 30,
  },
  sorryText: {
    paddingBottom: 20,
  },
  okButtonContainer: {
    marginBottom: 15,
    marginLeft: '5%',
    marginRight: '5%',
  },
  okButton: {
    borderRadius: 5,
    height: isBiggerThanShortDevice ? 53 : 43,
  },
})
