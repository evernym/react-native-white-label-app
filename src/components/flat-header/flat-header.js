// @flow
import React from 'react'
import SvgCustomIcon from '../../components/svg-custom-icon'
import { View, Text, TouchableOpacity } from 'react-native'
import { color, mediumGray, fontFamily } from '../../common/styles'

import type { FlatHeaderProps } from './type-flat-header'

const FlatHeader = (props: FlatHeaderProps) => {
  const { navigation, svgIconName, label, route } = props

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeftSection}>
        {svgIconName && route.params && route.params.existingPin === true && (
          <TouchableOpacity
            style={styles.backButton}
            testID="back-arrow"
            accessible={true}
            accessibilityLabel="back-arrow"
            hitSlop={{ top: 70, left: 70, bottom: 70, right: 70 }}
            onPress={() => navigation.goBack(null)}
          >
            <SvgCustomIcon name={svgIconName} fill={mediumGray} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.headerCenterSection}>
        {label && <Text style={styles.text}>{label}</Text>}
      </View>
      <View style={styles.headerRightSection} />
    </View>
  )
}

const styles = {
  headerContainer: {
    backgroundColor: color.bg.tertiary.color,
    height: 90,
    width: '100%',
    flexDirection: 'row',
  },
  headerLeftSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerCenterSection: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerRightSection: {
    flex: 1,
  },
  text: {
    fontFamily: fontFamily,
    fontWeight: '600',
    fontSize: 16,
    color: color.bg.tertiary.font.tertiary,
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 30,
  },
}

export { FlatHeader }
