// @flow

import {
  put,
  take,
  call,
  all,
  select,
  takeEvery,
  race,
} from 'redux-saga/effects'
import type {
  Proof,
  ProofStore,
  UpdateAttributeClaimAction,
  ProofAction,
  GenerateProofAction,
  ProofSuccessAction,
  ProofFailAction,
  IndyPreparedProof,
  IndyRequestedAttributes,
  VcxSelectedCredentials,
  RetrySendProofAction,
} from './type-proof'
import type {
  ProofRequestData,
  SelfAttestedAttributes,
  MissingAttribute,
  ProofRequestedAttributes,
  ProofRequestPayload,
  DissatisfiedAttribute,
  RequestedAttribute,
  ProofRequestedPredicates,
} from '../proof-request/type-proof-request'
import {
  UPDATE_ATTRIBUTE_CLAIM,
  GENERATE_PROOF,
  PROOF_SUCCESS,
  PROOF_FAIL,
  PROOF_REQUEST_SEND_PROOF_HANDLE,
  RESET_TEMP_PROOF_DATA,
  ERROR_SEND_PROOF,
  CLEAR_ERROR_SEND_PROOF,
  RETRY_SEND_PROOF,
} from './type-proof'
import type {
  CustomError,
  GenericObject,
  RequestedAttrsJson,
} from '../common/type-common'
import type { ClaimMap } from '../claim/type-claim'
import {
  generateProof,
  getMatchingCredentials,
  proofDeserialize,
  proofCreateWithRequest,
  proofGetState,
} from '../bridge/react-native-cxs/RNCxs'
import {
  proofRequestAutoFill,
  missingAttributesFound,
  acceptProofRequest,
  sendProof,
  updateProofHandle,
  dissatisfiedAttributesFound,
} from '../proof-request/proof-request-store'
import { getProofRequest, getClaimMap, getProofData } from '../store/store-selector'
import type { Attribute } from '../push-notification/type-push-notification'
import { RESET } from '../common/type-common'
import {
  PROOF_REQUEST_SHOW_START,
  NO_SELF_ATTEST,
  MISSING_ATTRIBUTES_FOUND,
  PROOF_REQUEST_AUTO_FILL,
  ATTRIBUTE_TYPE,
  NO_CRED_NO_SELF_ATTEST,
  DISSATISFIED_ATTRIBUTE_TYPE,
} from '../proof-request/type-proof-request'
import { ensureVcxInitAndPoolConnectSuccess, ensureVcxInitSuccess } from '../store/route-store'
import { customLogger } from '../store/custom-logger'
import { showSnackError } from '../store/config-store'
import { CREDENTIAL_DEFINITION_NOT_FOUND, CREDENTIAL_SCHEMA_NOT_FOUND } from '../bridge/react-native-cxs/error-cxs'

export const updateAttributeClaim = (
  uid: string,
  remoteDid: string,
  requestedAttrsJson: RequestedAttrsJson,
  selfAttestedAttrs: SelfAttestedAttributes
): UpdateAttributeClaimAction => ({
  type: UPDATE_ATTRIBUTE_CLAIM,
  uid,
  remoteDid,
  requestedAttrsJson,
  selfAttestedAttrs,
})

export const getProof = (uid: string) => ({
  type: GENERATE_PROOF,
  uid,
})

export const proofSuccess = (
  proof: Proof,
  uid: string
): ProofSuccessAction => ({
  type: PROOF_SUCCESS,
  proof,
  uid,
})

export const proofFail = (
  uid: string,
  error: CustomError
): ProofFailAction => ({
  type: PROOF_FAIL,
  uid,
  error,
})

export const proofRequestDataToStore = (uid: string, proofHandle: number) => ({
  type: PROOF_REQUEST_SEND_PROOF_HANDLE,
  uid,
  proofHandle,
})

export const resetTempProofData = (uid: string) => ({
  type: RESET_TEMP_PROOF_DATA,
  uid,
})

export const errorSendProofFail = (
  uid: string,
  remoteDid: string,
  error: CustomError
) => ({
  type: ERROR_SEND_PROOF,
  uid,
  remoteDid,
  error,
})

export const clearSendProofFail = (uid: string) => ({
  type: CLEAR_ERROR_SEND_PROOF,
  uid,
})

function isDissatisfiedAttribute(attribute: RequestedAttribute): boolean {
  // cases:
  // 1. self_attest_allowed: false
  // 2. restrictions != {}
  // 3. restrictions != [] and != [{}] and != [{},{},....]
  // 4. specified group of attributes `names`

  return (
    (typeof attribute.self_attest_allowed === 'boolean' &&
      attribute.self_attest_allowed === false) ||
    (typeof attribute.restrictions === 'object' &&
      Object.keys(attribute.restrictions).length > 0) ||
    (Array.isArray(attribute.restrictions) &&
      attribute.restrictions.filter(
        (restriction) => Object.keys(restriction).length > 0,
      ).length > 0) ||
    (attribute.names ? attribute.names.length > 0 : false)
  )
}

export function findMissingRequestedAttributes(
  preparedProof: IndyPreparedProof,
  proofRequest: ProofRequestData,
): [MissingAttribute[], DissatisfiedAttribute[]] {
  // apart from conversion, it finds attributes that are not in any claim

  const missingAttributes: MissingAttribute[] = []
  const dissatisfiedAttributes: DissatisfiedAttribute[] = []

  Object.keys(proofRequest.requested_attributes)
    .forEach((attrKey) => {
      const credentialData = preparedProof.attrs[attrKey]
      if (!credentialData || !credentialData[0]) {
        const requestedAttribute = proofRequest.requested_attributes[attrKey]
        if (isDissatisfiedAttribute(requestedAttribute)) {
          // dissatisfied attribute
          if (requestedAttribute.name) {
            dissatisfiedAttributes.push({
              name: requestedAttribute.name,
              reason: NO_SELF_ATTEST,
              type: DISSATISFIED_ATTRIBUTE_TYPE.ATTRIBUTE,
            })
          } else if (requestedAttribute.names) {
            dissatisfiedAttributes.push({
              name: requestedAttribute.names.join(','),
              reason: NO_SELF_ATTEST,
              type: DISSATISFIED_ATTRIBUTE_TYPE.ATTRIBUTE,
            })
          }
        } else {
          // self-attested attribute
          missingAttributes.push({
            key: attrKey,
            name: requestedAttribute.name || '',
          })
        }
      }
    })

  if (proofRequest.requested_predicates) {
    Object.keys(proofRequest.requested_predicates)
      .forEach((attrKey) => {
        const predicateClaimData = preparedProof.attrs[attrKey]
        if ((!predicateClaimData || !predicateClaimData[0]) && proofRequest.requested_predicates) {
          const requestedPredicate = proofRequest.requested_predicates[attrKey]
          dissatisfiedAttributes.push({
            name: requestedPredicate.name,
            p_type: requestedPredicate.p_type,
            p_value: requestedPredicate.p_value,
            reason: NO_CRED_NO_SELF_ATTEST,
            type: DISSATISFIED_ATTRIBUTE_TYPE.PREDICATE,
          })
        }
      })
  }

  return [missingAttributes, dissatisfiedAttributes]
}

function buildCaseInsensitiveMap(attrs: GenericObject) {
  return Object.keys(
    attrs,
  ).reduce(
    (acc, attributeName) => ({
      ...acc,
      [attributeName.toLowerCase().replace(/ /g, '')]: attributeName,
    }),
    {},
  )
}

export function convertIndyPreparedProofToAttributes(
  preparedProof: IndyPreparedProof,
  requestedAttributes: ProofRequestedAttributes,
  requestedPredicates: ?ProofRequestedPredicates,
): Array<Attribute> {
  let attributes = []
  Object.keys(requestedAttributes).forEach((attributeKey) => {
    let labels: Array<string> = []
    let attribute = requestedAttributes[attributeKey]
    if (attribute.names) {
      labels.push(...attribute.names)
    } else if (attribute.name) {
      labels.push(attribute.name)
    }
    const label = labels.join()
    const revealedAttributes = preparedProof.attrs[attributeKey]
    if (revealedAttributes && revealedAttributes.length > 0) {
      attributes.push(
        revealedAttributes.map((revealedAttribute) => {
          // convert attrs props to lowercase
          // maintain a mapping that will map case insensitive name to actual name in `attrs`
          let caseInsensitiveMap = null
          let values = {}
          if (revealedAttribute) {
            caseInsensitiveMap = buildCaseInsensitiveMap(revealedAttribute.cred_info.attrs,)

            values = labels.reduce((acc, attributeLabel) => {
              if (caseInsensitiveMap) {
                const key =
                  caseInsensitiveMap[
                    attributeLabel.toLowerCase().replace(/ /g, '')
                    ]
                return {
                  ...acc,
                  [attributeLabel]: revealedAttribute.cred_info.attrs[key],
                }
              }
            }, {})
          }

          return {
            label,
            key: attributeKey,
            data:
              revealedAttribute &&
              caseInsensitiveMap &&
              revealedAttribute.cred_info.attrs[
                caseInsensitiveMap[label.toLowerCase().replace(/ /g, '')]
                ],
            values: values,
            claimUuid: revealedAttribute && revealedAttribute.cred_info.referent,
            // TODO:KS Refactor this logic to not put cred_info here
            // We are putting cred_info here because we don't want to iterate
            // later to find whole credential
            cred_info: revealedAttribute ? revealedAttribute : null,
            self_attest_allowed: !isDissatisfiedAttribute(attribute),
            type: ATTRIBUTE_TYPE.FILLED_ATTRIBUTE,
          }
        }),
      )
    } else {
      const dissatisfied = isDissatisfiedAttribute(attribute)

      attributes.push([
        {
          label,
          key: attributeKey,
          data: undefined,
          values: {
            [label]: undefined,
          },
          self_attest_allowed: !dissatisfied,
          type: dissatisfied
            ? ATTRIBUTE_TYPE.DISSATISFIED_ATTRIBUTE
            : ATTRIBUTE_TYPE.SELF_ATTESTED_ATTRIBUTE,
        },
      ])
    }
  })

  if (requestedPredicates){
    Object.keys(requestedPredicates).forEach((attributeKey) => {
      let predicate = requestedPredicates[attributeKey]
      const matchingCredentials = preparedProof.attrs[attributeKey]
      if (matchingCredentials && matchingCredentials.length > 0) {
        attributes.push(
          matchingCredentials.map((matchingCredential) => {
            // convert attrs props to lowercase
            // maintain a mapping that will map case insensitive name to actual name in `predicates`
            let caseInsensitiveMap = null
            if (matchingCredential) {
              caseInsensitiveMap = buildCaseInsensitiveMap(matchingCredential.cred_info.attrs)
            }

            return {
              label: predicate.name,
              p_type: predicate.p_type,
              p_value: predicate.p_value,
              key: attributeKey,
              data:
                matchingCredential &&
                caseInsensitiveMap &&
                matchingCredential.cred_info.attrs[
                  caseInsensitiveMap[predicate.name.toLowerCase().replace(/ /g, '')]
                  ],
              claimUuid: matchingCredential && matchingCredential.cred_info.referent,
              cred_info: matchingCredential ? matchingCredential : null,
              type: ATTRIBUTE_TYPE.FILLED_PREDICATE,
            }
          })
        )
      } else {
        attributes.push(
          [
            {
              label: predicate.name,
              p_type: predicate.p_type,
              p_value: predicate.p_value,
              key: attributeKey,
              data: undefined,
              type: ATTRIBUTE_TYPE.DISSATISFIED_PREDICATE,
            },
          ]
        )
      }
    })
  }

  // $FlowFixMe
  return attributes
}

export function convertUserSelectedCredentialToVcxSelectedCredentials(
  userSelectedCredentials: IndyRequestedAttributes
): VcxSelectedCredentials {
  const attrs = Object.keys(userSelectedCredentials).reduce(
    (acc, attributeKey) => ({
      ...acc,
      [attributeKey]: {
        credential: userSelectedCredentials[attributeKey][2],
        tails_file: null,
      },
    }),
    {}
  )

  if (Object.keys(attrs).length === 0) {
    return {}
  }

  return {
    attrs,
  }
}

export function convertSelectedCredentialAttributesToIndyProof(
  userSelectedCredentials: IndyRequestedAttributes,
  proofRequest: ProofRequestData,
) {
  let revealedAttributes = {}
  let revealedGroupAttributes = {}
  let revealedPredicates = {}

  Object.keys(proofRequest.requested_attributes).forEach((attributeKey) => {
    const attribute = proofRequest.requested_attributes[attributeKey]
    const selectedAttribute = userSelectedCredentials[attributeKey]
    if (selectedAttribute) {
      const selectedCredentialAttributes = selectedAttribute[2].cred_info.attrs
      const caseInsensitiveMap = buildCaseInsensitiveMap(selectedCredentialAttributes)

      // in case of single attribute we fill usual revealed_attrs structure
      if (attribute.name) {
        revealedAttributes[attributeKey] = [
          selectedAttribute[0],
          selectedCredentialAttributes[
            caseInsensitiveMap[attribute.name.toLowerCase().replace(/ /g, '')]
            ],
        ]
      }

      // in case of multiple attributes we fill revealed_group_attrs structure
      if (attribute.names) {
        const values = attribute.names.reduce(
          (acc, name) => ({
            ...acc,
            [name]:
              selectedCredentialAttributes[
                caseInsensitiveMap[name.toLowerCase().replace(/ /g, '')]
              ],
          }),
          {}
        )
        revealedGroupAttributes[attributeKey] = {
          claimUuid: selectedAttribute[0],
          values: values,
        }
      }
    }
  })

  if (proofRequest.requested_predicates) {
    Object.keys(proofRequest.requested_predicates).forEach((attributeKey) => {
      if (proofRequest.requested_predicates){
        const predicate = proofRequest.requested_predicates[attributeKey]
        const credential = userSelectedCredentials[attributeKey]
        if (credential) {
          const selectedCredentialAttributes = credential[2].cred_info.attrs
          const caseInsensitiveMap = buildCaseInsensitiveMap(selectedCredentialAttributes)

          revealedPredicates[attributeKey] = [
            credential[0],
            selectedCredentialAttributes[
              caseInsensitiveMap[predicate.name.toLowerCase().replace(/ /g, '')]
              ],
          ]
        }
      }
    })
  }

  return {
    revealedAttributes,
    revealedGroupAttributes,
    revealedPredicates,
  }
}

export function* generateProofSaga(action: GenerateProofAction): any {
  try {
    const { uid } = action
    const proofRequestPayload: ProofRequestPayload = yield select(
      getProofRequest,
      uid
    )

    const proofRequestData = proofRequestPayload.originalProofRequestData
    let {
      proofHandle,
      ephemeralProofRequest,
      outofbandProofRequest,
    } = proofRequestPayload
    let matchingCredentialsJson: ?string = undefined

    // we can have proofHandle as 0 as well
    // if we have proofHandle as 0, that means we need to get proofHandle again
    let proofRequest = ephemeralProofRequest || outofbandProofRequest
    if (proofHandle === 0 && proofRequest) {
      proofHandle = yield call(proofCreateWithRequest, uid, proofRequest)
      // update proof handle in store, because it would be used by proof-request store
      yield put(updateProofHandle(proofHandle, uid))
    }

    try {
      matchingCredentialsJson = yield call(getMatchingCredentials, proofHandle)
    } catch (e) {
      // the reason why are we doing this here is
      // we persist proofHandle along with proof request
      // proofHandle is given by vcx for the their internal object which is in memory
      // and using that proofHandle we can query data
      // However, if user kills the app, then vcx looses all in memory object
      // and proofHandle that we persisted no longer points to proof object
      // so we catch that exception here and we get new proofHandle
      // and then try to query data again
      // if it fails again, then there must be some error from vcx side which we bubble up

      // the way we achieve what is written above is that we take the serialized proof request
      // from vcx and store that object on our side and then we pass that serialized object
      // back to vcx, so that vcx can create it's internal proof object again
      const serializedProofRequest =
        proofRequestPayload.vcxSerializedProofRequest
      if (serializedProofRequest) {
        // it might happen that we won't have serialized proof request
        // so we guard against it and let fail
        proofHandle = yield call(proofDeserialize, serializedProofRequest)
        // update proof handle in store, because it would be used by proof-request store
        yield put(updateProofHandle(proofHandle, uid))
        matchingCredentialsJson = yield call(
          getMatchingCredentials,
          proofHandle
        )
      }
    }

    if (!matchingCredentialsJson) {
      throw new Error('No matching credential json result')
    }

    const matchingCredentials: IndyPreparedProof = JSON.parse(
      matchingCredentialsJson
    )
    const claimMap: ClaimMap = yield select(getClaimMap)
    //TODO: this is a hack. Right now we are relying on assumption that libindy always returns
    //TODO: credentials in the same oldest-first order. In the next release of libindy we will
    //TODO: include the seq_no of credential and we will sort by it in descendant order
    for (const key in matchingCredentials.attrs) {
      if (
        matchingCredentials.attrs.hasOwnProperty(key) &&
        Array.isArray(matchingCredentials.attrs[key])
      ) {
        matchingCredentials.attrs[key].sort((credA, credB) => {
          if (!credA) {
            return -1
          }
          if (!credB) {
            return 1
          }

          const credAMap = claimMap[credA.cred_info.referent]
          const credBMap = claimMap[credB.cred_info.referent]
          if (!credAMap) {
            return -1
          }
          if (!credBMap) {
            return 1
          }
          const credAEpoch = credAMap.issueDate
          const credBEpoch = credBMap.issueDate

          return credBEpoch - credAEpoch
        })
      }
    }

    const [
      missingAttributes,
      dissatisfiedAttributes,
    ] = findMissingRequestedAttributes(
      matchingCredentials,
      proofRequestData,
    )

    if (dissatisfiedAttributes.length > 0) {
      // if we find that there are some attributes that are not available
      // in any of the claims stored in user wallet
      // and also proof requester has intended not to accept self-attested-attributes
      // then user cannot fulfill this whole proof request
      // let user know that there are dissatisfied attributes
      yield put(dissatisfiedAttributesFound(dissatisfiedAttributes, uid))
    }

    const requestedAttributes = convertIndyPreparedProofToAttributes(
      matchingCredentials,
      proofRequestData.requested_attributes,
      proofRequestData.requested_predicates,
    )

    yield put(proofRequestAutoFill(uid, requestedAttributes))

    if (missingAttributes.length > 0) {
      // if we find that there are some attributes that are not available
      // in any of the claims stored in user wallet
      // then we ask user to fill in those attributes
      // so we need to tell proof request screen to ask user to self attest
      yield put(missingAttributesFound(missingAttributes, uid))
    }

    yield put(proofRequestDataToStore(uid, proofHandle))
  } catch (e) {
    // captureError(e)
    yield put(proofFail(action.uid, e))
  }
}

export function* connectToPoolAndRegenerateProof(
  action: UpdateAttributeClaimAction,
  proofRequestPayload: ProofRequestPayload,
  selectedCredentials: VcxSelectedCredentials,
  selfAttestedAttributes: SelfAttestedAttributes,
): Generator<*, *, *> {
  const vcxResult = yield* ensureVcxInitAndPoolConnectSuccess()
  if (vcxResult && vcxResult.fail) {
    yield put(errorSendProofFail(action.uid, action.remoteDid, vcxResult.fail))
    return
  }

  if (!proofRequestPayload.vcxSerializedProofRequest) {
    throw new Error('Cannot restore proof object')
  }

  const proofHandle = yield call(
    proofDeserialize,
    proofRequestPayload.vcxSerializedProofRequest
  )
  yield call(
    generateProof,
    proofHandle,
    JSON.stringify(selectedCredentials),
    JSON.stringify(selfAttestedAttributes)
  )
  yield put(updateProofHandle(proofHandle, action.uid))
}

export function* updateAttributeClaimAndSendProof(
  action: UpdateAttributeClaimAction
): Generator<*, *, *> {
  try {
    const vcxResult = yield* ensureVcxInitSuccess()
    if (vcxResult && vcxResult.fail) {
      yield put(errorSendProofFail(action.uid, action.remoteDid, vcxResult.fail))
      return
    }
    // restore VCX object for proof generation
    const proofRequestPayload: ProofRequestPayload = yield select(
      getProofRequest,
      action.uid
    )
    let { proofHandle } = yield select(getProofData, action.uid)
    if (!proofHandle && proofRequestPayload.vcxSerializedProofRequest) {
      // it might happen that we won't have serialized proof request
      // so we guard against it and let fail
      proofHandle = yield call(proofDeserialize, proofRequestPayload.vcxSerializedProofRequest)
      yield put(updateProofHandle(proofHandle, action.uid))
    }

    yield put(clearSendProofFail(action.uid))

    const requestedAttrsJson = action.requestedAttrsJson
    const selfAttestedAttributes = action.selfAttestedAttrs
    yield put(sendProof(action.uid))

    const selectedCredentials = convertUserSelectedCredentialToVcxSelectedCredentials(
      requestedAttrsJson,
    )

    try {
      yield call(
        generateProof,
        proofHandle,
        JSON.stringify(selectedCredentials),
        JSON.stringify(selfAttestedAttributes),
      )

      const proofState: number = yield call(proofGetState, proofHandle)
      if (proofState === 4) {
        // if proof generation failed -> connect to pool ledger and retry (fetch fresh schema and cred def)
        yield call(
          connectToPoolAndRegenerateProof,
          action,
          proofRequestPayload,
          selectedCredentials,
          selfAttestedAttributes,
        )
      }
    } catch (e) {
      if (e.code === CREDENTIAL_SCHEMA_NOT_FOUND || e.code === CREDENTIAL_DEFINITION_NOT_FOUND){
        // if proof generation failed -> connect to pool ledger and retry (fetch fresh schema and cred def)
        yield call(
          connectToPoolAndRegenerateProof,
          action,
          proofRequestPayload,
          selectedCredentials,
          selfAttestedAttributes,
        )
      } else {
        throw e
      }
    }

    yield put(acceptProofRequest(action.uid))

    const proofRequest = proofRequestPayload.originalProofRequestData
    const {
      revealedAttributes,
      revealedGroupAttributes,
      revealedPredicates,
    } = convertSelectedCredentialAttributesToIndyProof(
      requestedAttrsJson,
      proofRequest
    )
    // create a proof object so that history store and others that depend on proof
    // can use this proof object, previously proof object was generated with libIndy
    // now that we have removed libIndy and use vcx, we are generating this object
    // We should re-write whole proof generation logic and events in a single saga
    // and merge two stores proof-request-store and proof-store
    const proof: Proof = {
      requested_proof: {
        revealed_attrs: revealedAttributes,
        revealed_group_attrs: revealedGroupAttributes,
        unrevealed_attrs: {},
        self_attested_attrs: selfAttestedAttributes,
        predicates: revealedPredicates,
      },
    }
    yield put(proofSuccess(proof, action.uid))
  } catch (e) {
    customLogger.log(`updateAttributeClaimAndSendProof: {:?}`, e)
    yield put(errorSendProofFail(action.uid, action.remoteDid, e))
    yield call(showSnackError, 'Error generating proof. Please try again.')
  }
}

export const reTrySendProof = (
  selfAttestedAttributes: $PropertyType<
    RetrySendProofAction,
    'selfAttestedAttributes'
    >,
  updateAttributeClaimAction: UpdateAttributeClaimAction
) => ({
  type: RETRY_SEND_PROOF,
  selfAttestedAttributes,
  updateAttributeClaimAction,
})

function* reTrySendProofSaga(action: RetrySendProofAction): Generator<*, *, *> {
  const {
    uid,
    remoteDid,
    requestedAttrsJson,
    selfAttestedAttrs,
  } = action.updateAttributeClaimAction
  // start proof generation
  yield put(getProof(uid))
  yield race([
    take(
      (missingAttributeAction) =>
        missingAttributeAction.type === MISSING_ATTRIBUTES_FOUND &&
        missingAttributeAction.uid === uid
    ),
    take(
      (proofRequestAutofillAction) =>
        proofRequestAutofillAction.type === PROOF_REQUEST_AUTO_FILL &&
        proofRequestAutofillAction.uid === uid
    ),
  ])

  yield take(
    (proofRequestDataStoreAction) =>
      proofRequestDataStoreAction.type === PROOF_REQUEST_SEND_PROOF_HANDLE &&
      proofRequestDataStoreAction.uid === uid
  )
  yield put(
    updateAttributeClaim(uid, remoteDid, requestedAttrsJson, selfAttestedAttrs)
  )
}

export function* watchGenerateProof(): any {
  yield takeEvery(GENERATE_PROOF, generateProofSaga)
  yield takeEvery(UPDATE_ATTRIBUTE_CLAIM, updateAttributeClaimAndSendProof)
  yield takeEvery(RETRY_SEND_PROOF, reTrySendProofSaga)
}

export function* watchProof(): any {
  yield all([watchGenerateProof()])
}

const initialState = {}

export default function proofReducer(
  state: ProofStore = initialState,
  action: ProofAction
) {
  switch (action.type) {
    case PROOF_SUCCESS: {
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          ...action.proof,
        },
      }
    }

    case PROOF_FAIL:
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          error: action.error,
        },
      }

    case PROOF_REQUEST_SHOW_START: {
      return {
        ...state,
        [action.uid]: undefined,
      }
    }

    case PROOF_REQUEST_SEND_PROOF_HANDLE: {
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofData: {
            proofHandle: action.proofHandle,
          },
        },
      }
    }

    case RESET_TEMP_PROOF_DATA: {
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofData: null,
        },
      }
    }

    case ERROR_SEND_PROOF: {
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofData: {
            ...state[action.uid].proofData,
            error: action.error,
          },
        },
      }
    }

    case CLEAR_ERROR_SEND_PROOF: {
      return {
        ...state,
        [action.uid]: {
          ...state[action.uid],
          proofData: {
            ...state[action.uid] ? state[action.uid].proofData: undefined,
            error: null,
          },
        },
      }
    }

    case RESET:
      return initialState

    default:
      return state
  }
}
