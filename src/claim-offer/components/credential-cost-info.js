// @flow
import React from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { scale } from 'react-native-size-matters'
import { BigNumber } from 'bignumber.js'

import {
  cardBorder,
  yellowSea,
  whiteSolid,
  isBiggerThanMediumDevice, colors,
} from '../../common/styles'
import { ModalButtons } from '../../components/buttons/modal-buttons'
import type { TokenFeesData } from '../type-claim-offer'
import { CustomText } from '../../components/'

type CredentialCostInfoProps = {
  feesData: TokenFeesData,
  payTokenValue: string,
  backgroundColor: string,
  onConfirmAndPay: () => void,
  onCancel: () => void,
  secondColorBackground: string,
}

const CredentialCostInfo = (props: CredentialCostInfoProps) => {
  const {
    feesData,
    payTokenValue,
    backgroundColor,
    onCancel,
    onConfirmAndPay,
    secondColorBackground,
  } = props
  const credentialCost = new BigNumber(payTokenValue || 0).toFixed(8)
  const costsData = [
    {
      label: 'Transaction Fee',
      key: 'fees',
      value: feesData.fees,
    },
    {
      label: 'Credential Cost',
      key: 'payTokenValue',
      value: credentialCost,
    },
    { label: 'Total', key: 'total', value: feesData.total || 0 },
  ]

  const renderCostCell = ({ item, index }) => {
    const { totalLabel, totalValue, labelText, valueText } = styles
    let totalLabelStyles = [totalLabel]
    let totalValueStyles = [totalValue]
    if (index === 2 && item.value && item.value.length >= 12) {
      totalLabelStyles.push({ fontSize: scale(17) })
      totalValueStyles.push({ fontSize: scale(19) })
    }

    return (
      <View style={styles.cell} key={item.label}>
        <CustomText
          bg={false}
          style={[labelText, index === 2 && totalLabelStyles]}
        >
          {item && item.label}
        </CustomText>
        <CustomText
          bg={false}
          formatNumber
          style={[valueText, index === 2 && totalValueStyles]}
        >
          {item && item.value}
        </CustomText>
      </View>
    )
  }

  const borderSeparator = ({ leadingItem }) => {
    const { key } = leadingItem
    return (
      <View
        style={[
          styles.borderSeparator,
          key === 'payTokenValue' && styles.borderTotalSeparator,
        ]}
      />
    )
  }

  const keyExtractor = (item) => `${item.label}`

  return (
    <View style={styles.costContainer}>
      <CustomText bg={false} style={[styles.noteMessage]}>
        Please confirm. Once tokens are transferred, it cannot be undone.
      </CustomText>
      {/* NOTE: Probably don't need to scroll here, should be able to make UI fit on screen */}
      <FlatList
        data={costsData}
        style={styles.costTable}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={borderSeparator}
        renderItem={renderCostCell}
      />
      {/* <View style={styles.buttonsContainer}> */}
      <ModalButtons
        onIgnore={onCancel}
        onPress={onConfirmAndPay}
        disableAccept={false}
        colorBackground={backgroundColor}
        secondColorBackground={secondColorBackground}
        denyButtonText={'Cancel'}
        acceptBtnText={'Confirm and Pay'}
      />
      {/* </View> */}
    </View>
  )
}

export default CredentialCostInfo

const textStyle = {
  color: colors.gray1,
  lineHeight: 20,
}

const styles = StyleSheet.create({
  costContainer: { flex: 1, backgroundColor: cardBorder },
  costTable: {
    height: 'auto',
    // flex: 1,
  },
  noteMessage: {
    color: colors.gray2,
    textAlign: 'center',
    fontSize: isBiggerThanMediumDevice ? scale(15) : scale(12),
    paddingTop: isBiggerThanMediumDevice ? 15 : 5,
    paddingBottom: isBiggerThanMediumDevice ? 10 : 5,
    flex: 1,
  },
  cell: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: whiteSolid,
  },
  valueText: {
    ...textStyle,
    fontSize: scale(17),
    color: yellowSea,
    textAlign: 'right',
  },
  labelText: {
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  borderSeparator: {
    backgroundColor: colors.gray4,
    width: '100%',
    height: 1,
  },
  borderTotalSeparator: {
    backgroundColor: yellowSea,
    width: '100%',
    height: 2,
  },
  totalLabel: {
    fontSize: scale(19),
    lineHeight: 22,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: scale(22),
    lineHeight: 22,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  buttonsContainer: {
    flex: 1,
  },
})
