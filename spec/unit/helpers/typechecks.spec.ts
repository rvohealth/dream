import { isObject, isString } from '../../../src/helpers/typechecks.js'

describe('isObject', () => {
  const subject = () => isObject(argument)
  let argument: any

  it('is false for an array', () => {
    argument = []
    expect(subject()).toBe(false)
  })

  it('is true for an object', () => {
    argument = {}
    expect(subject()).toBe(true)
  })

  it('is false for a string', () => {
    argument = 'hello'
    expect(subject()).toBe(false)
  })

  it('is false for a String', () => {
    argument = new String('hello')
    expect(subject()).toBe(false)
  })

  it('is false for null', () => {
    argument = null
    expect(subject()).toBe(false)
  })

  it('is false for undefined', () => {
    argument = undefined
    expect(subject()).toBe(false)
  })
})

describe('isString', () => {
  const subject = () => isString(argument)
  let argument: any

  it('is false for an array', () => {
    argument = []
    expect(subject()).toBe(false)
  })

  it('is false for an object', () => {
    argument = {}
    expect(subject()).toBe(false)
  })

  it('is true for a string', () => {
    argument = 'hello'
    expect(subject()).toBe(true)
  })

  it('is true for a String', () => {
    argument = new String('hello')
    expect(subject()).toBe(true)
  })

  it('is false for null', () => {
    argument = null
    expect(subject()).toBe(false)
  })

  it('is false for undefined', () => {
    argument = undefined
    expect(subject()).toBe(false)
  })
})
