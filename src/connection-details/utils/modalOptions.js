import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ModalHeaderBar } from '../../components/modal-header-bar/modal-header-bar'

import {
  credentialOfferHeadline,
} from '../../external-imports'
import { colors } from '../../common/styles'

export const withModalStyleHoc = (Component: any, headline: string, icon: string) => 
  (props) => (
    <>
      <ModalHeaderBar
        headerTitle={props.navigation.isFocused() ? headline: null}
        dismissIconType={props.navigation.isFocused() ? icon : null}
        onPress={() => props.navigation.goBack()}
      />
      <View style={styles.modalWrapper}>
        <Component {...props} />
      </View>
    </>
  )

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    marginLeft: '2.5%',
    marginRight: '2.5%',
    marginBottom: '4%',
    marginTop: '4%',
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingTop: 10,
  }
})
export const modalOptions = (headline: string, icon: string, animation: any) => (
  ({
     navigation: { goBack, isFocused },
   }) => ({
    contentStyle: {
      backgroundColor: colors.black,
    },
    ...animation || {}
  })
)
