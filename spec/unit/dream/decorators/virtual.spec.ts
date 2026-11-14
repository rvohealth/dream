import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import User from '../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

describe('@deco.Virtual', () => {
  it('adds the decorated property to the defaultParamSafeColumns', () => {
    expect(User['defaultParamSafeColumns']()).toEqual(expect.arrayContaining(['password']))
  })

  it('adds the virtual columns to the Dream class’s virtualAttributes', () => {
    expect(User['virtualAttributes']).toEqual(
      expect.arrayContaining([{ property: 'password', type: 'string' }])
    )
  })

  it('allows the decorated property to be passed into #new as if it were a column on the database', () => {
    const user = User.new({ password: 's3cr3t!' })
    expect(user.password).toEqual('s3cr3t!')
  })

  it('allows properties with no getter-setter pattern to behave', () => {
    const user = User.new({ randoVirtual: 'abc' })
    expect(user.randoVirtual).toEqual('abc')
  })

  it('can decorate getter properties', () => {
    const user = User.new({ lbs: 180.1 })
    expect(user.lbs).toEqual(180.1)
    expect(user.getAttribute('grams')).toEqual(81693)
  })

  it('can decorate setter properties', () => {
    const user = User.new({ kilograms: 90.2 })
    expect(user.kilograms).toEqual(90.2)
    expect(user.getAttribute('grams')).toEqual(90200)
  })

  context('on an STI base', () => {
    it('lists each inherited virtual attribute once on a child initialized after its base', () => {
      const deco = new Decorators<typeof NicknamedBase>()

      class NicknamedBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<NicknamedBase, 'id'>

        @deco.Virtual('string')
        public nickname: string
      }

      @STI(NicknamedBase)
      class NicknamedChild extends NicknamedBase {}

      processDynamicallyDefinedModels(NicknamedBase, NicknamedChild)

      expect(NicknamedChild['virtualAttributes']).toEqual([{ property: 'nickname', type: 'string' }])
      expect(NicknamedBase['virtualAttributes']).toEqual([{ property: 'nickname', type: 'string' }])
    })

    it('lists each inherited virtual attribute once on a child initialized before its base', () => {
      const deco = new Decorators<typeof NicknamedBase>()

      class NicknamedBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<NicknamedBase, 'id'>

        @deco.Virtual('string')
        public nickname: string
      }

      @STI(NicknamedBase)
      class NicknamedChild extends NicknamedBase {}

      processDynamicallyDefinedModels(NicknamedChild, NicknamedBase)

      expect(NicknamedChild['virtualAttributes']).toEqual([{ property: 'nickname', type: 'string' }])
      expect(NicknamedBase['virtualAttributes']).toEqual([{ property: 'nickname', type: 'string' }])
    })

    it('lists each inherited virtual attribute once on a child initialized a second time', () => {
      const deco = new Decorators<typeof NicknamedBase>()

      class NicknamedBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<NicknamedBase, 'id'>

        @deco.Virtual('string')
        public nickname: string
      }

      @STI(NicknamedBase)
      class NicknamedChild extends NicknamedBase {}

      processDynamicallyDefinedModels(NicknamedChild, NicknamedBase)
      processDynamicallyDefinedModels(NicknamedChild)

      expect(NicknamedChild['virtualAttributes']).toEqual([{ property: 'nickname', type: 'string' }])
    })
  })
})
