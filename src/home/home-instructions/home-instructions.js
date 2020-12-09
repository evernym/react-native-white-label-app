// @flow

import React, { PureComponent } from 'react'
import { ImageBackground, StyleSheet, Linking, View } from 'react-native'
import Snackbar from 'react-native-snackbar'

import { verticalScale, moderateScale } from 'react-native-size-matters'

// $FlowExpectedError[cannot-resolve-module] external file
import { HomeInstructionsContent } from '../../../../../../app/evernym-sdk/home'

import type { HomeInstructionsProps } from './type-home-instructions'
import { colors, fontFamily } from '../../common/styles/constant'

export class HomeInstructions extends PureComponent<
  HomeInstructionsProps,
  void
> {
  render() {
    const { usingProductionNetwork } = this.props
    return (
      <ImageBackground
        source={require('../../images/connection-items-placeholder.png')}
        style={styles.backgroundImage}
      >
        <View style={[styles.contentContainer]}>
          {HomeInstructionsContent ? (
            <HomeInstructionsContent
              usingProductionNetwork={usingProductionNetwork}
            />
          ) : (
            <View />
          )}
        </View>
      </ImageBackground>
    )
  }

  openTryConnectMe = () => {
    Linking.openURL('https://try.connect.me').catch(() => {
      Snackbar.show({
        text:
          'Could not open Tutorial website. No capable browser found to open it.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: colors.cmRed,
        textColor: colors.cmWhite,
      })
    })
  }
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    marginTop: verticalScale(-56),
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: moderateScale(90, 2.5),
    alignSelf: 'center',
  },
  headline: {
    fontSize: moderateScale(20, 0.1),
    color: colors.cmOrange,
    marginVertical: moderateScale(5),
    fontFamily: fontFamily,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  title: {
    fontSize: moderateScale(17, 0.1),
    marginVertical: moderateScale(5),
    color: colors.cmGray1,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  text: {
    fontSize: moderateScale(15, 0.1),
    marginVertical: moderateScale(5),
    marginHorizontal: '5%',
    color: colors.cmGray1,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
})
