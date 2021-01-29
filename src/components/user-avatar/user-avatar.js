// @flow
import React, { Component } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import type { UserAvatarProps } from './type-user-avatar'
import type { Store } from '../../store/type-store'

import Icon from '../icon'
import { selectUserAvatar } from '../../store/user/user-store'
import { getUserAvatarSource } from '../../store/store-selector'

// $FlowExpectedError[cannot-resolve-module] external file
import { DEFAULT_USER_AVATAR } from '../../../../../../app/evernym-sdk/app'

export const defaultUserAvatar =
  DEFAULT_USER_AVATAR || require('../../images/UserAvatar.png')

export class UserAvatar extends Component<UserAvatarProps, void> {
  changeAvatar = () => {
    if (!this.props.userCanChange) {
      return
    }

    this.props.selectUserAvatar()
  }

  render() {
    let avatarSource = this.props.avatarName || defaultUserAvatar

    if (this.props.children) {
      // if we are using children as render prop
      // then we want user of the component to specify what to render
      return (
        <TouchableWithoutFeedback
          testID={this.props.testID}
          accessible={true}
          accessibilityLabel={this.props.testID}
          onPress={this.changeAvatar}
        >
          <View pointerEvents="box-only">
            {this.props.children(avatarSource)}
          </View>
        </TouchableWithoutFeedback>
      )
    }

    return (
      <Icon
        src={avatarSource}
        onPress={this.changeAvatar}
        xxLarge
        round
        resizeMode="cover"
        testID={this.props.testID}
        accessible={true}
        accessibilityLabel={this.props.testID}
      />
    )
  }
}

const mapStateToProps = (state: Store) => ({
  avatarName: getUserAvatarSource(state.user.avatarName),
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ selectUserAvatar }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(UserAvatar)
