export function brightnessByColor(color) {
  const strColor = '' + color
  const isHEX = strColor.indexOf('#') == 0
  const isRGB = strColor.indexOf('rgb') == 0
  let r, g, b

  if (isHEX) {
    const hasFullSpec = strColor.length == 7
    const hexMatches = strColor
      .substr(1)
      .match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g)
    if (hexMatches) {
      r = parseInt(hexMatches[0] + (hasFullSpec ? '' : hexMatches[0]), 16)
      g = parseInt(hexMatches[1] + (hasFullSpec ? '' : hexMatches[1]), 16)
      b = parseInt(hexMatches[2] + (hasFullSpec ? '' : hexMatches[2]), 16)
    }
  }

  if (isRGB) {
    const rgbMatches = strColor.match(/(\d+){1,3}/g)
    if (rgbMatches) {
      r = rgbMatches[0]
      g = rgbMatches[1]
      b = rgbMatches[2]
    }
  }

  if (typeof r !== 'undefined') {
    return (r * 299 + g * 587 + b * 114) / 1000
  }
}

export function pickAndroidColor(foundColors) {
  const results = [
    {
      name: 'dominant',
      hexCode: foundColors.dominant,
      brightness: brightnessByColor(foundColors.dominant),
    },
    {
      name: 'average',
      hexCode: foundColors.average,
      brightness: brightnessByColor(foundColors.average),
    },
    {
      name: 'vibrant',
      hexCode: foundColors.vibrant,
      brightness: brightnessByColor(foundColors.vibrant),
    },
    {
      name: 'darkVibrant',
      hexCode: foundColors.darkVibrant,
      brightness: brightnessByColor(foundColors.darkVibrant),
    },
    {
      name: 'lightVibrant',
      hexCode: foundColors.lightVibrant,
      brightness: brightnessByColor(foundColors.lightVibrant),
    },
    {
      name: 'darkMuted',
      hexCode: foundColors.darkMuted,
      brightness: brightnessByColor(foundColors.darkMuted),
    },
    {
      name: 'lightMuted',
      hexCode: foundColors.lightMuted,
      brightness: brightnessByColor(foundColors.lightMuted),
    },
    {
      name: 'muted',
      hexCode: foundColors.muted,
      brightness: brightnessByColor(foundColors.muted),
    },
    {
      name: 'lightMuted',
      hexCode: foundColors.lightMuted,
      brightness: brightnessByColor(foundColors.lightMuted),
    },
  ]

  return pickColor(results)
}

export function pickIosColor(foundColors) {
  const results = [
    {
      name: 'primary',
      hexCode: foundColors.primary,
      brightness: brightnessByColor(foundColors.primary),
    },
    {
      name: 'secondary',
      hexCode: foundColors.secondary,
      brightness: brightnessByColor(foundColors.secondary),
    },
    {
      name: 'background',
      hexCode: foundColors.background,
      brightness: brightnessByColor(foundColors.background),
    },
    {
      name: 'detail',
      hexCode: foundColors.detail,
      brightness: brightnessByColor(foundColors.detail),
    },
  ]

  return pickColor(results)
}

export function pickColor(results) {
  // Sorting and picking the darkest color that is not black
  results.sort((a, b) => a.brightness - b.brightness)
  const chosenColor = results.find((color) => color.brightness !== 0)
  return chosenColor.hexCode
}
