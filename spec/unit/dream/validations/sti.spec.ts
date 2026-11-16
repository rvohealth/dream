import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

describe('Dream validations with STI models', () => {
  it('applies validations from base model', () => {
    const validation = Mylar['validations'].find(v => v.column === 'volume' && v.type === 'numericality')!
    expect(validation.type).toEqual('numericality')
    expect(validation.column).toEqual('volume')
  })

  context('when the STI base is initialized before its child', () => {
    it('reports a failing base validation once on the child', () => {
      const deco = new Decorators<typeof NamedBase>()

      class NamedBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<NamedBase, 'id'>

        @deco.Validates('presence')
        public name: DreamColumn<NamedBase, 'name'>
      }

      @STI(NamedBase)
      class NamedChild extends NamedBase {}

      processDynamicallyDefinedModels(NamedBase, NamedChild)

      const child = NamedChild.new({})
      expect(child.isInvalid).toBe(true)
      expect(child.errors).toEqual({ name: ['presence'] })
    })

    it('keeps two contains validations with different patterns on one column', () => {
      const deco = new Decorators<typeof PatternedBase>()

      class PatternedBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<PatternedBase, 'id'>

        @deco.Validates('contains', /a/)
        @deco.Validates('contains', /b/)
        public nickname: string
      }

      @STI(PatternedBase)
      class PatternedChild extends PatternedBase {}

      processDynamicallyDefinedModels(PatternedBase, PatternedChild)

      const child = PatternedChild.new({})

      child.nickname = 'x'
      expect(child.isInvalid).toBe(true)
      expect(child.errors).toEqual({ nickname: ['contains', 'contains'] })

      child.nickname = 'a'
      expect(child.isInvalid).toBe(true)
      expect(child.errors).toEqual({ nickname: ['contains'] })

      child.nickname = 'ab'
      expect(child.isValid).toBe(true)
    })
  })

  it('reports a failing base validation once on an STI child initialized a second time', () => {
    const deco = new Decorators<typeof NamedBase>()

    class NamedBase extends ApplicationModel {
      public override get table() {
        return 'sti_bases' as const
      }

      public id: DreamColumn<NamedBase, 'id'>

      @deco.Validates('presence')
      public name: DreamColumn<NamedBase, 'name'>
    }

    @STI(NamedBase)
    class NamedChild extends NamedBase {}

    processDynamicallyDefinedModels(NamedChild, NamedBase)
    processDynamicallyDefinedModels(NamedChild)

    const child = NamedChild.new({})
    expect(child.isInvalid).toBe(true)
    expect(child.errors).toEqual({ name: ['presence'] })
  })
})
