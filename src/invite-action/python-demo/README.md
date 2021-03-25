# Invite Action Demo

These are instructions on how to set-up an environment to be able to run the python demo for the `inviteAction` protocol.

## Installing required libraries

To install the `libindy`, `libnullpay` and `libvcx` libraries you need to download the [indy-sdk repository](https://gitlab.corp.evernym.com/dev/vcx/indy-sdk) so you can build from latest sources

### Prerequisites

Switch binary versions for compatibility

MacOS

```terminal
sh "brew switch libsodium 1.0.12"
sh "brew switch openssl 1.0.2q"
sh "brew switch zeromq 4.2.3"
```

Windows TBA

You need to install the latest version of Rust

### Building from latest sources

Steps to build from `libindy`, `libvcx` and `libnullpay`:

Build libraries

```terminal
cd {LIB_NAME_HERE}/{LIB_NAME_HERE} && cargo build
```

Copy into respective directories

Windows

```terminal
cp target/debug/{LIB_NAME_HERE}.so /usr/lib
```

MacOS

```terminal
cp target/debug/{LIB_NAME_HERE}.dylib /usr/local/lib
```

## Download Python Wrappers

Download [Python Wrapper](https://repo.corp.evernym.com/portal/dev/python3-vcx-wrapper_0.10.0.1007.tar.gz)

Run `pip3 install python3-vcx-wrapper_0.10.0.1007.tar.gz`

### Python Script Information

*Sender - (CULedger):*

There are two variants for the sender:

- `faber_without_ack_request.py` - Simple scenario when we use a connection only for sending an invitation for the action. We don't wait for acceptance acknowledgment/rejection from the invitation receiver

- `faber_with_ack_request.py` - more complex scenario when we request an acknowledgment for an invitation

The receiver will send the corresponding message on the accepted/rejected invitation.

*Receiver - (Customer):*

- `alice.py` - Handles both senders scenarios

## VCX artifacts which should be used

Artifacts:

[android](https://evernym.mycloudrepo.io/public/repositories/libvcx-android/com/evernym/vcx/0.10.0-6ffbe63/)

[java](https://evernym.mycloudrepo.io/public/repositories/libvcx-java/com/evernym/vcx/0.10.0.1036/)

[bionic](https://repo.corp.evernym.com/portal/dev/libvcx_0.10.0-bionic1036_amd64.deb)

[xenial](https://repo.corp.evernym.com/portal/dev/libvcx_0.10.0-xenial1036_amd64.deb)

[rpm](https://repo.corp.evernym.com/portal/dev/libvcx_0.10.0-1036_x86_64.rpm)

[nodejs](https://repo.corp.evernym.com/portal/dev/node-vcx-wrapper_0.10.0-1036_amd64.tgz)

[python](https://repo.corp.evernym.com/portal/dev/python3-vcx-wrapper_0.10.0.1036.tar.gz)

[ios v1](https://repo.corp.evernym.com/filely/ios/vcx.libvcxall_0.10.0-6ffbe6338_universal.zip)

[ios v2](https://repo.corp.evernym.com/filely/ios/vcx.libvcxpartial_0.10.0-6ffbe6338_universal.zip)