// @flow
import React, { Component } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { ModalButtons } from '../components/buttons/modal-buttons'
import CredentialPriceInfo from '../components/labels/credential-price-info'
import { buttonGreen } from '../common/styles/constant'
import { CustomText } from '../components'
import Loader from '../components/loader/loader'
import { Error } from '../components/error/error'
import { Success } from '../components/success/success'
import CredentialCostInfo from '../claim-offer/components/credential-cost-info'
import { designStyleGuideRoute } from '../common'

class DesignStyleguide extends Component<void, void> {
  render() {
    return (
      <View>
        <ScrollView>
          <CustomText style={[styles.title]}>Modal Buttons</CustomText>
          <ModalButtons
            onIgnore={() => {}}
            onPress={() => {}}
            disableAccept={false}
            payTokenValue={0}
            colorBackground={buttonGreen}
            denyButtonText={'Ignore'}
            acceptBtnText={'Read and Sign TAA'}
            buttonsWrapperStyles={{
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }}
          >
            <CredentialPriceInfo price={'0.000043'} />
          </ModalButtons>

          <CustomText style={[styles.title]}>Loader</CustomText>
          <Loader message="Custom loader message..." />

          <CustomText style={[styles.title]}>Error</CustomText>
          <Error errorText="Some error text" />

          <CustomText style={[styles.title]}>Success</CustomText>
          <Success successText="Some error text" afterSuccessShown={() => {}} />

          <CustomText style={[styles.title]}>CredentialCostInfo</CustomText>
          <CredentialCostInfo
            feesData={{
              fees: '0',
              total: '111',
              currentTokenBalance: '111',
            }}
            payTokenValue={'0.0004'}
            backgroundColor={'#999'}
            onConfirmAndPay={() => {}}
            onCancel={() => {}}
            secondColorBackground={'#666'}
          />
        </ScrollView>
      </View>
    )
  }
}

export const designStyleGuideScreen = {
  routeName: designStyleGuideRoute,
  screen: DesignStyleguide,
  options: {
    headerShown: true,
  },
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontWeight: 'bold',
    marginTop: 20,
    marginLeft: 20,
    padding: 5,
  },
})
