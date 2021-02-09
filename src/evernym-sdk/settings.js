// @flow

/*
 * Here is you can customize Settings view.
 * */

// text which will be used for the header.
export const HEADLINE = null

// options to be shown on Settings screen.
// Format:
// [
//   {
//     name: string, - (mandatory) - identifier
//     title: string, - (optional for predefined (there is default) / mandatory for custom) - title
//     subtitle: string, - (optional) - description
//     avatar: string, - (optional) - icon to show on the left
//     rightIcon: Icon, - (optional) - icon to show on the right
//     onPress: Function, - (optional) - handler on touch
//   }
// ]
// Predefined: Biometrics, Passcode, Feedback, About, Logs
export const SETTINGS_OPTIONS = null

// flag indicating whether you want to show camera button.
export const SHOW_CAMERA_BUTTON = true

// custom component to use for Settings dialog rendering (instead of predefined one)
export const CustomSettingsScreen = null
