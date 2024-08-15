export default function generateUnitSpecContent(dreamName: string) {
  return `\
// import { describe as context } from '@jest/globals'

describe('${dreamName}', () => {
  it.todo('add a test here to get started building ${dreamName}')
})
`
}
