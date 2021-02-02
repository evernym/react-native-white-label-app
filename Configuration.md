## Configuration

After running `evernym-sdk:configure` command all required modules and assets will set up with default values. 

For more convenience, we grouped all configuration options by files representing either a corresponding application screen or piece of functionality.
For example `home.js` contains options for `Home`.

**Ensure** that you completed build configuration for target platforms.

You should be able to run the application at this point or proceed to modify provided default configuration.

##### Application

The base application settings should be specified in `app.js` file.

* `APP_NAME` - name of the application 
    ```javascript
    export const APP_NAME = 'AppName'
    ```

* `APP_LOGO` - (Optional) small application logo used on several screens. 
    ```javascript
    export const APP_LOGO = require('./images/logo_app.png')
    ```
 
* `DEFAULT_USER_AVATAR` - (Optional) default user avatar placeholder.
    ```javascript
    export const DEFAULT_USER_AVATAR = require('./images/user_avatar.png')
    ``` 

##### Color theme

Application color theme is set by a group of constants provided in `colors.js` configuration module. 
It is used throughout the whole application.

```javascript
export const colors = {
  main: '#86B93B',
  secondary: '#6C8E3A',
  green1: '#86B93B',
  green2: '#6C8E3A',
  green3: 'rgba(134, 185, 59, 0.15)',
  red: '#CE0B24',
  orange: '#EB9B2D',
  white: '#FFFFFF',
  gray5: '#F2F2F2',
  gray4: '#EAEAEA',
  gray3: '#A5A5A5',
  gray2: '#777777',
  gray1: '#505050',
  gray0: '#404040',
  black: '#000000',
  blue: '#236BAE',
  default: '#6C8E3A',
}
```

##### End User License Agreement

You can configure EULA and privacy terms inside the `eula.js` module.

* `TERMS_AND_CONDITIONS_TITLE` - (string, optional) the text which will be used for the label.
    ```javascript
    export const TERMS_AND_CONDITIONS_TITLE = 'Terms and Conditions'
    ```

* `PRIVACY_POLICY_TITLE` - (string, optional) the text which will be used for the label.
    ```javascript
    export const PRIVACY_POLICY_TITLE = 'Privacy Policy'
    ```
  
There are two type variables used for specifying documents location:
* URL - url address leading to web document version (is used by default)
    * `ANDROID_EULA_URL` - url leading to EULA for android app 
        ```javascript
        export const ANDROID_EULA_URL = 'https://www.connect.me/google.html'
        ```
    * `IOS_EULA_URL` - url leading to EULA for ios app
        ```javascript
        export const ANDROID_EULA_URL = 'https://www.connect.me/google.html'
        ```
    * `PRIVACY_POLICY_URL` - url leading to Privacy policy document
        ```javascript
        export const PRIVACY_POLICY_URL = 'https://www.connect.me/privacy.html'
        ```

* LOCAL - path to local asset
    * `ANDROID_EULA_LOCAL` - path to local EULA file for android app 
        ```javascript
        export const ANDROID_EULA_LOCAL = 'file:///android_asset/external/connectme/eula_android.html'
        ```
    * `IOS_EULA_LOCAL` - path to local EULA file for ios app 
        ```javascript
        export const IOS_EULA_LOCAL = './eula_ios.html'
        ```
    * `ANDROID_PRIVACY_POLICY_LOCAL` - path to local Privacy policy document for android app
        ```javascript
        export const ANDROID_PRIVACY_POLICY_LOCAL = 'file:///android_asset/external/connectme/privacy.html'
        ```
    * `IOS_PRIVACY_POLICY_LOCAL` - path to local Privacy policy document for ios app
        ```javascript
        export const IOS_PRIVACY_POLICY_LOCAL = './privacy.html'
        ```

Note: By default, MSDK tries to use web versions of documents. Local assets will be used when there are connectivity issues.

##### Start up

You can configure application startup wizard which is shown for the newly installed application inside the `startup.js` module. 

* `BACKGROUND_IMAGE` - (image source, optional) image to use as a background:

    ```javascript
    export const BACKGROUND_IMAGE = require('./images/setup.png')
    ``` 

##### Lock

You can configure application locking screens (set up / enter / change password) inside the `lock.js` module.

* `LockHeader` - component which will be displayed as the header:
    ```javascript
    export function LockHeader(props: {
      height: number,
      width: number,
      fill: string,
    }) {
      return <AppIcon color={fill} {...props} />
    }
    ```

##### Home screen

You can configure application `Home` screen inside the `home.js` module.

* `HEADLINE` - (string) the text which will be used for the header.
    
  ```javascript
    export const HEADLINE = 'Home'
    ```

* `HomeViewEmptyState` - (React Component) component to be displayed at the home screen in cases of no recent notifications.

    This will usually happen after new installation of the application.
    
    You can provide a greeting message as in this example:
    
    ```javascript
    export const HomeViewEmptyState = () => {
      return (
        <Text>Hello, you now have a digital wallet!</Text>
      )
    }
    ```

* `SHOW_EVENTS_HISTORY` - (boolean) a flag indicating whether you want to show the history of events on the Home view.   
    
  ```javascript
    export const SHOW_EVENTS_HISTORY = true
    ```

##### Connections screen

You can configure application `Connections` screen inside the `my-connections.js` module.

* `HEADLINE` - (string) the text which will be used for the header.

  ```javascript
    export const HEADLINE = 'Connections'
    ```

* `MyConnectionsViewEmptyState` - (React Component) component to be displayed at the connections screen in cases of no connections made yet.
    ```javascript
    export const MyConnectionsViewEmptyState = () => {
      return (
        <Text>You do not have connections yet!</Text>
      )
    }
    ```

##### Credentials screen

You can configure application `Credentials` screen inside the `my-credentials.js` module.

* `HEADLINE` - (string) the text which will be used for the header.

  ```javascript
    export const HEADLINE = 'Credentials'
    ```

* `MyConnectionsViewEmptyState` - (React Component) component to be displayed at the credentials screen in cases of no credentials made yet.
    ```javascript
    export const MyCredentialsViewEmptyState = () => {
      return (
        <Text>You do not have credentials yet!</Text>
      )
    }
    ```

##### Navigation drawer

You can configure navigation menu inside the `navigator.js` module.

* `navigationOptions` - (object) The set of navigation options (and their labels) to be shown.
    ```javascript
    export const navigationOptions = {
      connections: { label: 'My Connections' },
      credentials: { label: 'My Credentials' },
      settings: { label: 'Settings' },
    }
    ```

* `DrawerHeaderContent` - (React Component) You can provide component to be displayed in the navigation drawer at the top, above the navigation section.

    ```javascript
    export function DrawerHeaderContent(props: {
      height: number,
      width: number,
      fill: string,
    }) {
      return (
        <Text>You are using sdk-app</Text>
      )
    }
    ```

* `DrawerFooterContent` - (React Component) You can provide component to be displayed in the navigation drawer at the bottom, below the navigation section.

    You can provide contents for the footer like this:
    
    ```javascript
    export function DrawerFooterContent() {
      return (
        <Text>You are using wallet 1.0.0</Text>
      )
    }
    ```

##### Server environment

You can configure a server environment used for agent provisioning inside the `provision.js` module.

* `SERVER_ENVIRONMENTS` - (object) custom server configurations:
    
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

* `DEFAULT_SERVER_ENVIRONMENT` - (string) the name of environment to use by default.

  ```javascript
  export const DEFAULT_SERVER_ENVIRONMENT = 'PROD'
  ```

* Information used for application provisioning
    * `VCX_PUSH_TYPE` -  type of push notifications
        * 1 - push notification to default app
        * 3 - forwarding
        * 4 - sponsor configured app
       
          ```javascript
          export const VCX_PUSH_TYPE = 1
          ```
        
    * `SPONSOR_ID` - An ID given to you from Evernym's Support Team after the Sponsor onboarding process is complete.

          ```javascript
          export const SPONSOR_ID = 'sponsorid'
          ```

##### Collecting log information

You can configure data used for logging in the `logs.js` module.

You can receive encrypted log file by email.

* `SEND_LOGS_EMAIL` - (string) - email to send logs.

    ```javascript
    export const SEND_LOGS_EMAIL = 'support@app.com'
    ```    

* `CUSTOM_LOG_UTILS` - (object) key or URL to the file containing key used for log encryption.

    ```javascript
    export const SEND_LOGS_EMAIL = 'support@app.com'
    export let CUSTOM_LOG_UTILS = {
      publicKeyUrl: 'https://app.com/sendlogs.public.encryption.key.txt',
      encryptionKey: '',
    }
    ```

##### Credential Offer dialog

You can customize `Credential Offer` dialog in the `credential-offer-dialog.js` module.

* `HEADLINE` - (string) the text which will be used for the header.

    ```javascript
    export const HEADLINE = 'Credential Offer'
    ```

* `ACCEPT_BUTTON_TEXT` - (string) the text which will be used for top (accept) button.

    ```javascript
    export const ACCEPT_BUTTON_TEXT = 'Accept'
    ```

* `DENY_BUTTON_TEXT` - (string) the text which will be used for bottom (deny) button.

    ```javascript
    export const DENY_BUTTON_TEXT = 'Deny'
    ```

##### Proof Request dialog 

You can customize `Proof Request Offer` dialog in the `proof-request-dialog.js` module.

* `HEADLINE` - (string) the text which will be used for the header.

    ```javascript
    export const HEADLINE = 'Proof Request'
    ```

* `ACCEPT_BUTTON_TEXT` - (string) the text which will be used for top (accept) button.

    ```javascript
    export const ACCEPT_BUTTON_TEXT = 'Accept'
    ```

* `DENY_BUTTON_TEXT` - (string) the text which will be used for bottom (deny) button.

    ```javascript
    export const DENY_BUTTON_TEXT = 'Deny'
    ```

##### Settings

You can customize `Settings` view in the `settings.js` module.

1. `HEADLINE` - (string) the text which will be used for the header.

    ```javascript
    export const HEADLINE = 'Settings'
    ```
   
1. `settingsOptions` - (object) The set of options (and their labels) to be shown.
    ```javascript
    export const settingsOptions = {
      biometrics: { title: 'Biometrics', subtitle: 'Use your finger or face to secure app' },
      passcode: { title: 'Passcode', subtitle: `View/Change your ${APP_NAME} passcode` },
      feedback: { title: 'Give app feedback', subtitle: `Tell us what you think of ${APP_NAME}` },
      about: { title: 'About', subtitle: 'Legal, Version, and Network Information' },
    }
    ```

##### Feedback

In order to gather application feedback is used `Apptentive`. 
You can provide credentials to be used for setting up `Apptentive` module in `feedback.js` file.

```javascript
export const APPTENTIVE_CREDENTIALS = Platform.select({
  ios: {
    apptentiveKey: '-',
    apptentiveSignature: '-',
  },
  android: {
    apptentiveKey: '-',
    apptentiveSignature: '-',
  },
})
```

##### Splash screen and app icon

These are configured inside your application for specific platforms.

* Android:
    
    * Splash Screen: 
        
        * Added following code into your `MainActivity.java` file:
            ```
               import org.devio.rn.splashscreen.SplashScreen;
               import android.os.Bundle; 
              ...
              
              public class MainActivity extends ReactActivity {
              ...
                    @Override
                    protected void onCreate(Bundle savedInstanceState) {
                        SplashScreen.show(this);
                        super.onCreate(savedInstanceState);
                    }
              ...
              }
              ```

         * copy `files/layout` and `files/drawable-mdpi` directories into your `android/app/src/main/res` directory.
          
    * Application icon: replace file `ic_launcher.png` in `android/app/src/main/res/mipmap-hdpi` directory with a desired one.
    
* iOS: TODO

##### Further customization

For further customizations, you can refer to provided sample configuration or the source code.
