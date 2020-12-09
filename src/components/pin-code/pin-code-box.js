// @flow
import React, { PureComponent } from 'react'
import { TextInput, StyleSheet, Platform } from 'react-native'
import { detox } from 'react-native-dotenv'

import type { PinCodeBoxProps, PinCodeBoxState } from './type-pin-code-box'

import PinCodeDigit from './pin-code-digit'
import { CustomView } from '../layout/custom-view'
import CustomKeyboard from '../keyboard/keyboard'
import { color } from '../../common/styles/constant'

const keyboard = Platform.OS === 'ios' ? 'number-pad' : 'numeric'

const isDigit = (text) => {
  if (isNaN(parseInt(text))) {
    return false
  }

  return true
}

export default class PinCodeBox extends PureComponent<
  PinCodeBoxProps,
  PinCodeBoxState
> {
  state = {
    pin: '',
  }

  customKeyboardRef = null

  inputBox: ?TextInput = null

  pinCodeArray = [1, 2, 3, 4, 5, 6]

  maxLength = 6

  maxValue = '999999'

  onPinChange = (pin: string) => {
    if (pin === '' || isDigit(pin.substr(pin.length - 1))) {
      this.setState({ pin }, this.onPinSet)
    }
  }

  clear = () => {
    // parent can call this to clear entered input
    // either in case pin was wrong, or we want them to enter it again
    this.inputBox && this.inputBox.clear()
    this.customKeyboardRef && this.customKeyboardRef.clear()
    this.setState({ pin: '' })
  }

  hideKeyboard = () => {
    this.inputBox && this.inputBox.blur()
  }

  showKeyboard = () => {
    // "Autofocus: false" in "TextInput" box was having issues with "showKeyBoard" logic. We removed "Autofocus: false" and handled
    // onFocus manually through setting the ref in componentDidMount and having a setTimeout for setting the ref while mounting.
    // This roundabout solution is the only way android 10 would work with a keyboard
    // Found partial solution here: https://github.com/software-mansion/react-native-screens/issues/89#issuecomment-551143682
    Platform.OS === 'ios'
      ? this.inputBox && this.inputBox.focus()
      : setTimeout(() => this.inputBox && this.inputBox.focus(), 500)
  }

  onPinSet = () => {
    // need to call this method after user value is set in state
    // here we can check if we got 6 digits, if yes, that means
    // we can say pin input is complete and let parent component
    // handle what to do after pin input is complete
    // while setting pin, parent can clear it and ask for pin again
    // while entering pin to unlock, parent can match pin in keychain
    if (this.state.pin.length === 6) {
      this.props.onPinComplete(this.state.pin)
    }
  }

  componentDidMount() {
    this.showKeyboard()
  }

  saveCustomKeyboardRef: Function = (ref: CustomKeyboard) =>
    (this.customKeyboardRef = ref)
  customKeyboard = () => {
    if (this.props.enableCustomKeyboard) {
      return (
        <CustomKeyboard
          maxLength={this.maxLength}
          onPress={this.onPinChange}
          color={color.bg.seventh.font.fifth}
          customKeyboard
          showDecimal
          ref={this.saveCustomKeyboardRef}
          maxValue={this.maxValue}
        />
      )
    }
    return null
  }

  render() {
    return (
      <CustomView>
        <CustomView onPress={this.showKeyboard} row>
          {this.pinCodeArray.map((keycode, index) => {
            return (
              <PinCodeDigit
                onPress={this.showKeyboard}
                key={index}
                entered={this.state.pin[index] !== undefined}
                testID={`pin-code-digit-${index}`}
              />
            )
          })}
        </CustomView>
        {this.customKeyboard()}
        <TextInput
          editable={!this.props.disableKeyboard}
          autoCorrect={false}
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={false}
          keyboardType={keyboard}
          keyboardAppearance="dark"
          maxLength={this.maxLength}
          onChangeText={this.onPinChange}
          ref={(inputBox) => {
            this.inputBox = inputBox
          }}
          style={styles.input}
          testID="pin-code-input-box"
          accessible={true}
          accessibilityLabel={`pin-code-input-box`}
          value={this.state.pin}
        />
      </CustomView>
    )
  }
}

const styles = StyleSheet.create({
  input: {
    position: 'absolute',
    right: detox === 'yes' ? 250 : -999,
    height: 0,
    width: 0,
  },
})
