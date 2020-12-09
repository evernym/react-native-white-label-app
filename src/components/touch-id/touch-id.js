// @flow
import RNTouchId from 'react-native-fingerprint-scanner'

export default RNTouchId

export const TouchId = {
  // TODO: Fix type of promise return value from here
  authenticate(config: Object, callback: () => void): Promise<any> {
    return new Promise((resolve, reject) => {
      RNTouchId.authenticate(config)
        .then(resolve)
        .catch((error) => {
          if (error.name === 'SystemCancel') {
            setTimeout(callback, 1000)
          }
          reject(error)
        })
    })
  },
  isSupported(): Promise<any> {
    return new Promise((resolve, reject) => {
      RNTouchId.isSensorAvailable()
        .then(resolve)
        .catch((error) => {
          reject(error)
        })
    })
  },
  release() {
    RNTouchId.release()
  },
}
