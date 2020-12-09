// @flow
declare module 'react-native-touch-id' {
  declare interface TouchIDError {
    name: string;
    message: string;
    details: any;
  }

  declare interface IsSupportedConfig {
    /**
     * Return unified error messages
     */
    unifiedErrors?: boolean;
  }

  declare interface AuthenticateConfig extends IsSupportedConfig {
    /**
     * **Android only** - Title of confirmation dialog
     */
    title?: string;
    /**
     * **Android only** - Color of fingerprint image
     */
    imageColor?: string;
    /**
     * **Android only** - Color of fingerprint image after failed attempt
     */
    imageErrorColor?: string;
    /**
     * **Android only** - Text shown next to the fingerprint image
     */
    sensorDescription?: string;
    /**
     * **Android only** - Text shown next to the fingerprint image after failed attempt
     */
    sensorErrorDescription?: string;
    /**
     * **Android only** - Cancel button text
     */
    cancelText?: string;
    /**
     * **iOS only** - By default specified 'Show Password' label. If set to empty string label is invisible.
     */
    fallbackLabel?: string;
    /**
     * **iOS only** - By default set to false. If set to true, will allow use of keypad passcode.
     */
    passcodeFallback?: boolean;
  }

  declare module.exports: {
    authenticate(
      reason: string,
      config?: AuthenticateConfig
    ): Promise<boolean | TouchIDError>,
    isSupported(): Promise<boolean | TouchIDError>,
  }
}
