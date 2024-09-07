export default function generateUnitSpecContent({
  fullyQualifiedModelName,
}: {
  fullyQualifiedModelName: string
}) {
  return `\
// import { describe as context } from '@jest/globals'

describe('${fullyQualifiedModelName}', () => {
  it.todo('add a test here to get started building ${fullyQualifiedModelName}')
})
`
}
