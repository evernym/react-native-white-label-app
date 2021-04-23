import moment from 'moment'

export const formatTimestamp = (timestamp: string) => {
  const now = moment().valueOf()
  let formattedTimestamp = moment(timestamp).valueOf()
  let minutes = Math.floor((now - formattedTimestamp) / 1000 / 60)

  if (minutes > 7 * 24 * 60) {
    return moment(timestamp).format('DD MMMM YYYY')
  } else if (minutes >= 2 * 24 * 60) {
    return moment(timestamp).format('dddd')
  } else if (minutes >= 24 * 60) {
    return 'Yesterday'
  } else if (minutes >= 120) return `${Math.floor(minutes / 60)} hours ago`
  else if (minutes >= 60) return `1 hour ago`
  else if (minutes >= 2) return `${minutes} minutes ago`
  else if (minutes >= 1) return '1 minute ago'
  else return 'Just now'
}
