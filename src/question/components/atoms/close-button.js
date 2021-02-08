// @flow
import React from 'react'

import { TouchableOpacity } from 'react-native'
import SvgCustomIcon from '../../../components/svg-custom-icon'
import { questionStyles } from '../../question-screen-style'
import { colors } from '../../../common/styles'

const CloseButton = (props: { onPress: () => void, icon: 'CloseIcon' }) => {
  return (
    <TouchableOpacity
      style={questionStyles.closeButton}
      onPress={props.onPress}
    >
      <SvgCustomIcon name={props.icon} fill={colors.gray2} height={20} width={20} />
    </TouchableOpacity>
  )
}
export default CloseButton
