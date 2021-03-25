import asyncio
import json
from time import sleep

from vcx.api.connection import Connection
from vcx.api.utils import vcx_agent_provision, vcx_messages_download, vcx_messages_update_status
from vcx.api.vcx_init import vcx_init_with_config
from vcx.state import State


provisionConfig = {
    'agency_url': 'https://agency-team1.pdev.evernym.com',
    'agency_did': 'TGLBMTcW9fHdkSqown9jD8',
    'agency_verkey': 'FKGV9jKvorzKPtPJPNLZkYPkLhiS1VbxdvBgd1RjcQHR',
    'wallet_name': 'alice_wallet',
    'wallet_key': '123',
    'payment_method': 'null',
    'enterprise_seed': '000000000000000000000000Trustee1',
    'protocol_type': '1.0',
}


async def main():
    await init()
    connection_to_faber = await connect()

    print("Press enter to start checking invite")
    input()

    pw_did = await connection_to_faber.get_my_pw_did()
    message_id, invite_action = await download_message(pw_did, 'invite-action')
    print("Invite for action is received" + invite_action)
    invite_action = json.loads(invite_action)

    # HERE
    # we processed received message on the app
    # we need to update its status as read to not receive it once again
    await update_message_as_read(pw_did, message_id)

    print("Check weather sender requested an acknowledgment for invitation")
    if invite_action and invite_action.get("~please_ack"):
        accept_invitation = input(
            "Would you like to accept proof? \n "
            "0 - accept \n "
            "1 - reject \n "
            "else finish \n") \
            .lower().strip()
        if accept_invitation == '0':
            await accept(connection_to_faber, invite_action)
        elif accept_invitation == '1':
            await reject(connection_to_faber, invite_action)
    else:
        print("No acknowledgment requested by inviter")

    print("Finished")


async def init():
    print("Provision an agent and wallet, get back configuration details")
    config = await vcx_agent_provision(json.dumps(provisionConfig))
    config = json.loads(config)
    # Set some additional configuration options specific to alice
    config['institution_name'] = 'alice'
    config['institution_logo_url'] = 'http://robohash.org/2'
    config['genesis_path'] = 'docker.txn'

    config = json.dumps(config)

    print("Initialize libvcx with new configuration")
    await vcx_init_with_config(config)


async def connect():
    print("Input invitation details")
    details = input('invite details: ')

    print("Convert to valid json and string and create a connection to faber")
    jdetails = json.loads(details)
    connection_to_faber = await Connection.accept_connection_invite('faber', json.dumps(jdetails))
    connection_state = await connection_to_faber.update_state()
    while connection_state != State.Accepted:
        sleep(2)
        await connection_to_faber.update_state()
        connection_state = await connection_to_faber.get_state()

    print("Connection is established")
    return connection_to_faber


async def accept(connection_to_faber, invite_action):
    print("Accept invite for action. Start here related protocol")
    # here we can start other work related to invitation

    ack_on = invite_action["~please_ack"].get("on")
    if 'ACCEPT' in ack_on:
        print("Send Ack for accepted invitation")
        ack = {
            "@type": "https://didcomm.org/invite-action/0.9/ack",
            "@id": "06d474e0-20d3-4cbf-bea6-6ba7e1891240",
            "status": "OK",
            "~thread": {
                "thid": invite_action['@id'],
            }
        }
        await connection_to_faber.send_message(json.dumps(ack), "ack", "Invite action accepted")
    if 'OUTCOME' in ack_on:
        print("Send Ack when related protocol will be finished")


async def reject(connection_to_faber, invite_action):
    print("Reject invitation")
    ack = {
        "@type": "https://didcomm.org/invite-action/0.9/problem-report",
        "@id": "06d474e0-20d3-4cbf-bea6-6ba7e1891240",
        "description": "Invitation was rejected",
        "~thread": {
            "thid": invite_action['@id'],
        }
    }
    await connection_to_faber.send_message(json.dumps(ack), "problem-report", "Invitation rejected")


async def download_message(pw_did: str, msg_type: str):
    messages = await vcx_messages_download("MS-103", None, pw_did)
    messages = json.loads(messages.decode())[0]['msgs']
    message = [message for message in messages if json.loads(message["decryptedPayload"])["@type"]["name"] == msg_type]
    if len(message) > 0:
        decryptedPayload = message[0]["decryptedPayload"]
        return message[0]["uid"], json.loads(decryptedPayload)["@msg"]
    else:
        return None, None


async def update_message_as_read(pw_did: str, uid: str):
    messages_to_update = [{
        "pairwiseDID": pw_did,
        "uids": [uid]
    }]
    await vcx_messages_update_status(json.dumps(messages_to_update))


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
    sleep(1)
