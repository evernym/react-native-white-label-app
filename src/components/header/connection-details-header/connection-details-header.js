// @flow
import React, { PureComponent } from 'react'
import { Text, View, Image, TouchableOpacity, Platform } from 'react-native'
import {
  EvaIcon,
  ANDROID_BACK_ARROW_ICON,
  IOS_BACK_ARROW_ICON,
  MORE_ICON,
} from '../../../common/icons'
import { moderateScale } from 'react-native-size-matters'
import { DefaultLogo } from '../../../components/default-logo/default-logo'
// TODO: DA refactor styles and use common one + refactor component
import { styles } from '../type-header'

// TODO: Fix the <any, void> to be the correct types for props and state
class ConnectionDetailsHeader extends PureComponent<any, void> {
  render() {
    const { params } = this.props.route
    const iOS = Platform.OS === 'ios'

    return (
      <View style={styles.container}>
        <View style={styles.iconSection}>
          <TouchableOpacity
            testID="back-arrow-touchable"
            onPress={this.goBack}
            accessible={true}
            accessibilityLabel="back-arrow"
          >
            <EvaIcon
              name={iOS ? IOS_BACK_ARROW_ICON : ANDROID_BACK_ARROW_ICON}
              width={moderateScale(32)}
              height={moderateScale(32)}
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.iconAndNameWrapper}>
          <View
            style={styles.headerImageOuterWrapper}
            accessible={true}
            accessibilityLabel="connection-logo"
          >
            {typeof params.image === 'string' ? (
              <View style={styles.headerImageWrapper}>
                <Image
                  style={styles.headerIcon}
                  source={{ uri: params.image }}
                  resizeMode={'cover'}
                />
              </View>
            ) : (
              <DefaultLogo
                text={params.senderName[0]}
                size={moderateScale(32)}
                fontSize={17}
              />
            )}
          </View>
          <View
            style={styles.labelWithIconSection}
            accessible={true}
            accessibilityLabel="connection-name"
          >
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              {params.senderName}
            </Text>
          </View>
        </View>
        <View style={styles.buttonMoreOptionsWrapper}>
          <TouchableOpacity
            testID="three-dots"
            accessible={true}
            accessibilityLabel="three-dots"
            onPress={this.props.moreOptionsOpen}
          >
            <EvaIcon
              name={MORE_ICON}
              width={moderateScale(32)}
              height={moderateScale(32)}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  goBack = () => {
    const {
      navigation,
      route: { params },
    } = this.props
    this.props.newConnectionSeen(params.senderDID)
    const backRedirectRoute = this.props.route.params?.backRedirectRoute
    if (backRedirectRoute) {
      navigation.navigate(backRedirectRoute)
    } else {
      navigation.goBack(null)
    }
  }
}

export { ConnectionDetailsHeader }
