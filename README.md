## Evernym React Native White Label App

- [Evernym React Native White Label App](#evernym-react-native-white-label-app)
- [Introduction](#introduction)
  - [Decentralized Identifier - DID](#decentralized-identifier---did)
  - [Verifiable Credentials](#verifiable-credentials)
- [React MSDK](#react-msdk)
- [Creating a new application with React MSDK](#creating-a-new-application-with-react-msdk)
    - [Create base app](#create-base-app)
    - [Base app configuration](#base-app-configuration)
    - [Android](#android)
    - [iOS](#ios)
- [Customization](#customization)
  
## Introduction

Self Sovereign Identity is a lifetime portable identity for any person, organization, or thing that does not depend on any centralized authority and can never be taken away. Self-sovereign identity is a two-party relationship model, with no third party coming between you and the organization, now considered your “peer”.

SSI is possible today with DIDs and Verifiable Credentials.

### Decentralized Identifier - DID
DID is a new type of globally unique identifier (URI) that does not require a centralized registration authority because control of the identifier can be proved using cryptography. You can think of it like one of the identifiers we’re more familiar with—a domain name or a phone number—without a central registrar like ICANN or NANP.

### Verifiable Credentials
Verifiable Credential (VC) is the new format for interoperable digital credential being defined by the W3C Verifiable Claims Working Group. Verifiable credentials conform to the [W3C’s Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/), and they facilitate interactions using a pattern called the triangle of trust:

Issuers create credentials, usually by having JSON docs [digitally signed](https://en.wikipedia.org/wiki/Digital_signature) in a special way. Holders store them, and verifiers ask for proof based upon them. Verifiable presentations that Holders provide to Verifiers are packages of evidence—either credentials, or data derived from one or more credentials—built by holders to satisfy a verifier’s requirements. Verifiers learn with certainty which issuers have attested something by checking digital signatures against a verifiable data registry (typically, a blockchain).

## React MSDK

React MSDK is built using [Evernym Mobile SDK](https://gitlab.com/evernym/mobile/mobile-sdk) as an [Aries compatible](https://www.hyperledger.org/projects/aries) React Native package which allows the quick building of customized digital wallets (completely under your control) representing a Holder side in the Verifiable Credentials model.

With React-Native Mobile SDK, your application can:
- Form private, secure connections with other entities in the Sovrin ecosystem
- Gather and store digital credentials
- Present digital proofs of part or all of your credentials, privately and securely
- Answer secure messages from any connection you have

The identity wallet app enables myriad use cases, including proving you’re over a specific legal age without revealing your exact date of birth, sharing health records privately and securely, and doing away with the username-and-password concept once and for all.

For the testing of your identity wallet you can use [Verity SDK](https://gitlab.com/evernym/verity/verity-sdk) representing the opposite communication side.

> In the [Evernym Mobile SDK](https://gitlab.com/evernym/mobile/mobile-sdk) and [Verity SDK](https://gitlab.com/evernym/verity/verity-sdk) repositories you can find a lot of useful information regarding building identity wallets and verifiable credentials exchange process.
 
## Prerequisites

- **Node >12.13** . Preferred way to install node is via [nvm](https://www.sitepoint.com/quick-tip-multiple-versions-node-nvm/)
- **React Native**. The currently supported version is 0.61.4
- **Sponsor server**. <br />
  You must have a Sponsor Server registered in Evernym environment.
  See [the document](https://gitlab.com/evernym/mobile/mobile-sdk/-/blob/main/docs/2.Initialization.md#sponsor-server) describing Sponsor onboarding process in detail. <br />
  During the application configuration, you will have to provide a function querying an agent provisioning token from your Sponsor Server.

## Creating a new application with React MSDK

To create a new project, you would need to go through the following steps.

#### Create base app
Create new react native project. We will call it `awesomeMsdkProject` for this guide.
```shell
npx react-native init awesomeMsdkProject --version 0.61.4
```

**NOTE**: you need to use the same version of `react-native` as specified in `peerDependencies` section of `package.json` file for the evernym react-native-sdk.
The currently recommended React-Native version is `0.61.4`.
By using a different version you are taking a risk of having issues with sdk.

#### Base app configuration

1. To include SDK in your new application, you need to set up it's dependencies.  
   Replace dependencies section leaving only `@evernym/react-native-white-label-app` dependency to your `package.json`.

    ```json
    "dependencies": {
        "@evernym/react-native-white-label-app": "https://gitlab.com/evernym/mobile/react-native-white-label-app.git",
      },
    ```

1. Native dependencies should be put in app dependencies (see [issue](https://github.com/react-native-community/cli/issues/870)). They are listed as peer dependencies in SDK.  
   Add all peer dependencies from `@evernym/react-native-white-label-app` into `dependencies` section of your app `package.json`.

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

1. Add all `devDependencies` from `@evernym/react-native-white-label-app` into `devDependencies` section of your app `package.json`.

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
        "evernym-sdk:configure": "yarn --cwd node_modules/@evernym/react-native-white-label-app run configure"
      },
    ```

   This command will add necessary modules for future application customization via `evernym-sdk`.

1. Now you can install all dependencies and do the automatic configuration, run following commands in your project directory:
    ```shell
    yarn
    yarn evernym-sdk:configure
    ```

   This will install all dependencies and add required modules to the `awesomeMsdkProject/app/evernym-sdk` directory.

1. Remove default `App.js` and put the following in `index.js`:
    ```javascript
      import * as EvernymSdk from '@evernym/react-native-white-label-app';
      import {name as appName} from './app.json';
      
      EvernymSdk.createApp(appName);
    ```

1. Navigate to `app/evernym-sdk/provision.js` file and define environment to be used by your application and function to be called for getting provisioning tokens.
   
    > **NOTE** that the application environment MUST match the environment where Sponsor Server is registered. <br />
      For example, the application must use `DEMO` if Sponsor Server was registered on the `DEMO` environment.

    * `DEFAULT_SERVER_ENVIRONMENT` - the name of environment to use. 

      There are several predefined environments:
        ```javascript
        // use default combination - DEMO for debug and PROD for releases builds
        export const DEFAULT_SERVER_ENVIRONMENT = null 
      
        // use Demo env
        // Agency: `https://agency.pps.evernym.com` and `Sovrin Staging Net`
        export const DEFAULT_SERVER_ENVIRONMENT = 'DEMO' 
      
        // use Production env
        // Agency: `https://agency.evernym.com` and `Sovrin Live Net`
        export const DEFAULT_SERVER_ENVIRONMENT = 'PROD' 
      
        // use Staging env
        // Agency: `https://agency.pstg.evernym.com` and `Sovrin Staging Net`
        export const DEFAULT_SERVER_ENVIRONMENT = 'STAGING' 
        ```

      You can also provide and use your custom environment using a combination of `SERVER_ENVIRONMENTS` and `DEFAULT_SERVER_ENVIRONMENT` variables:
      ```javascript
        export const SERVER_ENVIRONMENTS = {
          'CUSTOM': {
            agencyUrl: 'ahency_url',
            agencyDID: 'did',
            agencyVerificationKey: 'verkey',
            poolConfig: [{ key: 'staging', genesis: 'genesis_transactions' }],
          }
        }
        export const DEFAULT_SERVER_ENVIRONMENT = 'CUSTOM' 
        ```

    * `GET_PROVISION_TOKEN_FUNC` - function will be called in order to get an agent provisioning token for your application.
       ```
        /// example
        export const GET_PROVISION_TOKEN_FUNC = async (): [error: string | null, token: string | null]  => {
          try {
             // call your sponsor server endpoint
             const response = fetch_api(your_endpoint)
             // process response
             // return result in format [error, token]
             return [null, response.token]
          } catch (error) {
             return [error.message, null]
          }
        }
      ```
  
1. Congrats! Now we have ready JS part of the application. As the next steps, we need to configure the build for the target platforms.

#### Android

**Note**: At this point, you should already have completed [Base app configuration](#base-app-configuration) section.

In order to configure the building of your application for an Android platform see the [document](./docs/Build-Android.md).

#### iOS

**Note**: At this point, you should already have completed [Base app configuration](#base-app-configuration) section.

In order to configure the building of your application for an iOS platform see the [document](./docs/Build-iOS.md).

## Customization

See [documentation](docs/Customization.md) to get an overview of available configuration options.

## Acknowledgements
This effort is part of a project that has received funding from the European Union’s Horizon 2020 research and innovation program under grant agreement No 871932 delivered through our participation in the eSSIF-Lab, which aims to advance the broad adoption of self-sovereign identity for the benefit of all.
