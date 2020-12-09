// @flow
import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'

import type { GenericObject } from '../../common/type-common'

import {
  getExternalLinkValidity,
  QuestionExternalLinks,
  QuestionExternalLink,
  MAX_EXTERNAL_LINKS_TO_SHOW,
} from '../components/question-external-links'
import {
  mockExternalLinks,
  mockExternalLink,
} from '../../../__mocks__/data/question-store-mock-data'

describe('fn:getExternalLinkValidity', () => {
  it('should return error if external_links is not an array', () => {
    // We have added bunch of $FlowFixMe inside this test
    // because we want to test validation function by passing
    // different data types and checking for validation result
    // but, since our function is typed specifically for Array<ExternalLink>
    // we can't pass anything else to it, so just function call
    // is spared from flow checks to facilitate testing
    // with multiple different data types
    // $FlowFixMe
    const objectValidation = getExternalLinkValidity({})
    expect(objectValidation).toMatchSnapshot()

    // $FlowFixMe
    const emptyStringValidation = getExternalLinkValidity('')
    expect(emptyStringValidation).toMatchSnapshot()

    // $FlowFixMe
    const stringValidation = getExternalLinkValidity('{}')
    expect(stringValidation).toMatchSnapshot()

    // $FlowFixMe
    const numberValidation = getExternalLinkValidity(0)
    expect(numberValidation).toMatchSnapshot()

    // $FlowFixMe
    const NaNValidation = getExternalLinkValidity(NaN)
    expect(NaNValidation).toMatchSnapshot()

    // $FlowFixMe
    const nullValidation = getExternalLinkValidity(null)
    expect(nullValidation).toMatchSnapshot()

    // $FlowFixMe
    const undefinedValidation = getExternalLinkValidity(undefined)
    expect(undefinedValidation).toMatchSnapshot()
  })

  it('should not return an error if externalLinks array is empty', () => {
    expect(getExternalLinkValidity([])).toMatchSnapshot()
  })

  it('should return an error if link object is not defined correctly', () => {
    // $FlowFixMe Refer FlowFixMe reason from first test description
    const nullLinkValidation = getExternalLinkValidity([null])
    expect(nullLinkValidation).toMatchSnapshot()

    // $FlowFixMe
    const stringLinkValidation = getExternalLinkValidity(['string'])
    expect(stringLinkValidation).toMatchSnapshot()

    // $FlowFixMe
    const booleanLinkValidation = getExternalLinkValidity([true])
    expect(booleanLinkValidation).toMatchSnapshot()

    // $FlowFixMe
    const arrayLinkValidation = getExternalLinkValidity([[true]])
    expect(arrayLinkValidation).toMatchSnapshot()

    // $FlowFixMe
    const emptyObjectLinkValidation = getExternalLinkValidity([{}])
    expect(emptyObjectLinkValidation).toMatchSnapshot()

    // $FlowFixMe
    const otherPropObjectLinkValidation = getExternalLinkValidity([{ text: 1 }])
    expect(otherPropObjectLinkValidation).toMatchSnapshot()

    // $FlowFixMe
    const wrongValueObjectLinkValidation = getExternalLinkValidity([
      { text: '1' },
    ])
    expect(wrongValueObjectLinkValidation).toMatchSnapshot()

    const wrongSrcObjectLinkValidation = getExternalLinkValidity([
      { text: '1', src: '' },
    ])
    expect(wrongSrcObjectLinkValidation).toMatchSnapshot()

    // $FlowFixMe
    const wrongSrcObjectLinkValidation1 = getExternalLinkValidity([
      { text: '1', src: 1 },
    ])
    expect(wrongSrcObjectLinkValidation1).toMatchSnapshot()
  })

  it('should return an error if more than 1000 external link objects are passed', () => {
    const externalLinks = Array.from({ length: 1001 }, (v, index) => ({
      src: `${index}`,
    }))
    expect(getExternalLinkValidity(externalLinks)).toMatchSnapshot()
  })

  it('should not return an error if all link objects are correct', () => {
    expect(
      getExternalLinkValidity([{ text: 'some link', src: 'some link' }])
    ).toMatchSnapshot()
    expect(getExternalLinkValidity([{ src: 'some link' }])).toMatchSnapshot()
  })
})

describe('<QuestionExternalLinks />', () => {
  it('should render validation error if wrong data is passed', () => {
    const { snapshot } = setup({ externalLinks: [{ text: '1' }] })
    expect(snapshot).toMatchSnapshot()
  })

  it('should render links if links are passed', () => {
    const { snapshot } = setup()
    expect(snapshot).toMatchSnapshot()
  })

  it('should render MAX_EXTERNAL_LINKS_TO_SHOW links if more than limit is passed', () => {
    const { snapshot, instance } = setup({
      externalLinks: Array.from({ length: 40 }, () => mockExternalLink),
    })
    expect(snapshot).toMatchSnapshot()

    const externalLinks = instance.findAllByType(QuestionExternalLink)
    expect(externalLinks.length).toBe(MAX_EXTERNAL_LINKS_TO_SHOW)
  })

  it('should render null if no link is passed', () => {
    const { snapshot } = setup({ externalLinks: [] })
    expect(snapshot).toMatchSnapshot()
  })

  function setup(extraProps: ?GenericObject = {}) {
    const props = getProps(extraProps)
    const component = renderer.create(<QuestionExternalLinks {...props} />)
    const instance = component.root
    const snapshot = component.toJSON()

    return { props, component, snapshot, instance }
  }

  function getProps(extraProps: ?GenericObject = {}) {
    return {
      externalLinks: mockExternalLinks,
      ...extraProps,
    }
  }
})
