// @flow
import { put, call } from 'redux-saga/effects'
import { deleteDeviceSpecificData, hydrate } from '../hydration-store'
import { alreadyInstalledAction, hydrated, initialized } from '../config-store'
import { safeGet, secureGet } from '../../services/storage'
import { IS_ALREADY_INSTALLED } from '../../common'
import { IN_RECOVERY } from '../../lock/type-lock'
import { lockEnable } from '../../lock/lock-store'

describe('hydration store should update dependant store correctly', () => {
  // TODO Write this test in proper way and check for all generators and values
  xit('should raise correct action with correct data', () => {
    const gen = hydrate()

    expect(gen.next().value).toEqual(call(safeGet, IS_ALREADY_INSTALLED))
    expect(gen.next().value).toEqual(call(safeGet, IN_RECOVERY))
    expect(gen.next().value).toEqual(call(secureGet, '__uniqueId'))
    expect(gen.next().value).toEqual(put(alreadyInstalledAction(false)))
    expect(gen.next().value).toEqual(call(deleteDeviceSpecificData))
    expect(gen.next().value).toEqual(put(lockEnable('false')))
    expect(gen.next().value).toEqual(put(initialized()))
    expect(gen.next().value).toEqual(put(hydrated()))
  })
})
