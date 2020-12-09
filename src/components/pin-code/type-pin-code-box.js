// @flow
export type PinCodeDigitProps = {
  entered: boolean,
  testID?: ?string,
  onPress: () => void,
}

export type PinCodeBoxProps = {
  onPinComplete: (pin: string) => void,
  enableCustomKeyboard?: boolean,
  disableKeyboard?: boolean,
}

export type PinCodeBoxState = {
  pin: string,
}
