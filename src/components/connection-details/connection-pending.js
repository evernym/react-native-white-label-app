// @flow
import React, { PureComponent } from 'react'
import { Text, Image, View, StyleSheet } from 'react-native'
import { moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'

// TODO: Fix the <any, {}> to be the correct types for props and state
class ConnectionPending extends PureComponent<any, {}> {
  constructor(props: any) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.date}>{this.props.date}</Text>
        <View style={styles.innerWrapper}>
          <View style={styles.spinerWrapper}>
            <Image
              style={styles.spiner}
              source={require('../../images/componentsDetails/spiner.gif')}
            />
            <View style={styles.absolute} />
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.title}>{this.props.title}</Text>
            <Text style={styles.content}>{this.props.content}</Text>
          </View>
        </View>
      </View>
    )
  }
}

export { ConnectionPending }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '86%',
    marginLeft: '7%',
    paddingTop: moderateScale(15),
    paddingBottom: moderateScale(15),
  },
  innerWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: colors.cmGray5,
    borderRadius: 3,
    width: '100%',
    padding: moderateScale(12),
  },
  date: {
    color: colors.cmGray2,
    fontSize: moderateScale(fontSizes.size10),
    textAlign: 'left',
    fontFamily: fontFamily,
    paddingBottom: moderateScale(8),
  },
  spinerWrapper: {
    position: 'relative',
  },
  spiner: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  absolute: {
    width: moderateScale(14),
    height: moderateScale(14),
    backgroundColor: colors.cmWhite,
    borderRadius: 7,
    position: 'absolute',
  },
  spinerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    paddingLeft: moderateScale(12),
    flex: 1,
  },
  title: {
    color: colors.cmGray1,
    fontWeight: '700',
    fontSize: moderateScale(fontSizes.size7),
    textAlign: 'left',
    marginBottom: moderateScale(4),
    fontFamily: fontFamily,
  },
  content: {
    color: colors.cmGray2,
    fontWeight: '400',
    fontSize: moderateScale(fontSizes.size9),
    textAlign: 'left',
    fontFamily: fontFamily,
  },
})
