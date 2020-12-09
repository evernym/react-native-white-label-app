### How to send proof request to connect.me app

#### Prerequisite
- libvcx, libindy, libnullpay/libsovtoken binary for platform from where script needs to be running
- We should be able to call libvcx methods successfully
- We have code that can establish connection

> we can refer to a python script which is added below and has all steps for establishing a connection and sending a proof request and wait for response from user

### Steps to send a proof request

- Create a JSON of this format.
```js
{
  "attrs": [{
      "name": "illness"
      "self_attest_allowed": false,
      "restrictions": [{"issuer_did":"QreyffsPPLCUqetQbahYNu"}]
    },
    {
      "name": "symptoms"
    },
    {
      "name": "id"
    },
    {
      "name": "medicine"
    },
    {
      "name": "advice"
    }
  ],
  "sourceId": "79888675",
  "name": "Illness Proof",
  "revocationInterval": {}
}
```
- Create proof instance using below code
```python
proof = await Proof.create('proof_uuid', 'proof_from_alice', proof_attrs, {})
```
- Send proof to a connection
```python
await proof.request_proof(connection)
```

#### Data type for attribute
```js
{
  // required attribute
  name: String,
  // optional
  restrictions: Option<Array<{
    schema_id: Option<String>,
    schema_issuer_did: Option<String>,
    schema_name: Option<String>,
    schema_version: Option<String>,
    issuer_did: Option<String>,
    cred_def_id: Option<String>
  }>>,
  // optional
  non_revoked: Option<{
    from: Option<u64>,
    to: Option<u64>
  }>,
  // optional
  // by default ConnectMe will interpret that self attested value is allowed if this attribute is omitted
  self_attest_allowed: Option<bool>
}
```

### How to let prover know that some attributes can only be fulfilled via credentials

- In above attribute data type, we have a key `self_attest_allowed`. If we set this key to `false`, then prover would know that this attribute can only be fulfilled via credentials

- If there is a restriction set for an above attribute data type, it means that this attribute can only be fulfilled via credentials.

### How to fulfill proof

```python
  print("#1 Poll agency for a proof request")
  requests = await DisclosedProof.get_requests(connection_to_faber)

  print("#2 Create a Disclosed proof object from proof request")
  proof = await DisclosedProof.create('proof', requests[0])

  print("#3 Query for credentials in the wallet that satisfy the proof request")
  credentials = await proof.get_creds()

  # Use the first available credentials to satisfy the proof request
  for attr in credentials['attrs']:
      credentials['attrs'][attr] = {
          'credential': credentials['attrs'][attr][0]
      }

  print("#4 Generate the proof")
  await proof.generate_proof(credentials, {})

  print("#5 Send the proof to faber")
  await proof.send_proof(connection_to_faber)
```

### How to reject proof request

```python
  print("#1 Poll agency for a proof request")
  requests = await DisclosedProof.get_requests(connection_to_faber)

  print("#2 Create a Disclosed proof object from proof request")
  proof = await DisclosedProof.create('proof', requests[0])

  print("#3 Reject proof")
  proof = await DisclosedProof.reject_proof(connection_to_faber)
```

### From Verifier side, how to check whether user has fulfilled proof requested or rejected it

```python
  print("#20 Request proof of degree from alice")
  await proof.request_proof(connection)

  print("#21 Poll agency and wait for alice to provide proof")
  proof_state = await proof.get_state()
  while proof_state != State.Accepted and proof_state != State.Rejected:
      sleep(2)
      await proof.update_state()
      proof_state = await proof.get_state()

  if (proof_state == State.Accepted):
      print("#27 Process the proof provided by alice")
      await proof.get_proof(connection)

      print("#28 Check if proof is valid")
      if proof.proof_state == ProofState.Verified:
          print("proof is verified!!")
      else:
          print("could not verify proof :(")
  else:
      if (proof_state == State.Rejected):
          print("#29 Proof request fulfillment was rejected")
```

#### Test scripts

<details>
  <summary>Python test script to send proof request</summary>
  <p>

```python
#!/usr/bin/env python3

import random

from ctypes import cdll
from vcx.api.vcx_init import vcx_init, vcx_init_with_config
from vcx.api.utils import vcx_agent_provision, vcx_messages_download, vcx_set_active_txn_author_agreement_meta
from vcx.api.connection import Connection
from vcx.api.proof import Proof
from vcx.error import VcxError
from vcx.state import State, ProofState
from vcx.api.schema import Schema
from vcx.api.credential_def import CredentialDef
from vcx.api.issuer_credential import IssuerCredential
from multiprocessing import Process, Queue
from time import sleep

import shutil
import logging
import asyncio
import sys
import os
import json
import base64
import datetime
import time
# import qrcode


def clean_start(wallets_to_remove):
    """
    Erase existing wallets if they exist
    :return:
    """

    print("Remove test wallets...")
    wallet_path = '/Users/test/.indy_client/wallet'

    for _ in wallets_to_remove:
        check = wallet_path + os.sep + _
        if os.path.exists(check):
            print("\nRemoving {0}".format(check))
            shutil.rmtree(check, ignore_errors=True)
        else:
            print("Could not find {} or the wallet does not exist".format(check))


async def main():
    # Show the public DID for the connection
    # False means use a QR code
    use_public_did = False

    # Agency and wallet info
    wallet_key = 'provableinfowalletkey'
    genesis_file_location = '/Users/test/indy-sdk/vcx/wrappers/python3/genesis.txt'
    enterprise_seed = '00000000000000000000000000000000'
    pmt_method = 'null'
    ent_instituion_name = 'Test enterprise'
    ent_instituion_logo = 'http://robohash.org/234'

    # TestNet agency information
    ent_wallet_name = 'ent_provable-wallet'
    ent_agency_url = 'https://localhost:8080'
    ent_agency_did = 'QreyffsPPLCUqetQbahYNu'
    ent_agency_verkey = 'E194CfHi5GGRiy1nThMorPf3jBEm4tvcAgcb65JFfxc7'

    # Remove wallet if it exists
    clean_start([ent_wallet_name])

    # Provision first then run the test
    print("\n-- Provision enterprise")

    enterprise_config = {
        'agency_url': ent_agency_url,
        'agency_did': ent_agency_did,
        'agency_verkey': ent_agency_verkey,
        'wallet_name': ent_wallet_name,
        'wallet_key': wallet_key,
        'enterprise_seed': enterprise_seed,
        'payment_method': pmt_method,
        'genesis_path': genesis_file_location,
    }

    print("#1 provision agent")
    config = await vcx_agent_provision(json.dumps(enterprise_config))
    config = json.loads(config)

    # Set remaining configuration options specific to the enterprise
    config['payment_method'] = pmt_method
    config['institution_name'] = ent_instituion_name
    config['institution_logo_url'] = ent_instituion_logo
    config['genesis_path'] = genesis_file_location

    print("#2 load nullpay or sovtoken")
    # Init the payment plug-in
    if pmt_method == 'null':
        lib = cdll.LoadLibrary("libnullpay.dylib")
        lib.nullpay_init()
    else:
        lib = cdll.LoadLibrary("libsovtoken.dylib")
        lib.sovtoken_init()

    # Init using the config
    try:
        print("#3 init vcx")
        await vcx_init_with_config(json.dumps(config))
        print('\nVcx init complete (enterprise)')
    except VcxError as e:
        print("\nCould not initialize VCX: {0}".format(e))
        print("\nCould not initialize VCX (enterprise): {0}".format(e))

    print("#7 start creating connection with alice")
    connection = await Connection.create('alice')

    print("\n--  use public did:{}".format(use_public_did))
    if use_public_did:
        await connection.connect('{"use_public_did":true,"connection_type":"QR"}')
        invite_details = await connection.invite_details(True)
        print("\t-- Send_offer: invite_details:", invite_details)
    else:
        await connection.connect('{"connection_type":"QR"}')
        invite_details = await connection.invite_details(True)
        print('\n %s \n' % str(json.dumps(invite_details)))
        # img = qrcode.make(str(json.dumps(invite_details)))
        # img.save("qr.png")

    connection_state = await connection.get_state()
    while connection_state != State.Accepted:
        await asyncio.sleep(15)
        print("calling update_state")
        await connection.update_state()
        connection_state = await connection.get_state()
        print(connection_state)

    print("#8 Connection established with alice. state: " + str(connection_state))

    send_proof = "yes"
    while send_proof != "no":
        proof_attrs = [
            {'name': 'name', 'restrictions': [{'issuer_did': config['institution_did']}]},
            {'name': 'date'},
            {'name': 'degree'}
        ]

        print("#19 Create a Proof object")
        proof = await Proof.create('proof_uuid', 'proof_from_alice', proof_attrs, {})

        print("#20 Request proof of degree from alice")
        await proof.request_proof(connection)

        print("#21 Poll agency and wait for alice to provide proof")
        proof_state = await proof.get_state()
        while proof_state != State.Accepted and proof_state != State.Rejected:
            sleep(2)
            await proof.update_state()
            proof_state = await proof.get_state()

        if (proof_state == State.Accepted):
            print("#27 Process the proof provided by alice")
            await proof.get_proof(connection)

            print("#28 Check if proof is valid")
            if proof.proof_state == ProofState.Verified:
                print("proof is verified!!")
            else:
                print("could not verify proof :(")
        else:
            if (proof_state == State.Rejected):
                print("#29 Proof request fulfillment was denied")

        print("Finished")
        print("\n Want to send another question?(yes|no)")
        send_proof = input()

if __name__ == '__main__':
    print("If you are on a mac do...")
    print("You MUST copy this script to the /Users/test/evernym/indy-sdk.evernym/vcx/wrappers/python3 folder and run it from there or else it will not work")
    print(
        "export DYLD_LIBRARY_PATH=[path_to_folder_containing_libindy.dylib]:${DYLD_LIBRARY_PATH}")
    print(
        "ENV: export DYLD_LIBRARY_PATH=/Users/test/lib/mac/x86_64-apple-darwin:${DYLD_LIBRARY_PATH}")
    print("Usage: python3 ./proof_test.py")

    asyncio.get_event_loop().run_until_complete(main())

```
  </p>
</details>

<details>
  <summary>Node.js test script to send proof request. For import references, we can place below script inside `indy-sdk/vcx/wrappers/node/demo` </summary>
  <p>

```js
import {CredentialDef} from "../dist/api/credential-def";
import {IssuerCredential} from "../dist/api/issuer-credential";
import {Proof} from "../dist/api/proof";
import {Connection} from "../dist/api/connection";
import {Schema} from "./../dist/api/schema";
import {StateType, ProofState} from "../dist";
import sleepPromise from 'sleep-promise'
import * as demoCommon from "./common";
import {getRandomInt} from "./common";
import logger from './logger'

const utime = Math.floor(new Date() / 1000);

const provisionConfig = {
    'agency_url': 'http://localhost:8080',
    'agency_did': 'QreyffsPPLCUqetQbahYNu',
    'agency_verkey': 'E194CfHi5GGRiy1nThMorPf3jBEm4tvcAgcb65JFfxc7',
    'wallet_name': `node_vcx_demo_faber_wallet_${utime}`,
    'wallet_key': '123',
    'payment_method': 'null',
    'enterprise_seed': '00000000000000000000000000000000',
    'genesis_path': '/Users/test/indy-sdk/vcx/wrappers/python3/genesis.txt'
};

const logLevel = 'error';

async function run() {
    await demoCommon.initLibNullPay();

    logger.info("#0 initialize rust API from NodeJS");
    await demoCommon.initRustApiAndLogger(logLevel);

    logger.info("#1 Provision an agent and wallet, get back configuration details");
    logger.debug(`Config used to provision agent in agency: ${JSON.stringify(provisionConfig, null, 2)}`);
    let config = await demoCommon.provisionAgentInAgency(provisionConfig);
    config['genesis_path'] = '/Users/test/indy-sdk/vcx/wrappers/node/demo/genesis.txt'
    config['institution_name'] = 'Name'
    config['institution_logo_url'] = 'http://robohash.org/234'
    config['payment_method'] = 'null'

    logger.info("#2 Initialize libvcx with new configuration");
    logger.debug(`${JSON.stringify(config, null, 2)}`);
    await demoCommon.initVcxWithProvisionedAgentConfig(config);

    logger.info("#5 Create a connection to alice and print out the invite details");
    const connectionToAlice = await Connection.create({id: 'alice'});
    await connectionToAlice.connect('{"use_public_did": false}');
    await connectionToAlice.updateState();
    const details = await connectionToAlice.inviteDetails(true);
    logger.info("\n\n**invite details**");
    logger.info("**You'll ge queried to paste this data to alice side of the demo. This is invitation to connect.**");
    logger.info("**It's assumed this is obtained by Alice from Faber by some existing secure channel.**");
    logger.info("**Could be on website via HTTPS, QR code scanned at Faber institution, ...**");
    logger.info("\n******************\n\n");
    logger.info(JSON.stringify(JSON.parse(details)));
    logger.info("\n\n******************\n\n");

    logger.info("#6 Polling agency and waiting for alice to accept the invitation. (start alice.py now)");
    let connection_state = await connectionToAlice.getState();
    while (connection_state !== StateType.Accepted) {
        await sleepPromise(2000);
        await connectionToAlice.updateState();
        connection_state = await connectionToAlice.getState();
    }
    logger.info(`Connection to alice was Accepted!`);

    const proofAttributes = [
        {'name': 'name'},
        {'name': 'date'},
        {'name': 'degree'}
    ];

    logger.info("#19 Create a Proof object");
    const proof = await Proof.create({
        sourceId: "213",
        attrs: proofAttributes,
        name: 'proofForAlice',
        revocationInterval: {}
    });

    logger.info("#20 Request proof of degree from alice");
    await proof.requestProof(connectionToAlice);

    logger.info("#21 Poll agency and wait for alice to provide proof");
    let proofState = await proof.getState();
    while (proofState !== StateType.Accepted && proofState !== StateType.Rejected) {
        sleepPromise(2000);
        await proof.updateState();
        proofState = await proof.getState();
    }

    if (proofState === StateType.Accepted) {
      logger.info("#27 Process the proof provided by alice");
      await proof.getProof(connectionToAlice);
  
      logger.info("#28 Check if proof is valid");
      if (proof.proofState === ProofState.Verified) {
          logger.info("proof is verified!!")
      } else {
          logger.info("could not verify proof :(")
      }
    } else if (proofState === StateType.Rejected) {
      logger.info("#29 proof request fulfillment was denied by prover")
    }
}


run();
```

  </p>
</details>
