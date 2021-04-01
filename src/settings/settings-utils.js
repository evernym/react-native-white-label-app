import moment from 'moment'
import {customSettingsOptions} from "../external-imports";
import {MANUAL_BACKUP} from "./settings-constants";

export const formatBackupString = (date?: string) => {
  const now = moment().valueOf()
  var lastBackupDate = moment(date).valueOf()
  let minutes = Math.floor((now - lastBackupDate) / 1000 / 60)

  if (minutes >= 24 * 60) {
    return moment(date).format('h:mm a, MMMM Do YYYY')
  } else if (minutes >= 120) return `${Math.floor(minutes / 60)} hours ago`
  else if (minutes >= 60) return 'An hour ago'
  else if (minutes >= 5) return `${minutes} minutes ago`
  else if (minutes >= 2) return 'A few minutes ago'
  else return 'Just now'
}

export const isLocalBackupsEnabled = () =>
  customSettingsOptions &&
  !!customSettingsOptions.find(option => option.name === MANUAL_BACKUP)
