// @flow
import React from 'react'
import { Text, View, Dimensions, StyleSheet } from 'react-native'
import { colors, fontFamily } from '../../common/styles/constant'

let ScreenWidth = Dimensions.get('window').width

const styles = StyleSheet.create({
  container: {
    width: ScreenWidth,
    height: 26,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: colors.white,
    marginTop: -15,
    marginBottom: -15,
    alignItems: 'center',
  },
  border: {
    width: '100%',
    height: 1,
    backgroundColor: '#CE0B24',
    position: 'absolute',
  },
  textWrapper: {
    height: '100%',
    width: 88,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eaeaea',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '7%',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CE0B24',
    fontFamily: fontFamily,
  },
})

// TODO: Fix the <any, void> to be the correct types for props and state
export const NewMessageBreakLine = () => (
  <View style={styles.container}>
    <View style={styles.border} />
    <View style={styles.textWrapper}>
      <Text style={styles.text}>New Messages</Text>
    </View>
  </View>
)
