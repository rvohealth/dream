/**
 * Capitalizes the first character of a string.
 *
 * Examples:
 *   capitalize('hello') // 'Hello'
 *   capitalize('über') // 'Über'
 *   capitalize('😊hello') // '😊hello'
 *
 * @param str - The string to capitalize
 * @returns The input string with its first character capitalized
 */
export default function capitalize(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}
