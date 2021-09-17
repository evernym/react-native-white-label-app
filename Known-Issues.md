# React Native MSDK SDK Known Issues

The following are known issues React Native MSDK that customers may run into:

* Push Notifications may not be received by the app sometimes.

* Application crashes on Android when React-Native of 0.63+ version is used. 

* The lock of orientation does not work for Android.
  * Solution: Add patch into your project for the following package:
    * `react-native-screens` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/react-native-screens+2.17.1.patch)

* Android build failes due to unresolved dependencies from `jcenter` repository (deprecated repository).
  * Solution: Add patches into your project for the following packages:
    * `@react-native-community/blur` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/@react-native-community+blur+3.6.0.patch)
    * `apptentive-react-native` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/apptentive-react-native+5.5.0.patch)
    * `react-native-fingerprint-scanner` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/react-native-fingerprint-scanner+6.0.0.patch)
