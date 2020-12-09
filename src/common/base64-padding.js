// @flow

export function addBase64Padding(data: string): string {
  const trail = data.length % 4
  if (trail === 0) {
    return data
  }

  return `${data}${'='.repeat(4 - trail)}`
}

export function removeBase64Padding(data: string): string {
  return data.split('=')[0]
}
