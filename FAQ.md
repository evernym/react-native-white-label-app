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

