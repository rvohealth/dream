import { UpdateableProperties } from '@rvoh/dream'
import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'

export default async function createPostComment(
  post: Post,
  overrides: UpdateableProperties<PostComment> = {}
) {
  return await PostComment.create({
    post,
    ...overrides,
  })
}
