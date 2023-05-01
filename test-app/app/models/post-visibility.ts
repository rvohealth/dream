import { DateTime } from 'luxon'
import { Dream, BelongsTo, BeforeCreate } from '../../../src'
import Post from './post'

export default class PostVisibility extends Dream {
  public get table() {
    return 'post_visibilities' as const
  }

  public id: number
  public visibility: boolean
  public notes: string
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => Post)
  public post: Post
  public post_id: number

  @BeforeCreate()
  public conditionallyRaise() {
    console.log('BEFORE CREATE', this.notes)
    if (this.notes === 'raise exception if notes set to this')
      throw `intentionally raising exception because PostVisibility#notes is set to '${this.notes}'`
  }
}
