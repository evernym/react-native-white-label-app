export const getPredicateTitle = (p_type: string) => {
  switch (p_type) {
    case '>':
      return 'Greater than'
    case '>=':
      return 'Greater than or equal to'
    case '<':
      return 'Less than'
    case '<=':
      return 'Less than or equal to'
    default :
      return ''
  }
}
