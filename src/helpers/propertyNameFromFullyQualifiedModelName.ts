import standardizeFullyQualifiedModelName from './standardizeFullyQualifiedModelName'
import uncapitalize from './uncapitalize'

export default function (str: string): string {
  return uncapitalize(standardizeFullyQualifiedModelName(str).replace(/\//g, ''))
}
