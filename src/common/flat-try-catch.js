// @flow

export const flatTryCatch = (fn: (...variableArgs: any[]) => any) => (
  ...args: any[]
): [null | typeof Error, null | any] => {
  try {
    return [null, fn(...args)]
  } catch (e) {
    return [e, null]
  }
}
