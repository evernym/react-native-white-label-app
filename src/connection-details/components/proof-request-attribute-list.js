// @flow

// packages
import React, { Component } from 'react'
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view'
import { moderateScale, verticalScale } from 'react-native-size-matters'
// types
import type {
  ProofRequestAttributeListAndHeaderProps,
  ProofRequestAttributeListState,
} from '../../proof-request/type-proof-request'
import { ATTRIBUTE_TYPE } from '../../proof-request/type-proof-request'
import type { Attribute } from '../../push-notification/type-push-notification'
import type {
  ReactNavigation,
  RequestedAttrsJson,
} from '../../common/type-common'
// constants
import {
  attributeValueRoute,
  customValuesRoute,
} from '../../common/route-constants'
import {
  DISSATISFIED_ATTRIBUTE_DATA_TEXT,
  MISSING_ATTRIBUTE_DATA_TEXT,
} from '../type-connection-details'
// components
import { ModalHeader } from './modal-header'
// styles
import { colors, fontFamily, fontSizes } from '../../common/styles/constant'
// utils
import { generateStateForMissingAttributes, isInvalidValues } from '../utils'
import { RenderAttachmentIcon } from '../../components/attachment/attachment'
import { ALERT_ICON, ARROW_FORWARD_ICON, EvaIcon } from '../../common/icons'
import Icon from '../../components/icon'
import { attributesValueRoute } from '../../common'
import { isSelected } from './attributes-values'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { getPredicateTitle } from '../utils/getPredicateTitle'
import { ExpandableText } from '../../components/expandable-text/expandable-text'
import { renderUserAvatar } from '../../components/user-avatar/user-avatar'
import {
  checkProofForEmptyFields,
  showMissingField,
  showToggleMenu,
} from '../utils/checkForEmptyAttributes'

class ProofRequestAttributeList extends Component<
  ProofRequestAttributeListAndHeaderProps & ReactNavigation,
  ProofRequestAttributeListState
> {
  state = {
    isMissingFieldsShowing: false,
    showToggleMenu: false,
  }

  UNSAFE_componentWillReceiveProps(
    nextProps: ProofRequestAttributeListAndHeaderProps
  ) {
    if (this.props.missingAttributes !== nextProps.missingAttributes) {
      // once we know that there are missing attributes
      // then we generate state variable for each of them
      // because we will show user some input boxes and need to capture values
      // that user fills in them, also we need to enable generate proof button
      // once all the missing attributes are filled in by user
      this.setState(
        generateStateForMissingAttributes(nextProps.missingAttributes)
      )
    }
  }

  componentDidMount() {
    const attributes: Array<Attribute> = this.props.list
    this.checkForEmptyValues(attributes)
  }

  checkForEmptyValues = (attributes: Array<Attribute>) => {
    const data = Array.prototype.concat.apply([], attributes)
    const { hasEmpty, allEmpty } = checkProofForEmptyFields(data)
    this.setState({
      showToggleMenu: showToggleMenu(hasEmpty, allEmpty),
      isMissingFieldsShowing: showMissingField(hasEmpty, allEmpty),
    })
  }

  toggleMissingFields = (arg: boolean) =>
    this.setState({ isMissingFieldsShowing: arg })

  // this form is needed to fix flow error
  // because methods of a class are by default covariant
  // so we need an invariance to tell method signature
  canEnableGenerateProof = function () {
    const isInvalid = isInvalidValues(this.props.missingAttributes, this.state)
    this.props.canEnablePrimaryAction(!isInvalid)
  }

  onTextChange = (text: string, name: string, key: string) => {
    this.props.updateAttributesFilledByUser({
      label: name,
      value: text,
      key: key,
    })

    this.setState(
      {
        [name]: text,
      },
      this.canEnableGenerateProof
    )
  }

  keyExtractor = (_: Attribute, index: number) => index

  handleCustomValuesNavigation = (
    label: string,
    adjustedLabel: string,
    key: string
  ) => {
    const {
      navigation: { navigate },
    } = this.props
    const { onTextChange } = this

    return navigate(customValuesRoute, {
      label,
      onTextChange,
      labelValue: this.state?.[adjustedLabel],
      key,
      navigate,
    })
  }

  handleAttributeValuesNavigation = (
    label: string,
    items: any,
    attributesFilledFromCredential: RequestedAttrsJson
  ) => {
    const {
      navigation: { navigate },
    } = this.props
    const { onTextChange } = this

    if (!items[0]) {
      return
    }

    const keys = Object.keys(items[0].values)
    if (keys.length === 1) {
      return navigate(attributeValueRoute, {
        label: keys.join(),
        customValue: this.state?.[label],
        onTextChange,
        items,
        attributesFilledFromCredential,
        claimMap: this.props.claimMap,
        updateAttributesFilledFromCredentials: this.props
          .updateAttributesFilledFromCredentials,
        onCustomValueSet: this.onTextChange,
      })
    } else {
      return navigate(attributesValueRoute, {
        label: keys.join(),
        sender: this.props.institutionalName,
        onTextChange,
        items,
        attributesFilledFromCredential,
        claimMap: this.props.claimMap,
        updateAttributesFilledFromCredentials: this.props
          .updateAttributesFilledFromCredentials,
      })
    }
  }

  handlePredicateValuesNavigation = (
    label: string,
    items: any,
    attributesFilledFromCredential: RequestedAttrsJson
  ) => {
    const {
      navigation: { navigate },
    } = this.props

    if (!items[0]) {
      return
    }

    return navigate(attributeValueRoute, {
      label: items[0].label,
      items,
      claimMap: this.props.claimMap,
      sender: this.props.institutionalName,
      attributesFilledFromCredential: attributesFilledFromCredential,
      updateAttributesFilledFromCredentials: this.props
        .updateAttributesFilledFromCredentials,
    })
  }

  renderFilledAttribute = (
    { item, index }: any,
    attributesFilledFromCredential: RequestedAttrsJson,
    attributesFilledByUser: any
  ) => {
    let logoUrl

    const items = item
    const attribute = items[0]

    let views

    const { handleAttributeValuesNavigation } = this

    if (attributesFilledFromCredential[attribute.key]) {
      const selectedItem = items.find((item) =>
        isSelected(item, attributesFilledFromCredential)
      )

      views = Object.keys(selectedItem.values).map((label, keyIndex) => {
        const value = selectedItem.values[label]

        if ((value === '' || !value) && !this.state.isMissingFieldsShowing) {
          return <View />
        }

        let claim =
          (selectedItem.claimUuid &&
            this.props.claimMap &&
            this.props.claimMap[selectedItem.claimUuid]) ||
          {}

        if (!logoUrl) {
          logoUrl = claim.logoUrl ? { uri: claim.logoUrl } : null
        }

        return (
          <TouchableOpacity
            key={`${index}_${keyIndex}`}
            onPress={() =>
              handleAttributeValuesNavigation(
                label,
                items,
                attributesFilledFromCredential
              )
            }
            accessible={false}
          >
            <View style={styles.textAvatarWrapper}>
              <View style={styles.textInnerWrapper}>
                {
                  <View>
                    <View style={styles.textAvatarWrapper}>
                      <View style={styles.textInnerWrapper}>
                        {RenderAttachmentIcon(
                          label,
                          value,
                          selectedItem.claimUuid || '',
                          selectedItem.claimUuid || ''
                        )}
                      </View>
                      {keyIndex === 0 && (
                        <View style={styles.avatarWrapper}>
                          {logoUrl ? (
                            <Icon
                              medium
                              round
                              resizeMode="cover"
                              src={logoUrl}
                              testID="selected-credential-icon"
                              accessible={true}
                              accessibilityLabel="selected-credential-icon"
                            />
                          ) : (
                            claim &&
                            claim.senderName && (
                              <DefaultLogo
                                text={claim.senderName}
                                size={30}
                                fontSize={18}
                              />
                            )
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                }
              </View>
              {keyIndex === 0 && (
                <View style={styles.iconWrapper}>
                  <EvaIcon
                    name={ARROW_FORWARD_ICON}
                    fill={colors.black}
                    testID="arrow-forward-icon"
                    accessible={true}
                    accessibilityLabel="arrow-forward-icon"
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        )
      })
    } else {
      const value = attributesFilledByUser[attribute.key]

      views = (
        <TouchableOpacity
          onPress={() =>
            handleAttributeValuesNavigation(
              attribute.label,
              items,
              attributesFilledFromCredential
            )
          }
        >
          <View style={styles.textAvatarWrapper}>
            <View style={styles.textInnerWrapper}>
              <View>
                <View style={styles.textAvatarWrapper}>
                  <View style={styles.textInnerWrapper}>
                    {RenderAttachmentIcon(
                      attribute.label,
                      value,
                      attribute.claimUuid || '',
                      attribute.claimUuid || ''
                    )}
                  </View>
                  <View style={styles.avatarWrapper}>
                    {renderUserAvatar({ size: 'superSmall' })}
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.iconWrapper}>
              <EvaIcon
                name={ARROW_FORWARD_ICON}
                fill={colors.black}
                testID="arrow-forward-icon"
                accessible={true}
                accessibilityLabel="arrow-forward-icon"
              />
            </View>
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <View key={index} style={styles.wrapper}>
        <View>{views}</View>
      </View>
    )
  }

  renderSelfAttestedAttribute = ({ attribute, index }: any) => {
    const views = Object.keys(attribute.values).map((label, keyIndex) => {
      const adjustedLabel = label.toLocaleLowerCase()

      const { handleCustomValuesNavigation } = this
      const value = attribute.values[label]
        ? attribute.values[label]
        : this.state?.[adjustedLabel]
        ? this.state?.[adjustedLabel]
        : undefined

      if (value) {
        return (
          <View key={index} style={styles.wrapper}>
            <TouchableOpacity
              key={`${index}_${keyIndex}`}
              testID={value}
              accessible={false}
              onPress={() =>
                handleCustomValuesNavigation(
                  label,
                  adjustedLabel,
                  attribute.key
                )
              }
            >
              <View style={styles.textAvatarWrapper}>
                <View style={styles.textWrapper}>
                  <ExpandableText style={styles.title} text={label} />
                  <ExpandableText style={styles.contentInput} text={value} />
                </View>
                <View style={styles.iconWrapper}>
                  <EvaIcon
                    name={ARROW_FORWARD_ICON}
                    fill={colors.black}
                    testID="arrow-forward-icon"
                    accessible={true}
                    accessibilityLabel="arrow-forward-icon"
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )
      }

      if (!value) {
        return (
          <>
            {this.state.isMissingFieldsShowing && (
              <View key={index} style={styles.wrapper}>
                <TouchableOpacity
                  key={`${index}_${keyIndex}`}
                  testID={value}
                  accessible={false}
                  onPress={() =>
                    handleCustomValuesNavigation(
                      label,
                      adjustedLabel,
                      attribute.key
                    )
                  }
                >
                  <View style={styles.textAvatarWrapper}>
                    <View style={styles.textWrapper}>
                      <ExpandableText style={styles.title} text={label} />
                      <Text style={styles.dissatisfiedAttribute}>
                        {MISSING_ATTRIBUTE_DATA_TEXT}
                      </Text>
                    </View>
                    <View style={[styles.avatarWrapper, { paddingLeft: 4 }]}>
                      {renderUserAvatar({ size: 'superSmall' })}
                    </View>
                    <View style={styles.iconWrapper}>
                      <EvaIcon
                        name={ARROW_FORWARD_ICON}
                        fill={colors.black}
                        testID="arrow-forward-icon"
                        accessible={true}
                        accessibilityLabel="arrow-forward-icon"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </>
        )
      }
    })

    return <View>{views}</View>
  }

  renderDissatisfiedAttribute = ({ attribute, index }: any) => {
    const views = Object.keys(attribute.values).map((label, keyIndex) => {
      return (
        <View key={`${index}_${keyIndex}`} style={styles.textAvatarWrapper}>
          <View style={styles.textInnerWrapper}>
            <View>
              <ExpandableText style={styles.title} text={label} />
              <Text style={styles.dissatisfiedAttribute}>
                {DISSATISFIED_ATTRIBUTE_DATA_TEXT}
              </Text>
            </View>
          </View>
          {keyIndex === 0 && (
            <View style={styles.iconWrapper}>
              <EvaIcon
                name={ALERT_ICON}
                color={colors.red}
                testID="alert-icon"
                accessible={true}
                accessibilityLabel="alert-icon"
              />
            </View>
          )}
        </View>
      )
    })

    return (
      <View key={index} style={styles.wrapper}>
        <View>{views}</View>
      </View>
    )
  }

  renderFilledPredicate = (
    { item, index }: any,
    attributesFilledFromCredential: RequestedAttrsJson
  ) => {
    const items = item
    const attribute = items[0]

    const { handlePredicateValuesNavigation } = this

    if (!attributesFilledFromCredential[attribute.key]) {
      return
    }

    const selectedItem = items.find((item) =>
      isSelected(item, attributesFilledFromCredential)
    )

    let claim =
      (selectedItem.claimUuid &&
        this.props.claimMap &&
        this.props.claimMap[selectedItem.claimUuid]) ||
      {}

    const logoUrl = claim.logoUrl ? { uri: claim.logoUrl } : null

    return (
      <TouchableOpacity
        onPress={() =>
          handlePredicateValuesNavigation(
            attribute.label,
            items,
            attributesFilledFromCredential
          )
        }
        accessible={false}
      >
        <View key={index} style={styles.wrapper}>
          <View style={styles.textAvatarWrapper}>
            <View style={styles.textInnerWrapper}>
              <View>
                <View style={styles.textAvatarWrapper}>
                  <View style={styles.textInnerWrapper}>
                    {RenderAttachmentIcon(
                      attribute.label,
                      `${getPredicateTitle(attribute.p_type)} ${
                        attribute.p_value
                      }`,
                      selectedItem.claimUuid || '',
                      selectedItem.claimUuid || ''
                    )}
                  </View>
                  <View style={styles.avatarWrapper}>
                    {logoUrl ? (
                      <Icon
                        medium
                        round
                        resizeMode="cover"
                        src={logoUrl}
                        testID="selected-credential-icon"
                        accessible={true}
                        accessibilityLabel="selected-credential-icon"
                      />
                    ) : (
                      claim &&
                      claim.senderName && (
                        <DefaultLogo
                          text={claim.senderName}
                          size={30}
                          fontSize={18}
                        />
                      )
                    )}
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.iconWrapper}>
              <EvaIcon
                name={ARROW_FORWARD_ICON}
                fill={colors.black}
                testID="arrow-forward-icon"
                accessible={true}
                accessibilityLabel="arrow-forward-icon"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  renderDissatisfiedPredicate = ({ attribute, index }: any) => {
    return (
      <View key={index} style={styles.wrapper}>
        <View style={styles.textAvatarWrapper}>
          <View style={styles.textInnerWrapper}>
            {RenderAttachmentIcon(
              attribute.label,
              `${getPredicateTitle(attribute.p_type)} ${attribute.p_value}`,
              '',
              '',
              undefined,
              { color: colors.red }
            )}
          </View>
          <View style={styles.iconWrapper}>
            <EvaIcon
              name={ALERT_ICON}
              color={colors.red}
              testID="alert-icon"
              accessible={true}
              accessibilityLabel="alert-icon"
            />
          </View>
        </View>
      </View>
    )
  }

  // once we are going to render multiple values
  // then we have to render view for each pair in values and
  // collect them into one wrapping view
  renderValues = (
    { item, index }: any,
    attributesFilledFromCredential: RequestedAttrsJson,
    attributesFilledByUser: any
  ) => {
    const items = item

    if (!items[0]) {
      return <View />
    }

    const attribute = items[0]

    if (attribute.type === ATTRIBUTE_TYPE.FILLED_ATTRIBUTE) {
      return this.renderFilledAttribute(
        { item, index },
        attributesFilledFromCredential,
        attributesFilledByUser
      )
    } else if (attribute.type === ATTRIBUTE_TYPE.SELF_ATTESTED_ATTRIBUTE) {
      return this.renderSelfAttestedAttribute({ attribute, index })
    } else if (attribute.type === ATTRIBUTE_TYPE.DISSATISFIED_ATTRIBUTE) {
      return this.renderDissatisfiedAttribute({ attribute, index })
    } else if (attribute.type === ATTRIBUTE_TYPE.FILLED_PREDICATE) {
      return this.renderFilledPredicate(
        { item, index },
        attributesFilledFromCredential
      )
    } else if (attribute.type === ATTRIBUTE_TYPE.DISSATISFIED_PREDICATE) {
      return this.renderDissatisfiedPredicate({ attribute, index })
    } else {
      return <View />
    }
  }

  render() {
    const attributes: Array<Attribute> = this.props.list
    const { isMissingFieldsShowing, showToggleMenu } = this.state
    const { toggleMissingFields } = this

    const {
      institutionalName,
      credentialName,
      credentialText,
      imageUrl,
      colorBackground,
      attributesFilledFromCredential,
      attributesFilledByUser,
    } = this.props

    return (
      <KeyboardAwareFlatList
        scrollEnabled
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        style={styles.keyboardFlatList}
        data={attributes}
        keyExtractor={this.keyExtractor}
        renderItem={(item) =>
          this.renderValues(
            item,
            attributesFilledFromCredential,
            attributesFilledByUser
          )
        }
        extraData={this.props}
        extraScrollHeight={Platform.OS === 'ios' ? 170 : null}
        ListHeaderComponent={() => (
          <ModalHeader
            {...{
              institutionalName,
              credentialName,
              credentialText,
              imageUrl,
              colorBackground,
              isMissingFieldsShowing,
              toggleMissingFields,
              showToggleMenu,
            }}
          />
        )}
      />
    )
  }
}

export default ProofRequestAttributeList

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: moderateScale(12),
    ...Platform.select({
      ios: {
        borderBottomColor: colors.gray5,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomColor: colors.gray5,
        borderBottomWidth: 1,
      },
    }),
  },
  textAvatarWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  textInnerWrapper: {
    width: '90%',
  },
  iconWrapper: {
    marginTop: moderateScale(16),
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: verticalScale(fontSizes.size6),
    fontWeight: '400',
    color: colors.gray3,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    lineHeight: verticalScale(17),
  },
  contentInput: {
    height: verticalScale(32),
    fontSize: verticalScale(fontSizes.size3),
    fontWeight: '700',
    color: '#505050',
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    lineHeight: verticalScale(23),
  },
  content: {
    fontSize: verticalScale(fontSizes.size5),
    marginBottom: moderateScale(12),
    fontWeight: '400',
    color: colors.gray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  dissatisfiedAttribute: {
    fontSize: verticalScale(fontSizes.size3),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(6),
    fontWeight: '700',
    color: colors.red,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
    lineHeight: verticalScale(23),
  },
  keyboardFlatList: {
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  avatarWrapper: {
    paddingTop: moderateScale(10),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  textWrapper: {
    width: '80%',
  },
})
