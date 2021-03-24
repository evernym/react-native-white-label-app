// @flow
// packages
import React, { PureComponent } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { moderateScale, verticalScale } from 'react-native-size-matters'

// components
import { CustomText } from '../../components'
import SvgCustomIcon from '../../components/svg-custom-icon'

// styles
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'

type BottomButtonProps = {
  colorBackground: string,
  onPress: (event: any) => void,
  disableAccept: boolean,
  bottomBtnText: string,
  svgIcon: any,
  hideAccept?: boolean,
  bottomTestID: string,
}

type TopButtonProps = {
  disableDeny: boolean,
  topBtnText: string,
  onIgnore: (event: any) => void,
  topTestID: string,
}

// TODO: Fix the any type
type ModalButtonProps = {
  containerStyles?: any,
  children?: any,
  primaryActionValue: (event: any) => void,
  onPress: (event: any) => void,
} & BottomButtonProps &
  TopButtonProps

export class InviteActionButtons extends PureComponent<any, ModalButtonProps> {
  constructor(props: ModalButtonProps) {
    super(props)
  }

  render() {
    const {
      onIgnore,
      disableDeny = false,
      disableAccept = false,
      colorBackground,
      topBtnText,
      bottomBtnText,
      containerStyles,
      children,
      svgIcon,
      hideAccept,
      topTestID,
      bottomTestID,
      onPress,
    } = this.props
    const { container } = styles

    return (
      <View style={[container, containerStyles]}>
        {children}
        {topBtnText && (
          <TopButton
            {...{
              disableDeny,
              topBtnText,
              onIgnore,
              topTestID,
            }}
          />
        )}
        {!hideAccept && (
          <BottomButton
            {...{
              disableAccept,
              bottomBtnText,
              onPress,
              svgIcon,
              colorBackground,
              bottomTestID,
            }}
          />
        )}
      </View>
    )
  }
}

const TopButton = ({
  topBtnText,
  onIgnore,
  disableDeny,
  topTestID,
}: TopButtonProps) => {
  const { buttonIgnore, ignoreTextStyle, buttonParentWrapper } = styles

  return (
    <TouchableOpacity
      disabled={disableDeny}
      onPress={onIgnore}
      accessibilityLabel={topTestID}
    >
      <View
        style={[
          buttonParentWrapper,
          buttonIgnore,
          { marginBottom: moderateScale(16) },
        ]}
      >
        <CustomText errorText h4 transparentBg demiBold style={ignoreTextStyle}>
          {topBtnText}
        </CustomText>
      </View>
    </TouchableOpacity>
  )
}

const BottomButton = ({
  onPress,
  disableAccept,
  bottomBtnText,
  svgIcon,
  colorBackground,
  bottomTestID,
}: BottomButtonProps) => {
  const {
    buttonAccept,
    acceptTextStyle,
    buttonParentWrapper,
    svgIconStyles,
  } = styles

  return (
    <TouchableOpacity
      disabled={disableAccept}
      onPress={onPress}
      accessibilityLabel={bottomTestID}
    >
      <View
        style={[
          buttonParentWrapper,
          buttonAccept,
          {
            backgroundColor: colorBackground,
            opacity: disableAccept ? 0.4 : 1,
          },
        ]}
      >
        <CustomText h4 transparentBg thick center style={acceptTextStyle}>
          {bottomBtnText}
        </CustomText>
        {svgIcon && <SvgCustomIcon style={svgIconStyles} name={svgIcon} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    width: '100%',
    maxWidth: '100%',
    padding: moderateScale(15),
    paddingBottom: moderateScale(1),
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
