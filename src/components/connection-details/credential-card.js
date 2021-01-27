// @flow
import React, { PureComponent } from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { proofRequestRoute, claimOfferRoute } from '../../common'
import { moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { ExpandableText } from '../expandable-text/expandable-text'

// TODO: Fix the <any, {}> to be the correct types for props and state
class CredentialCard extends PureComponent<any, {}> {
  updateAndShowModal = () => {
    if (this.props.proof) {
      this.props.navigation.navigate(proofRequestRoute, { uid: this.props.uid })
    } else {
      this.props.navigation.navigate(claimOfferRoute, { uid: this.props.uid })
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.messageDate}>{this.props.messageDate}</Text>
        <ExpandableText
          text={this.props.messageTitle}
          style={styles.messageTitle}
          lines={1}
        />
        <ExpandableText
          text={this.props.messageContent}
          style={styles.messageContent}
          lines={1}
        />
        <View
          style={[
            styles.buttonsWrapper,
            { display: this.props.showButtons ? 'flex' : 'none' },
          ]}
        >
          <TouchableOpacity
            onPress={this.updateAndShowModal}
            style={[
              styles.buttonView,
              { backgroundColor: this.props.colorBackground },
            ]}
          >
            <Text style={styles.viewText}>View</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.helperView} />
      </View>
    )
  }
}

export { CredentialCard }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingLeft: '7%',
    paddingRight: '7%',
    paddingTop: moderateScale(15),
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  absolute: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: moderateScale(45),
  },
  messageDate: {
    color: colors.cmGray2,
    fontSize: moderateScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  messageTitle: {
    color: colors.cmGray1,
    fontWeight: '500',
    fontSize: moderateScale(fontSizes.size5),
    textAlign: 'left',
    marginTop: moderateScale(2),
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
  },
  messageContent: {
    color: colors.cmGray1,
    fontSize: moderateScale(fontSizes.size7),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  buttonsWrapper: {
    flexDirection: 'row',
    width: '100%',
    marginTop: moderateScale(15),
  },
  buttonView: {
    padding: moderateScale(6),
    paddingLeft: moderateScale(26),
    paddingRight: moderateScale(26),
    borderRadius: 5,
  },
  viewText: {
    color: colors.cmWhite,
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  buttonIgnore: {
    backgroundColor: 'transparent',
    padding: moderateScale(6),
    paddingLeft: moderateScale(26),
    paddingRight: moderateScale(26),
    borderRadius: 5,
  },
  ignoreText: {
    color: colors.cmGray2,
    fontSize: moderateScale(fontSizes.size7),
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  helperView: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cmGray5,
    width: '100%',
    paddingTop: moderateScale(15),
  },
})
