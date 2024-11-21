import Dream from '../Dream'
import { SerializableTypes } from '../serializer/decorators/attribute'

export default function Virtual(type?: SerializableTypes): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const t: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(t, 'virtualAttributes'))
      t['virtualAttributes'] = [...(t['virtualAttributes'] || [])]

    t['virtualAttributes'].push({
      property: key,
      type,
    } as VirtualAttributeStatement)
  }
}

export interface VirtualAttributeStatement {
  property: string
  type?: SerializableTypes
}
