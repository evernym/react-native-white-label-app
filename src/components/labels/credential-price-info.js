// @flow
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { BigNumber } from 'bignumber.js'
import { scale } from 'react-native-size-matters'

import { colors } from '../../common/styles/constant'
import SvgCustomIcon from '../../components/svg-setting-icons'
import { CustomText } from '../../components'

const CredentialPriceInfo = ({
  price,
  isPaid,
}: {
  price: string,
  isPaid?: boolean,
}) => {
  const priceAmount = new BigNumber(price)

  const textStyles = isPaid ? styles.paidText : styles.text
  return priceAmount > 0 ? (
    <View style={[styles.priceContainer, isPaid ? styles.paidContainer : {}]}>
      <CustomText transparentBg style={[textStyles]}>
        {isPaid ? 'You paid' : 'Price:'}
      </CustomText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <SvgCustomIcon
          fill={isPaid ? colors.cmGray2 : colors.cmWhite}
          name="PaymentToken"
          height={isPaid ? '16' : '24'}
          width={isPaid ? '16' : '24'}
        />
        <CustomText transparentBg style={[textStyles, styles.largeText]}>
          {priceAmount.toFixed().toString()}
        </CustomText>
        <CustomText transparentBg style={[textStyles]}>
          {isPaid ? 'for' : ''}
        </CustomText>
      </View>
    </View>
  ) : (
    <View />
  )
}

export default CredentialPriceInfo

const styles = StyleSheet.create({
  priceContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cmOrange,
    maxWidth: '100%',
    justifyContent: 'space-between',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,

    alignItems: 'center',
  },
  paidContainer: {
    backgroundColor: colors.cmGray5,
    justifyContent: 'flex-start',
  },
  text: {
    fontSize: scale(14),
    color: colors.cmWhite,
  },
  text1: {
    fontSize: scale(14),
    color: colors.cmWhite,
  },
  paidText: {
    fontSize: scale(11),
    color: colors.cmGray2,
    paddingRight: 5,
  },
  icon: {
    marginRight: 5,
    resizeMode: 'contain',
    height: 25,
  },
  largeText: {
    fontSize: scale(17),
    paddingLeft: 5,
  },
})
