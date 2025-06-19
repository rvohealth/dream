export function indent(number: number, { tabWidth = 2 }: { tabWidth?: number } = {}) {
  let spacesString = ''
  const indentationUnit = indentationUnitString(tabWidth)

  for (let i = 0; i < number; i++) {
    spacesString += indentationUnit
  }

  return spacesString
}

function indentationUnitString(number: number) {
  let spacesString = ''

  for (let i = 0; i < number; i++) {
    spacesString += ' '
  }

  return spacesString
}
