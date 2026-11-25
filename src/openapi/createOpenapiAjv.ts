import { Ajv2020 } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

/**
 * @internal
 *
 * The options `createOpenapiAjv` passes to AJV's constructor, over its
 * defaults.
 */
export type OpenapiAjvOptions = ConstructorParameters<typeof Ajv2020>[0]

/**
 * @internal
 *
 * The AJV instance `createOpenapiAjv` returns.
 */
export type OpenapiAjv = Ajv2020

/**
 * @internal
 *
 * Builds the AJV instance every OpenAPI schema is checked with, Dream's
 * declared-shape checker and Psychic's request and response validators alike,
 * so the formats an OpenAPI shape names are defined once: JSON Schema 2020-12,
 * the `ajv-formats` formats (`date`, `date-time`, `email`, `uuid`, …), and
 * Dream's own `decimal` and `bigint` formats, which check a string's digits.
 *
 * Those are the only formats Dream's declared-shape checker knows. A format an
 * app adds through Psychic's `ajvOptions.init` (on an OpenAPI document or an
 * `@OpenAPI` endpoint) is added only to the instance Psychic builds for that
 * endpoint's request and response validators. Under `strict: false`, AJV
 * treats a format it does not know as an annotation, logging a warning when it
 * compiles the schema, so the declared-shape check accepts any value for it.
 *
 * Defaults: no coercion, no removal of additional properties, defaults
 * applied, the first error only, formats validated, and `strict: false` with
 * `strictTypes: true`, so OpenAPI keywords JSON Schema does not know (such as
 * `example`) are ignored. `options` override them.
 */
export default function createOpenapiAjv(options: OpenapiAjvOptions = {}): OpenapiAjv {
  const ajv = new Ajv2020({
    removeAdditional: false,
    useDefaults: true,
    strict: false,
    coerceTypes: false,
    strictTypes: true,
    allErrors: false,
    validateFormats: true, // Enable format validation for date-time, email, etc.
    ...options,
  })

  // unfortunately, the Node16 resolution does not play
  // nicely with the addFormats function, since it is
  // stuck in commonjs. Typescript cannot resolve types
  // correctly, but after building and being consumed
  // on the other side of a build, this is the only
  // way to actually call the addFormats function without
  // it breaking.
  ;(addFormats as unknown as (ajv: unknown) => void)(ajv)

  ajv.addFormat('decimal', {
    type: 'string',
    validate: data => DECIMAL_REGEX.test(data),
  })

  ajv.addFormat('bigint', {
    type: 'string',
    validate: data => BIGINT_REGEX.test(data),
  })

  return ajv
}

// Both run on strings a client submits, so each must match in linear time:
// no digit may be matchable by two adjacent quantifiers (as in `\d+\.?\d*`,
// which backtracks quadratically on a long run of digits that does not match)
const DECIMAL_REGEX = /^-?(\d+(\.\d*)?|\.\d+)$/
const BIGINT_REGEX = /^-?\d+(\.0*)?$/
