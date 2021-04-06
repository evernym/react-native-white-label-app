// @flow
import React, { Component } from 'react'
import { StyleSheet, FlatList, View } from 'react-native'
import { connect } from 'react-redux'
import type { CustomListProps, Item } from './type-custom-list'
import type { Store } from '../../store/type-store'

import Icon from '../icon'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { DefaultLogo } from '../default-logo/default-logo'
import { ATTRIBUTE_TYPE } from '../../proof-request/type-proof-request'
import { getPredicateTitle } from '../../connection-details/utils/getPredicateTitle'
import { renderUserAvatar } from '../../components/user-avatar/user-avatar'
import { RenderAttachmentIcon } from '../../components/attachment/attachment'
import { getUserAvatarSource } from '../../store/store-utils'

export class CustomListProofRequest extends Component<CustomListProps, void> {
  keyExtractor = ({ label, values }: Item, index: number) => {
    if (label) {
      return `${label}${index}`
    }
    if (values) {
      return `${Object.keys(values).join('-')}${index}`
    }

    return `${index}`
  }

  renderSingleValue = ({ item, index }: { item: Item, index: number }) => {
    // if item is an array then take first element of item
    // as we only need single item
    if (Array.isArray(item)) {
      item = item[0]
    }

    let claim =
      item.claimUuid &&
      this.props.claimMap &&
      this.props.claimMap[item.claimUuid]

    let logo

    if (claim) {
      logo = claim.logoUrl ? (
        <Icon
          medium
          round
          resizeMode="cover"
          src={{ uri: claim.logoUrl }}
          testID={`proof-requester-logo-${index}`}
        />
      ) : (
        <DefaultLogo text={claim.senderName || ''} size={30} fontSize={18} />
      )
    } else {
      logo = renderUserAvatar({ size: 'superSmall' })
    }

    const data =
      (item.type === ATTRIBUTE_TYPE.FILLED_PREDICATE
        ? `${getPredicateTitle(item.p_type || '')} ${item.p_value || ''}`
        : item.data) || ''

    if ((data === '' || !data) && !this.props.isMissingFieldsShowing) {
      return <View />
    }

    return (
      <View key={index} style={styles.wrapper}>
        <View style={styles.textAvatarWrapper}>
          <View style={styles.textWrapper}>
            {RenderAttachmentIcon(
              item.label || '',
              data,
              item.claimUuid || '',
              item.claimUuid || ''
            )}
          </View>
          <View style={styles.avatarWrapper}>{logo}</View>
        </View>
      </View>
    )
  }

  renderMultipleValues = ({ item, index }: { item: Item, index: number }) => {
    let logoUrl
    let claim
    if (!item.values) {
      return <View />
    }

    const allValuesAreEmpty = Object.values(item.values).every(
      (value) => value === '' || !value
    )

    if (allValuesAreEmpty && !this.props.isMissingFieldsShowing) {
      return <View />
    }

    const views = Object.keys(item.values || {}).map((label, keyIndex) => {
      let value = ''
      if (item.values) {
        value = item.values[label]
      }

      if (!claim) {
        claim =
          item.claimUuid &&
          this.props.claimMap &&
          this.props.claimMap[item.claimUuid]
      }

      if (!claim) {
        return
      }

      logoUrl = claim.logoUrl ? { uri: claim.logoUrl } : null

      if ((value === '' || !value) && !this.props.isMissingFieldsShowing) {
        return <View />
      }

      return (
        <View key={`${index}_${keyIndex}`} style={styles.textInnerItemWrapper}>
          {RenderAttachmentIcon(
            label || '',
            value,
            item.claimUuid || '',
            item.claimUuid || ''
          )}
        </View>
      )
    })

    return (
      <View key={index} style={styles.wrapper}>
        <View style={styles.textAvatarWrapper}>
          <View style={styles.textInnerWrapper}>{views}</View>
          <View style={styles.avatarWrapper}>
            {logoUrl ? (
              <Icon
                medium
                round
                resizeMode="cover"
                src={logoUrl}
                testID={`proof-requester-logo-${index}`}
              />
            ) : (
              claim &&
              claim.senderName && (
                <DefaultLogo text={claim.senderName} size={30} fontSize={18} />
              )
            )}
          </View>
        </View>
      </View>
    )
  }

  render() {
    return (
      <FlatList
        data={this.props.items}
        keyExtractor={this.keyExtractor}
        renderItem={({ item, index }: { item: Item, index: number }) => {
          if (item.values) {
            return this.renderMultipleValues({ item, index })
          } else {
            return this.renderSingleValue({ item, index })
          }
        }}
      />
    )
  }
}

const mapStateToProps = (state: Store) => ({
  avatarSource: getUserAvatarSource(state.user.avatarName),
})

export default connect(mapStateToProps)(CustomListProofRequest)

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    width: '100%',
    position: 'relative',
    paddingTop: moderateScale(12),
    borderBottomColor: colors.gray3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.gray3,
    width: '100%',
    textAlign: 'left',
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
  },
  content: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '700',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    lineHeight: verticalScale(23),
  },
  contentGray: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '400',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  textAvatarWrapper: {
    flexDirection: 'row',
  },
  textWrapper: {
    width: '90%',
  },
  textInnerWrapper: {
    width: '90%',
  },
  textInnerItemWrapper: {
    paddingBottom: moderateScale(12),
  },
  avatarWrapper: {
    width: '15%',
    paddingTop: moderateScale(5),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
})
