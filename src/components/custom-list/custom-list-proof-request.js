// @flow
import React, { Component } from 'react'
import { StyleSheet, FlatList, View, Text } from 'react-native'
import { connect } from 'react-redux'
import type { CustomListProps, Item } from './type-custom-list'
import type { Store } from '../../store/type-store'
import { BLANK_ATTRIBUTE_DATA_TEXT } from '../../connection-details/type-connection-details'

import Icon from '../icon'
import { getUserAvatarSource } from '../../store/store-selector'
import { verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'
import { renderAttachmentIcon } from '../../connection-details/components/modal-content'
import { DefaultLogo } from '../default-logo/default-logo'
import { ATTRIBUTE_TYPE } from '../../proof-request/type-proof-request'
import { getPredicateTitle } from '../../connection-details/utils/getPredicateTitle'

const defaultAvatar = require('../../../../../../app/evernym-sdk/images/UserAvatar.png')

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

    // If the item has data, even if it is just a blank string, it exists. If it has no data it will be null and not show the icon.
    const isDataEmptyString = item.data === ''

    let claim =
      item.claimUuid &&
      this.props.claimMap &&
      this.props.claimMap[item.claimUuid]

    let logoUrl

    if (!logoUrl && claim) {
      logoUrl = claim.logoUrl ? { uri: claim.logoUrl } : null
    }

    if (!claim) {
      logoUrl = this.props.avatarSource || defaultAvatar
    }

    const data = (
      item.type === ATTRIBUTE_TYPE.FILLED_PREDICATE ?
        `${getPredicateTitle(item.p_type || '')} ${item.p_value || ''}` :
        item.data
    ) || ''

    return (
      <View key={index} style={styles.wrapper}>
        <View style={styles.textAvatarWrapper}>
          <View style={styles.textWrapper}>
            {
              // Show (none) in a lighter gray if the data is actually a blank string
              isDataEmptyString ? (
                <Text style={styles.contentGray}>
                  {BLANK_ATTRIBUTE_DATA_TEXT}
                </Text>
              ) : (
                renderAttachmentIcon(
                  item.label || '',
                  data,
                  item.claimUuid || '',
                  item.claimUuid || ''
                )
              )
            }
          </View>
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

  renderMultipleValues = ({ item, index }: { item: Item, index: number }) => {
    let logoUrl
    let claim
    if (!item.values) {
      return <View></View>
    }

    const views = Object.keys(item.values).map((label, keyIndex) => {
      let value = ''
      if (item.values) {
        value = item.values[label]
      }

      const isDataEmptyString = value === ''

      if (!claim) {
        claim =
          item.claimUuid &&
          this.props.claimMap &&
          this.props.claimMap[item.claimUuid]
      }

      if (!logoUrl && claim) {
        logoUrl = claim.logoUrl ? { uri: claim.logoUrl } : null
      }

      return (
        <View key={`${index}_${keyIndex}`} style={styles.textInnerItemWrapper}>
          <Text style={styles.title}>{label}</Text>
          {
            // Show (none) in a lighter gray if the data is actually a blank string
            isDataEmptyString ? (
              <Text style={styles.contentGray}>
                {BLANK_ATTRIBUTE_DATA_TEXT}
              </Text>
            ) : (
              <Text style={styles.content}>{value}</Text>
            )
          }
        </View>
      )
    })

    if (!claim) {
      logoUrl = this.props.avatarSource || defaultAvatar
    }

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
        style={styles.keyboardFlatList}
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
    backgroundColor: colors.cmWhite,
    width: '100%',
    position: 'relative',
    paddingTop: moderateScale(12),
    borderBottomColor: colors.cmGray3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.cmGray3,
    width: '100%',
    textAlign: 'left',
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
  },
  content: {
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '700',
    color: colors.cmGray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    lineHeight: verticalScale(23),
  },
  contentGray: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '400',
    color: colors.cmGray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  textAvatarWrapper: {
    width: '98.5%',
    flexDirection: 'row',
  },
  textWrapper: {
    width: '85%',
  },
  textInnerWrapper: {
    width: '85%',
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
  keyboardFlatList: {
    paddingLeft: '5%',
    paddingRight: '5%',
  },
})
