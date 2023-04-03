export function Column(dataType: string): any {
  return function (target: any, key: string, _: any) {
    // Object.defineProperty(target, key, {
    //   get() {
    //     return this.attributes[key]
    //   },
    //   set(value: any) {
    //     console.log('SETTING!!!')
    //     this.attributes[key] = value
    //   },
    // })
  }
}
