// @flow
import PBKDF2 from 'react-native-pbkdf2'
import { NativeModules, Platform } from 'react-native'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'

const { RNRandomBytes } = NativeModules

const generateKey = (password: string, salt: string) =>
  PBKDF2.derivationKey(password, salt, 1000)

export const generateSalt = async (isRealSalt: boolean) => {
  const numBytes = 32
  return new Promise(function (resolve, reject) {
    if (isRealSalt) {
      RNRandomBytes.randomBytes(numBytes, (err: any, bytes: string) => {
        if (err) {
          reject(err)
        } else {
          if (Platform.OS === 'android') {
            resolve(bytes.slice(0, -1))
          } else {
            resolve(bytes)
          }
        }
      })
    } else {
      resolve('78df78sufud7du77w2uw7wus7wuw7s7aueuw778sdus7sduas7w7w')
    }
  })
}

export async function pinHash(pin: string, salt: string) {
  try {
    let fullkey = await generateKey(pin, salt)
    if (fullkey.startsWith('{length=64,bytes=0x') && fullkey.endsWith('}')) {
      fullkey = fullkey.split('{length=64,bytes=0x')[1].slice(0, -1)
    }
    const key = fullkey.substring(0, 16)
    if (__DEV__) {
      customLogger.log('pinHash: salt: ', salt)
      customLogger.log('pinHash: fullkey: ', fullkey)
      customLogger.log('pinHash: key: ', key)
    }

    return key
  } catch (e) {
    console.log('error')
    customLogger.log(`pinHash: ${e}`)
    captureError(new Error(`pinHash: ${e}`))
    return null
  }
}
