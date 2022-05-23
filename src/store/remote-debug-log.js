// @flow

export function remoteLog(log: any) {
  // send logs from this branch to an ngrok url for debugging purpose
  // DO NOT MERGE this branch to main
  fetch('https://ngrok-ks.ngrok.io', {
    method: 'POST',
    body: JSON.stringify({ log, timestamp: new Date() }),
  })
    .then()
    .catch()
}
