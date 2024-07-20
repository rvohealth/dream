import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

describe('DreamSerializer#attributeTypeReflection', () => {
  context('with no argument', () => {
    it('allows accessing attributes from serializer', () => {
      class MySerializer extends DreamSerializer {
        @Attribute()
        public email: string
      }
      const serializer = new MySerializer({})
      expect(serializer.attributeTypeReflection('email')).toEqual('any')
    })
  })

  context('with a primitive type arg', () => {
    it('returns the primitive type', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('string[]')
        public email: string
      }
      const serializer = new MySerializer({})
      expect(serializer.attributeTypeReflection('email')).toEqual('string[]')
    })
  })

  context('with a calculated type', () => {
    context('enum', () => {
      it('returns the primitive type', () => {
        class MySerializer extends DreamSerializer {
          @Attribute('enum:HowYaDoinEnum')
          public stuff: string
        }
        const serializer = new MySerializer({})
        expect(serializer.attributeTypeReflection('stuff')).toEqual('HowYaDoinEnum')
      })
    })

    context('type', () => {
      it('returns the primitive type', () => {
        class MySerializer extends DreamSerializer {
          @Attribute('type:HowYaDoinEnum')
          public stuff: string
        }
        const serializer = new MySerializer({})
        expect(serializer.attributeTypeReflection('stuff')).toEqual('HowYaDoinEnum')
      })
    })
  })

  context('with a nested object', () => {
    it('returns a string reflecting the correct types for each attribute', () => {
      class MySerializer extends DreamSerializer {
        @Attribute({
          answer: {
            label: 'string',
            value: {
              value: 'number',
              unit: 'string',
            },
          },
        })
        public mydata: any
      }
      const serializer = new MySerializer({})
      expect(serializer.attributeTypeReflection('mydata')).toEqual(`\
{
  answer: {
    label: string
    value: {
      value: number
      unit: string
    }
  }
}`)
    })

    context('with an enum type', () => {
      it('specifies the enum type', () => {
        class MySerializer extends DreamSerializer {
          @Attribute({
            answer: {
              label: 'string',
              value: {
                value: 'number',
                unit: 'enum:HelloWorldEnum',
              },
            },
          })
          public mydata: any
        }
        const serializer = new MySerializer({})
        expect(serializer.attributeTypeReflection('mydata')).toEqual(`\
{
  answer: {
    label: string
    value: {
      value: number
      unit: HelloWorldEnum
    }
  }
}`)
      })
    })
  })
})
