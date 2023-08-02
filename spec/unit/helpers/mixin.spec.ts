import mixin from '../../../src/helpers/mixin'
import User from '../../../test-app/app/models/User'

describe('mixin', () => {
  class A {
    public dataFromBaseClass: string
    public a() {
      return 'a: ' + this.dataFromBaseClass
    }
  }

  class B {
    public dataFromBaseClass: string
    public b() {
      return 'b: ' + this.dataFromBaseClass
    }
  }

  interface C extends A, B {}
  @mixin(A, B)
  class C {
    public dataFromBaseClass: string
    constructor(c: string) {
      this.dataFromBaseClass = c
    }

    public c() {
      return 'c: ' + this.dataFromBaseClass
    }
  }

  it('merges all classes together', () => {
    const c = new C('mydata')
    expect(c.c()).toEqual('c: mydata')
    expect(c.a()).toEqual('a: mydata')
    expect(c.b()).toEqual('b: mydata')
  })

  context('with static methods on the classes being mixed', () => {
    class A {
      public static dataFromBaseClass: string
      static a() {
        return 'a: ' + this.dataFromBaseClass
      }
    }

    class B {
      public static dataFromBaseClass: string
      static b() {
        return 'b: ' + this.dataFromBaseClass
      }
    }

    interface C extends A, B {}
    @mixin(A, B)
    class C {
      public static dataFromBaseClass = 'mydata'
      static c() {
        return 'c: ' + this.dataFromBaseClass
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
      expect(C.c()).toEqual('c: mydata')
    })
  })

  context('with dream models', () => {
    class A {
      public email: string
      public a() {
        return 'a: ' + this.email
      }
    }

    interface ExtendedUser extends A, User {}
    @mixin(A)
    class ExtendedUser extends User {}

    it('merges all properties of both classes, maintaining access to static methods', async () => {
      const u = ExtendedUser.new({ email: 'howyadoin' })
      expect(u.email).toEqual('howyadoin')
      expect(u.a()).toEqual('a: howyadoin')
      expect(u.constructor.name).toEqual('ExtendedUser')
    })
  })
})
