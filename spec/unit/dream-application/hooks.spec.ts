import { DreamHookEventType } from '../../../src/dream-application.js'

describe('DreamApplication hooks', () => {
  function expectHookCalled(hookEventType: DreamHookEventType) {
    expect((process.env as any).__DREAM_HOOKS_TEST_CACHE.split(',')).toEqual(
      expect.arrayContaining([hookEventType])
    )
  }

  it('calls callback associated with db:log', () => {
    expectHookCalled('db:log')
  })
})
