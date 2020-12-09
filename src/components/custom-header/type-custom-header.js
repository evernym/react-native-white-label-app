// @flow
import type { GenericObject, ReactChildren } from '../../common/type-common'
import * as React from 'react'

export type CustomHeaderProps = {
  backgroundColor: string,
  children?: React.Node,
  centerComponent?: ReactChildren,
  leftComponent?: ReactChildren,
  rightComponent?: ReactChildren,
  outerContainerStyles?: GenericObject | number,
  flatHeader?: boolean,
  zeroBottomBorder?: boolean,
  largeHeader?: boolean,
}
