// @flow
import type { ReactNavigation } from '../common/type-common'

export type AboutAppProps = {} & ReactNavigation

export type AboutAppListItemProps = {
  onPress: () => void,
  titleValue: string,
}
