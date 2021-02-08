#### Build Android

**Note**: At this point, you should already have completed [Base app configuration](../README.md#base-app-configuration) section.

In order to configure the building of your application for an Android platform, you can either rely on [automatic](#automatic) command which will everything for you, or follow to [manual](#manual) steps.

* [Automatic](#automatic)
* [Manual](#manual)
* [Optional Dependencies](#optional-dependencies)
* [Issues](#issues)

##### Automatic

**Note**: Automatic configuration works only for Unix like OS.

1. Add the following command to your `scripts` section of your app `package.json`:

    ```json
      "scripts": {
        ...
        "evernym-sdk:configure-android": "./node_modules/@dev/react-native-evernym-sdk/configure-android.sh"
      },
    ```

1. Run the following command in your project directory:
    ```shell
    yarn evernym-sdk:configure-android
    ```

##### Manual

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
   
1. Replace your `android/app/src/main/AndroidManifest.xml` with [AndroidManifest.xml](files/android/AndroidManifest.xml) and  change placeholders (`react-native-evernym-sdk-placeholder`) in copied `AndroidManifest.xml`:
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
    As example, you can take [this](files/android/google-services.json) and replace placeholder `react-native-evernym-sdk-placeholder` on your app name. 
    Note that push notifications will not work if you use this file, to get working notifications you need to provide your own account information.
    
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
    
#### Optional dependencies

##### Deep linking configuration  
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
  
### Issues
    
- TODO
