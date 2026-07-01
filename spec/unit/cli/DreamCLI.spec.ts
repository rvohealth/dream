import { columnsWithTypesDescriptionForStiChild } from '../../../src/cli/index.js'

describe('DreamCLI', () => {
  describe('columnsWithTypesDescriptionForStiChild', () => {
    it('advertises that belongs_to is not supported', () => {
      expect(columnsWithTypesDescriptionForStiChild).toContain('belongs_to')
      expect(columnsWithTypesDescriptionForStiChild).toContain('NOT supported for STI children')
      expect(columnsWithTypesDescriptionForStiChild).toContain('declare all BelongsTo')
      expect(columnsWithTypesDescriptionForStiChild).toContain('on the STI parent model instead')
      expect(columnsWithTypesDescriptionForStiChild).not.toContain('User:belongs_to')
    })
  })
})
