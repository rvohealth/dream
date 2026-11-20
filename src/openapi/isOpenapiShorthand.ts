import { openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import maybeNullOpenapiShorthandToOpenapiShorthand from './maybeNullOpenapiShorthandToOpenapiShorthand.js'

/**
 * @internal
 *
 * Whether the value is a primitive shorthand, such as `'string'`,
 * `'date-time[]'` or `['integer', 'null']`.
 */
export default function isOpenapiShorthand(openapi: any): boolean {
  const openapiShorthand = maybeNullOpenapiShorthandToOpenapiShorthand(openapi)
  if (typeof openapiShorthand !== 'string') return false
  return openapiShorthandPrimitiveTypes.includes(openapiShorthand)
}
