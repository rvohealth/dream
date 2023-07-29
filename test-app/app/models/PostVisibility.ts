import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import BeforeCreate from '../../../src/decorators/hooks/before-create'
import HasOne from '../../../src/decorators/associations/has-one'
import { IdType } from '../../../src/dream/types'
import Post from './Post'

export default class PostVisibility extends Dream {
  public get table() {
    return 'post_visibilities' as const
  }

  public id: IdType
  public visibility: boolean
  public notes: string
  public created_at: DateTime
  public updated_at: DateTime

  @HasOne(() => Post)
  public post: Post

  @BeforeCreate()
  public conditionallyRaise() {
    if (this.notes === 'raise exception if notes set to this')
      throw `intentionally raising exception because PostVisibility#notes is set to '${this.notes}'`
  }
}
