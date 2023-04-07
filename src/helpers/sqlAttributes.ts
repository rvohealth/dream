import { DateTime } from 'luxon'

export default function sqlAttributes(attributes: { [key: string]: any }) {
  return Object.keys(attributes).reduce((result, key) => {
    const val = attributes[key]

    if (val?.constructor === DateTime) {
      result[key] = val.toUTC().toSQL()
    } else {
      result[key] = val
    }

    return result
  }, {} as { [key: string]: any })
}
