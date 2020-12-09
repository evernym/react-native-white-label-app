// @flow
import TouchId from '../touch-id'

describe('<TouchId />', () => {
  it('passes', () => {
    const authenticatesSpy = jest.spyOn(TouchId, 'authenticate')
    const onSuccess = jest.fn()
    const onFail = jest.fn()

    authenticatesSpy.mockImplementation(() => Promise.resolve({}))

    jest.useFakeTimers()

    TouchId.authenticate({
      description: 'test',
    })
      .then(onSuccess)
      .catch(onFail)

    jest.runAllTimers()
    expect(onSuccess).toHaveBeenCalled()
  })
})
