// @flow

// packages
import React from 'react'
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import { verticalScale } from 'react-native-size-matters'

// styles
import { colors, fontSizes } from '../../common/styles/constant'

export type ToggleFieldsTypes = {
  actionInfoText: [string, string],
  actionText: [string, string],
  useToggle: [boolean, (boolean) => void],
  showToggleMenu: boolean,
}

const ToggleFields = ({
                        actionInfoText,
                        actionText,
                        useToggle,
                        showToggleMenu = true,
                      }: ToggleFieldsTypes) => {
  const [show, hide] = actionText
  const [showInfoText, hideInfoText] = actionInfoText
  const [isToggled, setToggled] = useToggle
  const { container, infoTextStyles, actionTextStyles } = styles
  return (
    <>
      {showToggleMenu && (
        <View style={container}>
          <Text style={infoTextStyles}>
            {isToggled ? hideInfoText : showInfoText}{' '}
            <TouchableWithoutFeedback onPress={() => setToggled(!isToggled)}>
              <Text style={actionTextStyles}>{isToggled ? hide : show}</Text>
            </TouchableWithoutFeedback>
          </Text>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(2),
    marginBottom: verticalScale(2),
  },
  infoTextStyles: {
    textAlign: 'center',
    color: colors.secondary,
    fontSize: verticalScale(fontSizes.size9),
  },
  actionTextStyles: {
    color: colors.main,
    fontWeight: '700',
  },
})

export default ToggleFields
