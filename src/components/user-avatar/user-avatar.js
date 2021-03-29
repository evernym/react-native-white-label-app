// @flow
import React, { Component } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import type { UserAvatarProps } from './type-user-avatar'
import type { Store } from '../../store/type-store'

import Icon from '../icon'
import { selectUserAvatar } from '../../store/user/user-store'
import type { ImageSource } from '../../common/type-common'
import { Avatar } from '..'
import { getUserAvatarSource } from '../../store/store-utils'
import { defaultUserAvatar } from '../../external-imports'

export class UserAvatarComponent extends Component<UserAvatarProps, void> {
  changeAvatar = () => {
    if (!this.props.userCanChange) {
      return
    }

    this.props.selectUserAvatar()
  }

  render() {
    let avatarSource = this.props.avatarName || defaultUserAvatar
    const size = this.props.size || 'xxLarge'
    const props = {
      [size]: true,
      round: this.props.round || true,
      resizeMode: "cover"
    }

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
            {this.props.children(avatarSource, props)}
          </View>
        </TouchableWithoutFeedback>
      )
    }

    return (
      <Icon
        src={avatarSource}
        onPress={this.changeAvatar}
        testID={this.props.testID}
        accessible={true}
        accessibilityLabel={this.props.testID}
        {...props}
      />
    )
  }
}

const mapStateToProps = (state: Store, props) => ({
  avatarName: props.source || getUserAvatarSource(state.user.avatarName),
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ selectUserAvatar }, dispatch)

const UserAvatar = connect(mapStateToProps, mapDispatchToProps)(UserAvatarComponent)

export default UserAvatar

export const renderUserAvatar = (props: any) => (
  <UserAvatar {...props}>
    {renderAvatarWithSource}
  </UserAvatar>
)

const renderAvatarWithSource = (avatarSource: number | ImageSource, props) => {
  return <Avatar src={avatarSource} {...props} />
}
