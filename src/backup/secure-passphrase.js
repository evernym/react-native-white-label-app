// @flow
import { NativeModules } from 'react-native'
const { RNRandomBytes } = NativeModules
import { getDiceware } from './eff.js'

export const base64Chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
export const Base64 = {
  btoa: (input: string = '') => {
    let str = input
    let output = ''

    for (
      let block = 0, charCode, i = 0, map = base64Chars;
      str.charAt(i | 0) || ((map = '='), i % 1);
      output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4))

      if (charCode > 0xff) {
        throw new Error(
          "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range."
        )
      }

      block = (block << 8) | charCode
    }

    return output
  },

  atob: (input: string = '') => {
    let str = input.replace(/=+$/, '')
    let output = ''

    if (str.length % 4 == 1) {
      throw new Error(
        "'atob' failed: The string to be decoded is not correctly encoded."
      )
    }
    for (
      let bc = 0, bs = 0, buffer, i = 0;
      (buffer = str.charAt(i++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = base64Chars.indexOf(buffer)
    }

    return output
  },
}

// See : https://www.reddit.com/r/crypto/comments/4xe21s/
//
// skip is to make result in this range:
// 0 ≤ result < n* count < 2^31
// (where n is the largest integer that satisfies this equation)
// This makes result % count evenly distributed.
//
// P.S. if (((count - 1) & count) === 0) {...} is optional and for
// when count is a nice binary number (2n). If this if statement is
// removed then it might have to loop a few times. So it saves a
// couple of micro seconds.
export const secureRandom = async (count: number = 6) => {
  const skip = 0x7fffffff - (0x7fffffff % count)
  let result
  const numBytes = 64

  const secureRandomBytes = () => {
    return new Promise(function (resolve, reject) {
      RNRandomBytes.randomBytes(numBytes, (err: any, bytes: string) => {
        if (err) {
          reject(err)
        } else {
          let decoded = Base64.atob(bytes)
          resolve(decoded)
        }
      })
    })
  }

  let randIndex = numBytes
  let randVals = ''
  do {
    if (randIndex >= numBytes) {
      randVals = await secureRandomBytes()
      randIndex = 0
    }
    const randVal = randVals.charCodeAt(randIndex++)
    result = randVal & 0x7fffffff
  } while (result >= skip)

  return result % count
}

export const getWords = async (
  numWords: number = 12,
  numRollsPerWord: number = 5
) => {
  const diceware = getDiceware()

  let i, j, words, rollResults, rollResultsJoined

  words = []

  if (!numWords) {
    numWords = 1
  }
  if (!numRollsPerWord) {
    numRollsPerWord = 5
  }

  for (i = 0; i < numWords; i += 1) {
    rollResults = []

    for (j = 0; j < numRollsPerWord; j += 1) {
      // roll a 6 sided die
      const randVal = await secureRandom(6)
      rollResults.push(randVal + 1)
    }

    rollResultsJoined = rollResults.join('')
    words.push(diceware[rollResultsJoined])
  }

  return words
}
