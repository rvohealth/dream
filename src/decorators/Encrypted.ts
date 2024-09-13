import Dream from '../dream'
import pascalize from '../helpers/pascalize'

export default function Encrypted(encryptedColumnName?: string): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const t: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(t, 'encryptedAttributes'))
      t['encryptedAttributes'] = [...(t['encryptedAttributes'] || [])]

    t['encryptedAttributes'].push({
      property: key,
      encryptedColumnName: encryptedColumnName || `encrypted${pascalize(key)}`,
    })
  }
}

export interface EncryptedAttributeStatement {
  property: string
  encryptedColumnName: string
}
