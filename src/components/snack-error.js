import { useEffect } from 'react'
import { getSnackError } from '../store/store-selector'
import { useSelector } from 'react-redux'
import { colors } from '../common/styles'
import Snackbar from 'react-native-snackbar'

export const SnackError = () => {
  const snackError = useSelector(getSnackError)

  useEffect(() => {
    if (snackError) {
      Snackbar.dismiss()
      Snackbar.show({
        text: snackError,
        backgroundColor: colors.red,
        duration: Snackbar.LENGTH_LONG,
        textColor: colors.white,
      })
    }
  }, [snackError])

  return null
}
