export default function generateUnitSpecContent({
  fullyQualifiedModelName,
}: {
  fullyQualifiedModelName: string
}) {
  return `\
describe('${fullyQualifiedModelName}', () => {
  it.todo('add a test here to get started building ${fullyQualifiedModelName}')
})
`
}
