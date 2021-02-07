// @flow
import React from 'react';
import {View, Text, StyleSheet, Image, ImageBackground} from 'react-native';
import {colors, fontFamily, fontSizes} from '../common/styles/constant';
import {verticalScale, moderateScale} from 'react-native-size-matters';

export const EmptyState = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../images/home_background.png')}
        style={styles.backgroundImage}
        resizeMode="contain"
      >
        <Text style={styles.infoText}>
          You design goes here
        </Text>
        <Image
          source={require('../images/powered_by_logo.png')}
          style={styles.image}
        />
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    textAlign: 'center',
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size0),
    fontWeight: '700',
    color: colors.gray3,
    marginHorizontal: moderateScale(36),
  },
  image: {
    position: 'absolute',
    bottom: moderateScale(84),
    right: moderateScale(20),
  },
});
