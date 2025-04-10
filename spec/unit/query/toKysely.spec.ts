import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#toKysely', () => {
  let user: User
  let post: Post

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    post = await Post.create({ user })
    await PostComment.create({ post, body: 'hello world' })
  })

  context('select', () => {
    it('returns a valid kysely query with correct types', () => {
      const kyselyQuery = User.query().toKysely('select')
      expect(kyselyQuery.compile().sql).toEqual(
        'select "users".* from "users" where "users"."deleted_at" is null'
      )

      // type test - this will fail if types aren't working, since
      // name has to be a valid field
      kyselyQuery.where('name', '=', 'a')
    })

    context('with a joined association', () => {
      it('returns a valid kysely query with correct types', () => {
        const kyselyQuery = User.query().leftJoin('pets').toKysely('select')
        expect(kyselyQuery.compile().sql).toEqual(
          'select "users".* from "users" left join "pets" on "users"."id" = "pets"."user_id" and "pets"."deleted_at" is null where "users"."deleted_at" is null'
        )

        // type test - this will fail if types aren't working, since
        // name has to be a valid field
        kyselyQuery.where('pets.name', '=', 'a')
      })

      context('with an aliased association', () => {
        it('returns a valid kysely query with correct types', () => {
          const kyselyQuery = User.query().leftJoin('pets as p').toKysely('select')
          expect(kyselyQuery.compile().sql).toEqual(
            'select "users".* from "users" left join "pets" as "p" on "users"."id" = "p"."user_id" and "p"."deleted_at" is null where "users"."deleted_at" is null'
          )

          // type test - this will fail if types aren't working, since
          // name has to be a valid field
          kyselyQuery.where('p.name', '=', 'a')
        })
      })
    })
  })

  context('update', () => {
    it('returns a valid kysely query with correct types', () => {
      const kyselyQuery = User.query().toKysely('update').set('email', 'how@yadoin')
      expect(kyselyQuery.compile().sql).toEqual(
        'update "users" set "email" = $1 where "users"."deleted_at" is null'
      )

      // type test - this will fail if types aren't working, since
      // name has to be a valid field
      kyselyQuery.where('name', '=', 'a')
    })

    context('with a joined association', () => {
      it('returns a valid kysely query with correct types', () => {
        const kyselyQuery = User.query().leftJoin('pets').toKysely('update').set('email', 'how@yadoin')
        expect(kyselyQuery.compile().sql).toEqual(
          'update "users" set "email" = $1 left join "pets" on "users"."id" = "pets"."user_id" and "pets"."deleted_at" is null where "users"."deleted_at" is null'
        )

        // type test - this will fail if types aren't working, since
        // name has to be a valid field
        kyselyQuery.where('pets.name', '=', 'a')
      })

      context('with an aliased association', () => {
        it('returns a valid kysely query with correct types', () => {
          const kyselyQuery = User.query().leftJoin('pets as p').toKysely('update').set('email', 'how@yadoin')
          expect(kyselyQuery.compile().sql).toEqual(
            'update "users" set "email" = $1 left join "pets" as "p" on "users"."id" = "p"."user_id" and "p"."deleted_at" is null where "users"."deleted_at" is null'
          )

          // type test - this will fail if types aren't working, since
          // name has to be a valid field
          kyselyQuery.where('p.name', '=', 'a')
        })
      })
    })
  })

  context('delete', () => {
    it('returns a valid kysely query with correct types', () => {
      const kyselyQuery = User.query().toKysely('delete')
      expect(kyselyQuery.compile().sql).toEqual('delete from "users" where "users"."deleted_at" is null')

      // type test - this will fail if types aren't working, since
      // name has to be a valid field
      kyselyQuery.where('name', '=', 'a')
    })

    context('with a joined association', () => {
      it('returns a valid kysely query with correct types', () => {
        const kyselyQuery = User.query().leftJoin('pets').toKysely('delete')
        expect(kyselyQuery.compile().sql).toEqual(
          'delete from "users" left join "pets" on "users"."id" = "pets"."user_id" and "pets"."deleted_at" is null where "users"."deleted_at" is null'
        )

        // type test - this will fail if types aren't working, since
        // name has to be a valid field
        kyselyQuery.where('pets.name', '=', 'a')
      })

      context('with an aliased association', () => {
        it('returns a valid kysely query with correct types', () => {
          const kyselyQuery = User.query().leftJoin('pets as p').toKysely('delete')
          expect(kyselyQuery.compile().sql).toEqual(
            'delete from "users" left join "pets" as "p" on "users"."id" = "p"."user_id" and "p"."deleted_at" is null where "users"."deleted_at" is null'
          )

          // type test - this will fail if types aren't working, since
          // name has to be a valid field
          kyselyQuery.where('p.name', '=', 'a')
        })
      })
    })
  })
})
