// @flow

// If you look into the return type of this function
// you should notice that we are returning an array from  this function
// this function is just a wrapper on top of fetch.
// However, this changes a lot of ways we write code and handle errors
// By returning an array in which first item is an error
// and second item is the response
// We get two important things
// 1. We don't have to write try...catch statements everywhere
// 2. We are forced to handle errors. No more forgetting to add try...catch
// TODO:KS Write more details about both 1 & 2
// Problem #1 leads to try...catch nesting hell if there are multiple async
// calls
// Problem #2 leads to unexpected app crashes at runtime

export async function flatFetch(
  url: string,
  body?: string,
  headers?: { [string]: any }
): Promise<[null | typeof Error, null | string, null | Response]> {
  const options = {
    mode: 'cors',
    ...(body ? { method: 'POST', body } : {}),
    ...(headers ? headers : {}),
  }
  try {
    const response = await fetch(url, options)
    const responseText = await response.text()
    // request redirected
    if (response && response.status === 302) {
      return [null, null, response]
    }
    if (!response.ok) {
      throw new Error(responseText)
    }
    return [null, responseText, response]
  } catch (e) {
    return [e, null, null]
  }
}
