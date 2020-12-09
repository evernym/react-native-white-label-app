### How to send a message to connect.me app

#### Prerequisite
- libvcx, libindy, libnullpay/libsovtoken binary for platform from where script needs to be running
- We should be able to call libvcx methods successfully
- We have code that can establish connection

> we can refer to a python script which is added below and has all steps for establishing a connection and sending a message and wait 50 seconds for response from user

### Steps
- Create a JSON of this format. Refer for validation rules further
```js
{
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/committedanswer/1.0/question',
  '@id': '518be002-de8e-456e-b3d5-8fe472477a86',
  'question_text': 'Alice, are you on the phone with Bob from Faber Bank right now?',
  'question_detail': 'This is optional fine-print giving context to the question and its various answers.',
  'valid_responses': [
    {'text': 'Yes, it is me', 'nonce': '<unique_identifier_a+2018-12-13T17:00:00+0000>'},
    {'text': 'No, that is not me!', 'nonce': '<unique_identifier_b+2018-12-13T17:00:00+0000'}
  ],
  '@timing': {
    'expires_time': 'future'
  },
  'external_links': [
    {'text': 'Some external link', 'src': 'https://www.externalwebsite.com/'},
    {'src': 'https://www.directlinkwithouttext.com/'},
  ]
}
```
- Stringify above JSON and call libvcx method connection_send_message
```js
await connection.send_message(JSON.stringify(aboveJson), "Question", question_text)
```
- User should receive a message with above data
- Once user responds, we can use libvcx method vcx_messages_download method to download user response
```python
  # check our own message for changes in refMsgId property
  originalMessage = await vcx_messages_download('', "{}".format(msg_id.decode('utf-8')), None)
  originalMessage = json.loads(originalMessage.decode('utf-8'))
  # get user's response message id from message that we sent
  responseMessageId = originalMessage[0]['msgs'][0]['refMsgId']
  # download user response for message that we sent
  userResponseMessage = await vcx_messages_download('', "{}".format(responseMessageId), None)
```
- User response should look like
```js
{
  '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/committedanswer/1.0/answer',
  'response.@sig': {
    'signature': 'wK0/2hGn7Auf831PESB9uOD1YgruPIRjhqfdPH8i2cUcN/YAhaYxN8fAWSLo9bmjILd+1sJCn6FvghmY5+H8CA==',
    'sig_data': 'PHVuaXF1ZV9pZGVudGlmaWVyX2ErMjAxOC0xMi0xM1QxNzowMDowMCswMDAwPg==',
    'timestamp': '2018-12-13T17:29:34+0000'
  }
}
```
- Base64 decode signature and call libvcx verify_signature
- Base64 decode data and check which nonce user replied with

### Validation Rules

- In message JSON, property `valid_responses` is required and it should be a JSON array of objects with type `{ text: string, nonce: string }`
- `@id` and `@type` are required
- Other properties are not required
- If `question_detail` or `question_text` or both are passed, they have to be of string type. Otherwise app won't show them on UI
- If `external_links` is specified, then it should be a JSON array of objects with type `{ text?: string, src: string}`. In this object `text` is optional. As of now we support only those links which mobile OS can directly open. So, links that start with other app's url schemes such as `tel:`, `instagram://`, etc. won't be opened. Property `src` should have valid scheme for it to open in browser. For example: `www.google.com` is an invalid link, `https://www.google.com` is correct link since it specifies the scheme of link.
- Here are different validation error with codes that could occur on UI
```js

ERROR_NO_QUESTION_DATA = {
  code: 'CM-QUE-004',
  message: 'No data received for this message.',
}

ERROR_NO_RESPONSE_ARRAY = {
  code: 'CM-QUE-005',
  message: 'Property valid_responses should be a JSON array.',
}

ERROR_NOT_ENOUGH_RESPONSES = {
  code: 'CM-QUE-006',
  message: 'Property valid_responses should have at least one response.',
}

ERROR_TOO_MANY_RESPONSES = {
  code: 'CM-QUE-007',
  message: 'There are more than 1000 responses.',
}

ERROR_RESPONSE_NOT_PROPERLY_FORMATTED = {
  code: 'CM-QUE-008',
  message:
    'One or more of response in valid_responses property is not in correct format {text: string, nonce: string}.',
}

ERROR_RESPONSE_NOT_UNIQUE_NONCE = {
  code: 'CM-QUE-009',
  message: 'Not every response in valid_responses array has unique nonce',
}

ERROR_EXTERNAL_LINKS_NOT_ARRAY = {
  code: 'CM-QUE-010',
  message: 'property "external_links" should be an array of object type { text?:string, src:string }'
}

ERROR_EXTERNAL_LINKS_NOT_PROPERLY_FORMATTED = {
  code: 'CM-QUE-011',
  message: 'One or more link object inside "external_links" array is invalid. Link object should be of format { text?:string, src:string }, where "text" property is optional. However, if "text" property is defined, then it should be a string with less than or equal to 1000 characters. "src" property should be a string and is not optional.'
}

ERROR_TOO_MANY_EXTERNAL_LINKS = {
  code: 'CM-QUE-012',
  message: '"external_links" array should not have more than 1000 link objects.'
}
```

### How UI renders responses
- If there is exactly one object in `valid_responses` array. Then no radio buttons would be rendered. This one response would be rendered as a primary actionable button (green button) in bottom of message screen. Text of this button would be set from object's `text` property. There is limit on number of characters that can be displayed on button. For smaller width devices (for example: iphone 5), at most 17 characters would be displayed on this action button. For bigger width devices such as iphone 7 at most 20 characters would be shown.
- If there are exactly two objects in `valid_responses` array, then first object would be considered primary response. This primary response would be rendered as primary action button. Second object would also be rendered as secondary action button. There is a limit of 40 characters on big devices, and 35 characters on small devices.
- If there are more than objects in `valid_responses` array, then all responses would be rendered as radio buttons and put in a scrollable view. There is no limit on number of characters in this case.
- If there are more than 20 objects in `valid_responses` array. Then only first 20 responses would be rendered as radio buttons.
- If there are more than 1000 objects in `valid_responses` array. UI would throw validation error with code `CM-QUE-007`


#### Test script

<details>
  <summary>Python test script to send message</summary>
  <p>

```python
#!/usr/bin/env python3

from ctypes import cdll
from vcx.api.vcx_init import vcx_init, vcx_init_with_config
from vcx.api.utils import vcx_agent_provision, vcx_messages_download
from vcx.api.connection import Connection
from vcx.api.proof import Proof
from vcx.error import VcxError
from vcx.state import State
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
    wallet_path = '~/.indy_client/wallet'

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

    # Message expiration - set to 2 days in the future...
    now = datetime.datetime.today().strftime("%Y-%m-%dT%H:%M:%S+0000")
    future = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%S+0000")

    # Agency and wallet info
    wallet_key = 'provableinfowalletkey'
    genesis_file_location = './genesis.txt'
    enterprise_seed = '000000000000000000000000Trustee1'
    pmt_method = 'null'
    ent_instituion_name = 'Test enterprise'
    ent_instituion_logo = 'http://robohash.org/532'

    # TestNet agency information
    print("\nUse TestNet settings")
    ent_wallet_name = 'ent_provable-wallet'
    ent_agency_url = 'http://c6413b3d.ngrok.io'
    ent_agency_did = 'SxZNJbCt8vwn2Ks6nESe5'
    ent_agency_verkey = 'F9afBEVt2VaWjRminSosz3DaRZTufn1RA7MfP8houPz'

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
        'enterprise_seed': enterprise_seed
    }

    config = await vcx_agent_provision(json.dumps(enterprise_config))
    config = json.loads(config)

    # Set remaining configuration options specific to the enterprise
    config['payment_method'] = pmt_method
    config['institution_name'] = ent_instituion_name
    config['institution_logo_url'] = ent_instituion_logo
    config['genesis_path'] = genesis_file_location

    # Init the payment plug-in
    if pmt_method == 'null':
        lib = cdll.LoadLibrary("libnullpay.dylib")
        lib.nullpay_init()
    else:
        lib = cdll.LoadLibrary("libsovtoken.dylib")
        lib.sovtoken_init()

    # Init using the config
    try:
        await vcx_init_with_config(json.dumps(config))
        print('\nVcx init complete (enterprise)')
    except VcxError as e:
        print("\nCould not initialize VCX: {0}".format(e))
        print("\nCould not initialize VCX (enterprise): {0}".format(e))

    connection = await Connection.create('123')

    print("\n--  use public did:{}".format(use_public_did))
    if use_public_did:
        await connection.connect('{"use_public_did":true,"connection_type":"QR"}')
        invite_details = await connection.invite_details(True)
        print("\t-- Send_offer: invite_details:", invite_details)
        my_invite_details.put(invite_details)
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

    print("DONE calling update_state" + str(connection_state))

    send_question = "yes"

    while send_question != "no":
        question = {
            '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/committedanswer/1.0/question',
            '@id': '518be002-de8e-456e-b3d5-8fe472477a86',
            'question_text': 'Alice, are you on the phone with Bob from Faber Bank right now?',
            'question_detail': 'This is optional fine-print giving context to the question and its various answers.',
            'valid_responses': [
                {'text': 'Yes, it is me', 'nonce': '<unique_identifier_a+2018-12-13T17:00:00+0000>'},
                {'text': 'No, that is not me!', 'nonce': '<unique_identifier_b+2018-12-13T17:00:00+0000'}],
            '@timing': {
                'expires_time': future
            },
            'external_links': [
                {'text': 'Some external link with so many characters that it can go outside of two lines range from here onwards', 'src': '1'},
                {'src': 'Some external link with so many characters that it can go outside of two lines range from here onwards'},
            ]
        }
        msg_id = await connection.send_message(json.dumps(question), "Question", "Answer this question")
        print("\n-- Dynamic message sent")
        print("Dynamic message Id: {}".format(msg_id.decode('utf-8')))
        await asyncio.sleep(50)

        try:
            originalMessage = await vcx_messages_download('', "{}".format(msg_id.decode('utf-8')), None)
            originalMessage = json.loads(originalMessage.decode('utf-8'))
            responseMessageId = originalMessage[0]['msgs'][0]['refMsgId']
            messages = await vcx_messages_download('', "{}".format(responseMessageId), None)
            print("-- Enterprise message downloaded")
            messages = json.loads(messages.decode('utf-8'))
            print(messages)
            answer = json.loads(json.loads(messages[0]['msgs'][0]['decryptedPayload'])['@msg'])

            #   {'@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/committedanswer/1.0/answer',
            #    'response.@sig': {
            #       'signature': 'wK0/2hGn7Auf831PESB9uOD1YgruPIRjhqfdPH8i2cUcN/YAhaYxN8fAWSLo9bmjILd+1sJCn6FvghmY5+H8CA==',
            #       'sig_data': 'PHVuaXF1ZV9pZGVudGlmaWVyX2ErMjAxOC0xMi0xM1QxNzowMDowMCswMDAwPg==',
            #       'timestamp': '2018-12-13T17:29:34+0000'}
            #   }

            signature = base64.b64decode(answer['response.@sig']['signature'])
            data = answer['response.@sig']['sig_data']
            valid = await connection.verify_signature(data.encode(), signature)
            print("\n-- Signature verified for message...")

            if valid:
                print("-- Answer digitally signed: ", base64.b64decode(data))
            else:
                print("-- Signature was not valid")
        except VcxError as e:
            print("\n::ERROR:: Enterprise message failed to download\n{}".format(e))

        print("Finished")
        print("\n Want to send another question?(yes|no)")
        send_question = input()

if __name__ == '__main__':
    print("If you are on a mac do...")
    print("You MUST copy this script to the /Users/norm/forge/work/code/evernym/indy-sdk.evernym/vcx/wrappers/python3 folder and run it from there or else it will not work")
    print("export DYLD_LIBRARY_PATH=[path_to_folder_containing_libindy.dylib]:${DYLD_LIBRARY_PATH}")
    print("ENV: export DYLD_LIBRARY_PATH=/Users/norm/forge/tools/evernym/lib/mac/x86_64-apple-darwin:${DYLD_LIBRARY_PATH}")
    print("Usage: python3 ./test_QA_provable_question_answer.py")
    
    asyncio.get_event_loop().run_until_complete(main())
```
  </p>
</details>
