// @flow
import React, { Component } from 'react'
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { deleteConnectionAction } from '../../store/connections-store'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getUserAvatarSource } from '../../store/store-selector'
import type { Store } from '../../store/type-store'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { EvaIcon, DELETE_ICON, CLOSE_ICON } from '../../common/icons'

const defaultAvatar = require('../../../../../../app/evernym-sdk/images/UserAvatar.png')
// TODO: Fix the <any, void> to be the correct types for props and state
class MoreOptions extends Component<any, void> {
  onDeleteConnection = (senderDID) => {
    this.props.deleteConnectionAction(senderDID)
    this.props.navigation.goBack(null)
  }
  render() {
    const {
      route: { params },
    } = this.props
    let avatarSource = this.props.userAvatarSource || defaultAvatar

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeScreenWrapper}
          onPress={this.props.moreOptionsClose}
        />
        <View style={styles.smallSquare} />
        <View style={styles.contentWrapper}>
          <View style={styles.row}>
            {typeof params.image === 'string' ? (
              <Image style={styles.image} source={{ uri: params.image }} />
            ) : (
              <View style={{ marginRight: 5 }}>
                <DefaultLogo
                  text={params.senderName[0]}
                  size={moderateScale(24)}
                  fontSize={12}
                />
              </View>
            )}
            <Text style={styles.text}>did: {params.senderDID}</Text>
          </View>
          <View style={styles.row}>
            <Image style={styles.image} source={avatarSource} />
            <Text style={styles.text}>did: {params.identifier}</Text>
          </View>
          <TouchableOpacity
            testID="delete-connection"
            accessible={true}
            accessibilityLabel="delete-connection"
            style={styles.deleteButton}
            onPress={() => this.onDeleteConnection(params.senderDID)}
          >
            <EvaIcon
              name={DELETE_ICON}
              color={colors.cmBlue}
              style={styles.image}
            />
            <Text style={styles.buttonText}>Delete Connection</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.closeButtonWrapper}>
          <TouchableOpacity
            testID="delete-connection-close"
            accessible={true}
            accessibilityLabel="delete-connection-close"
            style={styles.closeButton}
            onPress={this.props.moreOptionsClose}
          >
            <EvaIcon
              name={CLOSE_ICON}
              width={moderateScale(32)}
              height={moderateScale(32)}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}
const mapStateToProps = (state: Store) => ({
  userAvatarSource: getUserAvatarSource(state.user.avatarName),
})
const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ deleteConnectionAction }, dispatch)
export default connect(mapStateToProps, mapDispatchToProps)(MoreOptions)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    paddingTop: verticalScale(60),
    zIndex: 999,
    alignItems: 'flex-end',
    width: '100%',
    paddingLeft: '2%',
    paddingRight: '2%',
    height: Dimensions.get('screen').height,
  },
  closeScreenWrapper: {
    position: 'absolute',
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
  },
  smallSquare: {
    position: 'relative',
    backgroundColor: colors.cmWhite,
    width: moderateScale(40),
    height: moderateScale(40),
    shadowColor: colors.cmBlack,
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 8,
  },
  closeButtonWrapper: {
    position: 'absolute',
    zIndex: 999,
    width: moderateScale(40),
    height: moderateScale(40),
    top: moderateScale(56),
    right: '2%',
    elevation: 8,
  },
  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    backgroundColor: colors.cmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    position: 'relative',
    backgroundColor: 'white',
    padding: moderateScale(12),
    shadowColor: colors.cmBlack,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: moderateScale(12),
  },
  image: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: 12,
    marginRight: 5,
  },
  text: {
    textAlign: 'left',
    fontWeight: '500',
    fontSize: verticalScale(fontSizes.size5),
    color: colors.cmGray2,
    fontFamily: fontFamily,
    marginRight: moderateScale(24),
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'left',
    fontWeight: '500',
    fontSize: verticalScale(fontSizes.size5),
    color: colors.cmBlue,
    fontFamily: fontFamily,
    marginLeft: moderateScale(3),
  },
})
