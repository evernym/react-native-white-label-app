// @flow
import React, { Component } from 'react'
import { StyleSheet, FlatList } from 'react-native'
import { connect } from 'react-redux'

import type { CustomListProps, Item } from './type-custom-list'
import type { Store } from '../../store/type-store'

import { Container } from '../layout/container'
import { CustomView } from '../layout/custom-view'
import CustomText from '../text'
import Icon from '../icon'
import Separator from '../separator'
import { OFFSET_3X } from '../../common/styles'
import { getUserAvatarSource } from '../../store/store-selector'
import { renderUserAvatar } from '../user-avatar/user-avatar'

export class CustomList extends Component<CustomListProps, void> {
  keyExtractor = ({ label, values }: Item, index: number) => {
    if (label) {
      return `${label}${index}`
    }
    if (values) {
      return `${Object.keys(values).join('-')}${index}`
    }

    return `${index}`
  }

  renderListType1Item = ({ item, index }: { item: Item, index: number }) => {
    // if item is an array then take first element of item
    // as we only need single item
    if (Array.isArray(item)) {
      item = item[0]
    }
    if (this.props.type === 'center') {
      return (
        <CustomView fifth row horizontalSpace doubleVerticalSpace>
          <CustomView fifth right style={[styles.itemLabel]}>
            <CustomText
              h7
              uppercase
              semiBold
              bg="tertiary"
              transparentBg
              style={[styles.labelText]}
              testID={`custom-list-label-${index}`}
            >
              {item.label}
            </CustomText>
          </CustomView>
          <CustomView fifth left style={[styles.itemValue]}>
            <CustomText
              h6
              demiBold
              bg="tertiary"
              transparentBg
              testID={`custom-list-data-${index}`}
            >
              {item.data}
            </CustomText>
          </CustomView>
        </CustomView>
      )
    } else {
      const logoUrl = item.data &&
        item.claimUuid &&
        this.props.claimMap &&
        this.props.claimMap[item.claimUuid] &&
        this.props.claimMap[item.claimUuid].logoUrl
          ? { uri: this.props.claimMap[item.claimUuid].logoUrl } :
          null

      const logo = logoUrl ?
        <Icon center medium round resizeMode="cover" src={logoUrl} />:
        renderUserAvatar({ size: 'superSmall'})

      return (
        <Container fifth style={[styles.list]} row>
          <Container fifth verticalSpace>
            <CustomView fifth>
              <CustomText
                h7
                uppercase
                semiBold
                bg="tertiary"
                transparentBg
                style={[styles.list2LabelText]}
                testID={`custom-list-label-${index}`}
              >
                {item.label}
              </CustomText>
            </CustomView>
            <CustomView fifth>
              <CustomText
                h6
                demiBold
                bg="tertiary"
                transparentBg
                testID={`custom-list-data-${index}`}
              >
                {item.data}
              </CustomText>
            </CustomView>
          </Container>
          {logo}
        </Container>
      )
    }
  }

  render() {
    const items: Item[] = this.props.items
    return (
      <Container safeArea fifth>
        <FlatList
          data={items}
          keyExtractor={this.keyExtractor}
          ItemSeparatorComponent={Separator}
          ListFooterComponent={Separator}
          renderItem={this.renderListType1Item}
        />
      </Container>
    )
  }
}

const mapStateToProps = (state: Store) => ({
  avatarSource: getUserAvatarSource(state.user.avatarName),
})

export default connect(mapStateToProps)(CustomList)

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: OFFSET_3X / 2,
  },
  itemLabel: {
    flex: 4,
    paddingRight: OFFSET_3X / 2,
  },
  labelText: {
    lineHeight: 19,
  },
  itemValue: {
    flex: 6,
  },
  list2LabelText: {
    paddingVertical: 2,
  },
})
