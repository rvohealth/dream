/**
 * Returns a string of spaces for indentation, using the specified tab width and number of indentations.
 *
 * Examples:
 *   indent(2) // '    ' (default tabWidth: 2)
 *   indent(3, { tabWidth: 4 }) // '            '
 *
 * @param number - The number of indentation units
 * @param options.tabWidth - The number of spaces per indentation unit (default: 2)
 * @returns A string of spaces for indentation
 */
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
