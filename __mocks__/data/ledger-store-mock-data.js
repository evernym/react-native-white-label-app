// @flow

import moment from 'moment'
import { STORE_STATUS } from '../../src/common/type-common'

export const transferFees = {
  transfer: '0.00001',
  refreshTime: moment().format(),
}

export const ledgerStoreWithTransferFees = {
  fees: {
    data: transferFees,
    status: STORE_STATUS.SUCCESS,
    error: null,
  },
}
