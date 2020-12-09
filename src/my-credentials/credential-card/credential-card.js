// @flow
import React, { PureComponent } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'
import type { CredentialCardProps } from './type-credential-card'
import { Avatar } from '../../components/avatar/avatar'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { verticalScale, moderateScale } from 'react-native-size-matters'

class CredentialCard extends PureComponent<CredentialCardProps, void> {
  pad = (dateOrMonth: number) => {
    return dateOrMonth < 10 ? '0' + dateOrMonth : dateOrMonth
  }
  getCorrectDateLabel = (time: number) => {
    const dayNames = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]
    const currentDateTime = new Date()
    const dateTimeCreated = new Date(time)
    const dateCreated = dateTimeCreated.getDate()
    const monthCreated = dateTimeCreated.getMonth()
    const yearCreated = dateTimeCreated.getFullYear()
    const hourCreated = dateTimeCreated.getHours()
    const minuteCreated = dateTimeCreated.getMinutes()
    const dayCreated = dateTimeCreated.getDay()
    const mmddyyyy =
      this.pad(monthCreated + 1) +
      '/' +
      this.pad(dateCreated) +
      '/' +
      yearCreated

    let hmm = ''
    if (hourCreated > 0 && hourCreated <= 12) {
      hmm += hourCreated
    } else if (hourCreated > 12) {
      hmm += hourCreated - 12
    } else if (hourCreated === 0) {
      hmm = '12'
    }

    hmm += minuteCreated < 10 ? ':0' + minuteCreated : ':' + minuteCreated
    hmm += hourCreated >= 12 ? ' PM' : ' AM'

    const dayOfWeek = dayNames[dayCreated]
    const fullTimeCreated = dateTimeCreated.getTime()
    const currentTime = currentDateTime.getTime()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = oneDay * 7
    if (currentTime - fullTimeCreated < oneDay) {
      return hmm
    } else if (
      currentTime - fullTimeCreated >= oneDay &&
      currentTime - fullTimeCreated < oneDay * 2
    ) {
      return 'Yesterday'
    } else if (
      currentTime - fullTimeCreated >= oneDay * 2 &&
      currentTime - fullTimeCreated <= oneWeek
    ) {
      return dayOfWeek
    } else if (currentTime - fullTimeCreated > oneWeek) {
      return mmddyyyy
    }
  }

  onButtonPress = () => this.props.onPress()

  render() {
    const {
      image,
      date,
      credentialName,
      attributesCount,
      issuerName,
    } = this.props

    const attributesLabel = attributesCount == 1 ? 'attribute' : `attributes`

    return (
      <TouchableOpacity style={styles.container} onPress={this.onButtonPress} accessible={false}>
        <View style={styles.avatarSection}>
          {typeof image === 'string' ? (
            <Avatar
              radius={16}
              src={{ uri: image }}
              testID={`${credentialName}-avatar`}
            />
          ) : (
            issuerName && (
              <DefaultLogo text={issuerName} size={32} fontSize={17} />
            )
          )}
        </View>
        <View style={styles.infoSection}>
          <View style={styles.infoSectionTopRow}>
            <View style={styles.credentialNameSection}>
              <Text
                style={styles.credentialNameText}
                numberOfLines={1}
                ellipsizeMode="tail"
                testID={`${credentialName}-title`}
                accessible={true}
                accessibilityLabel={`${credentialName}-title`}
              >
                {credentialName}
              </Text>
            </View>
          </View>
          <View style={styles.infoSectionBottomRow}>
            <View style={styles.attributesSection}>
              <Text
                style={styles.attributesText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {`${attributesCount} ${attributesLabel}`}
              </Text>
            </View>
          </View>
        </View>
        {date && (
          <View style={styles.dateSection}>
            <View style={styles.dateSectionRow}>
              <Text style={styles.dateText}>
                {this.getCorrectDateLabel(date * 1000)}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: moderateScale(88, 0.25),
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.cmGray5,
  },
  avatarSection: {
    height: '100%',
    width: 64,
    paddingTop: verticalScale(24),
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
  },
  infoSectionTopRow: {
    flex: 1,
    flexDirection: 'row',
    height: '50%',
  },
  infoSectionBottomRow: {
    flex: 1,
    height: '50%',
  },
  credentialNameSection: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  attributesSection: {
    width: '96%',
    height: '100%',
  },
  dateSection: {
    width: '32%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  dateSectionRow: {
    width: '85%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  credentialNameText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: 'bold',
    color: colors.cmGray1,
  },
  attributesText: {
    fontFamily: fontFamily,
    fontSize: verticalScale(fontSizes.size8),
    color: colors.cmGray2,
  },
  dateText: {
    fontFamily: fontFamily,
    fontStyle: 'italic',
    fontSize: verticalScale(fontSizes.size9),
    color: colors.cmGray3,
  },
})

export { CredentialCard }
