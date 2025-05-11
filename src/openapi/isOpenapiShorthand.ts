import { openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import maybeNullOpenapiShorthandToOpenapiShorthand from './maybeNullOpenapiShorthandToOpenapiShorthand.js'

export default function isOpenapiShorthand(openapi: any): boolean {
  const openapiShorthand = maybeNullOpenapiShorthandToOpenapiShorthand(openapi)
  if (typeof openapiShorthand !== 'string') return false
  return openapiShorthandPrimitiveTypes.includes(openapiShorthand)
}
