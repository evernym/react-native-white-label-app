// @flow
import { takeLatest, call, all } from 'redux-saga/effects'
import { safeSet } from '../services/storage'
import {
  EULA_ACCEPT,
  STORAGE_KEY_EULA_ACCEPTANCE,
  HYDRATE_EULA_ACCEPT,
  SHARE_EULA,
  title,
} from './type-eula'
import type {
  EulaAccept,
  EulaStore,
  EulaActions,
  HydrateEulaAcceptAction,
  ShareEula,
} from './type-eula'
import { captureError } from '../services/error/error-handler'
import { customLogger } from '../store/custom-logger'
import Share from "react-native-share"

const initialState: EulaStore = {
  isEulaAccept: false,
}

export const eulaAccept = (isEulaAccept: boolean): EulaAccept => ({
  type: EULA_ACCEPT,
  isEulaAccept,
})

export const shareEula = (uri: string): ShareEula => ({
  type: SHARE_EULA,
  uri,
})

// if we see that both this action and eulaAccept action creator
// does the same thing inside the reducer and while raising action as well
// the reason we have two action creators is that on EULA_ACCEPT
// we have a watch that runs and store this data inside wallet
// we do not want to wastefully make an API call when we just hydrated data
export const hydrateEulaAccept = (
  isEulaAccept: boolean
): HydrateEulaAcceptAction => ({
  type: HYDRATE_EULA_ACCEPT,
  isEulaAccept,
})

export function* watchEula(): any {
  yield all([watchEulaAcceptance(), watchShareEula()])
}

export function* watchEulaAcceptance(): any {
  yield takeLatest(EULA_ACCEPT, eulaAcceptanceSaga)
}

export function* watchShareEula(): any {
  yield takeLatest(SHARE_EULA, shareEulaSaga)
}

export function* eulaAcceptanceSaga(action: EulaAccept): Generator<*, *, *> {
  try {
    const { isEulaAccept } = action

    yield call(
      safeSet,
      STORAGE_KEY_EULA_ACCEPTANCE,
      JSON.stringify(isEulaAccept)
    )
  } catch (e) {
    captureError(e)
    customLogger.error(`eulaAcceptanceSaga: ${e}`)
  }
}

export function* shareEulaSaga({ uri }: ShareEula): Generator<*, *, *> {
  try {
    yield call(Share.open, {
      title,
      subject: title,
      url: uri,
      type: 'text/plain',
    })
  } catch (e) {
    // ignore error if user did not share
  }
}

export default function eulaReducer(
  state: EulaStore = initialState,
  action: EulaActions
): EulaStore {
  switch (action.type) {
    case HYDRATE_EULA_ACCEPT:
    case EULA_ACCEPT:
      return {
        ...state,
        isEulaAccept: action.isEulaAccept,
      }
    default:
      return state
  }
}
