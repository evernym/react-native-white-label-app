# react-native-evernym-sdk

## Creating a new application

To create a new project, you would need to use specific react and react native version (v0.61.4). The simplest way is to use terminal command:

In this example, we are naming our app "AwesomeMobileSDKProject". Feel free to use name which works for you:

```shell
npx react-native init awesome-mobilesdk-project --version 0.61.4
```

### Build configuration

#### RN MobileSDK dependency

> Note
>
> For the moment, while our RN package is not yet published, please clone **`react-native-evernym-sdk`** repo to separate folder on your machine.

```shell 
git clone git@github.com:evernym/react-native-evernym-sdk.git [destination folder path]
```

To include RN MobileSDK in your new application, you need to add it as one of the dependencies in your `package.json`.  
Execute this command in terminal:

```shell
npm add [local path to react-native-evernym-sdk folder on your machine]
```

#### Other dependencies

Native dependencies should be put in app dependencies (see [issue](https://github.com/react-native-community/cli/issues/870)). They are listed as peer dependencies in SDK.  
Add all peer dependencies from `react-native-evernym-sdk` to your app `package.json` dependencies section.

Execute this command in terminal to add necessary dependencies:

```bash 
yarn add @react-native-community/async-storage@^1.11.0  @react-native-community/blur@^3.6.0  @react-native-community/masked-view@^0.1.10  @react-native-community/netinfo@^5.9.2  @react-native-community/push-notification-ios@^1.4.0  @react-native-firebase/app@8.4.3  @react-native-firebase/messaging@7.8.6  @react-navigation/compat@^5.1.26  @react-navigation/drawer@5.8.2  @react-navigation/native@^5.5.1  @react-navigation/stack@5.5.1  apptentive-react-native@5.5.0  lottie-ios@3.1.8  lottie-react-native@3.4.0  react-native-alert-async@^1.0.5  react-native-branch@^5.0.0  react-native-camera@3.33.0  react-native-device-info@^5.6.1  react-native-document-picker@^3.4.0  react-native-dotenv@^0.2.0  react-native-elements@^2.0.2  react-native-eva-icons@^1.3.1  react-native-file-viewer@^2.1.1  react-native-fingerprint-scanner@^6.0.0  react-native-flip-toggle-button@^1.0.8  react-native-gesture-handler@1.6.1  react-native-image-crop-picker@^0.32.0  react-native-image-resizer@1.2.3  react-native-keyboard-aware-scroll-view@^0.9.1  react-native-localize@^1.4.0  react-native-mail@^4.1.0  react-native-modal@11.5.6  react-native-randombytes@3.5.3  react-native-reanimated@1.9.0  react-native-safe-area-context@3.0.5  react-native-screens@2.8.0  react-native-sensitive-info@5.5.5  react-native-shake@3.4.0  react-native-share@3.4.0  react-native-simple-radio-button@2.7.4  react-native-size-matters@0.3.0  react-native-snackbar@2.2.3  react-native-splash-screen@3.2.0  react-native-svg@12.1.0  react-native-svg-icon@^0.8.1  react-native-swipe-list-view@^3.2.3  react-native-switch@^1.5.0  react-native-unique-id@2.0.0  react-native-vector-icons@6.6  react-native-version-number@^0.3.6  react-native-webview@10.1.1  react-native-zip-archive@5.0.2 rn-fetch-blob@0.12.0  @types/color@^3.0.1  bignumber.js@^9.0.0  color@^3.1.2  hoist-non-react-statics@3.3.2  lodash.debounce@^4.0.8  lodash.findkey@^4.6.0  lodash.flatten@^4.4.0  lodash.get@^4.4.2  lodash.groupby@^4.6.0 lodash.memoize@^4.1.2  lodash.merge@^4.6.2  lodash.uniqby@^4.7.0  moment@^2.26.0  query-string@^6.13.0  react-redux@7.2.0  redux@4.0.5  redux-logger@3.0.6  redux-saga@1.1.3  url@0.11.0  url-parse@^1.4.7  validator@^13.1.1 react-native-pbkdf2:git://github.com/evernym/react-native-pbkdf2.git#v0.1.5 path:^0.12.7 react-native-fs:^2.16.6 validator:^13.5.2 react-native-pbkdf2@git://github.com/evernym/react-native-pbkdf2.git react-native-image-colors react-native-action-sheet react-native-redash
```

<!---
```json
"dependencies": {
    "@react-native-community/async-storage": "x",
    ...
    "react-native-zip-archive": "x",
    "react-native": "0.61.4",
    "rn-fetch-blob": "x"
  },
```
-->

We will also need some dev dependencies too:

```bash 
yarn add @babel/plugin-proposal-class-properties @babel/plugin-proposal-class-properties@^7.7.0 @babel/plugin-proposal-decorators@7.7.0 @babel/runtime@^7.6.2 axios@^0.18.0 babel-eslint@10.0.3 babel-jest@24.9.0 babel-plugin-jest-hoist@24.9.0 chalk@4.0.0 child-process-async@^1.0.1 cli-error-notifier@^2.1.0 cross-env@7.0.2 del@^5.1.0 detox@16.8.2 detox-getprops@0.1.2 eslint@7.2.0 eslint-plugin-flowtype@5.1.3 eslint-plugin-import@2.21.1 eslint-plugin-jsx-a11y@6.2.3 eslint-plugin-react@7.20.0 flow-annotation-check@1.11.2 flow-bin@^0.105.0 flow-typed@3.1.0 fs-extra@^9.0.1 gm@^1.23.1 husky@^4.3.0 imap-simple@^5.0.0 jest@24.9.0 jetifier@^1.6.5 jpeg-js@0.4.1 lint-staged madge@^3.9.1 metro-react-native-babel-preset@0.56.0 ngrok@3.3.0 node-fetch@2.6.0 node-ssh@^10.0.2 pixelmatch@5.2.0 pngjs@4.0.0 prettier@2.0.5 ramda@^0.27.0 react-devtools@4.7.0 react-native-bundle-visualizer@^2.1.1 react-native-dotenv@^0.2.0 react-test-renderer@16.9.0 reactotron-react-native@5.0.0 reactotron-redux@3.1.3 redux-saga-test-plan@4.0.0-rc.3 remote-redux-devtools@^0.5.16 remotedev-rn-debugger@0.8.4 shelljs@^0.8.4 yargs@^15.3.1 yarnhook@^0.4.3 copyfiles@^2.4.1 --dev
```

To configure required MSDK modules, add the following to your scripts section:

```json
  "scripts": {
    ...
    "evernym-sdk:configure": "yarn --cwd node_modules/react-native-evernym-sdk run configure"
  },
```

Now you can install all dependencies and do automatic configuration, run following commands in your project directory:
```shell
yarn
yarn evernym-sdk:configure
```

This will install all dependencies and add required modules to the `AwesomeProject/app/evernym-sdk` directory.

Next let's configure babel, add the following presets to `babel.config.js`
```javascript
  presets: [
    ...
    'module:react-native-dotenv',
  ],
```

And setup environment. Create files `.env` and `.env.production` with the following content:
```shell
detox=no
```

Next steps is configuring build for the platforms.

### Android

To build app with SDK, increase the available jvm memory in `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4608m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

Setup your `AndroidManifest.xml` with `allowBackup` property set to `true`:

```xml
<manifest ...
  xmlns:tools="http://schemas.android.com/tools"
  ...>
  ...
    <application
      ...
      tools:replace="android:allowBackup"
      android:allowBackup="true"
      ...
    </application>
</manifest>
```

In your `android/build.gradle`, set the minimum SDK version:
```groovy
buildscript {
    ext {
        ...
        minSdkVersion = 23
        ...
    }
    ...
```

And add the libvcx android repository:
```groovy
allprojects {
    repositories {
        ...
        maven {
            url 'https://evernym.mycloudrepo.io/public/repositories/libvcx-android'
        }
    }
}
```

In your `android/app/build.gradle` setup packaging options:
```groovy
android {
    ...
    packagingOptions{
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/x86/libc++_shared.so'

        if (enableHermes) {
            exclude '**/libjsc*.so'
        }
    }
    ...
}
```

And default configuration:
```groovy
android {
    ...
    defaultConfig {
        ...
        missingDimensionStrategy 'react-native-camera', 'general'
    }
    ...
}
```

### iOS Configuration

> Note:
>
> Current version of Evernym RN MobileSDK is not supported by Xcode 12, last supported version is Xcode 11.7. Also, make sure your **Command line tools** are set to version **Xcode 11.7 (11E801a)**

- Open iOS project in Xcode and in Build Settings update `iOS deployment target` to 10.0. Also change version in `Podfile`:

```ruby 
	platform :ios, '10.0'
```

- Create new swift file and add it to your Xcode project. When offered, also accept creating `*-Bridging-Header.h` file too. You can leave the content of both files empty.
- Add configure script to your package.json as instructed here
- Update index file of your project `index.js` by adding `import {ConnectMeApp} from 'react-native-evernym-sdk'` and replace App with  ConnectMeApp in `registryComponent` line. Whole document should look like this:

```js
/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import {ConnectMeApp} from "@dev/react-native-evernym-sdk";

AppRegistry.registerComponent(appName, () => ConnectMeApp);

```

- Add `Lato` fonts to Xcode project located here: `node_modules/@dev/react-native-evernym-sdk/src/fonts/Lato` and update `info.plist` with configuration related to fonts:

```plist
	<key>UIAppFonts</key>
	<array>
		<string>Lato-Bold.ttf</string>
		<string>Lato-BoldItalic.ttf</string>
		<string>Lato-Italic.ttf</string>
		<string>Lato-Medium.ttf</string>
		<string>Lato-MediumItalic.ttf</string>
		<string>Lato-Regular.ttf</string>
		<string>Lato-Semibold.ttf</string>
		<string>Lato-SemiboldItalic.ttf</string>
	</array>
```

In case you already added custom fonts to Xcode project, just expand list by adding `Lato` fonts.

### Usage
You can remove default `App.js` and put the following in `index.js`:
```javascript
// @flow

import * as EvernymSdk from 'react-native-evernym-sdk';
import {name as appName} from './app.json';

EvernymSdk.createApp(appName);
```

## Adding VCX library

VCX Cocoapods library is necessary to be added to iOS Podfile too. For instructions how to download and link it with your iOS RN project, please follow instructions from native MobileSDK  documentation.

In short:
- create vcx local folder on your machine
- download vcx `vcx.libvcxall_` library from [MobileSDK Releases](https://github.com/evernym/mobile-sdk/releases) section, extract and drag `vcx.framework` to vcx folder
- download and copy `vcx.podspec` file (from [MobileSDK](https://github.com/evernym/mobile-sdk/blob/master/vcx.podspec)) and copy to `iOS` folder inside your project directory
- update `vcx.podspec` as instructed in [MobileSDK documentation](https://github.com/evernym/mobile-sdk/blob/master/1.ProjectSetup.md#2-add-dependency-libraries)
- in `iOS/Podfile` add this line:

```ruby
  pod 'vcx', :path => 'path_to_extracted_vcx_folder/vcx.podspec'
```

- Run in terminal:

```shell
yarn install 
pod install --repo-update
```

## Issues

### Missing

In case you experiencing this error after running `yarn evernym-sdk:configure` please add this line to script section in your project `package.json`:

```json
{
`"configure": "yarn --cwd ../../.. copyfiles -su 4 'node_modules/@dev/react-native-evernym-sdk/src/evernym-sdk/*.js' 'node_modules/@dev/react-native-evernym-sdk/src/evernym-sdk/images/*.png' ./app && echo 'Evernym React Native SDK configured successfully'"`
}
```

### Missing ObjectiveC

Make sure you added .swift file and bridging header to your Xcode project, as instructed in this documentation.

In case you experience this error:\
`ld: warning: Could not find auto-linked library` please add next line in Build Settings, Search Library paths (in Xcode):

```
$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME) 
```

### Missing FS in DotEnv library

**iOS version **

In case you experience issue with missing fs library `node_modules/react-native-dotenv/index.js`, this can be resolution:

1. Add `react-native-fs` using yarn or npm
2. Open DotEnv library in `/node_modules/dotenv/lib/main.js`
3. Replace const `fs = require('fs')` to `fs = require('react-native-fs')`

Note: Unfortunately, if you rebuild node_modules, same steps will be necessary again, just to keep in mind.

## Configuration

### Splash screen and app icon

These are configured inside your application for specific platforms.

### Default preset

To configure required MSDK modules, add the following to your scripts section:

```json
  "scripts": {
    ...
    "evernym-sdk:configure": "yarn --cwd node_modules/react-native-evernym-sdk run configure"
  },
```

After running the script, all required modules and assets will be setup with defaults.
Configuration will be stored inside `app/evernym-sdk` project subfolder.
You can run application at this point or proceed to modify provided configuration.

### Application name

Application name is set by constant string `APP_NAME` provided in the `app.js` module inside configuration folder.

```javascript
export const APP_NAME = 'AppName'
```

### Images
You can configure images used in app, replacing the provided default ones in the project subdirectory
`app/evernym-sdk/images`

`cb_app.png` - small app logo.  
`logo_app` - big app logo.  
`setup.png` - configuration screen background for the first app install.  
`UserAvatar.png` - default user avatar placeholder.

### App banner icon

The SVG icon of the application is used in several places.
You can provide component `AppSvgIcon` in the `app-icon.js` module.
It takes the width, height and color as parameters.

```javascript
export function AppSvgIcon(props: {
  height: number,
  width: number,
  fill: string,
}) {
  return <AppIcon color={fill} {...props} />
}
```

### Color theme

Application color theme is set by a group of constants provided in `colors.js` configuration module. It is used throughout the whole application.

Three shades for the primary color are used.
Rest of the colors are for special cases like warnings and decision buttons.

```javascript
export const colors = {
  cmGreen1: '#86B93B',
  cmGreen2: '#6C8E3A',
  cmGreen3: 'rgba(134, 185, 59, 0.15)',
  cmRed: '#CE0B24',
  cmOrange: '#EB9B2D',
  cmWhite: '#FFFFFF',
  cmGray5: '#F2F2F2',
  cmGray4: '#EAEAEA',
  cmGray3: '#A5A5A5',
  cmGray2: '#777777',
  cmGray1: '#505050',
  cmBlack: '#000000',
  cmBlue: '#236BAE',
}
```

### End User License Agreement

You can provide links to your EULA and privacy terms inside the `eula.js` module.
Local assets are also supported and used when there are connectivity issues.

### Home screen

You can provide component to be displayed at the home and connections screens when there is no other information to show, in cases of no connections made yet and no recent notifications.

This will usually happen after new installation of the application.

You can provide a greeting message as in this example:

```javascript
export const HomeInstructionsContent = () => {
  return (
    <Text>Hello, you now have a digital wallet!</Text>
  )
}
```

### Navigation drawer

You can rename navigation options by providing following object in `navigator.js`:
```javascript
export const navigationOptions = {
  connections: { label: 'Label for Connections' },
  credentials: { label: 'Label for Credentials' },
}
```

You can provide component to be displayed in the navigation drawer at the bottom, below the navigation section.

You can provide contents for the footer like this:

```javascript
export function DrawerFooterContent() {
  return (
    <Text>You are using wallet 1.0.0</Text>
  )
}
```

### Server environment

You can override used environment in the `provision.js` module.

Let's define our own production and development configuration:

```javascript
export const SERVER_ENVIRONMENTS = {
  'PROD': {
    agencyUrl: 'https://agency.app.com',
    agencyDID: 'did',
    agencyVerificationKey: 'verkey',
    poolConfig:
      '{"reqSignature":{},"txn":{"data": pool config data},"ver":"1"}',
    paymentMethod: 'sov',
  },
  'DEVTEAM1': {
    agencyUrl: 'https://dev.agency.app.com',
    agencyDID: 'did',
    agencyVerificationKey: 'verkey',
    poolConfig:
      '{"reqSignature":{},"txn":{"data": pool config data},"ver":"1"}',
    paymentMethod: 'sov',
  },
```

### Collecting log information

You can collect encrypted log information by email.
Email and encryption information is provided in `logs.js`.

You can provide key or URL to the file containing key.

Sample configuration could be:

```javascript
export const SEND_LOGS_EMAIL = 'support@app.com'
export let CUSTOM_LOG_UTILS = {
  publicKeyUrl: 'https://app.com/sendlogs.public.encryption.key.txt',
  encryptionKey: '',
}

```

### Further customization

For further customizations, you can refer to provided samle configuration or the source code.

```json
"dependencies": {
    "react-native-evernym-sdk": "git+ssh://git@gitlab.corp.evernym.com/dev/connectme/react-native-evernym-sdk.git",
  },
```

Native dependecies should be put in app dependencies (see [issue](https://github.com/react-native-community/cli/issues/870)). They are listed as peer dependencies in SDK.  
Add all peer dependencies from react-native-evernym-sdk to your app `package.json` dependencies section.

```json
"dependencies": {
    "@react-native-community/async-storage": "x",
    ...
    "react-native-zip-archive": "x",
    "react-native": "0.61.4",
    "rn-fetch-blob": "x"
  },
```

Some of the dependencies listed are dev dependecies. Move the following packages to dev dependecies section:

```json
"devDependencies": {
    ...
    "copyfiles": "x",
    "react-native-dotenv": "x"
  },
```

To configure required MSDK modules, add the following to your scripts section:

```json
  "scripts": {
    ...
    "evernym-sdk:configure": "yarn --cwd node_modules/react-native-evernym-sdk run configure"
  },
```

Now you can install all dependecies and do automatic configuration, run following commands in your project directory:
```shell
yarn
yarn evernym-sdk:configure
```

This will install all dependecies and add required modules to the `AwesomeProject/app/evernym-sdk` directory.

Next let's configure `babel`, add the following presets to `babel.config.js`
```javascript
  presets: [
    ...
    'module:react-native-dotenv',
  ],
```

Next steps is configuring build for the platforms.

### Android

To build app with SDK, increase the available jvm memory in `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4608m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

Setup your `AndroidManifest.xml` with `allowBackup` property set to `true`:

```xml
<manifest ...
  xmlns:tools="http://schemas.android.com/tools"
  ...>
  ...
    <application
      ...
      tools:replace="android:allowBackup"
      android:allowBackup="true"
      ...
    </application>
</manifest>
```

In your `android/build.gradle`, set the minimum SDK version:
```groovy
buildscript {
    ext {
        ...
        minSdkVersion = 23
        ...
    }
    ...
```

And add the libvcx android repository:
```groovy
allprojects {
    repositories {
        ...
        maven {
            url 'https://evernym.mycloudrepo.io/public/repositories/libvcx-android'
        }
    }
}
```

In your `android/app/build.gradle` setup packaging options:
```groovy
android {
    ...
    packagingOptions{
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/x86/libc++_shared.so'

        if (enableHermes) {
            exclude '**/libjsc*.so'
        }
    }
    ...
}
```

And default configuration:
```groovy
android {
    ...
    defaultConfig {
        ...
        missingDimensionStrategy 'react-native-camera', 'general'
    }
    ...
}
```

### Usage
You can remove default `App.js` and put the following in `index.js`:
```javascript
// @flow

import * as EvernymSdk from 'react-native-evernym-sdk';
import {name as appName} from './app.json';

EvernymSdk.createApp(appName);
```

## Adding VCX library

In the moment (until VCX is published publicly), please add VCX pod in your podfile in this way:

```ruby
source 'git@gitlab.corp.evernym.com:dev/vcx/indy-sdk.git'

def vcx_version_for_debug_or_release
    if ENV['CONNECTME_DEBUG'] == "true"
        '0.0.176'
    else
        '0.0.175'
    end
end

target '[your target]' do

    pod 'vcx', vcx_version_for_debug_or_release

end

```

## Issues

### Missing FS in DotEnv libary

**iOS version **

In case you experience issue with missing fs library `node_modules/react-native-dotenv/index.js`, this can be resolution:

1. Add react-native-fs using yarn or npm
2. Open DotEnv library in /node_modules/dotenv/lib/main.js
3. Replace const `fs = require('fs')` to `fs = require('react-native-fs')`

Note: Unfortunately, if you rebuild node_modules, same steps will be necessary again, just to keep in mind.

## Configuration

### Splash screen and app icon

These are configured inside your application for specific platforms.

### Default preset

To configure required MSDK modules, add the following to your scripts section:

```json
  "scripts": {
    ...
    "evernym-sdk:configure": "yarn --cwd node_modules/react-native-evernym-sdk run configure"
  },
```

After running the script, all required modules and assets will be setup with defaults.
Configuration will be stored inside `app/evernym-sdk` project subfolder.
You can run application at this point or proceed to modify provided configuration.

### Application name

Application name is set by constant string `APP_NAME` provided in the `app.js` module inside configuration folder.

```javascript
export const APP_NAME = 'AppName'
```

### Images
You can configure images used in app, replacing the provided default ones in the project subdirectory
`app/evernym-sdk/images`

`cb_app.png` - small app logo.  
`logo_app` - big app logo.  
`setup.png` - configuration screen background for the first app install.  
`UserAvatar.png` - default user avatar placeholder.

### App banner icon

The SVG icon of the application is used in several places.
You can provide component `AppSvgIcon` in the `app-icon.js` module.
It takes the width, height and color as parameters.

```javascript
export function AppSvgIcon(props: {
  height: number,
  width: number,
  fill: string,
}) {
  return <AppIcon color={fill} {...props} />
}
```

### Color theme

Application color theme is set by a group of constants provided in `colors.js` configuration module. It is used throughout the whole application.

Three shades for the primary color are used.
Rest of the colors are for special cases like warnings and decision buttons.

```javascript
export const colors = {
  cmGreen1: '#86B93B',
  cmGreen2: '#6C8E3A',
  cmGreen3: 'rgba(134, 185, 59, 0.15)',
  cmRed: '#CE0B24',
  cmOrange: '#EB9B2D',
  cmWhite: '#FFFFFF',
  cmGray5: '#F2F2F2',
  cmGray4: '#EAEAEA',
  cmGray3: '#A5A5A5',
  cmGray2: '#777777',
  cmGray1: '#505050',
  cmGray0: '#404040',
  cmBlack: '#000000',
  cmBlue: '#236BAE',
}
```

### End User License Agreement

You can provide links to your EULA and privacy terms inside the `eula.js` module.
Local assets are also supported and used when there are connectivity issues.

### Home screen

You can provide component to be displayed at the home screen in cases of no recent notifications.

This will usually happen after new installation of the application.

You can provide a greeting message as in this example:

```javascript
export const HomeViewEmptyState = () => {
  return (
    <Text>Hello, you now have a digital wallet!</Text>
  )
}
```

### Connections screen

You can provide component to be displayed at the connections screen in cases of no connections made yet.

```javascript
export const MyConnectionsViewEmptyState = () => {
  return (
    <Text>You do not have connections yet!</Text>
  )
}
```

### Credentials screen

You can provide component to be displayed at the credentials screen in cases of no credentials made yet.

```javascript
export const MyCredentialsViewEmptyState = () => {
  return (
    <Text>You do not have credentials yet!</Text>
  )
}
```

### Navigation drawer

You can rename navigation options by providing following object in `navigator.js`:
```javascript
export const navigationOptions = {
  connections: { label: 'Label for Connections' },
  credentials: { label: 'Label for Credentials' },
}
```

You can provide component to be displayed in the navigation drawer at the bottom, below the navigation section.

You can provide contents for the footer like this:

```javascript
export function DrawerFooterContent() {
  return (
    <Text>You are using wallet 1.0.0</Text>
  )
}
```

### Server environment

You can override used environment in the `provision.js` module.

Let's define our own production and development configuration:

```javascript
export const SERVER_ENVIRONMENTS = {
  'PROD': {
    agencyUrl: 'https://agency.app.com',
    agencyDID: 'did',
    agencyVerificationKey: 'verkey',
    poolConfig:
      '{"reqSignature":{},"txn":{"data": pool config data},"ver":"1"}',
    paymentMethod: 'sov',
  },
  'DEVTEAM1': {
    agencyUrl: 'https://dev.agency.app.com',
    agencyDID: 'did',
    agencyVerificationKey: 'verkey',
    poolConfig:
      '{"reqSignature":{},"txn":{"data": pool config data},"ver":"1"}',
    paymentMethod: 'sov',
  },
```

### Collecting log information

You can collect encrypted log information by email.
Email and encryption information is provided in `logs.js`.

You can provide key or URL to the file containing key.

Sample configuration could be:

```javascript
export const SEND_LOGS_EMAIL = 'support@app.com'
export let CUSTOM_LOG_UTILS = {
  publicKeyUrl: 'https://app.com/sendlogs.public.encryption.key.txt',
  encryptionKey: '',
}

```

### Further customization

For further customizations, you can refer to provided sample configuration or the source code.
