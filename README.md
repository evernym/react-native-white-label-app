# react-native-evernym-sdk

* [Creating a new application](#creating-a-new-application)
    * [Create base app](#create-base-app)
    * [Base app configuration](#base-app-configuration)
    * [Android](#android)
    * [iOS](#ios)
* [Issues](#issues)
    * [Android](#android-issues)
    * [iOS](#ios-issues)
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
    import * as EvernymSdk from '@dev/react-native-evernym-sdk'
    import {name as appName} from './app.json';
    
    EvernymSdk.createApp(appName)
  ```
  
1. Congrats! Now we have ready JS part of the application. As the next steps, we need to configure the build for the target platforms.

#### Android

1. To build app with SDK, you need to increase the available jvm memory in `android/gradle.properties`

    ```properties
    org.gradle.jvmargs=-Xmx4608m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
    ```

1. Set the minimum supported SDK version in your `android/build.gradle`:
    ```groovy
    buildscript {
        ext {
            ...
            minSdkVersion = 23
            ...
        }
        ...
    ```

1. Add the libvcx android repository in your `android/build.gradle`:
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

1. Setup packaging options in your `android/app/build.gradle`:
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

1. Set default configuration for the camera in your `android/app/build.gradle`:
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
   
1. Replace your `android/app/src/main/AndroidManifest.xml` with [AndroidManifest.xml](./files/AndroidManifest.xml)

1. Change placeholders (`react-native-evernym-sdk-placeholder`) in copied `AndroidManifest.xml`:
    * `package` - your original android package name
   
1. Update your `MainActivity` by adding the following code (it's needed to configure your app storage): 
    ```
    import android.content.ContextWrapper;
    import android.system.Os;
   ```
    ```
    @Override
    protected void onStart() {
        super.onStart();
        try {
            ContextWrapper c = new ContextWrapper(this);
            Os.setenv("EXTERNAL_STORAGE", c.getFilesDir().toString(), true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
   ```
   
1. Added Google Firebase configuration:
    * Put `google-services.json` file into your `android/app` folder.
    * Add `google-services` dependencies into your `android/build.gradle` file.
        ```
        dependencies {
            ...
            classpath 'com.google.gms:google-services:4.2.0'
        }
        ```
    * Add `google-services` plugin into your `android/app/build.gradle` file.
        ```
         apply plugin: 'com.google.gms.google-services'
        ```
    * Uncomment the text located under `Firebase configuration` in `AndroidManifest.xml`:
    
1. Deep linking configuration:
    * Uncomment the text located under `Deep Linking configuration` in `AndroidManifest.xml`:

    * Set Branch keys in your `android/app/build.gradle` file:
        ```
       manifestPlaceholders = [BRANCH_LIVE_KEY: "key_live_gcrCKTHBKlx7N31qxgq33bpmzupAwr1q",
                               BRANCH_TEST_KEY:"key_test_fnzEMTMuTnr6HZWEBbJVOmfhsymtrs8S"]
       ```

    * Change placeholders (`react-native-evernym-sdk-placeholder`) for `Branch URI Scheme` and `Branch App Links` in `AndroidManifest.xml`:

    * Added branch import into your `MainApplication.java`:
        ```
       // branch needs to have a referral in initializing
       import io.branch.referral.Branch;
       ```

#### iOS

> Note:
>
> Current version of Evernym RN MobileSDK is not supported by Xcode 12, last supported version is Xcode 11.7. Also, make sure your **Command line tools** are set to version **Xcode 11.7 (11E801a)**

1. Open iOS project in Xcode and in Build Settings update `iOS deployment target` to 10.0. Also, change version in `Podfile`:

    ```ruby 
        platform :ios, '10.0'
    ```

1. Create new swift file and add it to your Xcode project. When offered, also accept creating `*-Bridging-Header.h` file too. You can leave the content of both files empty.

1.  Add `Lato` fonts to Xcode project located here: `node_modules/@dev/react-native-evernym-sdk/src/fonts/Lato` and update `info.plist` with configuration related to fonts:
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
    In case you already added custom fonts to Xcode project, just expand list by adding Lato fonts.
    
1. Add VCX library:

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
      
1. Configure Google Firebase:
    * Add initialization of Firebase library into your `AppDelegate.m`:
    
    ```objectiveC
    # import Firebase framework
    # import <Firebase.h>
    
    @implementation AppDelegate
      - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
            
            // ...
        
            if ([FIRApp defaultApp] == nil) {
              [FIRApp configure];
            }
        
            // ...
        
        return YES;
    }
    ```
   * Add Push notification capabilities.
   
       When selected Xcode project, choose **Signing & Capabilities**. From there, select signing for valid **Team** and **bundle identifier**. 
       Tap `+ Capabilty` and from the drop list (or by searching) choose `Push notifications`. 
       New certificates and provision profiles should be automatically generated by Xcode. 
       
       - Don't forget to follow rest of the steps for registering your app with Firebase service and including adding GoogleService-Info.plist to your project. For more details, please refer to official documentaion here: <a href="https://firebase.google.com/docs/cloud-messaging/ios/client" target="_blank" >https://firebase.google.com/docs/cloud-messaging/ios/client</a>
       
       - Register app for push notifications in AppDelegate.m
       
       ```objC
       if ([UNUserNotificationCenter class] != nil) {
         [UNUserNotificationCenter currentNotificationCenter].delegate = self;
         UNAuthorizationOptions authOptions = UNAuthorizationOptionAlert |
             UNAuthorizationOptionSound | UNAuthorizationOptionBadge;
         [[UNUserNotificationCenter currentNotificationCenter]
             requestAuthorizationWithOptions:authOptions
             completionHandler:^(BOOL granted, NSError * _Nullable error) {
               // ...
             }];
       }
       
       [application registerForRemoteNotifications];
       
       ```

1. Configure App permissions

## Issues

##### Android issues

##### iOS issues

* **Missing ObjectiveC**
    
    Make sure you added .swift file and bridging header to your Xcode project, as instructed in this documentation.
    
    In case you experience this error:\
    `ld: warning: Could not find auto-linked library` please add next line in Build Settings, Search Library paths (in Xcode):
    
    ```
    $(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME) 

* **Missing FS in DotEnv library** 

    In case you experience issue with missing fs library `node_modules/react-native-dotenv/index.js`, this can be resolution: 

    1. Add react-native-fs using yarn or npm 
    2. Open DotEnv library in /node_modules/dotenv/lib/main.js 
    3. Replace const `fs = require('fs')` to `fs = require('react-native-fs')`

    Note: Unfortunately, if you rebuild node_modules, same steps will be necessary again, just to keep in mind.

## Customization

See [documentation](./Configuration.md) to get an overview of available configuration options.
