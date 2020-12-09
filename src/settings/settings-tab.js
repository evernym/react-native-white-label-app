// @flow
import React, { Component } from 'react'
import { View } from 'react-native'
import { connect } from 'react-redux'
import SvgCustomIcon from '../components/svg-custom-icon'
import { color } from '../common/styles'

import type { Store } from '../store/type-store'
import { styles } from '../navigation/navigator'

class SettingsTab extends Component<any> {
  render() {
    return (
      <View style={styles.icon}>
        <SvgCustomIcon
          name="Settings"
          height={29}
          fill={
            this.props.focused ? color.actions.font.tenth : color.actions.sixth
          }
        />
        {this.props.cloudBackupError !== null &&
          !this.props.hasViewedWalletError && (
            <View
              style={{
                position: 'absolute',
                width: 10,
                height: 10,
                right: 0,
                borderRadius: 50,
                backgroundColor: 'red',
                zIndex: 10002,
              }}
            />
          )}
      </View>
    )
  }
}

const mapStateToProps = (state: Store) => {
  return {
    cloudBackupError: state.backup.cloudBackupError,
    hasViewedWalletError: state.backup.hasViewedWalletError,
  }
}

export default connect(mapStateToProps)(SettingsTab)
