import { DateTime } from 'luxon'
import { CalendarDate } from '../../../src'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

describe('DreamSerializer#attributeTypeReflection', () => {
  context('with no argument', () => {
    it('allows accessing attributes from serializer', () => {
      class MySerializer extends DreamSerializer {
        @Attribute()
        public email: string
      }
      expect(MySerializer.attributeTypeReflection('email')).toEqual('any')
    })
  })

  context('with a primitive type arg', () => {
    it('parses string[]', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('string[]')
        public stuff: string[]
      }
      expect(MySerializer.attributeTypeReflection('stuff')).toEqual('string[]')
    })

    it('parses date as string', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('date')
        public stuff: CalendarDate
      }
      expect(MySerializer.attributeTypeReflection('stuff')).toEqual('string')
    })

    it('parses datetime as string', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('datetime')
        public stuff: DateTime
      }
      expect(MySerializer.attributeTypeReflection('stuff')).toEqual('string')
    })

    it('parses decimal as number', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('decimal')
        public stuff: number
      }
      expect(MySerializer.attributeTypeReflection('stuff')).toEqual('number')
    })

    it('parses json as any', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('json')
        public stuff: string
      }
      expect(MySerializer.attributeTypeReflection('stuff')).toEqual('any')
    })
  })

  context('with a calculated type', () => {
    context('enum', () => {
      it('returns the primitive type', () => {
        class MySerializer extends DreamSerializer {
          @Attribute('enum:HowYaDoinEnum')
          public stuff: string
        }
        expect(MySerializer.attributeTypeReflection('stuff')).toEqual('HowYaDoinEnum')
      })
    })

    context('type', () => {
      it('returns the primitive type', () => {
        class MySerializer extends DreamSerializer {
          @Attribute('type:HowYaDoinEnum')
          public stuff: string
        }
        expect(MySerializer.attributeTypeReflection('stuff')).toEqual('HowYaDoinEnum')
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
      expect(MySerializer.attributeTypeReflection('mydata')).toEqual(`\
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

    context('with startSpaces passed', () => {
      it('indents everything by the startSpaces value but the first line', () => {
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
        expect(MySerializer.attributeTypeReflection('mydata', { startSpaces: 2 })).toEqual(`{
    answer: {
      label: string
      value: {
        value: number
        unit: string
      }
    }
  }`)
      })
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
        expect(MySerializer.attributeTypeReflection('mydata')).toEqual(`\
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
