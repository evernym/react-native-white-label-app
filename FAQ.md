#### What error message means

* Error: `Connection already exists.`
* Cause: Trying to accept duplicate connection. The old connection will be reused instead of forming a new one.

---

* Error: `Failed to establish connection. Please try again later.`
* Cause: An unexpected error occurred during connection establishing process. Check you internet connection.

---

* Error: `Definition for offered Credential not found on the network application is connected to.`
* Cause: Mobile application and Issuer service are connected to different environments.

---

* Error: `Schema for offered Credential not found on the network application is connected to.`
* Cause: Mobile application and Issuer service are connected to different environments.

---

* Error: `Offered Credential does not match to its schema definition.`
* Cause: Issuer sent invalid Credential Offer because its attributes does not match to public definition.

---

* Error: `Error generating proof. Please try again.`
* Cause: Proof Request received from the Verifier is invalid formatted.
---

#### Frequenly Asked Questions

- **Q: A user has forgotten their app's passcode. Is there a passcode attempt limit, and what happens if it is breached? Is there a recovery mechanism?**

    Unfortunately, there is no passcode recovery mechanism in the current implementation. The app would have to be reinstalled and the wallet content would be lost. 

    The passcode attempts will go as follows:

    - If a user enters the wrong passcode 4 times, the app is locked for 1 minute before the user can try another passcode. 
    - After 6 wrong attempts, the app locks for 3 minutes. 
    - After 8 wrong attempts, the app locks for 15 minutes. 
    - After 9 wrong attempts, the app locks for 1 hour. 
    - After 10 wrong attempts, the app locks for 24 hours. 
    - After 11 wrong attempts, the app locks forever.