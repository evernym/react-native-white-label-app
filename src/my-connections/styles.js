// @flow
import { StyleSheet } from 'react-native'
import { colors } from '../common/styles/constant'
import { verticalScale, moderateScale } from 'react-native-size-matters'

const externalStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
    flex: 1,
  },
  flatListContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
  },
  flatListInnerContainer: {
    paddingBottom: moderateScale(170, 0.25),
    margin: 15,
    padding: 10,
    marginBottom: 40,
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: verticalScale(90),
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export { externalStyles }
