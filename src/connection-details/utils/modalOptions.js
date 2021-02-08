import React from 'react'
import { ModalHeaderBar } from '../../components/modal-header-bar/modal-header-bar'

import { colors } from '../../common/styles'

export const modalOptions = (headline, icon, animation) => (
  ({
     navigation: { goBack, isFocused },
   }) => ({
    safeAreaInsets: { top: 85 },
    cardStyle: {
      marginLeft: '2.5%',
      marginRight: '2.5%',
      marginBottom: '4%',
      borderRadius: 10,
      backgroundColor: colors.white,
    },
    cardOverlay: () => {
      return (
        <ModalHeaderBar
          headerTitle={isFocused() ? headline: null}
          dismissIconType={isFocused() ? icon : null}
          onPress={() => goBack(null)}
        />
      )
    },
    ...animation || {}
  })
)
