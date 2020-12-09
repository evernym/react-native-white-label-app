// @flow

// If you look into the return type of this function
// you should notice that we are returning an array from  this function
// this is just a helper function to wrap on top of other async functions
// However, this changes a lot of ways we write code and handle errors
// By returning an array in which first item is an error
// and second item is the response
// We get two important things
// 1. We don't have to write try...catch statements everywhere
// 2. We are forced to handle errors. No more forgetting to add try...catch
// TODO:KS Write more details about both 1 & 2
// Here are the problems that this function aims to solve
// Problem #1 leads to try...catch nesting hell if there are multiple async
// calls
// Problem #2 leads to unexpected app crashes at runtime

export const flattenAsync = (
  fn: (...variableArgs: any[]) => Promise<any>
) => async (
  ...args: Array<any>
): Promise<[null | typeof Error, null | any]> => {
  try {
    const response = await fn(...args)
    return [null, response]
  } catch (e) {
    return [e, null]
  }
}
