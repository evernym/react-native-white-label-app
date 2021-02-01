## Configuration

After running `evernym-sdk:configure` command all required modules and assets will set up with default values. 

**Ensure** that you completed build configuration for target platforms.

You should be able to run the application at this point or proceed to modify provided default configuration.

#### Splash screen and app icon

These are configured inside your application for specific platforms.

#### Application Name

Application name is set by constant string `APP_NAME` provided in the `app.js` module inside configuration folder.

```javascript
export const APP_NAME = 'AppName'
```

#### Application Images

The `app.js` module contains constants which allows setting images that will be used across the app:

`APP_LOGO` - small app logo.  
`APP_IMAGE` - big app logo.  
`DEFAULT_USER_AVATAR` - default user avatar placeholder.

By default, they are set to use example images from `app/evernym-sdk/images` subdirectory.

```javascript
export const APP_LOGO = require('./images/logo_app.png')
export const APP_IMAGE = require('./images/cb_app.png')
export const DEFAULT_USER_AVATAR = require('./images/UserAvatar.png')
``` 

#### App banner icon

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

#### Color theme

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

#### End User License Agreement

You can provide links to your EULA and privacy terms inside the `eula.js` module.
Local assets are also supported and used when there are connectivity issues.

#### Start up

You can provide background image that will be used through the application startup wizard which is shown for the newly installed app.

```javascript
export const BACKGROUND_IMAGE = require('./images/setup.png')
``` 

#### Home screen

1. `HEADLINE` - (string) the text which will be used for the header.

1. `HomeViewEmptyState` - (React Component) component to be displayed at the home screen in cases of no recent notifications.

    This will usually happen after new installation of the application.
    
    You can provide a greeting message as in this example:
    
    ```javascript
    export const HomeViewEmptyState = () => {
      return (
        <Text>Hello, you now have a digital wallet!</Text>
      )
    }
    ```

1. `SHOW_EVENTS_HISTORY` - (boolean) a flag indicating whether you want to show the history of events on the Home view.   

#### Connections screen

1. `HEADLINE` - (string) the text which will be used for the header.

1. `MyConnectionsViewEmptyState` - (React Component) component to be displayed at the connections screen in cases of no connections made yet.
    ```javascript
    export const MyConnectionsViewEmptyState = () => {
      return (
        <Text>You do not have connections yet!</Text>
      )
    }
    ```

#### Credentials screen

1. `HEADLINE` - (string) the text which will be used for the header.

1. `MyConnectionsViewEmptyState` - (React Component) component to be displayed at the credentials screen in cases of no credentials made yet.
    ```javascript
    export const MyCredentialsViewEmptyState = () => {
      return (
        <Text>You do not have credentials yet!</Text>
      )
    }
    ```

#### Navigation drawer

You can customize navigation menu in `navigator.js` file.

1. The set of navigation options (and their labels) to be shown.
    ```javascript
    export const navigationOptions = {
      connections: { label: 'My Connections' },
      credentials: { label: 'My Credentials' },
      settings: { label: 'Settings' },
    }
    ```

1. You can provide component to be displayed in the navigation drawer at the bottom, below the navigation section.

    You can provide contents for the footer like this:
    
    ```javascript
    export function DrawerFooterContent() {
      return (
        <Text>You are using wallet 1.0.0</Text>
      )
    }
    ```

#### Server environment

You can override used environment in the `provision.js` module.

1.  Let's define our own production and development configuration:
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

1. `DEFAULT_SERVER_ENVIRONMENT` - the name of environment to use by default.

1. Information used for application provisioning
    * `VCX_PUSH_TYPE` -  type of push notifications
        * 1 - push notification to default app
        * 3 - forwarding
        * 4 - sponsor configured app
    * `SPONSOR_ID` - An ID given to you from Evernym's Support Team after the Sponsor onboarding process is complete.

#### Collecting log information

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

#### Credential Offer dialog

You can customize labels used for dialog in `credential-offer-dialog.js` module.

1. `HEADLINE` - (string) the text which will be used for the header.
1. `ACCEPT_BUTTON_TEXT` - (string) the text which will be used for top (accept) button.
1. `DENY_BUTTON_TEXT` - (string) the text which will be used for bottom (deny) button.

#### Proof Request dialog 

You can customize labels used for dialog in `proof-request-dialog.js` module.

1. `HEADLINE` - (string) the text which will be used for the header.
1. `ACCEPT_BUTTON_TEXT` - (string) the text which will be used for top (accept) button.
1. `DENY_BUTTON_TEXT` - (string) the text which will be used for bottom (deny) button.

#### Settings

You can customize settings view in `settings.js` file.

1. `HEADLINE` - (string) the text which will be used for the header.

1. The set of options (and their labels) to be shown.
    ```javascript
    export const settingsOptions = {
      biometrics: { title: 'Biometrics', subtitle: 'Use your finger or face to secure app' },
      passcode: { title: 'Passcode', subtitle: `View/Change your ${APP_NAME} passcode` },
      feedback: { title: 'Give app feedback', subtitle: `Tell us what you think of ${APP_NAME}` },
      about: { title: 'About', subtitle: 'Legal, Version, and Network Information' },
    }
    ```

#### Feedback

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


#### Further customization

For further customizations, you can refer to provided sample configuration or the source code.
