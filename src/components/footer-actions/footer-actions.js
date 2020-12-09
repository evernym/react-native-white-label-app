// @flow
import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { Store } from '../../store/type-store'
import type { FooterActionsProps } from './type-footer-actions'

import { Container } from '../layout/container'
import { CustomView } from '../layout/custom-view'
import CustomButton from '../button'
import ImageColorPicker from '../image-color-picker/image-color-picker'
import { DENY, CONNECT } from '../../common'
import { noop } from '../../common'
import { white } from '../../common/styles/constant'
import { getConnectionTheme } from '../../store/store-selector'

export const FooterActions = (props: FooterActionsProps) => {
  const {
    denyTitle = DENY,
    acceptTitle = CONNECT,
    logoUrl = '',
    onDecline = noop,
    onAccept = noop,
    testID,
    disableAccept = false,
    disableDeny = false,
    hidePrimary = false,
    useColorPicker = false,
    activeConnectionThemePrimary,
  } = props
  const customColor = useMemo(
    () => ({
      backgroundColor: activeConnectionThemePrimary,
    }),
    [activeConnectionThemePrimary]
  )

  return (
    <SafeAreaView style={customColor} edges={insetEdges}>
      <CustomView fifth>
        <CustomView row>
          <Container>
            <CustomButton
              primary
              medium
              disabled={disableDeny}
              title={denyTitle}
              onPress={onDecline}
              testID={`${testID}-deny`}
              customColor={customColor}
            />
          </Container>
          {!hidePrimary && (
            <Container>
              <CustomButton
                primary
                medium
                disabled={disableAccept}
                title={acceptTitle}
                onPress={onAccept}
                testID={`${testID}-accept`}
                style={[styles.buttonStyle]}
                customColor={customColor}
                fontWeight="bold"
              />
            </Container>
          )}
        </CustomView>
        {useColorPicker && <ImageColorPicker imageUrl={logoUrl} />}
      </CustomView>
    </SafeAreaView>
  )
}

const mapStateToProps = (state: Store, props: FooterActionsProps) => {
  const activeConnectionThemePrimary = getConnectionTheme(
    state,
    props.logoUrl || ''
  ).primary

  return {
    activeConnectionThemePrimary,
  }
}

export default connect(mapStateToProps)(FooterActions)

const styles = StyleSheet.create({
  buttonStyle: {
    // borderLeftColor is broken on android https://github.com/facebook/react-native/issues/19981
    borderColor: white,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
})

const insetEdges = ['bottom']
