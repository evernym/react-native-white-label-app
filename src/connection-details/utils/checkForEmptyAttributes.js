export const checkCredentialForEmptyFields = (content) => {
  let attributesCount: number = 0
  let emptyCount: number = 0

  content.forEach((item) => {
    attributesCount += 1
    emptyCount += !item.data || item.data === '' ? 1 : 0
  })

  return {
    hasEmpty: emptyCount >= 1,
    allEmpty: emptyCount === attributesCount,
  }
}

export const checkProofForEmptyFields = (content) => {
  let attributesCount: number = 0
  let emptyCount: number = 0
  let processedAttributes = []

  content.forEach((item) => {
    if (!processedAttributes.includes(item.key)) {
      if (item.values) {
        attributesCount += Object.keys(item.values).length
        emptyCount += Object.values(item.values).filter((value) => !value || value === '').length
      } else {
        attributesCount += 1
        emptyCount += !item.data || item.data === '' ? 1 : 0
      }
      processedAttributes.push(item.key)
    }
  })

  return {
    hasEmpty: emptyCount >= 1,
    allEmpty: emptyCount === attributesCount,
  }
}

export const showMissingField = (hasEmpty: boolean, allEmpty: boolean) => !hasEmpty || allEmpty
export const showToggleMenu = (hasEmpty: boolean, allEmpty: boolean) => hasEmpty && !allEmpty
