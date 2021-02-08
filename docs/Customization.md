## Configuration

After running `evernym-sdk:configure` command all required modules and assets will set up with default values. 

**Ensure** that you completed build configuration for target platforms.

You should be able to run the application at this point or proceed to modify provided default configuration.

For more convenience, we grouped all configuration options by files representing either a corresponding application screen or piece of functionality.
For example `home.js` contains options for `Home` screen.

**Content:**
* [Application](#application)
* [Color theme](#color-theme)
* [Font](#font)
* [Environment](#environment)
* [End User License Agreement](#end-user-license-agreement)
* [Start up](#start-up)
* [Lock](#lock)
* [Navigation Menu](#navigation-menu)
* [Home](#home)
* [Connections](#connections)
* [Credentials](#credentials)
* [Collecting log information](#collecting-log-information)
* [Credential Offer](#credential-offer-dialog)
* [Proof Request](#proof-request-dialog)
* [Question dialog](#question-dialog)
* [Settings](#settings)
* [Feedback](#feedback)
* [Application information](#application-information)
* [Splash screen and app icon](#splash-screen-and-app-icon)

#### Application

The base application settings should be specified in `app.js` file.

* `APP_NAME` - (string, Mandatory) name of the application 
    ```javascript
    export const APP_NAME = 'AppName'
    ```

* `APP_ICON` - (image source, Optional) application icon 
    * to use default MSDK icon
        ```javascript
        export const APP_ICON = null
        ```
    * to use custom
        ```javascript
        export const APP_ICON = require('app_icon.png')
        ```

* `APP_LOGO` - (image source, Optional) small application logo used on several screens. 
    * to use default MSDK logo
        ```javascript
        export const APP_LOGO = null
        ```
    * to use custom
        ```javascript
        export const APP_LOGO = require('logo_app.png')
        ```

* `COMPANY_NAME` - (string, Optional) name of a company built app. 
    * to omit 
        ```javascript
        export const APP_LOGO = null
        ```
    * to use custom 
        ```javascript
        export const COMPANY_NAME = 'Company'
        ```


* `COMPANY_LOGO` - (image source, Optional) logo of a company built application. 
    * to omit 
         ```javascript
         export const COMPANY_LOGO = null
         ```
     * to use custom
         ```javascript
        export const COMPANY_LOGO = require('app_company.png')
         ```
 
* `DEFAULT_USER_AVATAR` - (image source, Optional) default user avatar placeholder.
    * to use default avatar
        ```javascript
        export const DEFAULT_USER_AVATAR = null
        ```
    * to use custom
        ```javascript
        export const DEFAULT_USER_AVATAR = require('user_avatar.png')
        ```

#### Color theme

Application color theme is set by a group of constants provided in `colors.js` configuration module. 
It is used throughout the whole application.

* `COLORS` - (object, Optional) color palette to use.
    * to use default 
         ```javascript
         export const COMPANY_LOGO = null
         ```
         Default:
        ```
        {
          main: '#86B93B',
          secondary: 'rgba(134, 185, 59, 0.15)',
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
        }
        ```
     * to use custom
         ```javascript
        export const COMPANY_LOGO = {
          main: '#236BAE',
          secondary: '#11ABAE',
          ...
        }
         ```

#### Font

You can specify the font which will be used in the app inside the `font.js` module.

* `FONT_FAMILY` - (string, Optional) font family to use.

    * to use default - `Lato`
        ```javascript
        export const FONT_FAMILY = null
        ```
    * to use custom
        ```javascript
        export const FONT_FAMILY = 'Roboto'
        ```
  
* `FONT_SIZES` - (string, Optional)  grid to use for fonts.

    * to use default - `Lato`
        ```javascript
        export const FONT_SIZES = null
        ```
      Default:
      ```
      {
        size0: 42,
        size1: 26,
        size2: 23,
        size3: 19,
        size4: 17,
        size5: 15,
        size6: 14,
        size7: 13,
        size8: 11,
        size9: 10,
        size10: 9,
        size11: 8,
      }
      ```
    * to use custom
        ```
        export const FONT_SIZES = {
          size0: 36,
          size1: 22,
          ...
        ```

#### Environment

You can configure a server environment used for agent provisioning inside the `provision.js` module.

* `SERVER_ENVIRONMENTS` - (object) additional custom server configurations:
    * to use default 
        ```javascript
        export const SERVER_ENVIRONMENTS = {}
        ```
    * to add custom environments
        ```javascript
        export const SERVER_ENVIRONMENTS = {
          'PROD2': {
            agencyUrl: 'https://agency.app.com',
            agencyDID: 'did',
            agencyVerificationKey: 'verkey',
            poolConfig:
              '{"reqSignature":{},"txn":{"data": pool config data},"ver":"1"}',
            paymentMethod: 'sov',
          },
          'DEVTEAM2': {
            agencyUrl: 'https://dev.agency.app.com',
            agencyDID: 'did',
            agencyVerificationKey: 'verkey',
            poolConfig:
              '{"reqSignature":{},"txn":{"data": pool config data},"ver":"1"}',
            paymentMethod: 'sov',
          }
        }
        ```

* `DEFAULT_SERVER_ENVIRONMENT` - (string, Optional) the name of environment to use by default.
    * to use default - (`DEVTEAM1` for development / `PROD` for production)
        ```javascript
        export const DEFAULT_SERVER_ENVIRONMENT = null
        ```
    * to use custom 
        ```javascript
        export const DEFAULT_SERVER_ENVIRONMENT = 'PROD2'
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

#### End User License Agreement

You can configure EULA and privacy terms inside the `eula.js` module.

* `TERMS_AND_CONDITIONS_TITLE` - (string, Optional)  the text which will be used for the label.
    * to use default - `Terms and Conditions`
        ```javascript
        export const TERMS_AND_CONDITIONS_TITLE = null
        ```
    * to use custom
        ```javascript
        export const TERMS_AND_CONDITIONS_TITLE = 'Custom Terms and Conditions'
        ```

* `PRIVACY_POLICY_TITLE` - (string, Optional) the text which will be used for the label.
    * to use default - `Privacy Policy`
        ```javascript
        export const PRIVACY_POLICY_TITLE = null
        ```
    * to use custom
        ```javascript
        export const PRIVACY_POLICY_TITLE = 'Custom Privacy Policy'
        ```
  
* `CustomEulaScreen` - (React Component) custom component for Eula screen rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomEulaScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomEulaScreen = () => <Text>Custom Eula</Text>
        ```  
  
There are two type variables used for specifying documents location:
* URL - url address leading to web document version (is used by default)
    * `ANDROID_EULA_URL` - (string, Optional) url leading to EULA for android app 
        * to use default - `https://www.connect.me/google.html`
            ```javascript
            export const ANDROID_EULA_URL = null
            ```
        * to use custom
            ```javascript
            export const ANDROID_EULA_URL = 'https://www.custom./androud_eula.html'
            ```
      
    * `IOS_EULA_URL` -(string, Optional)  url leading to EULA for ios app
        * to use default - `https://www.connect.me/ios_eula.html`
            ```javascript
            export const IOS_EULA_URL = null
            ```
        * to use custom
            ```javascript
            export const IOS_EULA_URL = 'https://www.custom.me/ios_eula.html'
            ```
      
    * `PRIVACY_POLICY_URL` - (string, Optional) url leading to Privacy policy document
        * to use default - `https://www.connect.me/privacy.html`
            ```javascript
            export const PRIVACY_POLICY_URL = null
            ```
        * to use custom
            ```javascript
            export const PRIVACY_POLICY_URL = 'https://www.connect.me/privacy.html'
            ```

* LOCAL - path to local asset
    * `ANDROID_EULA_LOCAL` - (string, Optional) path to local EULA file for android app 
        * to use default - `None`
            ```javascript
            export const ANDROID_EULA_LOCAL = null
            ```
        * to use custom
            ```javascript
            export const ANDROID_EULA_LOCAL = 'file:///eula_android.html'
            ```
      
    * `IOS_EULA_LOCAL` - (string, Optional) path to local EULA file for ios app 
        * to use default - `None`
            ```javascript
            export const IOS_EULA_LOCAL = null
            ```
        * to use custom
            ```javascript
            export const IOS_EULA_LOCAL = './eula_ios.html'
            ```
      
    * `ANDROID_PRIVACY_POLICY_LOCAL` - (string, Optional) path to local Privacy policy document for android app
        * to use default - `None`
            ```javascript
            export const ANDROID_PRIVACY_POLICY_LOCAL = null
            ```
        * to use custom
            ```javascript
            export const ANDROID_PRIVACY_POLICY_LOCAL = 'file:///privacy.html'
            ```
      
    * `IOS_PRIVACY_POLICY_LOCAL` - (string, Optional) path to local Privacy policy document for ios app
        * to use default - `None`
            ```javascript
            export const IOS_PRIVACY_POLICY_LOCAL = null
            ```
        * to use custom
            ```javascript
            export const IOS_PRIVACY_POLICY_LOCAL = './privacy.html'
            ```

Note: By default, MSDK tries to use web versions of documents. Local assets will be used when there are connectivity issues.

#### Start up

You can configure application startup wizard which is shown for the newly installed application inside the `startup.js` module. 

* `BACKGROUND_IMAGE` - (image source, Optional) image to use as a background:
    * to use default MSDK star up background
        ```javascript
        export const BACKGROUND_IMAGE = null
        ```
    * to use custom
        ```javascript
        export const BACKGROUND_IMAGE = require('setup.png')
        ```
  
* `CustomStartUpScreen` - (React Component) custom component for Start Up screen rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomStartUpScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomStartUpScreen = () => <Text>Custom Start Up</Text>
        ```  

#### Lock

You can configure application locking screens (set up / enter / change password) inside the `lock.js` module.

* `LockHeader` - (React Component, Optional)component which will be displayed as the header (above password input):
    * to omit
        ```javascript
        export const LockHeader = null
        ```
    * to use custom
        ```javascript
        export const LockHeader = () => <Text>Hello</Text>
        ```

#### Home

You can configure application `Home` screen inside the `home.js` module.

* `HEADLINE` - (string, Optional) the text which will be used for the header.
    * to use default - `Home`
        ```javascript
        export const HEADLINE = null
        ```
    * to use custom
        ```javascript
        export const HEADLINE = 'Custom Home'
        ```

* `HomeViewEmptyState` - (React Component, Optional) component to be displayed at the home screen in cases of no recent notifications.

    This will usually happen after new installation of the application.
    
    You can provide a greeting message as in this example:
    
    * to use default 
        ```javascript
        export const HomeViewEmptyState = null
        ```
    * to omit 
        ```javascript
        export const HomeViewEmptyState = () => null
        ```
    * to use custom
        ```javascript
        export const HomeViewEmptyState = () => {
          return (
            <Text>Hello, you now have a digital wallet!</Text>
          )
        }
        ```

* `SHOW_EVENTS_HISTORY` - (boolean, Optional) a flag indicating whether you want to show the history of events on the Home view.   
    * to use default - `show`
        ```javascript
        export const SHOW_EVENTS_HISTORY = null
        ```
    * to use custom
        ```javascript
        export const SHOW_EVENTS_HISTORY = true
        ```

#### Connections

You can configure application `Connections` screen inside the `connections.js` module.

* `HEADLINE` - (string, Optional) the text which will be used for the header.
    * to use default - `show`
        ```javascript
        export const HEADLINE = null
        ```
    * to use custom
        ```javascript
        export const HEADLINE = 'Custom Connections'
        ```

* `MyConnectionsViewEmptyState` - (React Component, Optional) component to be displayed at the connections screen in cases of no connections made yet.
    * to use default 
        ```javascript
        export const MyConnectionsViewEmptyState = null
        ```
    * to omit 
        ```javascript
        export const MyConnectionsViewEmptyState = () => null
        ```
    * to use custom
        ```javascript
        export const MyConnectionsViewEmptyState = () => {
          return (
            <Text>You do not have connections yet!</Text>
          )
        }
        ```

* `SHOW_CAMERA_BUTTON` - (boolean, Optional) flag indicating whether you want to show camera button.
    * to use default - `true`
        ```javascript
        export const SHOW_CAMERA_BUTTON = null
        ```
    * to use custom
        ```javascript
        export const SHOW_CAMERA_BUTTON = false
        ```

* `CustomMyConnectionsScreen` - (React Component) custom component for Connections screen rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomMyConnectionsScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomMyConnectionsScreen = () => <Text>Custom Connections</Text>
        ``` 

* `CustomConnectionDetailsScreen` - (React Component) custom component for Connection Details screen rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomConnectionDetailsScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomConnectionDetailsScreen = () => <Text>Custom Connection Details</Text>
        ``` 

#### Credentials

You can configure application `Credentials` screen inside the `credentials.js` module.

* `HEADLINE` - (string, Optional) the text which will be used for the header.
    * to use default - `show`
        ```javascript
        export const HEADLINE = null
        ```
    * to use custom
        ```javascript
        export const HEADLINE = 'Custom Credentials'
        ```

* `MyCredentialsViewEmptyState` - (React Component, Optional) component to be displayed at the credentials screen in cases of no credentials made yet.
    * to use default 
        ```javascript
        export const MyCredentialsViewEmptyState = null
        ```
    * to omit 
        ```javascript
        export const MyCredentialsViewEmptyState = () => null
        ```
    * to use custom
        ```javascript
        export const MyCredentialsViewEmptyState = () => {
          return (
            <Text>You do not have credentials yet!</Text>
          )
        }
        ```

* `SHOW_CAMERA_BUTTON` - (boolean, Optional) flag indicating whether you want to show camera button.
    * to use default - `true`
        ```javascript
        export const SHOW_CAMERA_BUTTON = null
        ```
    * to use custom
        ```javascript
        export const SHOW_CAMERA_BUTTON = false
        ```

* `CustomMyCredentialsScreen` - (React Component) custom component for Credentials screen rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomMyCredentialsScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomMyCredentialsScreen = () => <Text>Custom Credentials</Text>
        ``` 

* `CustomMyCredentialsScreen` - (React Component) custom component for Credential Details screen rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomCredentialDetailsScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomCredentialDetailsScreen = () => <Text>Custom Credential Details</Text>
        ``` 

#### Navigation Menu

You can configure navigation menu inside the `navigator.js` module.

* `navigationOptions` - (object) The set of navigation options (and their labels) to be shown.
    * to use default - `{ Home, Connections, Credentials, Settings }`
        ```javascript
        export const HomeViewEmptyState = null
        ```
    * to use custom 
        ```javascript
        export const NAVIGATION_OPTIONS = {
          settings: { label: 'Settings' },
        }
        ```

**Note** - `Home` screen is always included.

* `DrawerHeaderContent` - (React Component) You can provide component to be displayed in the navigation drawer at the top, above the navigation section.
    * to use default 
        ```javascript
        export const DrawerHeaderContent = null
        ```
    * to omit 
        ```javascript
        export const DrawerHeaderContent = () => null
        ```
    * to use custom 
        ```javascript
        export const DrawerHeaderContent = (props: {
          height: number,
          width: number,
          fill: string,
        }) => <Text>You are using sdk-app</Text>
        ```

* `DrawerFooterContent` - (React Component) You can provide component to be displayed in the navigation drawer at the bottom, below the navigation section.
    * to use default 
        ```javascript
        export const DrawerFooterContent = null
        ```    
    * to omit 
        ```javascript
        export const DrawerFooterContent = () => null
        ```
    * to use custom 
        ```javascript
        export const DrawerFooterContent = () => <Text>You are using wallet 1.0.0</Text>
        ```

#### Collecting log information

You can configure data used for logging in the `logs.js` module.

You can receive encrypted log file by email.

* `SEND_LOGS_EMAIL` - (string) - email to send logs.
    * to use default - `cmsupport@evernym.com`
        ```javascript
        export const SEND_LOGS_EMAIL = null
        ```
    * to use custom 
        ```javascript
        export const SEND_LOGS_EMAIL = 'support@app.com'
        ```

* `CUSTOM_LOG_UTILS` - (object) key or URL to the file containing key used for log encryption.

    ```javascript
    export let CUSTOM_LOG_UTILS = {
      publicKeyUrl: '...',
      encryptionKey: '...',
    }
    ```

#### Credential Offer

You can customize `Credential Offer` dialog in the `credential-offer.js` module.

* `HEADLINE` - (string) the text which will be used for the header.
    * to use default - `Credential Offer`
        ```javascript
        export const HEADLINE = null
        ```
    * to use custom 
        ```javascript
        export const HEADLINE = 'Custom Credential Offer'
        ```

* `ACCEPT_BUTTON_TEXT` - (string) the text which will be used for top (accept) button.
    * to use default - `Accept Credential`
        ```javascript
        export const ACCEPT_BUTTON_TEXT = null
        ```
    * to use custom 
        ```javascript
        export const ACCEPT_BUTTON_TEXT = 'Accept'
        ```

* `DENY_BUTTON_TEXT` - (string) the text which will be used for bottom (deny) button.
    * to use default - `Reject`
        ```javascript
        export const DENY_BUTTON_TEXT = null
        ```
    * to use custom 
        ```javascript
        export const DENY_BUTTON_TEXT = 'Deny'
        ```

* `CustomCredentialOfferModal` - (React Component) custom component for Credential Offer dialog rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomCredentialOfferModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomCredentialOfferModal = () => <Text>Custom Credential Offer Dialog</Text>
        ``` 

* `CustomCredentialOfferModal` - (React Component) custom component for received Credential dialog rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomCredentialModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomCredentialModal = () => <Text>Custom Credential Dialog</Text>
        ``` 

#### Proof Request 

You can customize `Proof Request` dialog in the `proof-request.js` module.

* `HEADLINE` - (string) the text which will be used for the header.
    * to use default - `Proof Request`
        ```javascript
        export const HEADLINE = null
        ```
    * to use custom 
        ```javascript
        export const HEADLINE = 'Custom Request'
        ```

* `ACCEPT_BUTTON_TEXT` - (string) the text which will be used for top (accept) button.
    * to use default - `Share Attributes`
        ```javascript
        export const ACCEPT_BUTTON_TEXT = null
        ```
    * to use custom 
        ```javascript
        export const ACCEPT_BUTTON_TEXT = 'Accept'
        ```

* `DENY_BUTTON_TEXT` - (string) the text which will be used for bottom (deny) button.
    * to use default - `Reject`
        ```javascript
        export const DENY_BUTTON_TEXT = null
        ```
    * to use custom 
        ```javascript
        export const DENY_BUTTON_TEXT = 'Deny'
        ```
      
* `CustomProofRequestModal` - (React Component) custom component for received Proof Request dialog rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomProofRequestModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomProofRequestModal = () => <Text>Custom Proof Request Dialog</Text>
        ``` 

* `CustomSharedProofModal` - (React Component) custom component for shared Proof dialog rendering (instead of predefined one).
    * to use default
        ```javascript
        export const CustomSharedProofModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomSharedProofModal = () => <Text>Custom Proof Dialog</Text>
        ``` 

* `CustomSelectAttributeValueModal` - (React Component) custom component for selecting a credential for filling a requested attribute in Proof (instead of predefined one).
    * to use default
        ```javascript
        export const CustomSelectAttributeValueModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomSelectAttributeValueModal = () => <Text>Custom Dialog</Text>
        ``` 

* `CustomSelectAttributesValuesModal` - (React Component) custom component for selecting a credential for filling a requested attribute group in Proof (instead of predefined one).
    * to use default
        ```javascript
        export const CustomSelectAttributesValuesModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomSelectAttributesValuesModal = () => <Text>Custom Dialog</Text>
        ``` 

* `CustomSelectAttributesValuesModal` - (React Component) custom component for entering a custom value for a requested attribute which can be self attested in Proof (instead of predefined one).
    * to use default
        ```javascript
        export const CustomEnterAttributeValueModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomEnterAttributeValueModal = () => <Text>Custom Dialog</Text>
        ``` 

#### Question dialog 

You can customize `Question` dialog in the `question-dialog.js` module.

* `HEADLINE` - (string) the text which will be used for the header.
    * to use default - `Proof Request`
        ```javascript
        export const HEADLINE = null
        ```
    * to use custom 
        ```javascript
        export const HEADLINE = 'Custom Request'
        ```

* `CustomQuestionModal` - (React Component) custom component for rendering of Question dialog (instead of predefined one).
    * to use default
        ```javascript
        export const CustomQuestionModal = null
        ```    
    * to use custom 
        ```javascript
        export const CustomQuestionModal = () => <Text>Custom Question Dialog</Text>
        ``` 

#### Settings

You can customize `Settings` view in the `settings.js` module.

1. `HEADLINE` - (string) the text which will be used for the header.
    * to use default - `Settings`
        ```javascript
        export const HEADLINE = null
        ```
    * to use custom 
        ```javascript
        export const HEADLINE = 'Custom Settings'
        ```
   
1. `settingsOptions` - (object) The set of options to be shown. Optionally, you can also specify option title, subtitle, and icon. 
    * to use default - `{ biometrics, passcode, about }`
        ```javascript
        export const SETTINGS_OPTIONS = null
        ```
    * to use custom - Note, that `title`, `subtitle`, and `icon` are optional
        ```javascript
        export const SETTINGS_OPTIONS = {
          biometrics: { 
            title: 'Biometrics', 
            subtitle: 'Use your finger or face to secure app' 
          },
          passcode: {},
          feedback: { 
            title: 'Give app feedback' 
          },
          logs: {
            icon: <EvaIcon name="message-square-outline" />
          },
          about: { 
            title: 'Give app feedback' 
          },
        }
        ```
      
      Options: 
        * `biometrics` - enable/disable using finger or face to secure app 
        * `passcode` - change your app passcode
        * `logs` - send logs to development team
        * `about` - application information
        * `feedback` - give the app a feedback

* `SHOW_CAMERA_BUTTON` - (boolean, Optional) flag indicating whether you want to show camera button.
    * to use default - `true`
        ```javascript
        export const SHOW_CAMERA_BUTTON = null
        ```
    * to use custom
        ```javascript
        export const SHOW_CAMERA_BUTTON = false
        ```

* `CustomSettingsScreen` - (React Component) custom component for rendering of Settings screen (instead of predefined one).
    * to use default
        ```javascript
        export const CustomSettingsScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomSettingsScreen = () => <Text>Custom Settings</Text>
        ``` 

#### Feedback

In order to gather application feedback is used `Apptentive`. 
You can provide credentials to be used for setting up `Apptentive` module in `feedback.js` file.
Note: This variable is mandatory if you want to enable `feedback` option on `Settings` screen.

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

#### Application information

The information about the application which will be shown on `About` screen can be configured in `app.js` file.

* `INFO` - (object) object specifying which information need to be show
    * to use default - `appLogo, appName, appVersion, appEnvironment, builtBy, poweredBy, termsAndConditions, privacyPolicy`
        ```javascript
        export const INFO = null
        ```
    * to use custom 
        ```javascript
        export const INFO = {
            appLogo: true, // show application logo
            appName: true, // show application name
        }
        ```

      Options: 
        * `appLogo` - show application logo
        * `appName` - show application name
        * `appVersion` - show application version
        * `appEnvironment` - show application environment
        * `builtBy` - show company label/name built application 
        * `poweredBy` - powered by Evernym label
        * `termsAndConditions` - end user license agreement
        * `privacyPolicy` - privacy policy document

* `AdditionalInfo` - (React Component) some additional information which will be show on the screen
    * to omit
        ```javascript
        export const AdditionalInfo = null
        ```
    * to use custom 
        ```javascript
        export const AdditionalInfo = () => <Text>Extra data</Text>
        ```

* `CustomAboutAppScreen` - (React Component) custom component for rendering of About screen (instead of predefined one).
    * to use default
        ```javascript
        export const CustomAboutAppScreen = null
        ```    
    * to use custom 
        ```javascript
        export const CustomAboutAppScreen = () => <Text>Custom About</Text>
        ```

#### Splash screen and app icon

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

#### Further customization

For further customizations, you can refer to provided sample configuration or the source code.
