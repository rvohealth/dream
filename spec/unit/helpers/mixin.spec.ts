import mixin from '../../../src/helpers/mixin'
import User from '../../../test-app/app/models/User'

describe('mixin', () => {
  class A {
    get a() {
      return 'a'
    }
  }

  class B {
    get b() {
      return 'b'
    }
  }

  interface C extends A, B {}
  @mixin(A, B)
  class C {
    public c: string
    constructor(c: string) {
      this.c = c
    }
  }

  it('merges all classes together', () => {
    const c = new C('c')
    expect(c.c).toEqual('c')
    expect(c.a).toEqual('a')
    expect(c.b).toEqual('b')
  })

  context('with static methods on the classes being mixed', () => {
    class A {
      static get a() {
        return 'a'
      }
    }

    class B {
      static get b() {
        return 'b'
      }
    }

    interface C extends A, B {}
    @mixin(A, B)
    class C {
      static get c() {
        return 'c'
      }
    }

    // NOTE: as of now, it seems our mixin pattern cannot account for
    // static methods/properties on the classes being mixed in
    it.todo('maintains static methods from mixin classes')
    // it('maintains static methods from mixin classes', () => {
    //   expect(C.a).toEqual('a')
    //   expect(C.b).toEqual('b')
    // })

    it('maintains static methods the base class', () => {
      expect(C.c).toEqual('c')
    })
  })

  context('with dream models', () => {
    interface ExtendedUser extends A, User {}
    @mixin(A)
    class ExtendedUser extends User {}

    it('merges all properties of both classes, maintaining access to static methods', async () => {
      const u = ExtendedUser.new({ email: 'howyadoin' })
      expect(u.email).toEqual('howyadoin')
      expect(u.a).toEqual('a')
      expect(u.constructor.name).toEqual('ExtendedUser')
    })
  })
})
