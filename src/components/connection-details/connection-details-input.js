// @flow
import React, { PureComponent } from 'react'
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native'

class ConnectionDetailsInput extends PureComponent<void, void> {
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.wrapper}>
          <TouchableOpacity style={styles.tunderButton}>
            <Image
              style={styles.thunder}
              source={require('../../images/componentsDetails/thunder.png')}
            />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput style={styles.textInput} />
            <TouchableOpacity style={styles.sendMessage}>
              <Image
                source={require('../../images/componentsDetails/sendArrow.png')}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
}

export { ConnectionDetailsInput }

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.85)',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    paddingBottom: 40,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 20,
    fontSize: 17,
    fontWeight: '500',
    padding: 10,
    paddingRight: 14,
    paddingLeft: 14,
    color: '#a5a5a5',
    backgroundColor: 'white',
  },
  absolute: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: 45,
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 10,
    paddingRight: 0,
  },
  tunderButton: {
    width: 24,
    height: 24,
    marginLeft: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thunder: {},
  inputWrapper: {
    flex: 1,
    marginRight: '7%',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  sendMessage: {
    position: 'absolute',
    width: 28,
    height: 28,
    right: 10,
  },
})
