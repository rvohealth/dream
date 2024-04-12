import Dream from '../dream'

export default function Virtual(): any {
  // eslint-disable-next-line
  return function (target: any, key: string, _: any) {
    const t: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(t, 'virtualAttributes'))
      t['virtualAttributes'] = [...(t['virtualAttributes'] || [])]

    t['virtualAttributes'].push({
      property: key,
    } as VirtualAttributeStatement)
  }
}

export interface VirtualAttributeStatement {
  property: string
}
