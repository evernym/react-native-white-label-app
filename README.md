# react-native-evernym-sdk

* [Creating a new application](#creating-a-new-application)
    * [Create base app](#create-base-app)
    * [Base app configuration](#base-app-configuration)
    * [Android](#android)
    * [iOS](#ios)
* [Customization](#customization)

## Creating a new application

To create a new project, you would need to go through the following steps.

#### Create base app
Create new react native project. We will call it `awesomeMsdkProject` for this guide.
```shell
npx react-native init awesomeMsdkProject --version 0.61.4
```

**NOTE**: you need to use the same version of `react-native` as specified in `peerDependencies` section of `package.json` file for the evernym react-native-sdk.
By using a different version you are taking a risk of having issues with sdk.

#### Base app configuration

1. To include SDK in your new application, you need to set up it's dependencies.  
Replace dependencies section leaving only `@dev/react-native-evernym-sdk` dependency to your `package.json`.

    ```json
    "dependencies": {
        "@dev/react-native-evernym-sdk": "git+ssh://git@gitlab.corp.evernym.com/dev/connectme/react-native-evernym-sdk.git",
      },
    ```
   
    > Note
      >
      > For the moment, while our RN package is not yet published, please clone **`react-native-evernym-sdk`** repo to separate folder on your machine 
      and use a local path for setting **`react-native-evernym-sdk`** dependency.
    
   
1. Native dependencies should be put in app dependencies (see [issue](https://github.com/react-native-community/cli/issues/870)). They are listed as peer dependencies in SDK.  
Add all peer dependencies from `react-native-evernym-sdk` into `dependencies` section of your app `package.json`.

    ```json
    "dependencies": {
        "@react-native-community/async-storage": "x",
        ...
        "react-native-zip-archive": "x",
        "react-native": "0.61.4",
        "rn-fetch-blob": "x",
        ...
      },
    ```

1. Add dev dependencies to `devDependencies` section of your app `package.json`:

    ```json
    "devDependencies": {
        ...
        "copyfiles": "x"
      },
    ```

1. Add the following command to your `scripts` section of your app `package.json`:

    ```json
      "scripts": {
        ...
        "evernym-sdk:configure": "yarn --cwd node_modules/@dev/react-native-evernym-sdk run configure"
      },
    ```

    This command will add necessary modules for future application customization via `evernym-sdk`.

1. Now you can install all dependencies and do the automatic configuration, run following commands in your project directory:
    ```shell
    yarn
    yarn evernym-sdk:configure
    ```

    This will install all dependencies and add required modules to the `awesomeMsdkProject/app/evernym-sdk` directory.

* Remove default `App.js` and put the following in `index.js`: 
  ```javascript
    import * as EvernymSdk from '@dev/react-native-evernym-sdk';
    import {name as appName} from './app.json';
    
    EvernymSdk.createApp(appName);
  ```
  
1. Congrats! Now we have ready JS part of the application. As the next steps, we need to configure the build for the target platforms.

#### Android

**Note**: At this point, you should already have completed [Base app configuration](#base-app-configuration) section.

In order to configure the building of your application for an Android platform see the [document](./docs/Build-Android.md).

#### iOS

**Note**: At this point, you should already have completed [Base app configuration](#base-app-configuration) section.

In order to configure the building of your application for an Android platform see the [document](./docs/Build-iOS.md).

## Customization

See [documentation](docs/Customization.md) to get an overview of available configuration options.
