//@flow
import React, { Component } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { Container, CustomView, CustomText, CustomButton } from '../components'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import type { Store } from '../store/type-store'
import { FooterActions } from '../components'
import { OFFSET_1X, OFFSET_2X } from '../common/styles'
import { selectRestoreMethodRoute, switchEnvironmentRoute } from '../common'
import { disableDevMode } from '../lock/lock-store'
import type {
  SwitchEnvironmentState,
  SwitchEnvironmentProps,
} from './type-switch-environment'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { withStatusBar } from '../components/status-bar/status-bar'
import { baseUrls} from '../environment'
import { changeEnvironment } from './switсh-environment-store'
import { SERVER_ENVIRONMENT } from './type-switch-environment'

const styles = StyleSheet.create({
  TextInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginHorizontal: OFFSET_1X,
    marginBottom: OFFSET_2X,
  },
  label: {
    marginHorizontal: OFFSET_1X,
  },
})

class SwitchEnvironment extends Component<
  SwitchEnvironmentProps,
  SwitchEnvironmentState
> {
  state = {
    agencyDID: '',
    agencyVerificationKey: '',
    agencyUrl: '',
    poolConfig: '',
    paymentMethod: '',
  }

  onSave = () => {
    const {
      agencyDID,
      agencyVerificationKey,
      agencyUrl,
      poolConfig,
      paymentMethod,
    } = this.state

    this.props.changeEnvironment(
      agencyUrl,
      agencyDID,
      agencyVerificationKey,
      poolConfig,
      paymentMethod
    )
    this.props.navigation.goBack()
  }

  onSaveAndRestore = () => {
    const {
      agencyDID,
      agencyVerificationKey,
      agencyUrl,
      poolConfig,
      paymentMethod,
    } = this.state
    this.props.changeEnvironment(
      agencyUrl,
      agencyDID,
      agencyVerificationKey,
      poolConfig,
      paymentMethod
    )
    this.props.navigation.navigate(selectRestoreMethodRoute)
  }

  onCancel = () => {
    this.props.navigation.goBack()
  }

  componentDidMount() {
    const {
      agencyDID,
      agencyUrl,
      agencyVerificationKey,
      disableDevMode,
      poolConfig,
      paymentMethod,
    } = this.props
    disableDevMode()
    this.setState({
      agencyDID,
      agencyUrl,
      agencyVerificationKey,
      poolConfig,
      paymentMethod,
    })
  }

  onSwitchTap = (environment: string) => {
    this.setState(baseUrls[environment])
  }

  render() {
    const testID = 'switch-environment'
    return (
      <Container>
        <Container>
          <CustomView row style={[style.buttonGroup]}>
            <CustomButton
              primary
              title="DEV"
              testID={`${testID}-dev`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.DEVELOPMENT)}
            />
            <CustomButton
              primary
              title="SANDBOX"
              testID={`${testID}-sandbox`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.SANDBOX)}
            />
            <CustomButton
              primary
              title="STAGING"
              testID={`${testID}-staging`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.STAGING)}
            />
            <CustomButton
              primary
              title="DEMO"
              testID={`${testID}-demo`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.DEMO)}
            />
          </CustomView>
          <CustomView row style={[style.buttonGroup]}>
            <CustomButton
              primary
              title="QATest1"
              testID={`${testID}-qatest1`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.QATEST1)}
            />
            <CustomButton
              primary
              title="QA"
              testID={`${testID}-qa`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.QA)}
            />
            <CustomButton
              primary
              title="DEV-RC"
              testID={`${testID}-devrc`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.DEVRC)}
            />
          </CustomView>
          <CustomView row style={[style.buttonGroup]}>
            <CustomButton
              primary
              title="DevTeam1"
              testID={`${testID}-devteam1`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.DEVTEAM1)}
            />
            <CustomButton
              primary
              title="DevTeam2"
              testID={`${testID}-devteam2`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.DEVTEAM2)}
            />
            <CustomButton
              primary
              title="DevTeam3"
              testID={`${testID}-devteam3`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.DEVTEAM3)}
            />
          </CustomView>
          <CustomView row style={[style.buttonGroup]}>
            <CustomButton
              primary
              title="Prod"
              testID={`${testID}-prod`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.PROD)}
            />
            <CustomButton
              primary
              title="BCovrin_TEST"
              testID={`${testID}-bcvorin_test`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.BCOVRIN_TEST)}
            />
            <CustomButton
              primary
              title="ID_UNION"
              testID={`${testID}-id-union`}
              onPress={() => this.onSwitchTap(SERVER_ENVIRONMENT.ID_UNION)}
            />
            <CustomButton
              primary
              title="Save and Restore"
              testID={`${testID}-SAVEnRESTORE`}
              onPress={() => this.onSaveAndRestore()}
            />
          </CustomView>
          <KeyboardAwareScrollView>
            <CustomText
              h7
              uppercase
              bold
              bg="tertiary"
              transparentBg
              style={styles.label}
            >
              {'Agency URL'}
            </CustomText>
            <TextInput
              style={styles.TextInput}
              onChangeText={(agencyUrl) => this.setState({ agencyUrl })}
              value={this.state.agencyUrl}
              testID="text-input-agencyUrl"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <CustomText
              h7
              uppercase
              bold
              bg="tertiary"
              transparentBg
              style={styles.label}
            >
              {'Agency DID'}
            </CustomText>
            <TextInput
              style={styles.TextInput}
              onChangeText={(agencyDID) => this.setState({ agencyDID })}
              value={this.state.agencyDID}
              testID="text-input-agencyDID"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <CustomText
              h7
              uppercase
              bold
              bg="tertiary"
              transparentBg
              style={styles.label}
            >
              {'Agency VerKey'}
            </CustomText>
            <TextInput
              style={styles.TextInput}
              onChangeText={(agencyVerificationKey) =>
                this.setState({ agencyVerificationKey })
              }
              value={this.state.agencyVerificationKey}
              testID="text-input-agencyVerificationKey"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <CustomText
              h7
              uppercase
              bold
              bg="tertiary"
              transparentBg
              style={styles.label}
            >
              {'Pool Config'}
            </CustomText>
            <TextInput
              style={styles.TextInput}
              onChangeText={(poolConfig) => this.setState({ poolConfig })}
              value={this.state.poolConfig}
              testID="text-input-poolConfig"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <CustomText
              h7
              uppercase
              bold
              bg="tertiary"
              transparentBg
              style={styles.label}
            >
              {'Payment Method'}
            </CustomText>
            <TextInput
              style={styles.TextInput}
              onChangeText={(paymentMethod) => this.setState({ paymentMethod })}
              value={this.state.paymentMethod}
              testID="text-input-paymentMethod"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
          </KeyboardAwareScrollView>
        </Container>
        <FooterActions
          onAccept={this.onSave}
          onDecline={this.onCancel}
          denyTitle="Cancel"
          acceptTitle="Save"
          testID={`${testID}-footer`}
        />
      </Container>
    )
  }
}

const mapStateToProps = ({ config }: Store) => {
  return {
    agencyUrl: config.agencyUrl,
    agencyDID: config.agencyDID,
    agencyVerificationKey: config.agencyVerificationKey,
    poolConfig: config.poolConfig,
    paymentMethod: config.paymentMethod,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      changeEnvironment,
      disableDevMode,
    },
    dispatch
  )

export const switchEnvironmentScreen = {
  routeName: switchEnvironmentRoute,
  screen: withStatusBar()(
    connect(mapStateToProps, mapDispatchToProps)(SwitchEnvironment)
  ),
}

const style = StyleSheet.create({
  buttonGroup: {
    marginTop: 20,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'space-between',
  },
})
