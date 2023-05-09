export default function Virtual(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'virtualAttributes'))
      target.constructor['virtualAttributes'] = []

    target.constructor.virtualAttributes.push({
      property: key,
    } as VirtualAttributeStatement)
  }
}

export interface VirtualAttributeStatement {
  property: string
}
