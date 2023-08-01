// NOTE: this mixin pattern was copied from:
// https://github.com/derek-pavao/ts-apply-mixins/blob/master/apply-mixins.ts
//
// it is much more convoluted than the conventional mixin examples I have come accross in my travels,
// but is preferable because it actually copies static methods over as well, where other patterns
// I have seen (including the mixin patterns on the typescript docs themselves) don't have regard
// for anything other than the prototype

import 'reflect-metadata'

export default function mixin(...mixins: Mixin<any>[]): ClassDecorator {
  return function (target: any) {
    applyMixins(target, mixins)
  }
}

export type Constructor<T> = new (...args: any[]) => T
export type Mixin<T> = Constructor<T> | object

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  const staticPropsToIgnore = new Set(['length', 'prototype', 'name'])

  baseCtors.forEach(baseCtor => {
    // Copy class level metadata
    Reflect.getMetadataKeys(baseCtor).forEach(metadataKey => {
      Reflect.defineMetadata(metadataKey, Reflect.getMetadata(metadataKey, baseCtor), derivedCtor)
    })

    // copy prototype level metadata
    Reflect.getMetadataKeys(baseCtor.prototype).forEach(metadataKey => {
      Reflect.defineMetadata(
        metadataKey,
        Reflect.getMetadata(metadataKey, baseCtor.prototype),
        derivedCtor.prototype
      )
    })

    // Loop over static properties
    Object.getOwnPropertyNames(baseCtor).forEach(staticProp => {
      if (!staticPropsToIgnore.has(staticProp)) {
        derivedCtor[staticProp] = baseCtor[staticProp]
      }
    })

    // Loop over prototype properties
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(propName => {
      // copy prototype property level metadata

      Reflect.getMetadataKeys(baseCtor.prototype, propName).forEach(metadataKey => {
        Reflect.defineMetadata(
          metadataKey,
          Reflect.getMetadata(metadataKey, baseCtor.prototype, metadataKey),
          derivedCtor.prototype,
          propName
        )
      })

      Reflect.getMetadataKeys(baseCtor.prototype, propName).forEach(metadataKey => {
        Reflect.defineMetadata(
          metadataKey,
          Reflect.getMetadata(metadataKey, baseCtor.prototype, propName),
          derivedCtor.prototype,
          propName
        )
      })

      if (propName !== 'constructor') {
        Object.defineProperty(
          derivedCtor.prototype,
          propName,
          // @ts-ignore
          Object.getOwnPropertyDescriptor(baseCtor.prototype, propName)
        )
      }
    })
  })
}
