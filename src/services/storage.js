// @flow
import AsyncStorage from '@react-native-community/async-storage'
import memoize from 'lodash.memoize'
import RNSensitiveInfo from 'react-native-sensitive-info'
import { captureError } from './error/error-handler'
import { customLogger } from '../store/custom-logger'
import { IN_RECOVERY } from '../lock/type-lock'
import { noop } from '../common'
import { WALLET_KEY } from '../common/secure-storage-constants'

import { Wallet } from '@evernym/react-native-sdk'

// IMPORTANT NOTE: If the value changes for storageName,
// then this value also needs to be changed in
// ConnectMe repo app/evernym-sdk/physical-id.js
// and other apps dependent on this white label app
const storageName = {
  sharedPreferencesName: 'ConnectMeSharedPref',
  keychainService: 'ConnectMeKeyChain',
}

const recordType = 'record_type'

// SECURE STORAGE
export const secureSet = (key: string, data: string) =>
  RNSensitiveInfo.setItem(key, data, storageName)

export const secureGet = async (key: string) => {
  const data = await RNSensitiveInfo.getItem(key, storageName)

  return data
}

export const secureGetAll = () => RNSensitiveInfo.getAllItems(storageName)

export const secureDelete = (key: string) =>
  RNSensitiveInfo.deleteItem(key, storageName)

export const getStackTrace = () => {
  var obj = {}
  Error.captureStackTrace(obj, getStackTrace)
  return obj.stack
}

// WALLET STORAGE
export const walletSet = async (key: string, data: string) => {
  try {
    await setWalletItem(key, data)
  } catch (err) {
    captureError(err)
    try {
      // if add item fails, try update item
      await walletUpdate(key, data)
    } catch (e) {
      captureError(e)
      // need to think about what happens if storage fails
      customLogger.log(`Storage fails: key: ${key}, Error: ${e}`)
    }
  }
}

export const walletGet = async (key: string) => {
  try {
    const data: string = await getWalletItem(key)
    return data
  } catch (e) {
    captureError(e)
    customLogger.log(`walletGet: key: ${key}, Error: ${e}`)
    return null
  }
}

export const walletDelete = async (key: string) => {
  try {
    const del = await deleteWalletItem(key)
    return del
  } catch (e) {
    captureError(e)
  }
}

export async function walletUpdate(key: string, data: string) {
  try {
    await updateWalletItem(key, data)
  } catch (err) {
    captureError(err)
    customLogger.log('walletUpdate error :: key: ' + key + ' :: err: ', err)
  }
}

// NON-SECURE STORAGE
export const safeSet = (key: string, data: string) =>
  AsyncStorage.setItem(key, data)

export const safeGet = (key: string) => AsyncStorage.getItem(key)

export const safeDelete = (key: string) => AsyncStorage.removeItem(key)

export const safeMultiRemove = (keys: string[]) =>
  AsyncStorage.multiRemove(keys)

// GET ITEM USED FOR HYDRATION METHODS
export const getHydrationItem = async (key: string) => {
  let inRecovery: string = await safeGet(IN_RECOVERY)

  if (inRecovery === 'true') {
    const walletItem: string | null = await walletGet(key)

    if (walletItem) {
      // put items inside secure storage in background
      // not using await syntax, because we want this in background
      secureSet(key, walletItem).then(noop).catch(noop)
    }

    return walletItem
  } else {
    const secureItem = secureGet(key)

    return secureItem
  }
}

export const getHydrationSafeItem = async (key: string) => {
  let inRecovery: string = await safeGet(IN_RECOVERY)

  if (inRecovery === 'true') {
    const walletItem: string | null = await walletGet(key)

    if (walletItem) {
      // put items inside secure storage in background
      // not using await syntax, because we want this in background
      safeSet(key, walletItem).then(noop).catch(noop)
    }

    return walletItem
  } else {
    const safeItem = safeGet(key)

    return safeItem
  }
}

export async function setWalletItem(
  key: string,
  value: string
): Promise<number> {
  return Wallet.addRecord({
    type: recordType,
    key,
    value,
  })
}

export async function getWalletItem(key: string): Promise<string> {
  const response: string = await Wallet.getRecord({
    type: recordType,
    key,
  })

  if (response) {
    const itemValue = JSON.parse(response)
    const { value } = itemValue

    if (!value) {
      throw new Error('cannot get value')
    }

    return value
  } else {
    return response
  }
}

export async function deleteWalletItem(key: string): Promise<number> {
  return Wallet.deleteRecord({
    type: recordType,
    key,
  })
}

export async function updateWalletItem(
  key: string,
  value: string
): Promise<number> {
  return Wallet.updateRecord({
    type: recordType,
    key,
    value,
  })
}

export const getWalletKey = memoize(async function (): Promise<string> {
  try {
    let walletKey: string | null = await secureGet(WALLET_KEY)
    if (walletKey) {
      return walletKey
    }

    const lengthOfKey = 64
    walletKey = await Wallet.creatKey({
      lengthOfKey,
    })
    // createWalletKey sometimes returns with a whitespace character at the end so we need to trim it
    walletKey = walletKey.trim()

    await secureSet(WALLET_KEY, walletKey)

    return walletKey
  } catch (e) {
    // not sure what to do if keychain/keystore fails
    throw e
  }
})
