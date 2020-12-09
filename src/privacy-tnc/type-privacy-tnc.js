// @flow
import type { CustomError } from '../common/type-common'
import type {
  NavigationScreenProp,
  NavigationLeafRoute,
} from '@react-navigation/native'

export type PrivacyTNCProps = {} & {
  navigation: NavigationScreenProp<{|
    ...NavigationLeafRoute,
  |}>,
  route: {
    params: {|
      url: string,
      title: string,
    |},
  },
}

export type PrivacyTNCState = {
  error: null | CustomError,
}
