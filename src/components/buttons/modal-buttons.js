// @flow
import React, { PureComponent } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import debounce from 'lodash.debounce'
import { moderateScale, verticalScale } from 'react-native-size-matters'
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'
import { CustomText } from '../../components'
import SvgCustomIcon from '../../components/svg-custom-icon'

type AcceptButtonProps = {
  colorBackground: string,
  debounceButtonPress: (event: any) => void,
  disableAccept: boolean,
  acceptBtnText: string,
  svgIcon: any,
  hideAccept?: boolean,
  bottomTestID: string,
}

type DenyButtonProps = {
  disableDeny: boolean,
  denyButtonText: string,
  onIgnore: (event: any) => void,
  topTestID: string,
}

// TODO: Fix the any type
type ModalButtonProps = {
  containerStyles?: any,
  children?: any,
  primaryActionValue: (event: any) => void,
  onPress: (event: any) => void,
} & DenyButtonProps &
  AcceptButtonProps

class ModalButtons extends PureComponent<any, ModalButtonProps> {
  constructor(props: ModalButtonProps) {
    super(props)
  }

  debounceButtonPress = debounce(
    (event) => {
      const { primaryActionValue, onPress } = this.props
      if (primaryActionValue) {
        onPress(primaryActionValue)
        return
      }
      if (onPress) {
        onPress(event)
      }
    },
    600,
    { leading: true, trailing: false }
  )

  render() {
    const {
      onIgnore,
      disableDeny = false,
      disableAccept = false,
      colorBackground,
      denyButtonText,
      acceptBtnText,
      containerStyles,
      children,
      svgIcon,
      hideAccept,
      topTestID,
      bottomTestID,
    } = this.props
    const { container } = styles
    const { debounceButtonPress } = this

    return (
      <View style={[container, containerStyles]}>
        {children}
        {!hideAccept && (
          <AcceptButton
            {...{
              disableAccept,
              acceptBtnText,
              debounceButtonPress,
              svgIcon,
              colorBackground,
              bottomTestID,
            }}
          />
        )}
        {denyButtonText && (
          <DenyButton
            {...{
              disableDeny,
              denyButtonText,
              onIgnore,
              topTestID,
            }}
          />
        )}
      </View>
    )
  }
}

const DenyButton = ({
  denyButtonText,
  onIgnore,
  disableDeny,
  topTestID,
}: DenyButtonProps) => {
  const { buttonIgnore, ignoreTextStyle, buttonParentWrapper } = styles

  return (
    <TouchableOpacity
      disabled={disableDeny}
      onPress={onIgnore}
      accessibilityLabel={topTestID}
    >
      <View style={[buttonParentWrapper, buttonIgnore]}>
        <CustomText errorText h4 transparentBg demiBold style={ignoreTextStyle}>
          {denyButtonText}
        </CustomText>
      </View>
    </TouchableOpacity>
  )
}

const AcceptButton = ({
  debounceButtonPress,
  disableAccept,
  acceptBtnText,
  svgIcon,
  colorBackground,
  bottomTestID,
}: AcceptButtonProps) => {
  const {
    buttonAccept,
    acceptTextStyle,
    buttonParentWrapper,
    svgIconStyles,
  } = styles

  return (
    <TouchableOpacity
      disabled={disableAccept}
      onPress={debounceButtonPress}
      style={[
        buttonParentWrapper,
        buttonAccept,
        {
          backgroundColor: colorBackground,
          opacity: disableAccept ? 0.4 : 1,
          marginBottom: moderateScale(16),
        },
      ]}
      accessible={true}
      accessibilityLabel={bottomTestID}
    >
      <CustomText h4 transparentBg thick center style={acceptTextStyle}>
        {acceptBtnText}
      </CustomText>
      {svgIcon && <SvgCustomIcon style={svgIconStyles} name={svgIcon} />}
    </TouchableOpacity>
  )
}

export { ModalButtons }

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    width: '100%',
    maxWidth: '100%',
    padding: moderateScale(15),
    paddingBottom: moderateScale(10),
    flexDirection: 'column',
  },
  buttonParentWrapper: {
    borderRadius: 5,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonIgnore: {
    borderWidth: 1,
    borderColor: colors.red,
    padding: moderateScale(17),
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '35%',
  },
  buttonAccept: {
    borderRadius: 5,
    padding: moderateScale(17),
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '35%',
  },
  ignoreTextStyle: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    color: colors.red,
    fontFamily: fontFamily,
  },
  acceptTextStyle: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    color: colors.white,
    fontFamily: fontFamily,
  },
  fullWidth: {
    flexDirection: 'column',
  },
  fullIgnore: {
    width: '100%',
  },
  svgIconStyles: { position: 'absolute', right: 10 },
})
