// @flow
import * as React from 'react'
import { useEffect, useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { formatTimestamp } from './event-timestamp-utils'
import { colors, fontFamily, fontSizes } from '../../common/styles'
import { verticalScale } from 'react-native-size-matters'

const INTERVAL = 60000

export type EventTimestampProps = {
  timestamp: string,
  customStyles?: any,
}

export const EventTimestamp = ({
  timestamp,
  customStyles,
}: EventTimestampProps) => {
  const [label, setLabel] = useState<string>(formatTimestamp(timestamp))

  useEffect(() => {
    const interval = setInterval((_) => {
      setLabel(formatTimestamp(timestamp))
    }, INTERVAL)
    return (_) => clearInterval(interval)
  }, [timestamp])

  return <Text style={customStyles || styles.textDate}>{label}</Text>
}

const styles = StyleSheet.create({
  textDate: {
    fontSize: verticalScale(fontSizes.size11),
    fontWeight: 'normal',
    fontFamily: fontFamily,
    fontStyle: 'italic',
    color: colors.gray3,
    textAlign: 'right',
  },
})
