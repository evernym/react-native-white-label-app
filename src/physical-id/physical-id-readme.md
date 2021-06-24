# Physical ID to Verifiable Credentials

This module lets users scan their physical identity card and get a verifiable credential

## Questions

### Questions to ask from ID Verification team

- Can SDK token be re-used or do we need get new sdk token for every SDK scan launch?
- On Android ConnectMe needs to enable `allowBackup` while Jumio SDK ask to disable `allowBackup`. What are the ramifications, if we enable `allowBackup` in white label app
- How long is workflow ID related data stored on MasterCard ID Verification service. Can Evernym's server request the data any time? Or does this data expire after some time?

### Implementation questions

- Where should we deploy the backend to get sdk token, invitation, credential, and checking workflow status?
- When we expose this feature, do we expose Evernym developed backend for all our white label app customers or do our customers needs to develope their own backend for above mentioned functionalities
- What should be the UI/UX for this feature inside our white label app?
