import standardizeFullyQualifiedModelName from './standardizeFullyQualifiedModelName.js'
import uncapitalize from './uncapitalize.js'

export default function (str: string): string {
  return uncapitalize(standardizeFullyQualifiedModelName(str).replace(/\//g, ''))
}
