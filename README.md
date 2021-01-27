# react-native-evernym-sdk

## Creating a new application

To create a new project, you would need to use the same react native version as in peer dependencies of the evernym SDK and go through the following steps.

Create new react native project called "AwesomeProject":
```shell
npx react-native init AwesomeProject --version 0.61.4
```

### Build configuration

To include SDK in your new application, you need to setup it's dependencies.  
Replace dependecies section leaving only `react-native-evernym-sdk` dependency to your `package.json`.

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

Next let's configure babel, add the following presets to `babel.config.js`
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
