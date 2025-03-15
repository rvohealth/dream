import standardizeFullyQualifiedModelName from './standardizeFullyQualifiedModelName.js.js'
import uncapitalize from './uncapitalize.js.js'

export default function (str: string): string {
  return uncapitalize(standardizeFullyQualifiedModelName(str).replace(/\//g, ''))
}
