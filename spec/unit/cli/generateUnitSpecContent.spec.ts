import generateUnitSpecContent from '../../../src/helpers/cli/generateUnitSpecContent.js'

describe('generateUnitSpecContent', () => {
  it('generates a blank unit spec for a dream model, with context commented out above', () => {
    const res = generateUnitSpecContent({ fullyQualifiedModelName: 'User' })
    expect(res).toEqual(`\
describe('User', () => {
  it.todo('add a test here to get started building User')
})
`)
  })
})
