// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native'
import Snackbar from 'react-native-snackbar'

import { PrivacyPolicyTitle } from '../../common/privacyTNC-constants'
import type { ExternalLink } from '../type-question'
import type { CustomError } from '../../common/type-common'

import {
  ERROR_EXTERNAL_LINKS_NOT_ARRAY,
  ERROR_EXTERNAL_LINKS_NOT_PROPERLY_FORMATTED,
  ERROR_TOO_MANY_EXTERNAL_LINKS,
} from '../type-question'
import { CustomView, CustomText } from '../../components'
import {
  OFFSET_1X,
  alertCancel,
  venetianRed,
  color, colors,
} from '../../common/styles'
import { appName } from '../../external-exports'

export class QuestionExternalLinks extends PureComponent<QuestionExternalLinksProps> {
  render() {
    const { externalLinks = [] } = this.props

    const validationError = getExternalLinkValidity(externalLinks)
    if (validationError) {
      return (
        <CustomView style={[styles.validationErrorContainer]}>
          <CustomText bg={false} size="h6" style={[styles.validationErrorText]}>
            {`Invalid external link. Error: ${validationError.code}`}
          </CustomText>
        </CustomView>
      )
    }

    if (!hasExternalLinks(externalLinks)) {
      return null
    }

    // we need to take only maximum links that we are allowed to show
    const maxLinks = externalLinks.slice(0, MAX_EXTERNAL_LINKS_TO_SHOW)

    return (
      <CustomView>
        {maxLinks.map((link: ExternalLink, index: number) => (
          <QuestionExternalLink key={`${link.src}${index}`} link={link} />
        ))}
      </CustomView>
    )
  }
}

export class QuestionExternalLink extends PureComponent<QuestionExternalLinkProps> {
  render() {
    const { text, src } = this.props.link
    return (
      <CustomView style={[styles.externalLinkContainer]}>
        <TouchableOpacity onPress={this.onLinkClick}>
          <CustomText
            bg={false}
            size="h6"
            style={[styles.externalLinkText]}
            numberOfLines={2}
          >
            {text || src}
          </CustomText>
        </TouchableOpacity>
      </CustomView>
    )
  }

  onLinkClick = () => {
    Alert.alert(
      `You are about to leave ${appName}`,
      `The contents of this link are not controlled by ${appName} and are not covered by its ${PrivacyPolicyTitle} and End User License Agreement. Proceed?`,
      [alertCancel, { text: 'OK', onPress: this.openLink }]
    )
  }

  openLink = () => {
    Linking.openURL(this.props.link.src).catch(() => {
      Snackbar.show({
        text: 'Could not open this link. Link seems to be incorrect.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: venetianRed,
        textColor: colors.white,
      })
    })
  }
}

export function getExternalLinkValidity(
  externalLinks: ExternalLink[]
): null | CustomError {
  if (!Array.isArray(externalLinks)) {
    return ERROR_EXTERNAL_LINKS_NOT_ARRAY
  }

  if (externalLinks.length > 1000) {
    return ERROR_TOO_MANY_EXTERNAL_LINKS
  }

  const everyLinkValid = externalLinks.every((link: ExternalLink) => {
    // if an element of external_links array is either null or false or empty string
    // then it is not a valid element
    const linkJSType = typeof link
    if (
      !link ||
      ['string', 'number', 'boolean', 'function', 'symbol'].includes(
        linkJSType
      ) ||
      Array.isArray(link)
    ) {
      return false
    }

    const { text, src } = link
    if (text) {
      // if we do get text, then it should be a string
      // with less than MAX_CHARACTERS_FOR_TEXT characters
      if (typeof text !== 'string' || text.length > MAX_CHARACTERS_FOR_TEXT) {
        return false
      }
    }

    // src should be defined and should be a string
    return typeof src === 'string' && src
  })
  if (!everyLinkValid) {
    return ERROR_EXTERNAL_LINKS_NOT_PROPERLY_FORMATTED
  }

  return null
}

function hasExternalLinks(externalLinks: Array<ExternalLink>): boolean {
  return Array.isArray(externalLinks) && externalLinks.length > 0
}

const styles = StyleSheet.create({
  externalLinkContainer: {
    marginVertical: 8,
  },
  externalLinkText: {
    color: 'blue',
  },
  validationErrorContainer: {
    marginVertical: OFFSET_1X,
  },
  validationErrorText: {
    color: color.bg.tertiary.font.seventh,
  },
})

export const MAX_EXTERNAL_LINKS_TO_SHOW = 20
const MAX_CHARACTERS_FOR_TEXT = 1000

export type QuestionExternalLinksProps = {
  externalLinks: Array<ExternalLink>,
}

export type QuestionExternalLinkProps = {
  link: ExternalLink,
}
