# Android installation steps

**Note**: At this point, you should already have completed [Base app configuration](../README.md#base-app-configuration) section.

In order to configure the building of your application for an Android platform, you can either rely on [automatic](#automatic) command which will everything for you, or follow to [manual](#manual) steps.

- [Android installation steps](#android-installation-steps)
  - [Automatic](#automatic)
  - [Manual](#manual)
  - [Issues](#issues)

## Automatic

**Note**: Automatic configuration works only for Unix like OS.

1. Add the following command to your `scripts` section of your app `package.json`:
    * Linux, Windows:
      ```json
        "scripts": {
          ...
          "evernym-sdk:configure-android": "./node_modules/@evernym/react-native-white-label-app/files/android/configure-android.sh"
        },
      ```
    * MacOs
      ```json
        "scripts": {
          ...
          "evernym-sdk:configure-android": "./node_modules/@evernym/react-native-white-label-app/files/android/configure-android-mac.sh"
        },
      ```
      
1. Run the following command in your project directory:

    ```shell
        yarn evernym-sdk:configure-android
    ```

## Manual

1. To build app with SDK, you need to increase the available jvm memory in `android/gradle.properties`

    ```properties
    org.gradle.jvmargs=-Xmx4608m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
    ```

1. Add blacklist to your `android/gradle.properties`

    ```properties
   android.jetifier.blacklist=bcprov
    ```

1. Set distribution url in your `android/gradle/wrapper/gradle-wrapper.properties`

    ```properties
    distributionUrl='https\://services.gradle.org/distributions/gradle-6.9-bin.zip
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

1. Add the libvcx and jumio android repositories in your `android/build.gradle`:

    ```groovy
    allprojects {
        repositories {
            ...
            maven {
                url 'https://evernym.mycloudrepo.io/public/repositories/libvcx-android'
            }
            maven {
                url 'https://evernym.mycloudrepo.io/public/repositories/evernym'
            }
            maven { url 'http://mobile-sdk.jumio.com' }
        }
    }
    ```

1. Set gradle version and add kotlin dependence in your  `android/build.gradle`:

    ```groovy
   dependencies {
        classpath 'com.android.tools.build:gradle:4.2.1'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.4.20'
        ...
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

1. Add fonts in your `android/app/build.gradle`:

    ```groovy
    apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
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

1. Add kotlin dependence in your `android/app/build.gradle`:

   ```groovy
   dependencies {
        implementation "org.jetbrains.kotlin:kotlin-stdlib:1.4.20"
        ...
   }
   ```

1. Replace your `android/app/src/main/AndroidManifest.xml` with [AndroidManifest.xml](files/android/AndroidManifest.xml) and  change placeholders (`react-native-white-label-app-placeholder`) in copied `AndroidManifest.xml`:
  * `package` - your original android package name

1. Create `android/app/src/main/res/xml/` folder and copy [file_viewer_provider_paths.xml](files/android/file_viewer_provider_paths.xml) file there.

1. Update your `MainActivity` by adding the following code (it's needed to configure your app storage):

    ```java
    import android.content.ContextWrapper;
    import android.system.Os;
    ```

    ```java
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

## Optional dependencies

### Push Notifications configuration

There are two strategies regarding receiving messages by an application which described [here](./Customization.md#receiving-message):

If you wish to use **Push Notifications** strategy you need to set variable `USE_PUSH_NOTIFICATION=true` and follow steps bellow to configure Google Firebase for Android:

**Official documentation:** https://developer.android.com/guide/topics/ui/notifiers/notifications

1. Put `google-services.json` file into your `android/app` folder.
   Example file can be found (showing structure) [here](files/android/google-services.json).
   Note that push notifications will not work if you use this file, to get working notifications you need to provide your own account information.

1. Add `google-services` dependencies into your `android/build.gradle` file.

    ```groovy
    dependencies {
        ...
        classpath 'com.google.gms:google-services:4.2.0'
    }
    ```

1. Add `google-services` plugin into your `android/app/build.gradle` file.

    ```groovy
     apply plugin: 'com.google.gms.google-services'
    ```

1. Uncomment the text located under `Firebase configuration` in `AndroidManifest.xml`:

### Deep linking configuration

* Uncomment the text located under `Deep Linking configuration` in `AndroidManifest.xml`:

* Set Branch keys in your `android/app/build.gradle` file:

    ```
        manifestPlaceholders = [BRANCH_LIVE_KEY: "key_live_....",
                           BRANCH_TEST_KEY:"key_test_..."]
    ```

* Change placeholders (`react-native-white-label-app-placeholder`) for `Branch URI Scheme` and `Branch App Links` in `AndroidManifest.xml`:

* Added branch import into your `MainApplication.java`:

    ```java
    // branch needs to have a referral in initializing
    import io.branch.referral.Branch;
   ```

## Issues

#### The lock of orientation does not work for Android

Solution: Add patch into your project for the following package:
* `react-native-screens` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/react-native-screens+2.17.1.patch)

#### jcenter repository deprecated
Solution: Add patches into your project for the following packages:
* `@react-native-community/blur` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/@react-native-community+blur+3.6.0.patch)
* `apptentive-react-native` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/apptentive-react-native+5.5.0.patch)
* `react-native-fingerprint-scanner` - [link](https://gitlab.com/evernym/mobile/connectme/-/blob/main/patches/react-native-fingerprint-scanner+6.0.0.patch)
