import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

describe('DreamSerializer.renderArray', () => {
  it('renders an array of dream instances', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public name: string
    }

    const results = MySerializer.renderArray([
      { email: 'abc', name: 'Frodo', password: '123' },
      { email: 'def', name: 'Chalupa jones', password: '456' },
    ])

    expect(results).toEqual([{ name: 'Frodo' }, { name: 'Chalupa jones' }])
  })

  context('passthrough is passed', () => {
    it('sends passthrough through to each serializer instance', () => {
      class MySerializer extends DreamSerializer {
        @Attribute()
        public name() {
          return this.passthroughData.name
        }
      }

      const results = MySerializer.renderArray([{ email: 'abc' }, { email: 'def' }], {
        passthrough: { name: 'calvin coolidge' },
      })

      expect(results).toEqual([{ name: 'calvin coolidge' }, { name: 'calvin coolidge' }])
    })
  })
})
