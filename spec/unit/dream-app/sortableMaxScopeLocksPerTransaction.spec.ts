import DreamApp from '../../../src/dream-app/index.js'

describe('DreamApp#sortableMaxScopeLocksPerTransaction', () => {
  const configuredValues = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]

  it('defaults to 40', () => {
    expect(DreamApp.getOrFail().sortableMaxScopeLocksPerTransaction).toEqual(40)
  })

  it.each(configuredValues)('rejects invalid value %s without installing it', value => {
    const app = DreamApp.getOrFail()
    const priorValue = app.sortableMaxScopeLocksPerTransaction

    expect(() => app.set('sortableMaxScopeLocksPerTransaction', value)).toThrow(
      'sortableMaxScopeLocksPerTransaction must be a finite positive integer'
    )
    expect(app.sortableMaxScopeLocksPerTransaction).toEqual(priorValue)
  })

  it('installs a finite positive integer', () => {
    const app = DreamApp.getOrFail()
    const priorValue = app.sortableMaxScopeLocksPerTransaction

    app.set('sortableMaxScopeLocksPerTransaction', 17)
    expect(app.sortableMaxScopeLocksPerTransaction).toEqual(17)

    app.set('sortableMaxScopeLocksPerTransaction', priorValue)
  })
})
