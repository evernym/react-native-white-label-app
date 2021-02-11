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
* [Credential Offer](#credential-offer)
* [Proof Request](#proof-request)
* [Question dialog](#question-dialog)
* [Settings](#settings)
* [Feedback](#feedback)
* [Application information](#application-information)
* [Splash screen and app icon](#splash-screen-and-app-icon)
* [Advanced](#advanced)

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

#### Receiving Message

There are two strategies regarding receiving messages by an application:

1. **Polling** - app once in a while calls Cloud Agent to get all new messages for all existing connections.

2. **Push Notifications** - There is configured Push Notification service which notifies the application about new messages.

By default, app uses **Polling** strategy which follows rules:

* Download messages by manual pulling screen down
* Download messages when a user navigates to `Home` screen.
* Download messages every 15 seconds when a user holds on `Home` screen. 
* Download messages in 30 second after taking some action (accepting Connection Invitation / Credential Offer / Proof Request)

If you wish to use **Push Notifications** strategy you need to set variable `USE_PUSH_NOTIFICATION` in the `app.js` module:
* `USE_PUSH_NOTIFICATION` - (boolean, Optional) whether you want to enable push notifications logic.
    * to use default - **false**
        ```javascript
        export const USE_PUSH_NOTIFICATION = null
        ```
    * to enable
        ```javascript
        export const USE_PUSH_NOTIFICATION = true
        ```
      
**NOTE** that if you decided to enable Push Notifications you **MUST** configure Firebase for target build platforms!
* [Android](./Build-Android.md#push-notifications-configuration)  
* [iOS](./Build-iOS.md#push-notifications-configuration)  
      
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
      Default:
      * Debug - `DEVTEAM1`
           ```
            agencyUrl: 'https://agency-team1.pdev.evernym.com',
            agencyDID: 'TGLBMTcW9fHdkSqown9jD8',
            agencyVerificationKey: 'FKGV9jKvorzKPtPJPNLZkYPkLhiS1VbxdvBgd1RjcQHR',
            poolConfig: '{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","blskey_pop":"RahHYiCvoNCtPTrVtP7nMC5eTYrsUA8WjXbdhNc8debh1agE9bGiJxWBXYNFbnJXoXhWFMvyqhqhRoq737YQemH5ik9oL7R4NTTCz2LEZhkgLJzB3QRQqJyBNyv7acbdHrAT8nQ9UkLbaVL9NBpnWXBTw4LEMePaSHEw66RzPNdAX1","client_ip":"54.71.181.31","client_port":9702,"node_ip":"54.71.181.31","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","blskey_pop":"Qr658mWZ2YC8JXGXwMDQTzuZCWF7NK9EwxphGmcBvCh6ybUuLxbG65nsX4JvD4SPNtkJ2w9ug1yLTj6fgmuDg41TgECXjLCij3RMsV8CwewBVgVN67wsA45DFWvqvLtu4rjNnE9JbdFTc1Z4WCPA3Xan44K1HoHAq9EVeaRYs8zoF5","client_ip":"54.71.181.31","client_port":9704,"node_ip":"54.71.181.31","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","blskey_pop":"QwDeb2CkNSx6r8QC8vGQK3GRv7Yndn84TGNijX8YXHPiagXajyfTjoR87rXUu4G4QLk2cF8NNyqWiYMus1623dELWwx57rLCFqGh7N4ZRbGDRP4fnVcaKg1BcUxQ866Ven4gw8y4N56S5HzxXNBZtLYmhGHvDtk6PFkFwCvxYrNYjh","client_ip":"54.71.181.31","client_port":9706,"node_ip":"54.71.181.31","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","blskey_pop":"RPLagxaR5xdimFzwmzYnz4ZhWtYQEj8iR5ZU53T2gitPCyCHQneUn2Huc4oeLd2B2HzkGnjAff4hWTJT6C7qHYB1Mv2wU5iHHGFWkhnTX9WsEAbunJCV2qcaXScKj4tTfvdDKfLiVuU2av6hbsMztirRze7LvYBkRHV3tGwyCptsrP","client_ip":"54.71.181.31","client_port":9708,"node_ip":"54.71.181.31","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}',
          ```
      * Production - `PROD`
          ```
            agencyUrl: 'https://agency.evernym.com',
            agencyDID: 'DwXzE7GdE5DNfsrRXJChSD',
            agencyVerificationKey: '844sJfb2snyeEugKvpY7Y4jZJk9LT6BnS6bnuKoiqbip',
            poolConfig: '{"reqSignature":{},"txn":{"data":{"data":{"alias":"ev1","client_ip":"54.207.36.81","client_port":"9702","node_ip":"18.231.96.215","node_port":"9701","services":["VALIDATOR"]},"dest":"GWgp6huggos5HrzHVDy5xeBkYHxPvrRZzjPNAyJAqpjA"},"metadata":{"from":"J4N1K1SEB8uY2muwmecY5q"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"b0c82a3ade3497964cb8034be915da179459287823d92b5717e6d642784c50e6"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"zaValidator","client_ip":"154.0.164.39","client_port":"9702","node_ip":"154.0.164.39","node_port":"9701","services":["VALIDATOR"]},"dest":"BnubzSjE3dDVakR77yuJAuDdNajBdsh71ZtWePKhZTWe"},"metadata":{"from":"UoFyxT8BAqotbkhiehxHCn"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"d5f775f65e44af60ff69cfbcf4f081cd31a218bf16a941d949339dadd55024d0"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"danube","client_ip":"128.130.204.35","client_port":"9722","node_ip":"128.130.204.35","node_port":"9721","services":["VALIDATOR"]},"dest":"476kwEjDj5rxH5ZcmTtgnWqDbAnYJAGGMgX7Sq183VED"},"metadata":{"from":"BrYDA5NubejDVHkCYBbpY5"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"ebf340b317c044d970fcd0ca018d8903726fa70c8d8854752cd65e29d443686c"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"royal_sovrin","client_ip":"35.167.133.255","client_port":"9702","node_ip":"35.167.133.255","node_port":"9701","services":["VALIDATOR"]},"dest":"Et6M1U7zXQksf7QM6Y61TtmXF1JU23nsHCwcp1M9S8Ly"},"metadata":{"from":"4ohadAwtb2kfqvXynfmfbq"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"24d391604c62e0e142ea51c6527481ae114722102e27f7878144d405d40df88d"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"digitalbazaar","client_ip":"34.226.105.29","client_port":"9701","node_ip":"34.226.105.29","node_port":"9700","services":["VALIDATOR"]},"dest":"D9oXgXC3b6ms3bXxrUu6KqR65TGhmC1eu7SUUanPoF71"},"metadata":{"from":"rckdVhnC5R5WvdtC83NQp"},"type":"0"},"txnMetadata":{"seqNo":5,"txnId":"56e1af48ef806615659304b1e5cf3ebf87050ad48e6310c5e8a8d9332ac5c0d8"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"OASFCU","client_ip":"38.70.17.248","client_port":"9702","node_ip":"38.70.17.248","node_port":"9701","services":["VALIDATOR"]},"dest":"8gM8NHpq2cE13rJYF33iDroEGiyU6wWLiU1jd2J4jSBz"},"metadata":{"from":"BFAeui85mkcuNeQQhZfqQY"},"type":"0"},"txnMetadata":{"seqNo":6,"txnId":"825aeaa33bc238449ec9bd58374b2b747a0b4859c5418da0ad201e928c3049ad"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"BIGAWSUSEAST1-001","client_ip":"34.224.255.108","client_port":"9796","node_ip":"34.224.255.108","node_port":"9769","services":["VALIDATOR"]},"dest":"HMJedzRbFkkuijvijASW2HZvQ93ooEVprxvNhqhCJUti"},"metadata":{"from":"L851TgZcjr6xqh4w6vYa34"},"type":"0"},"txnMetadata":{"seqNo":7,"txnId":"40fceb5fea4dbcadbd270be6d5752980e89692151baf77a6bb64c8ade42ac148"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"DustStorm","client_ip":"207.224.246.57","client_port":"9712","node_ip":"207.224.246.57","node_port":"9711","services":["VALIDATOR"]},"dest":"8gGDjbrn6wdq6CEjwoVStjQCEj3r7FCxKrA5d3qqXxjm"},"metadata":{"from":"FjuHvTjq76Pr9kdZiDadqq"},"type":"0"},"txnMetadata":{"seqNo":8,"txnId":"6d1ee3eb2057b8435333b23f271ab5c255a598193090452e9767f1edf1b4c72b"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"prosovitor","client_ip":"138.68.240.143","client_port":"9711","node_ip":"138.68.240.143","node_port":"9710","services":["VALIDATOR"]},"dest":"C8W35r9D2eubcrnAjyb4F3PC3vWQS1BHDg7UvDkvdV6Q"},"metadata":{"from":"Y1ENo59jsXYvTeP378hKWG"},"type":"0"},"txnMetadata":{"seqNo":9,"txnId":"15f22de8c95ef194f6448cfc03e93aeef199b9b1b7075c5ea13cfef71985bd83"},"ver":"1"}\n{"reqSignature":{},"txn":{"data":{"data":{"alias":"iRespond","client_ip":"52.187.10.28","client_port":"9702","node_ip":"52.187.10.28","node_port":"9701","services":["VALIDATOR"]},"dest":"3SD8yyJsK7iKYdesQjwuYbBGCPSs1Y9kYJizdwp2Q1zp"},"metadata":{"from":"JdJi97RRDH7Bx7khr1znAq"},"type":"0"},"txnMetadata":{"seqNo":10,"txnId":"b65ce086b631ed75722a4e1f28fc9cf6119b8bc695bbb77b7bdff53cfe0fc2e2"},"ver":"1"}',
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

You can configure navigation menu and app navigation inside the `navigator.js` module.

* `MENU_NAVIGATION_OPTIONS` - (object) The set of navigation options (and their labels) to be shown.
    * to use default
        ```javascript
        export const MENU_NAVIGATION_OPTIONS = null
        ```
        Default tabs:
        * Home
        * Connections
        * Credentials
        * Settings
    * to change predefined (for predefined routes `name, label, route, icon` are optional fields / defaults will be used if they are not specified) 
        ```javascript
        // Menu contains Home and Connections tabs
        export const MENU_NAVIGATION_OPTIONS = [
          {
            name: 'Connections',
            label: 'Other Connection Label'
          }
        ]     
        ```
    * to change order
        ```javascript
        export const MENU_NAVIGATION_OPTIONS = [
          {
            name: 'Settings',
          },
          {
            name: 'Connections',
          },
          {
            name: 'Credentials',
          }
        ]     
        ```
    * to add new route
        ```javascript
        // Menu contains Home and My Route tabs
        export const Component = () => {
          return <Text style={{color: colors.black}}>MY SCREEN</Text>
        }
        export const MENU_NAVIGATION_OPTIONS = [
          { 
            name: 'My Route', // id
            label: 'My Route', // label to show
            route: 'route', // route name
            icon: <Icon name="my" />, // icon to use
            component: Component // React Component to render
          }
        ]     
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

* `EXTRA_SCREENS` - (object) additional routes need to be registered in the app navigator inside **Screens** Stack Navigator (see https://reactnavigation.org/docs/stack-navigator/)
    * to use default
        ```javascript
        export const EXTRA_SCREENS = null
        export const EXTRA_SCREENS = []
        ```
    * to add custom 
        ```javascript
        export const Component = () => {
          return <Text style={{color: colors.black}}>MY SCREEN</Text>
        }
        export const EXTRA_SCREENS = [
          { 
            route: 'route', // route name
            component: Component, // React Component to render
            options: { title: 'Awesome app' } // see https://reactnavigation.org/docs/screen-options
          }
        ]
        ```

* `EXTRA_MODALS` - (object) additional routes need to be registered in the app navigator inside **Modal Windows** Stack Navigator (see https://reactnavigation.org/docs/stack-navigator/)
    * to use default
        ```javascript
        export const EXTRA_MODALS = null
        export const EXTRA_MODALS = []
        ```
    * to add custom 
        ```javascript
        export const Component = () => {
          return <Text style={{color: colors.black}}>MY SCREEN</Text>
        }
        export const EXTRA_MODALS = [
          { 
            route: 'route', // route name
            component: Component, // React Component to render
            options: { title: 'Awesome app' } // see https://reactnavigation.org/docs/screen-options
          }
        ]
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
    * to use default
        ```javascript
        export const SETTINGS_OPTIONS = null
        ```
        Defaults:
        * Biometrics
        * Passcode
        * Logs
        * About
        
        Predefined Options: 
        * `Biometrics` - enable/disable using finger or face to secure app 
        * `Passcode` - change your app passcode
        * `Logs` - send logs to development team
        * `About` - application information
        * `Feedback` - give the app a feedback
    * to change predefined (for predefined options `title, subtitle, avatar, rightIcon, onPress` are optional fields / defaults will be used if they are not specified) 
        ```javascript
        // Menu contains Home and Connections tabs
        export const SETTINGS_OPTIONS = [
          {
            name: 'Biometrics',
            label: 'Other Biometrics Label'
          }
        ]     
        ```
    * to change order
        ```javascript
        export const SETTINGS_OPTIONS = [
          {
            name: 'About',
          },
          {
            name: 'Biometrics',
          },
          {
            name: 'Logs',
          }
        ]     
        ```
    * to add new setting
        ```javascript
        // Settings contains Biometrics and Custom settings
        export const SETTINGS_OPTIONS = [
            {
              name: 'Biometrics',
            },
            {
              name: 'Custom',
              title: 'Custom Option', // title
              subtitle: null, // (optional) - description 
              avatar: null, // (optional) - icon to show on the left
              rightIcon: null, // (optional) - icon to show on the right
              onPress: null, // (optional) - handler on touch
            },
        ]     
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

#### Advanced

For advanced customizations, you can refer to this [document](./Advanced.md) describing MSDK internals.
