import DreamApp from '../../../src/dream-app/index.js'
import paramSafeColumnNames from '../../../src/helpers/paramSafeColumnNames.js'
import ModelWithParamUnsafeColumns from '../../../test-app/app/models/ModelWithParamUnsafeColumns.js'
import User from '../../../test-app/app/models/User.js'

describe('paramSafeColumnNames', () => {
  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.paramSafeColumnNames).toBe(paramSafeColumnNames)
  })

  it('names the columns Dream.paramSafeColumnsOrFallback allows for the model', () => {
    expect(paramSafeColumnNames(User)).toEqual(User['paramSafeColumnsOrFallback']())
    expect(paramSafeColumnNames(ModelWithParamUnsafeColumns)).toEqual(
      ModelWithParamUnsafeColumns['paramSafeColumnsOrFallback']()
    )
  })
})
