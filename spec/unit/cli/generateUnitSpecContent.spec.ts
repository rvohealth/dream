import generateUnitSpecContent from '../../../src/helpers/cli/generateUnitSpecContent'

describe('generateUnitSpecContent', () => {
  it('generates a blank unit spec for a dream model, with context commented out above', () => {
    const res = generateUnitSpecContent('User')
    expect(res).toEqual(`\
// import { describe as context } from '@jest/globals'

describe('User', () => {
  it.todo('add a test here to get started building User')
})`)
  })
})
