import Dream from '../dream'

export default class CannotDefineAssociationWithBothThroughAndWithoutDefaultScopes extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private associationName: string
  ) {
    super()
  }

  public get message() {
    return `
Cannot define association with both "through" and "withoutDefaultScopes".
Error found when trying to parse "${this.associationName}" on the
${this.dreamClass.name} dream class.

Instead, define "withoutDefaultScopes" on the association this is going
through and/or on the source.

For example, given a User with many Posts (soft-deletable) and PostComments
(also soft-deletable), if we wanted an "allPostComments" association on User,
instead of removing the soft delete scope from the "allPostComments" association,
we would have the "allPostComments" association go through an "allComments"
association (with "withoutDefaultScopes" defined) and set the source of
"allPostComments" to be an "allComments" association on Post that also defined
"withoutDefaultScopes":


export default class User extends ApplicationModel {
  ...

  @HasMany(() => Post, { dependent: 'destroy' })
  public posts: Post[]

  @HasMany(() => Post, { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allPosts: Post[]

  @HasMany(() => PostComment, { through: 'posts', source: 'comments' })
  public postComments: PostComment[]

  @HasMany(() => PostComment, {
    through: 'allPosts',
    source: 'allComments',
  })
  public allPostComments: PostComment[]
}


@SoftDelete()
export default class Post extends ApplicationModel {
  ...
  @HasMany(() => PostComment, { dependent: 'destroy' })
  public comments: PostComment[]

  @HasMany(() => PostComment, { withoutDefaultScopes: ['dream:SoftDelete'] })
  public allComments: PostComment[]
}
`
  }
}
