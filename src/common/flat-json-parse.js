// @flow

export function flatJsonParse(
  text: string
): [null | typeof Error, null | Object] {
  try {
    return [null, JSON.parse(text)]
  } catch (e) {
    return [e, null]
  }
}
