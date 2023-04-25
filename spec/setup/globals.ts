interface DreamMatchers<R = unknown> {
  toMatchDreamModel(expected: any): any
  toMatchDreamModels(expected: any): any
}

declare global {
  namespace jest {
    interface Expect extends DreamMatchers {}
    interface Matchers<R> extends DreamMatchers<R> {}
    interface InverseAsymmetricMatchers extends DreamMatchers {}
  }
}

export {}
