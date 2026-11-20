/**
 * @internal
 *
 * Whether the value is an object carrying nothing but a `description`.
 */
export default function isBlankDescription(obj: any) {
  if (typeof obj !== 'object') return false
  if (Object.keys(obj).length > 1) return false
  return Object.keys(obj)[0] === 'description'
}
