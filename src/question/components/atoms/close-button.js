// @flow
import React from 'react'

import { TouchableOpacity } from 'react-native'
import { grey } from '../../../common/styles'
import SvgCustomIcon from '../../../components/svg-custom-icon'
import { questionStyles } from '../../question-screen-style'

const CloseButton = (props: { onPress: () => void, icon: 'CloseIcon' }) => {
  return (
    <TouchableOpacity
      style={questionStyles.closeButton}
      onPress={props.onPress}
    >
      <SvgCustomIcon name={props.icon} fill={grey} height={20} width={20} />
    </TouchableOpacity>
  )
}
export default CloseButton
